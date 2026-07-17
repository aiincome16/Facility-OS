/************************************************
 * Facility OS
 * app.js
 *
 * Zentrale Anwendungssteuerung
 * - lokale Daten laden
 * - App-State initialisieren
 * - Router synchronisieren
 * - Login und Logout
 * - Objektauswahl
 * - Check-in und Check-out
 * - Fehleranzeige
 * - vorbereitet für spätere API-/Sheets-Anbindung
 ************************************************/

import * as AppState
    from "./appState.js";

import * as DataService
    from "./services/dataService.js";

import {
    ROUTES,
    initializeRouter,
    navigateTo,
    getCurrentRoute,
    setRouterContext,
    subscribeToRoute,
    resetRouter
} from "./router.js";

import {
    renderApp
} from "./ui/renderApp.js";

/************************************************
 * APP-LAUFZEITSTATUS
 ************************************************/

let appInitialized =
    false;

let dataLoaded =
    false;

let routerInitialized =
    false;

let currentRoute =
    ROUTES.LOGIN;

let unsubscribeFromRouter =
    null;

let unsubscribeFromState =
    null;

let renderScheduled =
    false;

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

const REQUIRED_COLLECTION_NAMES =
    Object.freeze([
        "users",
        "objects",
        "rooms",
        "tasks",
        "materials",
        "shifts",
        "tickets"
    ]);

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

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

function normalizeRole(value) {

    return normalizeText(value)
        .toUpperCase();
}

function normalizeIdentifier(value) {

    return normalizeText(value)
        .toLowerCase();
}

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function createLocalId(prefix) {

    const normalizedPrefix =
        normalizeText(prefix)
            .replace(
                /[^A-Za-z0-9_-]/g,
                ""
            )
            .toUpperCase() ||
        "ENTRY";

    const randomPart =
        Math.random()
            .toString(36)
            .slice(2, 9)
            .toUpperCase();

    return `${normalizedPrefix}-${Date.now()}-${randomPart}`;
}

function getCurrentTimestamp() {

    return new Date()
        .toISOString();
}

/************************************************
 * APP-ELEMENT
 ************************************************/

function getAppElement() {

    return document.getElementById(
        "app"
    );
}

/************************************************
 * STATE AUSLESEN
 ************************************************/

function getState() {

    if (
        typeof AppState.getAppState !==
        "function"
    ) {

        throw new Error(
            "getAppState() wurde in appState.js nicht gefunden."
        );
    }

    const state =
        AppState.getAppState();

    if (
        !state ||
        typeof state !==
        "object"
    ) {

        throw new Error(
            "getAppState() hat keinen gültigen State zurückgegeben."
        );
    }

    return state;
}

/************************************************
 * STATE AKTUALISIEREN
 ************************************************/

function updateState(
    partialState,
    options = {}
) {

    const update =
        asObject(
            partialState
        );

    if (
        typeof AppState.updateAppState ===
        "function"
    ) {

        AppState.updateAppState(
            update,
            options
        );

        return;
    }

    Object.assign(
        getState(),
        update
    );
}

function setLoadingState(value) {

    if (
        typeof AppState.setLoading ===
        "function"
    ) {

        AppState.setLoading(
            value === true
        );

        return;
    }

    updateState(
        {
            loading:
                value === true
        },
        {
            notify:
                false
        }
    );
}

function setErrorState(error) {

    const message =
        error
            ? (
                error instanceof Error
                    ? error.message
                    : String(error)
            )
            : null;

    if (
        typeof AppState.setError ===
        "function"
    ) {

        AppState.setError(
            message
        );

        return;
    }

    updateState(
        {
            error:
                message
        },
        {
            notify:
                false
        }
    );
}

function setRouteState(route) {

    const normalizedRoute =
        normalizeText(route) ||
        ROUTES.OVERVIEW;

    currentRoute =
        normalizedRoute;

    const state =
        getState();

    if (
        state.currentRoute ===
        normalizedRoute
    ) {

        return;
    }

    if (
        typeof AppState.setCurrentRoute ===
        "function"
    ) {

        AppState.setCurrentRoute(
            normalizedRoute
        );

        return;
    }

    updateState(
        {
            currentRoute:
                normalizedRoute
        },
        {
            notify:
                false
        }
    );
}

