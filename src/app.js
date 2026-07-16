/************************************************
 * Facility OS
 * app.js
 *
 * Zentrale Anwendungssteuerung
 * - lokale Daten laden
 * - App-State initialisieren
 * - Router steuern
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
    updateRouterContext
} from "./router.js";

import {
    renderApp
} from "./ui/renderApp.js";

/************************************************
 * APP-STATUS
 ************************************************/

let appInitialized =
    false;

let dataLoaded =
    false;

let routerInitialized =
    false;

let currentRoute =
    ROUTES.OVERVIEW;

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
            .toUpperCase() ||
        "ENTRY";

    const randomPart =
        Math.random()
            .toString(36)
            .slice(2, 8)
            .toUpperCase();

    return `${normalizedPrefix}-${Date.now()}-${randomPart}`;
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

    return AppState.getAppState();
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

    updateState({
        loading:
            value === true
    });
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

    updateState({
        error:
            message
    });
}

function setRouteState(route) {

    const normalizedRoute =
        normalizeText(route) ||
        ROUTES.OVERVIEW;

    currentRoute =
        normalizedRoute;

    if (
        typeof AppState.setCurrentRoute ===
        "function"
    ) {

        AppState.setCurrentRoute(
            normalizedRoute
        );

        return;
    }

    updateState({
        currentRoute:
            normalizedRoute
    });
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
                }
                finally {

                    window.location.href =
                        window.location.pathname;
                }
            }
        );
}

/************************************************
 * BENUTZER FÜR TEST-LOGIN FINDEN
 ************************************************/

function findUserForLogin({
    name,
    role
}) {

    const state =
        getState();

    const normalizedName =
        normalizeText(name)
            .toLowerCase();

    const normalizedRole =
        normalizeRole(role);

    const activeUsers =
        asArray(state.users)
            .filter(
                (user) =>
                    user.active !== false
            );

    const exactMatch =
        activeUsers.find(
            (user) => {

                const userName =
                    normalizeText(
                        user.name ??
                        user.fullName
                    ).toLowerCase();

                return (
                    normalizeRole(
                        user.role
                    ) ===
                        normalizedRole &&
                    userName ===
                        normalizedName
                );
            }
        );

    if (exactMatch) {
        return exactMatch;
    }

    return (
        activeUsers.find(
            (user) =>
                normalizeRole(
                    user.role
                ) ===
                normalizedRole
        ) ??
        null
    );
}

