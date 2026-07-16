/************************************************
 * Facility OS
 * appState.js
 *
 * Zentrale Zustandsverwaltung
 * - Benutzersitzung
 * - aktuelles Objekt
 * - Schichtstatus
 * - geladene Datenbestände
 * - lokale Persistenz
 * - Listener für UI-Aktualisierungen
 * - vorbereitet für spätere API-/Sheets-Anbindung
 ************************************************/

/************************************************
 * SPEICHERSCHLÜSSEL
 ************************************************/

const STORAGE_KEYS = Object.freeze({

    SESSION:
        "facility_os_session",

    CURRENT_OBJECT:
        "facility_os_current_object",

    CURRENT_SHIFT:
        "facility_os_current_shift",

    APP_STATE:
        "facility_os_app_state"
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
        "workOrders"
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
            "/dashboard",

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

        lastUpdatedAt:
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

function normalizeId(value) {

    return String(value ?? "")
        .trim();
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
 * PERSISTIERBARE SITZUNG
 ************************************************/

function persistSession() {

    if (
        appState.currentUser
    ) {

        writeStorage(
            STORAGE_KEYS.SESSION,
            {
                currentUser:
                    appState.currentUser,

                savedAt:
                    new Date().toISOString()
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
            appState.currentObject
        );
    }
    else {

        removeStorage(
            STORAGE_KEYS.CURRENT_OBJECT
        );
    }

    if (
        appState.currentShift &&
        appState.shiftStarted === true
    ) {

        writeStorage(
            STORAGE_KEYS.CURRENT_SHIFT,
            appState.currentShift
        );
    }
    else {

        removeStorage(
            STORAGE_KEYS.CURRENT_SHIFT
        );
    }
}

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

    if (
        storedSession.currentUser
    ) {

        appState.currentUser =
            cloneValue(
                storedSession.currentUser
            );
    }

    if (
        storedObject &&
        typeof storedObject === "object"
    ) {

        appState.currentObject =
            cloneValue(
                storedObject
            );
    }

    if (
        storedShift &&
        typeof storedShift === "object"
    ) {

        appState.currentShift =
            cloneValue(
                storedShift
            );

        appState.shiftStarted =
            true;
    }

    appState.sessionRestored =
        true;
}

/************************************************
 * ÄNDERUNGEN MELDEN
 ************************************************/

function notifySubscribers() {

    appState.lastUpdatedAt =
        new Date().toISOString();

    subscribers.forEach(
        (subscriber) => {

            try {

                subscriber(
                    getAppState()
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

    appState.initialized =
        true;

    appState.lastUpdatedAt =
        new Date().toISOString();

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
    }

    if (notify) {

        notifySubscribers();
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

    DATA_COLLECTION_NAMES.forEach(
        (collectionName) => {

            appState[
                collectionName
            ] =
                asArray(
                    normalizedCollections[
                        collectionName
                    ]
                );
        }
    );

    reconcilePersistedEntities();

    appState.lastUpdatedAt =
        new Date().toISOString();

    if (notify) {

        notifySubscribers();
    }

    return getAppState();
}

/************************************************
 * PERSISTIERTE ENTITÄTEN MIT GELADENEN DATEN
 * ABGLEICHEN
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

        if (matchingObject) {

            appState.currentObject =
                matchingObject;
        }
        else {

            appState.currentObject =
                null;
        }
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
    }

    persistSession();
}

/************************************************
 * EINZELNE DATENSAMMLUNG SETZEN
 ************************************************/

export function setCollection(
    collectionName,
    values,
    {
        notify = true
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
        asArray(
            values
        );

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
        notify = true
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
        asObject(
            entry
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
        notify = true
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
                    entry.id !==
                    normalizedId
                ) {

                    return entry;
                }

                updatedEntry = {
                    ...entry,

                    ...normalizedChanges
                };

                return updatedEntry;
            }
        );

    if (notify) {

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
        notify = true
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

    const previousLength =
        appState[
            collectionName
        ].length;

    appState[
        collectionName
    ] =
        asArray(
            appState[
                collectionName
            ]
        ).filter(
            (entry) =>
                entry.id !==
                normalizedId
        );

    const removed =
        appState[
            collectionName
        ].length <
        previousLength;

    if (
        removed &&
        notify
    ) {

        notifySubscribers();
    }

    return removed;
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
        user &&
        typeof user === "object"
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
    }

    if (persist) {

        persistSession();
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
        object &&
        typeof object === "object"
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
        notify = false
    } = {}
) {

    const normalizedRoute =
        String(
            route ??
            "/dashboard"
        ).trim() ||
        "/dashboard";

    appState.currentRoute =
        normalizedRoute;

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

    const normalizedShift =
        shift &&
        typeof shift === "object"
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
                    new Date().toISOString(),

                endTime:
                    null,

                status:
                    "RUNNING",

                source:
                    "LOCAL_TEST"
            };

    appState.currentShift =
        normalizedShift;

    appState.shiftStarted =
        true;

    if (persist) {

        persistSession();
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

    const finalShift =
        completedShift &&
        typeof completedShift === "object"
            ? cloneValue(
                completedShift
            )
            : (
                appState.currentShift
                    ? {
                        ...appState.currentShift,

                        endTime:
                            new Date().toISOString(),

                        status:
                            "FINISHED"
                    }
                    : null
            );

    appState.currentShift =
        null;

    appState.shiftStarted =
        false;

    if (persist) {

        persistSession();
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
        "/login";

    removeStorage(
        STORAGE_KEYS.SESSION
    );

    removeStorage(
        STORAGE_KEYS.CURRENT_OBJECT
    );

    removeStorage(
        STORAGE_KEYS.CURRENT_SHIFT
    );

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
                entry.id ===
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
 * STATUS ZURÜCKSETZEN
 ************************************************/

export function resetAppState({
    preserveData = false,
    preserveSession = false,
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
                        appState[
                            collectionName
                        ];

                    return result;
                },
                {}
            )
            : createInitialDataCollections();

    const preservedUser =
        preserveSession
            ? appState.currentUser
            : null;

    const preservedObject =
        preserveSession
            ? appState.currentObject
            : null;

    const preservedShift =
        preserveSession
            ? appState.currentShift
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
                )
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

        notify:
            true
    });
}