function setUserState(user) {

    if (
        typeof AppState.setCurrentUser ===
        "function"
    ) {

        AppState.setCurrentUser(
            user
        );

        return;
    }

    updateState(
        {
            currentUser:
                user
        },
        {
            persist:
                true
        }
    );
}

function setObjectState(object) {

    if (
        typeof AppState.setCurrentObject ===
        "function"
    ) {

        AppState.setCurrentObject(
            object
        );

        return;
    }

    updateState(
        {
            currentObject:
                object
        },
        {
            persist:
                true
        }
    );
}

function clearSessionState() {

    if (
        typeof AppState.logoutCurrentUser ===
        "function"
    ) {

        AppState.logoutCurrentUser();

        return;
    }

    updateState(
        {
            currentUser:
                null,

            currentObject:
                null,

            currentShift:
                null,

            shiftStarted:
                false,

            currentRoute:
                ROUTES.LOGIN
        },
        {
            persist:
                true
        }
    );
}

/************************************************
 * RENDERING PLANEN
 ************************************************/

function scheduleRender() {

    if (
        renderScheduled ||
        !appInitialized ||
        !dataLoaded
    ) {

        return;
    }

    renderScheduled =
        true;

    window.requestAnimationFrame(
        () => {

            renderScheduled =
                false;

            renderCurrentApp();
        }
    );
}

/************************************************
 * DATEN NORMALISIEREN
 ************************************************/

function normalizeLoadedData(result) {

    const resultObject =
        asObject(result);

    const source =
        asObject(
            resultObject.data ??
            resultObject.collections ??
            resultObject.datasets ??
            resultObject
        );

    const normalizedData = {};

    DATA_COLLECTION_NAMES.forEach(
        (collectionName) => {

            normalizedData[
                collectionName
            ] =
                asArray(
                    source[
                        collectionName
                    ]
                );
        }
    );

    return normalizedData;
}

/************************************************
 * DATEN PRÜFEN
 ************************************************/

function validateRequiredData(data) {

    const missingCollections =
        REQUIRED_COLLECTION_NAMES.filter(
            (collectionName) =>
                !Array.isArray(
                    data[
                        collectionName
                    ]
                )
        );

    if (
        missingCollections.length > 0
    ) {

        throw new Error(
            `Pflichtdaten fehlen: ${missingCollections.join(", ")}`
        );
    }

    if (
        data.users.length === 0
    ) {

        throw new Error(
            "Die Benutzerdaten enthalten keine Einträge."
        );
    }

    if (
        data.objects.length === 0
    ) {

        throw new Error(
            "Die Objektdaten enthalten keine Einträge."
        );
    }

    return true;
}

function validateDataRelations(data) {

    if (
        typeof DataService.validateDataRelations !==
        "function"
    ) {

        return [];
    }

    try {

        return asArray(
            DataService.validateDataRelations(
                data
            )
        );
    }
    catch (error) {

        console.warn(
            "Datenbeziehungen konnten nicht vollständig geprüft werden.",
            error
        );

        return [];
    }
}

/************************************************
 * DATEN IN STATE ÜBERNEHMEN
 ************************************************/

function applyLoadedData(data) {

    if (
        typeof AppState.setDataCollections ===
        "function"
    ) {

        AppState.setDataCollections(
            data,
            {
                notify:
                    false
            }
        );

        return;
    }

    updateState(
        data,
        {
            notify:
                false
        }
    );
}

/************************************************
 * DATEN LADEN
 ************************************************/

async function loadApplicationData() {

    if (
        typeof DataService.loadAllData !==
        "function"
    ) {

        throw new Error(
            "loadAllData() wurde in dataService.js nicht gefunden."
        );
    }

    const loadedResult =
        await DataService.loadAllData();

    const normalizedData =
        normalizeLoadedData(
            loadedResult
        );

    validateRequiredData(
        normalizedData
    );

    const relationWarnings =
        validateDataRelations(
            normalizedData
        );

    if (
        relationWarnings.length > 0
    ) {

        console.warn(
            "Hinweise zu Datenbeziehungen:",
            relationWarnings
        );
    }

    applyLoadedData(
        normalizedData
    );

    dataLoaded =
        true;

    return normalizedData;
}

