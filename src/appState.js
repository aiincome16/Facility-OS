/************************************************
 * Facility OS
 * appState.js
 *
 * Zentrale Zustandsverwaltung
 * - Benutzersitzung
 * - aktuelles Objekt
 * - Schichtstatus
 * - geladene Datenbestände
 * - lokale Präsentationsdaten
 * - lokale Persistenz
 * - Listener für UI-Aktualisierungen
 * - vorbereitet für spätere API-/Sheets-Anbindung
 ************************************************/

/************************************************
 * ROUTEN
 ************************************************/

const DEFAULT_ROUTES =
    Object.freeze({

        LOGIN:
            "/login",

        OVERVIEW:
            "/overview"
    });

/************************************************
 * SPEICHERSCHLÜSSEL
 ************************************************/

const STORAGE_KEYS =
    Object.freeze({

        SESSION:
            "facility_os_session",

        CURRENT_OBJECT:
            "facility_os_current_object",

        CURRENT_SHIFT:
            "facility_os_current_shift",

        APP_STATE:
            "facility_os_app_state",

        LOCAL_CHANGES:
            "facility_os_local_changes"
    });

/************************************************
 * DATENSAMMLUNGEN
 ************************************************/

const DATA_COLLECTION_NAMES =
    Object.freeze([
        "users",
        "objects",
        "rooms",
        "tasks",
        "materials",
        "materialStock",
        "shifts",
        "tickets",
        "notifications",
        "messages",
        "objectGuide",
        "objectSettings",
        "checkins",
        "checkouts",
        "taskLogs",
        "timeDeviations",
        "keybook",
        "customerAccess",
        "objectSecurity",
        "objectWaste",
        "userPerformance",
        "help",
        "customerRequests",
        "workOrders",
        "reports"
    ]);

/************************************************
 * LOKAL VERÄNDERBARE SAMMLUNGEN
 *
 * Diese Daten entstehen in der Präsentations-App
 * und bleiben nach einem Neuladen erhalten.
 ************************************************/

const PERSISTED_COLLECTION_NAMES =
    Object.freeze([
        "shifts",
        "checkins",
        "checkouts",
        "tickets",
        "messages",
        "notifications",
        "customerRequests",
        "workOrders",
        "taskLogs",
        "timeDeviations",
        "materialStock",
        "reports"
    ]);

/************************************************
 * INITIALER STATUS
 ************************************************/

function createInitialDataCollections() {

    const collections = {};

    DATA_COLLECTION_NAMES.forEach(
        (collectionName) => {

            collections[
                collectionName
            ] = [];
        }
    );

    return collections;
}

function createInitialState() {

    return {

        loading:
            false,

        error:
            null,

        initialized:
            false,

        currentRoute:
            DEFAULT_ROUTES.LOGIN,

        currentUser:
            null,

        currentObject:
            null,

        currentShift:
            null,

        shiftStarted:
            false,

        sessionRestored:
            false,

        localChangesRestored:
            false,

        lastUpdatedAt:
            null,

        dataLoadedAt:
            null,

        dataSource:
            "LOCAL_JSON",

        ...createInitialDataCollections()
    };
}

/************************************************
 * ZENTRALER APP-STATUS
 ************************************************/

const appState =
    createInitialState();

/************************************************
 * LISTENER
 ************************************************/

const subscribers =
    new Set();

/************************************************
 * BASISHELFER
 ************************************************/

function asArray(value) {

    return Array.isArray(value)
        ? value
        : [];
}

function asObject(value) {

    return (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    )
        ? value
        : {};
}

function normalizeId(value) {

    return String(value ?? "")
        .trim();
}

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

function normalizeStatus(value) {

    return normalizeText(value)
        .toUpperCase();
}

function getTimestamp() {

    return new Date()
        .toISOString();
}

function cloneValue(value) {

    if (
        value === undefined
    ) {

        return undefined;
    }

    try {

        return structuredClone(
            value
        );
    }
    catch {

        return JSON.parse(
            JSON.stringify(
                value
            )
        );
    }
}

