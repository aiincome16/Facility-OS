/************************************************
 * Facility OS
 * app.js
 *
 * Zentrale Anwendungssteuerung
 * - lokale JSON-Daten laden
 * - App-State initialisieren
 * - Sitzung wiederherstellen
 * - Router steuern
 * - Login und Logout
 * - Objektauswahl
 * - Check-in und Check-out
 * - Lade- und Fehleranzeige
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
    ROUTES.DASHBOARD;

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

function normalizeRole(value) {

    return String(value ?? "")
        .trim()
        .toUpperCase();
}

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

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

function getAppElement() {

    return document.getElementById(
        "app"
    );
}

/************************************************
 * SICHERE STATE-AKTUALISIERUNG
 ************************************************/

function updateState(partialState) {

    const stateUpdate =
        asObject(partialState);

    if (
        typeof AppState.updateAppState ===
        "function"
    ) {

        AppState.updateAppState(
            stateUpdate
        );

        return;
    }

    const currentState =
        getState();

    Object.assign(
        currentState,
        stateUpdate
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

    const normalizedError =
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
            normalizedError
        );

        return;
    }

    updateState({
        error:
            normalizedError
    });
}

function setRouteState(route) {

    currentRoute =
        route;

    if (
        typeof AppState.setCurrentRoute ===
        "function"
    ) {

        AppState.setCurrentRoute(
            route
        );

        return;
    }

    updateState({
        currentRoute:
            route
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

    updateState({
        currentUser:
            user
    });
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

    updateState({
        currentObject:
            object
    });
}

function clearUserState() {

    if (
        typeof AppState.logoutCurrentUser ===
        "function"
    ) {

        AppState.logoutCurrentUser();

        return;
    }

    updateState({
        currentUser:
            null,

        currentObject:
            null,

        currentShift:
            null,

        shiftStarted:
            false
    });
}

/************************************************
 * DATENSTRUKTUR
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

function normalizeLoadedData(result) {

    const resultObject =
        asObject(result);

    const possibleDataObject =
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
                    possibleDataObject[
                        collectionName
                    ]
                );
        }
    );

    return normalizedData;
}

function applyLoadedData(data) {

    const normalizedData =
        normalizeLoadedData(data);

    if (
        typeof AppState.setDataCollections ===
        "function"
    ) {

        AppState.setDataCollections(
            normalizedData
        );

        return normalizedData;
    }

    updateState(
        normalizedData
    );

    return normalizedData;
}

/************************************************
 * DATENVALIDIERUNG
 ************************************************/

function validateRequiredData(data) {

    const requiredCollections = [
        "users",
        "objects",
        "rooms",
        "tasks",
        "materials",
        "shifts",
        "tickets"
    ];

    const missingCollections =
        requiredCollections.filter(
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

        const validationResult =
            DataService.validateDataRelations(
                data
            );

        return asArray(
            validationResult
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

    const errorMessage =
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
                    Daten konnten nicht geladen werden
                </h1>

                <p>
                    ${escapeHtml(errorMessage)}
                </p>

                <button
                    type="button"
                    class="button button-primary button-full"
                    id="reload-application"
                >
                    Erneut laden
                </button>

            </section>

        </main>
    `;

    const reloadButton =
        document.getElementById(
            "reload-application"
        );

    reloadButton?.addEventListener(
        "click",
        () => {

            window.location.reload();
        }
    );
}

/************************************************
 * HTML-SICHERHEIT FÜR SYSTEMANSICHTEN
 ************************************************/

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/************************************************
 * BENUTZER SUCHEN
 ************************************************/

function findUserForLogin({
    name,
    role
}) {

    const state =
        getState();

    const users =
        asArray(
            state.users
        );

    const normalizedRole =
        normalizeRole(role);

    const normalizedName =
        normalizeText(name)
            .toLowerCase();

    const activeUsers =
        users.filter(
            (user) =>
                user.active !== false
        );

    const exactNameAndRoleMatch =
        activeUsers.find(
            (user) => {

                const userRole =
                    normalizeRole(
                        user.role
                    );

                const userName =
                    normalizeText(
                        user.name ??
                        user.fullName
                    ).toLowerCase();

                return (
                    userRole ===
                        normalizedRole &&
                    userName ===
                        normalizedName
                );
            }
        );

    if (exactNameAndRoleMatch) {

        return exactNameAndRoleMatch;
    }

    const roleMatch =
        activeUsers.find(
            (user) =>
                normalizeRole(
                    user.role
                ) ===
                normalizedRole
        );

    if (roleMatch) {

        return roleMatch;
    }

    return null;
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
            `TEST-${normalizedRole || "USER"}`,

        name:
            normalizedName,

        fullName:
            normalizedName,

        role:
            normalizedRole,

        active:
            true,

        assignedObjectIds:
            []
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

        const customerObjects =
            objects.filter(
                (object) =>
                    allowedObjectIds.includes(
                        object.id
                    ) ||
                    object.customerUserId ===
                        user.id
            );

        return customerObjects;
    }

    return [];
}

/************************************************
 * AKTUELLES OBJEKT PRÜFEN
 ************************************************/

function validateCurrentObject() {

    const state =
        getState();

    const currentUser =
        state.currentUser;

    const currentObject =
        state.currentObject;

    if (
        !currentUser ||
        !currentObject
    ) {

        return null;
    }

    const visibleObjects =
        getObjectsForUser(
            currentUser
        );

    const validObject =
        visibleObjects.find(
            (object) =>
                object.id ===
                currentObject.id
        );

    if (!validObject) {

        setObjectState(
            null
        );

        return null;
    }

    if (
        validObject !==
        currentObject
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
        return;
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

    renderCurrentApp();
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
        ROUTES.DASHBOARD
    );
}

/************************************************
 * LOGOUT
 ************************************************/

function handleLogout() {

    clearUserState();

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

    renderCurrentApp();
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

    const currentUser =
        state.currentUser;

    const visibleObjects =
        getObjectsForUser(
            currentUser
        );

    const selectedObject =
        visibleObjects.find(
            (object) =>
                object.id ===
                normalizedObjectId
        );

    if (!selectedObject) {

        window.alert(
            "Das ausgewählte Objekt wurde nicht gefunden oder ist für diesen Benutzer nicht freigegeben."
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

    const currentShift = {
        id:
            `SHIFT-LOCAL-${Date.now()}`,

        userId:
            state.currentUser.id,

        employeeId:
            state.currentUser.id,

        objectId:
            state.currentObject.id,

        startTime:
            new Date().toISOString(),

        endTime:
            null,

        status:
            "RUNNING",

        source:
            "LOCAL_TEST"
    };

    if (
        typeof AppState.startShift ===
        "function"
    ) {

        AppState.startShift(
            currentShift
        );
    }
    else {

        updateState({
            currentShift,

            shiftStarted:
                true
        });
    }

    renderCurrentApp();
}

/************************************************
 * CHECK-OUT
 ************************************************/

function handleCheckout() {

    const state =
        getState();

    if (
        state.shiftStarted !== true
    ) {

        window.alert(
            "Es läuft derzeit keine Schicht."
        );

        return;
    }

    const currentShift =
        asObject(
            state.currentShift
        );

    const completedShift = {
        ...currentShift,

        endTime:
            new Date().toISOString(),

        status:
            "FINISHED"
    };

    const updatedShifts = [
        ...asArray(
            state.shifts
        ),

        completedShift
    ];

    if (
        typeof AppState.stopShift ===
        "function"
    ) {

        AppState.stopShift(
            completedShift
        );

        updateState({
            shifts:
                updatedShifts
        });
    }
    else {

        updateState({
            currentShift:
                null,

            shiftStarted:
                false,

            shifts:
                updatedShifts
        });
    }

    renderCurrentApp();
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

    const state =
        getState();

    validateCurrentObject();

    const refreshedState =
        getState();

    const route =
        currentRoute ||
        refreshedState.currentRoute ||
        getCurrentRoute() ||
        ROUTES.DASHBOARD;

    renderApp({
        route,

        state:
            refreshedState,

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

        AppState.resetAppState();
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
 * UNBEHANDELTE FEHLER
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