/************************************************
 * LADEANSICHT
 ************************************************/

function renderLoadingScreen(
    message =
        "Facility OS wird geladen …"
) {

    const appElement =
        getAppElement();

    if (!appElement) {

        return;
    }

    appElement.innerHTML = `
        <main class="system-state-page">

            <section class="system-state-card">

                <div
                    class="loading-spinner"
                    aria-hidden="true"
                ></div>

                <h1>
                    Facility OS
                </h1>

                <p>
                    ${escapeHtml(message)}
                </p>

            </section>

        </main>
    `;
}

/************************************************
 * FEHLERANSICHT
 ************************************************/

function renderFatalError(error) {

    const appElement =
        getAppElement();

    if (!appElement) {

        return;
    }

    const message =
        error instanceof Error
            ? error.message
            : String(
                error ??
                "Unbekannter Fehler"
            );

    appElement.innerHTML = `
        <main class="system-state-page">

            <section class="system-state-card system-error-card">

                <span class="system-error-label">
                    Startfehler
                </span>

                <h1>
                    Facility OS konnte nicht gestartet werden
                </h1>

                <p>
                    ${escapeHtml(message)}
                </p>

                <button
                    type="button"
                    class="button button-primary button-full"
                    id="reload-application"
                >
                    Erneut laden
                </button>

                <button
                    type="button"
                    class="button button-secondary button-full"
                    id="reset-application"
                >
                    Sitzung zurücksetzen
                </button>

            </section>

        </main>
    `;

    document
        .getElementById(
            "reload-application"
        )
        ?.addEventListener(
            "click",
            () => {

                window.location.reload();
            }
        );

    document
        .getElementById(
            "reset-application"
        )
        ?.addEventListener(
            "click",
            () => {

                try {

                    if (
                        typeof AppState.resetApp ===
                        "function"
                    ) {

                        AppState.resetApp();
                    }
                    else {

                        window.localStorage.clear();
                    }

                    resetRouter();
                }
                finally {

                    window.location.href =
                        window.location.pathname;
                }
            }
        );
}

/************************************************
 * LOGIN-BENUTZER FINDEN
 ************************************************/

function getUserLoginIdentifiers(user) {

    return [
        user.id,
        user.username,
        user.email,
        user.employeeNumber,
        user.login,
        user.userName,
        user.name,
        user.fullName,
        user.displayName
    ]
        .map(
            normalizeIdentifier
        )
        .filter(Boolean);
}

function findUserForLogin(identifier) {

    const normalizedIdentifier =
        normalizeIdentifier(
            identifier
        );

    if (!normalizedIdentifier) {

        return null;
    }

    return asArray(
        getState().users
    )
        .filter(
            (user) =>
                user.active !== false
        )
        .find(
            (user) =>
                getUserLoginIdentifiers(
                    user
                ).includes(
                    normalizedIdentifier
                )
        ) ??
        null;
}

function getStoredPassword(user) {

    return String(
        user.password ??
        user.testPassword ??
        user.pin ??
        ""
    );
}

function validateLoginPassword(
    user,
    suppliedPassword
) {

    const storedPassword =
        getStoredPassword(
            user
        );

    const password =
        String(
            suppliedPassword ??
            ""
        );

    if (!storedPassword) {

        return true;
    }

    return (
        storedPassword ===
        password
    );
}

/************************************************
 * SICHTBARE OBJEKTE
 ************************************************/