function createFallbackTestUser({
    name,
    role
}) {

    const normalizedRole =
        normalizeRole(role);

    const normalizedName =
        normalizeText(name) ||
        "Test Benutzer";

    return {
        id:
            createLocalId(
                normalizedRole ||
                "USER"
            ),

        name:
            normalizedName,

        fullName:
            normalizedName,

        role:
            normalizedRole,

        active:
            true,

        assignedObjectIds:
            [],

        source:
            "LOCAL_TEST"
    };
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

        const managedObjects =
            objects.filter(
                (object) =>
                    object.objectLeaderId ===
                        user.id ||
                    object.managerId ===
                        user.id ||
                    object.leaderId ===
                        user.id
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
                        access.customerUserId ===
                            user.id
                )
                .map(
                    (access) =>
                        access.objectId
                );

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
 * ROUTER-KONTEXT
 ************************************************/

function synchronizeRouterContext() {

    if (!routerInitialized) {
        return currentRoute;
    }

    const state =
        getState();

    const resolvedRoute =
        updateRouterContext({
            currentUser:
                state.currentUser,

            currentObject:
                state.currentObject
        });

    if (resolvedRoute) {

        setRouteState(
            resolvedRoute
        );
    }

    return resolvedRoute;
}

/************************************************
 * NAVIGATION
 ************************************************/

function handleNavigate(route) {

    const state =
        getState();

    const resolvedRoute =
        navigateTo(
            route,
            {
                currentUser:
                    state.currentUser,

                currentObject:
                    state.currentObject
            }
        );

    setRouteState(
        resolvedRoute
    );
}

/************************************************
 * LOGIN
 ************************************************/

function handleLogin(loginData) {

    const name =
        normalizeText(
            loginData?.name
        );

    const role =
        normalizeRole(
            loginData?.role
        );

    if (!role) {

        window.alert(
            "Bitte wähle eine Benutzerrolle aus."
        );

        return;
    }

    const existingUser =
        findUserForLogin({
            name,
            role
        });

    const selectedUser =
        existingUser
            ? {
                ...existingUser,

                name:
                    name ||
                    existingUser.name ||
                    existingUser.fullName
            }
            : createFallbackTestUser({
                name,
                role
            });

    setUserState(
        selectedUser
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

        setObjectState(
            null
        );
    }

    synchronizeRouterContext();

    handleNavigate(
        ROUTES.OVERVIEW
    );
}

/************************************************
 * LOGOUT
 ************************************************/

function handleLogout() {

    clearSessionState();

    synchronizeRouterContext();

    const resolvedRoute =
        navigateTo(
            ROUTES.LOGIN,
            {
                replace:
                    true,

                currentUser:
                    null,

                currentObject:
                    null
            }
        );

    setRouteState(
        resolvedRoute
    );
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

        window.alert(
            "Es wurde kein Objekt ausgewählt."
        );

        return;
    }

    const state =
        getState();

    const selectedObject =
        getObjectsForUser(
            state.currentUser
        ).find(
            (object) =>
                object.id ===
                normalizedObjectId
        );

    if (!selectedObject) {

        window.alert(
            "Das Objekt wurde nicht gefunden oder ist nicht freigegeben."
        );

        return;
    }

    setObjectState(
        selectedObject
    );

    synchronizeRouterContext();

    handleNavigate(
        ROUTES.OBJECT_DETAIL
    );
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
            "LOCAL_TEST"
    };
}

/************************************************
 * CHECK-IN
 ************************************************/

function handleCheckin() {

    const state =
        getState();

    if (!state.currentUser) {

        window.alert(
            "Für den Check-in ist eine Anmeldung erforderlich."
        );

        return;
    }

    if (!state.currentObject) {

        window.alert(
            "Bitte wähle vor dem Check-in ein Objekt aus."
        );

        handleNavigate(
            ROUTES.OBJECTS
        );

        return;
    }

    if (
        state.shiftStarted === true
    ) {

        window.alert(
            "Es läuft bereits eine Schicht."
        );

        return;
    }

    const startTime =
        new Date().toISOString();

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
            state.currentUser.fullName,

        objectId:
            state.currentObject.id,

        objectName:
            state.currentObject.name,

        startTime,

        endTime:
            null,

        status:
            "RUNNING",

        source:
            "LOCAL_TEST"
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
                false
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
            "LOCAL_TEST"
    };
}

/************************************************
 * CHECK-OUT
 ************************************************/

function handleCheckout() {

    const state =
        getState();

    if (
        state.shiftStarted !== true ||
        !state.currentShift
    ) {

        window.alert(
            "Es läuft derzeit keine Schicht."
        );

        return;
    }

    const endTime =
        new Date().toISOString();

    const completedShift = {
        ...asObject(
            state.currentShift
        ),

        endTime,

        status:
            "FINISHED"
    };

    const updatedShifts =
        asArray(
            state.shifts
        ).map(
            (shift) =>
                shift.id ===
                    completedShift.id
                    ? completedShift
                    : shift
        );

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
                false
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
        ROUTES.OVERVIEW;

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
                state.currentObject,

            onRouteChange:
                (route) => {

                    setRouteState(
                        route
                    );

                    renderCurrentApp();
                }
        });

    routerInitialized =
        true;

    setRouteState(
        currentRoute
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
        typeof AppState.subscribeToAppState !==
        "function"
    ) {

        return;
    }

    AppState.subscribeToAppState(
        () => {

            if (
                appInitialized &&
                dataLoaded
            ) {

                renderCurrentApp();
            }
        }
    );
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