function isObject(value) {

    return (
        value &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

function isRunningShift(shift) {

    if (!isObject(shift)) {

        return false;
    }

    const status =
        normalizeStatus(
            shift.status
        );

    if (
        [
            "FINISHED",
            "COMPLETED",
            "CLOSED",
            "CANCELLED"
        ].includes(status)
    ) {

        return false;
    }

    return (
        [
            "RUNNING",
            "ACTIVE"
        ].includes(status) ||
        (
            Boolean(
                shift.startTime ??
                shift.checkinTime
            ) &&
            !(
                shift.endTime ??
                shift.checkoutTime
            )
        )
    );
}

/************************************************
 * LOCAL-STORAGE
 ************************************************/

function readStorage(key) {

    try {

        const rawValue =
            window.localStorage.getItem(
                key
            );

        if (!rawValue) {

            return null;
        }

        return JSON.parse(
            rawValue
        );
    }
    catch (error) {

        console.warn(
            `Gespeicherte Daten konnten nicht gelesen werden: ${key}`,
            error
        );

        return null;
    }
}

function writeStorage(
    key,
    value
) {

    try {

        if (
            value === null ||
            value === undefined
        ) {

            window.localStorage.removeItem(
                key
            );

            return true;
        }

        window.localStorage.setItem(
            key,
            JSON.stringify(
                value
            )
        );

        return true;
    }
    catch (error) {

        console.warn(
            `Daten konnten nicht gespeichert werden: ${key}`,
            error
        );

        return false;
    }
}

function removeStorage(key) {

    try {

        window.localStorage.removeItem(
            key
        );
    }
    catch (error) {

        console.warn(
            `Gespeicherte Daten konnten nicht entfernt werden: ${key}`,
            error
        );
    }
}

/************************************************
 * SITZUNG SPEICHERN
 ************************************************/

function persistSession() {

    if (
        appState.currentUser
    ) {

        writeStorage(
            STORAGE_KEYS.SESSION,
            {
                currentUser:
                    cloneValue(
                        appState.currentUser
                    ),

                savedAt:
                    getTimestamp()
            }
        );
    }
    else {

        removeStorage(
            STORAGE_KEYS.SESSION
        );
    }

    if (
        appState.currentObject
    ) {

        writeStorage(
            STORAGE_KEYS.CURRENT_OBJECT,
            cloneValue(
                appState.currentObject
            )
        );
    }
    else {

        removeStorage(
            STORAGE_KEYS.CURRENT_OBJECT
        );
    }

    if (
        appState.currentShift &&
        appState.shiftStarted === true &&
        isRunningShift(
            appState.currentShift
        )
    ) {

        writeStorage(
            STORAGE_KEYS.CURRENT_SHIFT,
            cloneValue(
                appState.currentShift
            )
        );
    }
    else {

        removeStorage(
            STORAGE_KEYS.CURRENT_SHIFT
        );
    }
}

/************************************************
 * LOKALE ÄNDERUNGEN SPEICHERN
 ************************************************/

function createPersistedCollectionsSnapshot() {

    return PERSISTED_COLLECTION_NAMES.reduce(
        (
            result,
            collectionName
        ) => {

            result[
                collectionName
            ] =
                cloneValue(
                    asArray(
                        appState[
                            collectionName
                        ]
                    )
                );

            return result;
        },
        {}
    );
}

function persistLocalChanges() {

    writeStorage(
        STORAGE_KEYS.LOCAL_CHANGES,
        {
            collections:
                createPersistedCollectionsSnapshot(),

            savedAt:
                getTimestamp()
        }
    );
}

/************************************************
 * ALLGEMEINEN STATUS SPEICHERN
 ************************************************/

function persistAppMetadata() {

    writeStorage(
        STORAGE_KEYS.APP_STATE,
        {
            currentRoute:
                appState.currentRoute,

            dataSource:
                appState.dataSource,

            savedAt:
                getTimestamp()
        }
    );
}

/************************************************
 * SITZUNG WIEDERHERSTELLEN
 ************************************************/

function restoreSession() {

    const storedSession =
        asObject(
            readStorage(
                STORAGE_KEYS.SESSION
            )
        );

    const storedObject =
        readStorage(
            STORAGE_KEYS.CURRENT_OBJECT
        );

    const storedShift =
        readStorage(
            STORAGE_KEYS.CURRENT_SHIFT
        );

    const storedMetadata =
        asObject(
            readStorage(
                STORAGE_KEYS.APP_STATE
            )
        );

    if (
        isObject(
            storedSession.currentUser
        )
    ) {

        appState.currentUser =
            cloneValue(
                storedSession.currentUser
            );
    }

    if (
        isObject(
            storedObject
        )
    ) {

        appState.currentObject =
            cloneValue(
                storedObject
            );
    }

    if (
        isObject(
            storedShift
        ) &&
        isRunningShift(
            storedShift
        )
    ) {

        appState.currentShift =
            cloneValue(
                storedShift
            );

        appState.shiftStarted =
            true;
    }
    else {

        appState.currentShift =
            null;

        appState.shiftStarted =
            false;

        removeStorage(
            STORAGE_KEYS.CURRENT_SHIFT
        );
    }

    if (
        appState.currentUser
    ) {

        appState.currentRoute =
            normalizeText(
                storedMetadata.currentRoute
            ) ||
            DEFAULT_ROUTES.OVERVIEW;
    }
    else {

        appState.currentRoute =
            DEFAULT_ROUTES.LOGIN;

        appState.currentObject =
            null;

        appState.currentShift =
            null;

        appState.shiftStarted =
            false;
    }

    appState.sessionRestored =
        true;
}

/************************************************
 * LOKALE ÄNDERUNGEN WIEDERHERSTELLEN
 ************************************************/

function getStoredLocalCollections() {

    const storedChanges =
        asObject(
            readStorage(
                STORAGE_KEYS.LOCAL_CHANGES
            )
        );

    return asObject(
        storedChanges.collections
    );
}

function restoreLocalChanges() {

    const storedCollections =
        getStoredLocalCollections();

    PERSISTED_COLLECTION_NAMES.forEach(
        (collectionName) => {

            const storedValues =
                storedCollections[
                    collectionName
                ];

            if (
                Array.isArray(
                    storedValues
                )
            ) {

                appState[
                    collectionName
                ] =
                    cloneValue(
                        storedValues
                    );
            }
        }
    );

    appState.localChangesRestored =
        true;
}

/************************************************
 * SAMMLUNGEN ZUSAMMENFÜHREN
 ************************************************/

function mergeCollectionsById(
    loadedValues,
    localValues
) {

    const loaded =
        asArray(
            loadedValues
        );

    const local =
        asArray(
            localValues
        );

    const result = [];
    const positions =
        new Map();

    loaded.forEach(
        (entry) => {

            const clonedEntry =
                cloneValue(
                    entry
                );

            const entryId =
                normalizeId(
                    clonedEntry?.id
                );

            if (entryId) {

                positions.set(
                    entryId,
                    result.length
                );
            }

            result.push(
                clonedEntry
            );
        }
    );

    local.forEach(
        (entry) => {

            const clonedEntry =
                cloneValue(
                    entry
                );

            const entryId =
                normalizeId(
                    clonedEntry?.id
                );

            if (
                entryId &&
                positions.has(
                    entryId
                )
            ) {

                const position =
                    positions.get(
                        entryId
                    );

                result[position] = {
                    ...result[position],
                    ...clonedEntry
                };

                return;
            }

            if (entryId) {

                positions.set(
                    entryId,
                    result.length
                );
            }

            result.push(
                clonedEntry
            );
        }
    );

    return result;
}

/************************************************
 * ÄNDERUNGEN MELDEN
 ************************************************/

function notifySubscribers() {

    appState.lastUpdatedAt =
        getTimestamp();

    const snapshot =
        getAppState();

    subscribers.forEach(
        (subscriber) => {

            try {

                subscriber(
                    snapshot
                );
            }
            catch (error) {

                console.error(
                    "Fehler in einem App-State-Listener:",
                    error
                );
            }
        }
    );
}

/************************************************
 * INITIALISIERUNG
 ************************************************/

export function initializeAppState() {

    if (
        appState.initialized === true
    ) {

        return getAppState();
    }

    restoreSession();
    restoreLocalChanges();

    appState.initialized =
        true;

    appState.lastUpdatedAt =
        getTimestamp();

    return getAppState();
}

/************************************************
 * STATUS AUSLESEN
 ************************************************/

export function getAppState() {

    return appState;
}

export function getAppStateSnapshot() {

    return cloneValue(
        appState
    );
}

export function getCurrentUser() {

    return appState.currentUser;
}

export function getCurrentObject() {

    return appState.currentObject;
}

export function getCurrentShift() {

    return appState.currentShift;
}

export function getCurrentRoute() {

    return appState.currentRoute;
}

/************************************************
 * STATUS AKTUALISIEREN
 ************************************************/

export function updateAppState(
    partialState,
    {
        notify = true,
        persist = false
    } = {}
) {

    const update =
        asObject(
            partialState
        );

    Object.entries(
        update
    ).forEach(
        ([
            key,
            value
        ]) => {

            appState[key] =
                value;
        }
    );

    if (persist) {

        persistSession();
        persistLocalChanges();
        persistAppMetadata();
    }

    if (notify) {

        notifySubscribers();
    }
    else {

        appState.lastUpdatedAt =
            getTimestamp();
    }

    return getAppState();
}

/************************************************
 * DATENBESTÄNDE SETZEN
 ************************************************/

export function setDataCollections(
    collections,
    {
        notify = false
    } = {}
) {

    const normalizedCollections =
        asObject(
            collections
        );

    const storedLocalCollections =
        getStoredLocalCollections();

    DATA_COLLECTION_NAMES.forEach(
        (collectionName) => {

            const loadedValues =
                asArray(
                    normalizedCollections[
                        collectionName
                    ]
                );

            if (
                PERSISTED_COLLECTION_NAMES.includes(
                    collectionName
                )
            ) {

                appState[
                    collectionName
                ] =
                    mergeCollectionsById(
                        loadedValues,
                        storedLocalCollections[
                            collectionName
                        ]
                    );

                return;
            }

            appState[
                collectionName
            ] =
                cloneValue(
                    loadedValues
                );
        }
    );

    reconcilePersistedEntities();

    appState.dataLoadedAt =
        getTimestamp();

    appState.lastUpdatedAt =
        getTimestamp();

    persistLocalChanges();

    if (notify) {

        notifySubscribers();
    }

    return getAppState();
}

/************************************************
 * PERSISTIERTE ENTITÄTEN ABGLEICHEN
 ************************************************/

function reconcilePersistedEntities() {

    if (
        appState.currentUser?.id
    ) {

        const matchingUser =
            appState.users.find(
                (user) =>
                    user.id ===
                    appState.currentUser.id
            );

        if (matchingUser) {

            appState.currentUser = {
                ...matchingUser,
                ...appState.currentUser
            };
        }
        else {

            appState.currentUser =
                null;

            appState.currentObject =
                null;

            appState.currentShift =
                null;

            appState.shiftStarted =
                false;

            appState.currentRoute =
                DEFAULT_ROUTES.LOGIN;
        }
    }

    if (
        appState.currentObject?.id
    ) {

        const matchingObject =
            appState.objects.find(
                (object) =>
                    object.id ===
                    appState.currentObject.id
            );

        appState.currentObject =
            matchingObject
                ? cloneValue(
                    matchingObject
                )
                : null;
    }

    if (
        appState.currentShift?.id
    ) {

        const matchingShift =
            appState.shifts.find(
                (shift) =>
                    shift.id ===
                    appState.currentShift.id
            );

        if (matchingShift) {

            appState.currentShift = {
                ...matchingShift,
                ...appState.currentShift
            };
        }

        if (
            !isRunningShift(
                appState.currentShift
            )
        ) {

            appState.currentShift =
                null;

            appState.shiftStarted =
                false;
        }
    }

    if (
        !appState.currentUser
    ) {

        appState.currentObject =
            null;

        appState.currentShift =
            null;

        appState.shiftStarted =
            false;

        appState.currentRoute =
            DEFAULT_ROUTES.LOGIN;
    }

    persistSession();
    persistAppMetadata();
}

/************************************************
 * EINZELNE DATENSAMMLUNG SETZEN
 ************************************************/

export function setCollection(
    collectionName,
    values,
    {
        notify = true,
        persist = true
    } = {}
) {

    if (
        !DATA_COLLECTION_NAMES.includes(
            collectionName
        )
    ) {

        throw new Error(
            `Unbekannte Datensammlung: ${collectionName}`
        );
    }

    appState[
        collectionName
    ] =
        cloneValue(
            asArray(
                values
            )
        );

    if (
        persist &&
        PERSISTED_COLLECTION_NAMES.includes(
            collectionName
        )
    ) {

        persistLocalChanges();
    }

    if (notify) {

        notifySubscribers();
    }

    return appState[
        collectionName
    ];
}

/************************************************
 * EINTRAG HINZUFÜGEN
 ************************************************/

export function addCollectionEntry(
    collectionName,
    entry,
    {
        notify = true,
        persist = true
    } = {}
) {

    if (
        !DATA_COLLECTION_NAMES.includes(
            collectionName
        )
    ) {

        throw new Error(
            `Unbekannte Datensammlung: ${collectionName}`
        );
    }

    const normalizedEntry =
        cloneValue(
            asObject(
                entry
            )
        );

    appState[
        collectionName
    ] = [
        ...asArray(
            appState[
                collectionName
            ]
        ),
        normalizedEntry
    ];

    if (
        persist &&
        PERSISTED_COLLECTION_NAMES.includes(
            collectionName
        )
    ) {

        persistLocalChanges();
    }

    if (notify) {

        notifySubscribers();
    }

    return normalizedEntry;
}

/************************************************
 * EINTRAG AKTUALISIEREN
 ************************************************/

export function updateCollectionEntry(
    collectionName,
    entryId,
    changes,
    {
        notify = true,
        persist = true
    } = {}
) {

    if (
        !DATA_COLLECTION_NAMES.includes(
            collectionName
        )
    ) {

        throw new Error(
            `Unbekannte Datensammlung: ${collectionName}`
        );
    }

    const normalizedId =
        normalizeId(
            entryId
        );

    const normalizedChanges =
        asObject(
            changes
        );

    let updatedEntry =
        null;

    appState[
        collectionName
    ] =
        asArray(
            appState[
                collectionName
            ]
        ).map(
            (entry) => {

                if (
                    normalizeId(
                        entry?.id
                    ) !==
                    normalizedId
                ) {

                    return entry;
                }

                updatedEntry = {
                    ...entry,
                    ...cloneValue(
                        normalizedChanges
                    )
                };

                return updatedEntry;
            }
        );

    if (
        updatedEntry &&
        persist &&
        PERSISTED_COLLECTION_NAMES.includes(
            collectionName
        )
    ) {

        persistLocalChanges();
    }

    if (
        updatedEntry &&
        notify
    ) {

        notifySubscribers();
    }

    return updatedEntry;
}

/************************************************
 * EINTRAG ENTFERNEN
 ************************************************/

export function removeCollectionEntry(
    collectionName,
    entryId,
    {
        notify = true,
        persist = true
    } = {}
) {

    if (
        !DATA_COLLECTION_NAMES.includes(
            collectionName
        )
    ) {

        throw new Error(
            `Unbekannte Datensammlung: ${collectionName}`
        );
    }

    const normalizedId =
        normalizeId(
            entryId
        );

    const previousValues =
        asArray(
            appState[
                collectionName
            ]
        );

    const filteredValues =
        previousValues.filter(
            (entry) =>
                normalizeId(
                    entry?.id
                ) !==
                normalizedId
        );

    const removed =
        filteredValues.length <
        previousValues.length;

    if (!removed) {

        return false;
    }

    appState[
        collectionName
    ] =
        filteredValues;

    if (
        persist &&
        PERSISTED_COLLECTION_NAMES.includes(
            collectionName
        )
    ) {

        persistLocalChanges();
    }

    if (notify) {

        notifySubscribers();
    }

    return true;
}

/************************************************
 * BENUTZER
 ************************************************/

export function setCurrentUser(
    user,
    {
        notify = true,
        persist = true
    } = {}
) {

    appState.currentUser =
        isObject(user)
            ? cloneValue(
                user
            )
            : null;

    if (!appState.currentUser) {

        appState.currentObject =
            null;

        appState.currentShift =
            null;

        appState.shiftStarted =
            false;

        appState.currentRoute =
            DEFAULT_ROUTES.LOGIN;
    }
    else if (
        appState.currentRoute ===
        DEFAULT_ROUTES.LOGIN
    ) {

        appState.currentRoute =
            DEFAULT_ROUTES.OVERVIEW;
    }

    if (persist) {

        persistSession();
        persistAppMetadata();
    }

    if (notify) {

        notifySubscribers();
    }

    return appState.currentUser;
}

/************************************************
 * OBJEKT
 ************************************************/

export function setCurrentObject(
    object,
    {
        notify = true,
        persist = true
    } = {}
) {

    appState.currentObject =
        isObject(object)
            ? cloneValue(
                object
            )
            : null;

    if (persist) {

        persistSession();
    }

    if (notify) {

        notifySubscribers();
    }

    return appState.currentObject;
}

/************************************************
 * ROUTE
 ************************************************/

export function setCurrentRoute(
    route,
    {
        notify = false,
        persist = true
    } = {}
) {

    const fallbackRoute =
        appState.currentUser
            ? DEFAULT_ROUTES.OVERVIEW
            : DEFAULT_ROUTES.LOGIN;

    const normalizedRoute =
        normalizeText(
            route
        ) ||
        fallbackRoute;

    if (
        appState.currentRoute ===
        normalizedRoute
    ) {

        return appState.currentRoute;
    }

    appState.currentRoute =
        normalizedRoute;

    if (persist) {

        persistAppMetadata();
    }

    if (notify) {

        notifySubscribers();
    }

    return appState.currentRoute;
}

/************************************************
 * LADESTATUS
 ************************************************/

export function setLoading(
    loading,
    {
        notify = false
    } = {}
) {

    appState.loading =
        loading === true;

    if (notify) {

        notifySubscribers();
    }

    return appState.loading;
}

/************************************************
 * FEHLERSTATUS
 ************************************************/

export function setError(
    error,
    {
        notify = false
    } = {}
) {

    appState.error =
        error
            ? String(error)
            : null;

    if (notify) {

        notifySubscribers();
    }

    return appState.error;
}

/************************************************
 * SCHICHT STARTEN
 ************************************************/

export function startShift(
    shift = null,
    {
        notify = true,
        persist = true
    } = {}
) {

    const stateUser =
        appState.currentUser;

    const stateObject =
        appState.currentObject;

    const timestamp =
        getTimestamp();

    const normalizedShift =
        isObject(shift)
            ? cloneValue(
                shift
            )
            : {
                id:
                    `SHIFT-LOCAL-${Date.now()}`,

                userId:
                    stateUser?.id ??
                    null,

                employeeId:
                    stateUser?.id ??
                    null,

                objectId:
                    stateObject?.id ??
                    null,

                startTime:
                    timestamp,

                checkinTime:
                    timestamp,

                endTime:
                    null,

                checkoutTime:
                    null,

                status:
                    "RUNNING",

                source:
                    "LOCAL_TEST",

                createdAt:
                    timestamp,

                updatedAt:
                    timestamp
            };

    if (
        !isRunningShift(
            normalizedShift
        )
    ) {

        normalizedShift.status =
            "RUNNING";

        normalizedShift.endTime =
            null;

        normalizedShift.checkoutTime =
            null;
    }

    appState.currentShift =
        normalizedShift;

    appState.shiftStarted =
        true;

    const existingShiftIndex =
        appState.shifts.findIndex(
            (entry) =>
                entry.id ===
                normalizedShift.id
        );

    if (
        existingShiftIndex >= 0
    ) {

        appState.shifts =
            appState.shifts.map(
                (entry) =>
                    entry.id ===
                    normalizedShift.id
                        ? {
                            ...entry,
                            ...normalizedShift
                        }
                        : entry
            );
    }
    else {

        appState.shifts = [
            ...appState.shifts,
            normalizedShift
        ];
    }

    if (persist) {

        persistSession();
        persistLocalChanges();
    }

    if (notify) {

        notifySubscribers();
    }

    return appState.currentShift;
}

/************************************************
 * SCHICHT BEENDEN
 ************************************************/

export function stopShift(
    completedShift = null,
    {
        notify = true,
        persist = true
    } = {}
) {

    const timestamp =
        getTimestamp();

    const finalShift =
        isObject(
            completedShift
        )
            ? cloneValue(
                completedShift
            )
            : (
                appState.currentShift
                    ? {
                        ...appState.currentShift,

                        endTime:
                            timestamp,

                        checkoutTime:
                            timestamp,

                        status:
                            "FINISHED",

                        updatedAt:
                            timestamp
                    }
                    : null
            );

    if (
        finalShift?.id
    ) {

        const existingShiftIndex =
            appState.shifts.findIndex(
                (entry) =>
                    entry.id ===
                    finalShift.id
            );

        if (
            existingShiftIndex >= 0
        ) {

            appState.shifts =
                appState.shifts.map(
                    (entry) =>
                        entry.id ===
                        finalShift.id
                            ? {
                                ...entry,
                                ...finalShift
                            }
                            : entry
                );
        }
        else {

            appState.shifts = [
                ...appState.shifts,
                finalShift
            ];
        }
    }

    appState.currentShift =
        null;

    appState.shiftStarted =
        false;

    if (persist) {

        persistSession();
        persistLocalChanges();
    }

    if (notify) {

        notifySubscribers();
    }

    return finalShift;
}

/************************************************
 * LOGOUT
 ************************************************/

export function logoutCurrentUser({
    notify = true
} = {}) {

    appState.currentUser =
        null;

    appState.currentObject =
        null;

    appState.currentShift =
        null;

    appState.shiftStarted =
        false;

    appState.currentRoute =
        DEFAULT_ROUTES.LOGIN;

    removeStorage(
        STORAGE_KEYS.SESSION
    );

    removeStorage(
        STORAGE_KEYS.CURRENT_OBJECT
    );

    removeStorage(
        STORAGE_KEYS.CURRENT_SHIFT
    );

    persistAppMetadata();

    if (notify) {

        notifySubscribers();
    }

    return true;
}

/************************************************
 * SUCHE UND FILTER
 ************************************************/

export function findById(
    collectionName,
    entryId
) {

    if (
        !DATA_COLLECTION_NAMES.includes(
            collectionName
        )
    ) {

        return null;
    }

    const normalizedId =
        normalizeId(
            entryId
        );

    return (
        asArray(
            appState[
                collectionName
            ]
        ).find(
            (entry) =>
                normalizeId(
                    entry?.id
                ) ===
                normalizedId
        ) ??
        null
    );
}

export function getRoomsByObjectId(
    objectId
) {

    const normalizedObjectId =
        normalizeId(
            objectId
        );

    return appState.rooms.filter(
        (room) =>
            room.objectId ===
            normalizedObjectId
    );
}

export function getTasksByObjectId(
    objectId
) {

    const normalizedObjectId =
        normalizeId(
            objectId
        );

    return appState.tasks.filter(
        (task) =>
            task.objectId ===
            normalizedObjectId
    );
}

export function getTasksByRoomId(
    roomId
) {

    const normalizedRoomId =
        normalizeId(
            roomId
        );

    return appState.tasks.filter(
        (task) =>
            task.roomId ===
            normalizedRoomId
    );
}

export function getTicketsByObjectId(
    objectId
) {

    const normalizedObjectId =
        normalizeId(
            objectId
        );

    return appState.tickets.filter(
        (ticket) =>
            ticket.objectId ===
            normalizedObjectId
    );
}

export function getMaterialStockByObjectId(
    objectId
) {

    const normalizedObjectId =
        normalizeId(
            objectId
        );

    return appState.materialStock.filter(
        (stock) =>
            stock.objectId ===
            normalizedObjectId
    );
}

export function getShiftsByObjectId(
    objectId
) {

    const normalizedObjectId =
        normalizeId(
            objectId
        );

    return appState.shifts.filter(
        (shift) =>
            shift.objectId ===
            normalizedObjectId
    );
}

/************************************************
 * LISTENER REGISTRIEREN
 ************************************************/

export function subscribeToAppState(
    subscriber
) {

    if (
        typeof subscriber !==
        "function"
    ) {

        throw new TypeError(
            "Der App-State-Listener muss eine Funktion sein."
        );
    }

    subscribers.add(
        subscriber
    );

    return () => {

        subscribers.delete(
            subscriber
        );
    };
}

/************************************************
 * LOKALE PRÄSENTATIONSDATEN LÖSCHEN
 ************************************************/

export function clearLocalChanges({
    notify = true
} = {}) {

    removeStorage(
        STORAGE_KEYS.LOCAL_CHANGES
    );

    PERSISTED_COLLECTION_NAMES.forEach(
        (collectionName) => {

            appState[
                collectionName
            ] = [];
        }
    );

    appState.currentShift =
        null;

    appState.shiftStarted =
        false;

    removeStorage(
        STORAGE_KEYS.CURRENT_SHIFT
    );

    if (notify) {

        notifySubscribers();
    }

    return true;
}

/************************************************
 * STATUS ZURÜCKSETZEN
 ************************************************/

export function resetAppState({
    preserveData = false,
    preserveSession = false,
    preserveLocalChanges = false,
    notify = true
} = {}) {

    const preservedCollections =
        preserveData
            ? DATA_COLLECTION_NAMES.reduce(
                (
                    result,
                    collectionName
                ) => {

                    result[
                        collectionName
                    ] =
                        cloneValue(
                            appState[
                                collectionName
                            ]
                        );

                    return result;
                },
                {}
            )
            : createInitialDataCollections();

    const preservedUser =
        preserveSession
            ? cloneValue(
                appState.currentUser
            )
            : null;

    const preservedObject =
        preserveSession
            ? cloneValue(
                appState.currentObject
            )
            : null;

    const preservedShift =
        preserveSession &&
        isRunningShift(
            appState.currentShift
        )
            ? cloneValue(
                appState.currentShift
            )
            : null;

    const newState =
        createInitialState();

    Object.assign(
        appState,
        newState,
        preservedCollections,
        {
            currentUser:
                preservedUser,

            currentObject:
                preservedObject,

            currentShift:
                preservedShift,

            shiftStarted:
                Boolean(
                    preservedShift
                ),

            currentRoute:
                preservedUser
                    ? DEFAULT_ROUTES.OVERVIEW
                    : DEFAULT_ROUTES.LOGIN
        }
    );

    if (!preserveSession) {

        removeStorage(
            STORAGE_KEYS.SESSION
        );

        removeStorage(
            STORAGE_KEYS.CURRENT_OBJECT
        );

        removeStorage(
            STORAGE_KEYS.CURRENT_SHIFT
        );
    }
    else {

        persistSession();
    }

    if (!preserveLocalChanges) {

        removeStorage(
            STORAGE_KEYS.LOCAL_CHANGES
        );
    }
    else {

        persistLocalChanges();
    }

    persistAppMetadata();

    if (notify) {

        notifySubscribers();
    }

    return getAppState();
}

/************************************************
 * KOMPLETTER RESET
 ************************************************/

export function resetApp() {

    return resetAppState({
        preserveData:
            false,

        preserveSession:
            false,

        preserveLocalChanges:
            false,

        notify:
            true
    });
}