function getObjectsForUser(user) {

    const state =
        getState();

    const objects =
        asArray(
            state.objects
        ).filter(
            (object) =>
                object.active !== false
        );

    if (!user) {

        return [];
    }

    const role =
        normalizeRole(
            user.role
        );

    if (
        [
            "SUPER_ADMIN",
            "ADMIN",
            "BUCHHALTUNG"
        ].includes(role)
    ) {

        return objects;
    }

    if (
        role ===
        "OBJEKTLEITER"
    ) {

        const managedObjectIds =
            asArray(
                user.assignedObjectIds ??
                user.objectIds ??
                user.managedObjectIds
            );

        const managedObjects =
            objects.filter(
                (object) =>
                    object.objectLeaderId ===
                        user.id ||
                    object.managerId ===
                        user.id ||
                    object.leaderId ===
                        user.id ||
                    managedObjectIds.includes(
                        object.id
                    )
            );

        return managedObjects.length > 0
            ? managedObjects
            : objects;
    }

    if (
        role ===
        "MITARBEITER"
    ) {

        const assignedObjectIds =
            asArray(
                user.assignedObjectIds ??
                user.objectIds
            );

        const assignedObjects =
            objects.filter(
                (object) =>
                    assignedObjectIds.includes(
                        object.id
                    ) ||
                    asArray(
                        object.assignedEmployeeIds ??
                        object.employeeIds ??
                        object.assignedUserIds
                    ).includes(
                        user.id
                    )
            );

        return assignedObjects.length > 0
            ? assignedObjects
            : objects;
    }

    if (
        role ===
        "KUNDE"
    ) {

        const allowedObjectIds =
            asArray(
                state.customerAccess
            )
                .filter(
                    (access) =>
                        access.active !== false &&
                        (
                            access.customerUserId ===
                                user.id ||
                            access.userId ===
                                user.id
                        )
                )
                .map(
                    (access) =>
                        access.objectId
                )
                .filter(Boolean);

        return objects.filter(
            (object) =>
                allowedObjectIds.includes(
                    object.id
                ) ||
                object.customerUserId ===
                    user.id
        );
    }

    return [];
}

/************************************************
 * AKTUELLES OBJEKT ABGLEICHEN
 ************************************************/

function validateCurrentObject() {

    const state =
        getState();

    if (
        !state.currentUser ||
        !state.currentObject
    ) {

        return null;
    }

    const validObject =
        getObjectsForUser(
            state.currentUser
        ).find(
            (object) =>
                object.id ===
                state.currentObject.id
        );

    if (!validObject) {

        setObjectState(
            null
        );

        return null;
    }

    if (
        validObject !==
        state.currentObject
    ) {

        setObjectState(
            validObject
        );
    }

    return validObject;
}

/************************************************
 * ROUTER-KONTEXT SYNCHRONISIEREN
 ************************************************/

function synchronizeRouterContext({
    notify = false
} = {}) {

    if (!routerInitialized) {

        return currentRoute;
    }

    const state =
        getState();

    setRouterContext(
        {
            currentUser:
                state.currentUser,

            currentObject:
                state.currentObject
        },
        {
            notify,
            resolve:
                true
        }
    );

    const resolvedRoute =
        getCurrentRoute();

    setRouteState(
        resolvedRoute
    );

    return resolvedRoute;
}

/************************************************
 * NAVIGATION
 ************************************************/

function handleNavigate(route) {

    const state =
        getState();

    setRouterContext(
        {
            currentUser:
                state.currentUser,

            currentObject:
                state.currentObject
        },
        {
            notify:
                false,

            resolve:
                true
        }
    );

    return navigateTo(
        route
    );
}

/************************************************
 * LOGIN
 ************************************************/

function handleLogin(loginData) {

    const identifier =
        normalizeText(
            loginData?.identifier
        );

    const password =
        String(
            loginData?.password ??
            ""
        );

    if (!identifier) {

        throw new Error(
            "Bitte wähle einen Benutzer oder gib einen Benutzernamen ein."
        );
    }

    const selectedUser =
        findUserForLogin(
            identifier
        );

    if (!selectedUser) {

        throw new Error(
            "Der Benutzer wurde nicht gefunden."
        );
    }

    if (
        !normalizeRole(
            selectedUser.role
        )
    ) {

        throw new Error(
            "Für diesen Benutzer wurde keine gültige Rolle hinterlegt."
        );
    }

    if (
        !validateLoginPassword(
            selectedUser,
            password
        )
    ) {

        throw new Error(
            "Das eingegebene Passwort ist nicht korrekt."
        );
    }

    setUserState(
        {
            ...selectedUser,

            lastLoginAt:
                getCurrentTimestamp()
        }
    );

    const visibleObjects =
        getObjectsForUser(
            selectedUser
        );

    if (
        visibleObjects.length === 1
    ) {

        setObjectState(
            visibleObjects[0]
        );
    }
    else {

        const previousObjectId =
            getState()
                .currentObject
                ?.id;

        const previousObject =
            visibleObjects.find(
                (object) =>
                    object.id ===
                    previousObjectId
            ) ??
            null;

        setObjectState(
            previousObject
        );
    }

    synchronizeRouterContext();

    navigateTo(
        ROUTES.OVERVIEW,
        {
            replace:
                true
        }
    );

    return true;
}

/************************************************
 * LOGOUT
 ************************************************/

function handleLogout() {

    clearSessionState();

    setRouterContext(
        {
            currentUser:
                null,

            currentObject:
                null
        },
        {
            notify:
                false,

            resolve:
                true
        }
    );

    navigateTo(
        ROUTES.LOGIN,
        {
            replace:
                true
        }
    );

    return true;
}

/************************************************
 * OBJEKT AUSWÄHLEN
 ************************************************/

function handleSelectObject(objectId) {

    const normalizedObjectId =
        normalizeText(
            objectId
        );

    if (!normalizedObjectId) {

        throw new Error(
            "Es wurde kein Objekt ausgewählt."
        );
    }

    const state =
        getState();

    if (!state.currentUser) {

        throw new Error(
            "Für die Objektauswahl ist eine Anmeldung erforderlich."
        );
    }

    const selectedObject =
        getObjectsForUser(
            state.currentUser
        ).find(
            (object) =>
                object.id ===
                normalizedObjectId
        );

    if (!selectedObject) {

        throw new Error(
            "Das Objekt wurde nicht gefunden oder ist für diesen Benutzer nicht freigegeben."
        );
    }

    setObjectState(
        selectedObject
    );

    synchronizeRouterContext();

    return selectedObject;
}

/************************************************
 * LAUFENDE SCHICHT ERMITTELN
 ************************************************/

function getRunningShiftForCurrentUser(state) {

    const currentUserId =
        state.currentUser?.id;

    if (!currentUserId) {

        return null;
    }

    if (
        state.currentShift &&
        (
            state.currentShift.userId ===
                currentUserId ||
            state.currentShift.employeeId ===
                currentUserId
        )
    ) {

        return state.currentShift;
    }

    return asArray(
        state.shifts
    ).find(
        (shift) => {

            const status =
                normalizeRole(
                    shift.status
                );

            const belongsToUser =
                shift.userId ===
                    currentUserId ||
                shift.employeeId ===
                    currentUserId;

            const isRunning =
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
                    ) &&
                    ![
                        "FINISHED",
                        "COMPLETED",
                        "CANCELLED"
                    ].includes(status)
                );

            return (
                belongsToUser &&
                isRunning
            );
        }
    ) ??
    null;
}

/************************************************
 * LOKALE CHECK-IN-DATEN
 ************************************************/

function createCheckinEntry(
    state,
    shift
) {

    return {
        id:
            createLocalId(
                "CHECKIN"
            ),

        shiftId:
            shift.id,

        userId:
            state.currentUser.id,

        employeeId:
            state.currentUser.id,

        objectId:
            state.currentObject.id,

        checkinAt:
            shift.startTime,

        timestamp:
            shift.startTime,

        method:
            "LOCAL_TEST",

        qrVerified:
            false,

        gpsVerified:
            false,

        status:
            "COMPLETED",

        source:
            "LOCAL_TEST",

        createdAt:
            shift.startTime
    };
}

/************************************************
 * CHECK-IN
 ************************************************/

function handleCheckin() {

    const state =
        getState();

    if (!state.currentUser) {

        throw new Error(
            "Für den Check-in ist eine Anmeldung erforderlich."
        );
    }

    if (!state.currentObject) {

        handleNavigate(
            ROUTES.OBJECTS
        );

        throw new Error(
            "Bitte wähle vor dem Check-in ein Objekt aus."
        );
    }

    const runningShift =
        getRunningShiftForCurrentUser(
            state
        );

    if (runningShift) {

        throw new Error(
            "Für diesen Benutzer läuft bereits eine Schicht."
        );
    }

    const startTime =
        getCurrentTimestamp();

    const currentShift = {

        id:
            createLocalId(
                "SHIFT"
            ),

        userId:
            state.currentUser.id,

        employeeId:
            state.currentUser.id,

        employeeName:
            state.currentUser.name ??
            state.currentUser.fullName ??
            state.currentUser.displayName,

        objectId:
            state.currentObject.id,

        objectName:
            state.currentObject.name ??
            state.currentObject.id,

        startTime,

        checkinTime:
            startTime,

        endTime:
            null,

        checkoutTime:
            null,

        status:
            "RUNNING",

        source:
            "LOCAL_TEST",

        createdAt:
            startTime,

        updatedAt:
            startTime
    };

    const checkinEntry =
        createCheckinEntry(
            state,
            currentShift
        );

    updateState(
        {
            shifts: [
                ...asArray(
                    state.shifts
                ),
                currentShift
            ],

            checkins: [
                ...asArray(
                    state.checkins
                ),
                checkinEntry
            ]
        },
        {
            notify:
                false,

            persist:
                true
        }
    );

    if (
        typeof AppState.startShift ===
        "function"
    ) {

        AppState.startShift(
            currentShift
        );
    }
    else {

        updateState(
            {
                currentShift,

                shiftStarted:
                    true
            },
            {
                persist:
                    true
            }
        );
    }

    scheduleRender();

    return currentShift;
}

/************************************************
 * CHECK-OUT-DATEN
 ************************************************/

function createCheckoutEntry(
    state,
    completedShift
) {

    return {
        id:
            createLocalId(
                "CHECKOUT"
            ),

        shiftId:
            completedShift.id,

        userId:
            state.currentUser?.id ??
            completedShift.userId,

        employeeId:
            state.currentUser?.id ??
            completedShift.employeeId,

        objectId:
            state.currentObject?.id ??
            completedShift.objectId,

        checkoutAt:
            completedShift.endTime,

        timestamp:
            completedShift.endTime,

        materialAvailable:
            null,

        problemVisible:
            null,

        wasteRemoved:
            null,

        objectSecured:
            null,

        status:
            "COMPLETED",

        source:
            "LOCAL_TEST",

        createdAt:
            completedShift.endTime
    };
}

/************************************************
 * CHECK-OUT
 ************************************************/

function handleCheckout() {

    const state =
        getState();

    const runningShift =
        getRunningShiftForCurrentUser(
            state
        );

    if (!runningShift) {

        throw new Error(
            "Es läuft derzeit keine Schicht."
        );
    }

    const endTime =
        getCurrentTimestamp();

    const startTime =
        new Date(
            runningShift.startTime ??
            runningShift.checkinTime
        );

    const endDate =
        new Date(
            endTime
        );

    const durationMinutes =
        Number.isNaN(
            startTime.getTime()
        )
            ? 0
            : Math.max(
                Math.round(
                    (
                        endDate.getTime() -
                        startTime.getTime()
                    ) /
                    60000
                ),
                0
            );

    const completedShift = {
        ...asObject(
            runningShift
        ),

        endTime,

        checkoutTime:
            endTime,

        durationMinutes,

        actualMinutes:
            durationMinutes,

        status:
            "FINISHED",

        updatedAt:
            endTime
    };

    const existingShifts =
        asArray(
            state.shifts
        );

    const shiftExists =
        existingShifts.some(
            (shift) =>
                shift.id ===
                completedShift.id
        );

    const updatedShifts =
        shiftExists
            ? existingShifts.map(
                (shift) =>
                    shift.id ===
                    completedShift.id
                        ? completedShift
                        : shift
            )
            : [
                ...existingShifts,
                completedShift
            ];

    const checkoutEntry =
        createCheckoutEntry(
            state,
            completedShift
        );

    updateState(
        {
            shifts:
                updatedShifts,

            checkouts: [
                ...asArray(
                    state.checkouts
                ),
                checkoutEntry
            ]
        },
        {
            notify:
                false,

            persist:
                true
        }
    );

    if (
        typeof AppState.stopShift ===
        "function"
    ) {

        AppState.stopShift(
            completedShift
        );
    }
    else {

        updateState(
            {
                currentShift:
                    null,

                shiftStarted:
                    false
            },
            {
                persist:
                    true
            }
        );
    }

    scheduleRender();

    return completedShift;
}

/************************************************
 * DARSTELLUNG
 ************************************************/

function renderCurrentApp() {

    if (
        !appInitialized ||
        !dataLoaded
    ) {

        return;
    }

    validateCurrentObject();

    const state =
        getState();

    const route =
        currentRoute ||
        state.currentRoute ||
        getCurrentRoute() ||
        (
            state.currentUser
                ? ROUTES.OVERVIEW
                : ROUTES.LOGIN
        );

    renderApp({
        route,

        state,

        onNavigate:
            handleNavigate,

        onLogin:
            handleLogin,

        onLogout:
            handleLogout,

        onCheckin:
            handleCheckin,

        onCheckout:
            handleCheckout,

        onSelectObject:
            handleSelectObject
    });
}

/************************************************
 * ROUTER STARTEN
 ************************************************/

function startRouter() {

    const state =
        getState();

    currentRoute =
        initializeRouter({
            currentUser:
                state.currentUser,

            currentObject:
                state.currentObject
        });

    routerInitialized =
        true;

    setRouteState(
        currentRoute
    );

    if (
        typeof unsubscribeFromRouter ===
        "function"
    ) {

        unsubscribeFromRouter();
    }

    unsubscribeFromRouter =
        subscribeToRoute(
            (route) => {

                if (
                    route ===
                    currentRoute
                ) {

                    scheduleRender();

                    return;
                }

                setRouteState(
                    route
                );

                scheduleRender();
            }
        );
}

/************************************************
 * STATE INITIALISIEREN
 ************************************************/

function initializeState() {

    if (
        typeof AppState.initializeAppState ===
        "function"
    ) {

        AppState.initializeAppState();

        return;
    }

    if (
        typeof AppState.resetAppState ===
        "function"
    ) {

        AppState.resetAppState({
            preserveData:
                false,

            preserveSession:
                true,

            notify:
                false
        });
    }
}

/************************************************
 * STATE-ABONNEMENT
 ************************************************/

function subscribeToState() {

    if (
        typeof unsubscribeFromState ===
        "function"
    ) {

        unsubscribeFromState();

        unsubscribeFromState =
            null;
    }

    if (
        typeof AppState.subscribeToAppState !==
        "function"
    ) {

        return;
    }

    const unsubscribe =
        AppState.subscribeToAppState(
            () => {

                if (
                    !appInitialized ||
                    !dataLoaded
                ) {

                    return;
                }

                synchronizeRouterContext();

                scheduleRender();
            }
        );

    if (
        typeof unsubscribe ===
        "function"
    ) {

        unsubscribeFromState =
            unsubscribe;
    }
}

/************************************************
 * APP STARTEN
 ************************************************/

async function initializeApplication() {

    try {

        renderLoadingScreen(
            "Daten und Benutzeroberfläche werden vorbereitet …"
        );

        initializeState();

        subscribeToState();

        setLoadingState(
            true
        );

        setErrorState(
            null
        );

        await loadApplicationData();

        validateCurrentObject();

        appInitialized =
            true;

        startRouter();

        setLoadingState(
            false
        );

        renderCurrentApp();
    }
    catch (error) {

        console.error(
            "Facility OS konnte nicht gestartet werden.",
            error
        );

        appInitialized =
            false;

        dataLoaded =
            false;

        setLoadingState(
            false
        );

        setErrorState(
            error
        );

        renderFatalError(
            error
        );
    }
}

/************************************************
 * GLOBALE FEHLER
 ************************************************/

window.addEventListener(
    "error",
    (event) => {

        console.error(
            "Nicht behandelter JavaScript-Fehler:",
            event.error ??
            event.message
        );
    }
);

window.addEventListener(
    "unhandledrejection",
    (event) => {

        console.error(
            "Nicht behandelter Promise-Fehler:",
            event.reason
        );
    }
);

/************************************************
 * STARTPUNKT
 ************************************************/

if (
    document.readyState ===
    "loading"
) {

    document.addEventListener(
        "DOMContentLoaded",
        initializeApplication,
        {
            once:
                true
        }
    );
}
else {

    initializeApplication();
}