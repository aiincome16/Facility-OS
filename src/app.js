/************************************************
 * Facility OS
 * app.js
 ************************************************/

import {
    APP_CONFIG,
    USER_ROLES
} from "./config/appConfig.js";

import {
    getAppState,
    initializeAppState,
    logoutCurrentUser,
    setCurrentObject,
    setCurrentUser,
    setDataCollections,
    setError,
    setLoading,
    startShift,
    stopShift,
    subscribeToAppState
} from "./appState.js";

import {
    initializeRouter,
    navigateTo,
    refreshRoute
} from "./router.js";

import {
    createDataSummary,
    loadAllData,
    validateDataRelations
} from "./services/dataService.js";

import {
    renderApp
} from "./ui/renderApp.js";

/************************************************
 * INTERNE VARIABLEN
 ************************************************/

let applicationStarted = false;

let lastRenderedSignature = "";

/************************************************
 * BENUTZER
 ************************************************/

function createTestUser({
    name,
    role
}) {

    const normalizedName =
        String(name ?? "").trim();

    const normalizedRole =
        String(role ?? "").trim();

    if (!normalizedName) {

        throw new Error(
            "Bitte einen Namen eingeben."
        );
    }

    if (
        !Object.values(
            USER_ROLES
        ).includes(normalizedRole)
    ) {

        throw new Error(
            "Die ausgewählte Benutzerrolle ist ungültig."
        );
    }

    const state =
        getAppState();

    /**
     * Wenn für die Testrolle bereits ein Benutzer
     * in users.json vorhanden ist, verwenden wir diesen.
     */
    const existingUser =
        state.users.find(
            (user) => {

                return (
                    user.role ===
                        normalizedRole &&
                    user.active !== false
                );
            }
        );

    if (existingUser) {

        return {
            ...existingUser,

            /**
             * Der im Login eingegebene Name wird nur
             * für die Testanzeige übernommen.
             */
            name:
                normalizedName,

            firstName:
                normalizedName
                    .split(" ")[0] ??
                normalizedName,

            lastName:
                normalizedName
                    .split(" ")
                    .slice(1)
                    .join(" "),

            testUser: true
        };
    }

    return {

        id:
            `USR-TEST-${Date.now()}`,

        name:
            normalizedName,

        firstName:
            normalizedName
                .split(" ")[0] ??
            normalizedName,

        lastName:
            normalizedName
                .split(" ")
                .slice(1)
                .join(" "),

        role:
            normalizedRole,

        email: "",

        phone: "",

        active: true,

        assignedObjectIds: [],

        testUser: true,

        createdAt:
            new Date().toISOString()
    };
}

/************************************************
 * DATEN LADEN
 ************************************************/

async function initializeData() {

    setLoading(true);

    try {

        const result =
            await loadAllData({
                forceReload: false,
                useCache: true
            });

        const relationValidation =
            validateDataRelations(
                result.data
            );

        const warnings = [

            ...(Array.isArray(
                result.errors
            )
                ? result.errors.map(
                    (error) =>
                        error.message
                )
                : []),

            ...relationValidation.warnings
        ];

        setDataCollections(
            result.data,
            {
                source:
                    result.source,

                loadedAt:
                    result.loadedAt,

                warnings
            }
        );

        const summary =
            createDataSummary(
                result.data
            );

        console.info(
            "Facility-OS-Daten wurden geladen:",
            summary
        );

        if (
            warnings.length > 0
        ) {

            console.warn(
                "Facility-OS-Datenwarnungen:",
                warnings
            );
        }

        return true;

    } catch (error) {

        console.error(
            "Facility-OS-Daten konnten nicht geladen werden:",
            error
        );

        setError(error);

        return false;
    }
}

/************************************************
 * LOGIN UND LOGOUT
 ************************************************/

function handleLogin(
    loginData
) {

    try {

        const user =
            createTestUser(
                loginData
            );

        setCurrentUser(
            user
        );

        const state =
            getAppState();

        const assignedObjects =
            state.objects.filter(
                (object) => {

                    const assignedObjectIds =
                        Array.isArray(
                            user.assignedObjectIds
                        )
                            ? user.assignedObjectIds
                            : [];

                    return (
                        assignedObjectIds.includes(
                            object.id
                        ) ||
                        object.objectLeaderId ===
                            user.id
                    );
                }
            );

        /**
         * Wenn der Benutzer genau einem Objekt
         * zugeordnet ist, wird es automatisch gesetzt.
         */
        if (
            assignedObjects.length === 1
        ) {

            setCurrentObject(
                assignedObjects[0]
            );
        }

        navigateTo(
            APP_CONFIG
                .AUTHENTICATED_DEFAULT_ROUTE
        );

    } catch (error) {

        console.error(
            "Login fehlgeschlagen:",
            error
        );

        window.alert(
            error.message ??
            "Die Anmeldung ist fehlgeschlagen."
        );
    }
}

function handleLogout() {

    logoutCurrentUser();

    navigateTo(
        "/login"
    );
}

/************************************************
 * CHECK-IN
 ************************************************/

function findPlannedShiftForUser(
    userId
) {

    const state =
        getAppState();

    const today =
        new Date()
            .toISOString()
            .slice(0, 10);

    const todaysShifts =
        state.shifts
            .filter(
                (shift) => {

                    return (
                        shift.userId ===
                            userId &&
                        shift.date ===
                            today &&
                        [
                            "PLANNED",
                            "ACTIVE"
                        ].includes(
                            shift.status
                        )
                    );
                }
            )
            .sort(
                (
                    firstShift,
                    secondShift
                ) => {

                    return String(
                        firstShift.plannedStart ??
                        ""
                    ).localeCompare(
                        String(
                            secondShift.plannedStart ??
                            ""
                        )
                    );
                }
            );

    return (
        todaysShifts[0] ??
        null
    );
}

function handleCheckin() {

    try {

        const state =
            getAppState();

        if (!state.currentUser) {

            throw new Error(
                "Für den Check-in ist eine Anmeldung erforderlich."
            );
        }

        if (
            state.currentUser.role !==
            USER_ROLES.MITARBEITER
        ) {

            throw new Error(
                "Der Check-in ist nur für Mitarbeiter vorgesehen."
            );
        }

        if (state.shiftStarted) {

            window.alert(
                "Du bist bereits eingecheckt."
            );

            return;
        }

        const plannedShift =
            findPlannedShiftForUser(
                state.currentUser.id
            );

        const currentObject =
            plannedShift
                ? state.objects.find(
                    (object) =>
                        object.id ===
                        plannedShift.objectId
                ) ?? null
                : state.currentObject;

        if (currentObject) {

            setCurrentObject(
                currentObject
            );
        }

        const shift = {

            ...(plannedShift ?? {}),

            id:
                plannedShift?.id ??
                `SHIFT-TEST-${Date.now()}`,

            userId:
                state.currentUser.id,

            objectId:
                currentObject?.id ??
                plannedShift?.objectId ??
                null,

            date:
                plannedShift?.date ??
                new Date()
                    .toISOString()
                    .slice(0, 10),

            actualStart:
                new Date()
                    .toISOString(),

            actualEnd: null,

            status: "ACTIVE",

            testMode: true
        };

        startShift(
            shift
        );

        window.alert(
            plannedShift
                ? "Die geplante Schicht wurde gestartet."
                : "Test-Check-in wurde gespeichert."
        );

    } catch (error) {

        console.error(
            "Check-in fehlgeschlagen:",
            error
        );

        window.alert(
            error.message ??
            "Der Check-in ist fehlgeschlagen."
        );
    }
}

/************************************************
 * CHECK-OUT
 ************************************************/

function handleCheckout() {

    try {

        const state =
            getAppState();

        if (!state.currentUser) {

            throw new Error(
                "Für den Check-out ist eine Anmeldung erforderlich."
            );
        }

        if (!state.shiftStarted) {

            window.alert(
                "Es ist keine laufende Schicht vorhanden."
            );

            return;
        }

        const currentObject =
            state.currentObject;

        const objectSettings =
            state.objectSettings.find(
                (settings) =>
                    settings.objectId ===
                    currentObject?.id
            );

        const requiredChecks = [];

        if (
            objectSettings
                ?.checkout
                ?.materialCheckRequired
        ) {

            requiredChecks.push(
                "Materialbestand"
            );
        }

        if (
            objectSettings
                ?.checkout
                ?.problemCheckRequired
        ) {

            requiredChecks.push(
                "Probleme und Schäden"
            );
        }

        if (
            objectSettings
                ?.checkout
                ?.wasteCheckRequired
        ) {

            requiredChecks.push(
                "Müllentsorgung"
            );
        }

        if (
            objectSettings
                ?.checkout
                ?.securityCheckRequired
        ) {

            requiredChecks.push(
                "Objektsicherung"
            );
        }

        if (
            objectSettings
                ?.checkout
                ?.keyReturnRequired
        ) {

            requiredChecks.push(
                "Schlüsselrückgabe"
            );
        }

        const confirmationText =
            requiredChecks.length > 0
                ? (
                    "Vor dem Auschecken müssen später folgende Punkte bestätigt werden:\n\n" +
                    requiredChecks
                        .map(
                            (check) =>
                                `• ${check}`
                        )
                        .join("\n") +
                    "\n\nTest-Check-out jetzt durchführen?"
                )
                : "Test-Check-out jetzt durchführen?";

        const confirmed =
            window.confirm(
                confirmationText
            );

        if (!confirmed) {
            return;
        }

        stopShift();

        window.alert(
            "Test-Check-out wurde gespeichert."
        );

    } catch (error) {

        console.error(
            "Check-out fehlgeschlagen:",
            error
        );

        window.alert(
            error.message ??
            "Der Check-out ist fehlgeschlagen."
        );
    }
}

/************************************************
 * DARSTELLUNG
 ************************************************/

function createRenderSignature(
    route,
    state
) {

    return JSON.stringify({

        route,

        loading:
            state.loading,

        error:
            state.error,

        dataLoaded:
            state.dataLoaded,

        currentUserId:
            state.currentUser?.id ??
            null,

        currentUserRole:
            state.currentUser?.role ??
            null,

        currentObjectId:
            state.currentObject?.id ??
            null,

        currentShiftId:
            state.currentShift?.id ??
            null,

        shiftStarted:
            state.shiftStarted,

        users:
            state.users.length,

        objects:
            state.objects.length,

        rooms:
            state.rooms.length,

        tasks:
            state.tasks.length,

        materials:
            state.materials.length,

        tickets:
            state.tickets.length,

        notifications:
            state.notifications.length
    });
}

function renderLoadingState() {

    const appElement =
        document.getElementById(
            "app"
        );

    if (!appElement) {
        return;
    }

    appElement.innerHTML = `
        <div class="loading-screen">
            <div>
                <strong>
                    Facility OS wird geladen …
                </strong>

                <p>
                    Testdaten werden vorbereitet.
                </p>
            </div>
        </div>
    `;
}

function renderFatalDataError(
    errorMessage
) {

    const appElement =
        document.getElementById(
            "app"
        );

    if (!appElement) {
        return;
    }

    appElement.innerHTML = `
        <section class="fatal-error">

            <h1>
                Daten konnten nicht geladen werden
            </h1>

            <p>
                ${String(
                    errorMessage ??
                    "Unbekannter Fehler"
                )}
            </p>

            <button
                type="button"
                class="button button-primary"
                id="retry-data-load"
            >
                Erneut versuchen
            </button>

        </section>
    `;

    const retryButton =
        document.getElementById(
            "retry-data-load"
        );

    retryButton?.addEventListener(
        "click",
        async () => {

            renderLoadingState();

            const success =
                await initializeData();

            if (success) {

                refreshRoute();
            }
        }
    );
}

function renderCurrentApp(
    route = null,
    state = null
) {

    const currentState =
        state ??
        getAppState();

    const currentRoute =
        route ??
        currentState.currentRoute;

    if (
        currentState.loading &&
        !currentState.dataLoaded
    ) {

        renderLoadingState();

        return;
    }

    if (
        currentState.error &&
        !currentState.dataLoaded
    ) {

        renderFatalDataError(
            currentState.error
        );

        return;
    }

    const renderSignature =
        createRenderSignature(
            currentRoute,
            currentState
        );

    if (
        renderSignature ===
        lastRenderedSignature
    ) {

        return;
    }

    lastRenderedSignature =
        renderSignature;

    renderApp({

        route:
            currentRoute,

        state:
            currentState,

        onNavigate:
            navigateTo,

        onLogin:
            handleLogin,

        onLogout:
            handleLogout,

        onCheckin:
            handleCheckin,

        onCheckout:
            handleCheckout
    });
}

/************************************************
 * APP INITIALISIEREN
 ************************************************/

async function initializeApplication() {

    if (applicationStarted) {
        return;
    }

    applicationStarted = true;

    try {

        initializeAppState();

        subscribeToAppState(
            (state) => {

                renderCurrentApp(
                    state.currentRoute,
                    state
                );
            }
        );

        initializeRouter(
            (route, state) => {

                renderCurrentApp(
                    route,
                    state
                );
            }
        );

        renderLoadingState();

        await initializeData();

        refreshRoute();

        console.info(
            `${APP_CONFIG.APP_NAME} ${APP_CONFIG.APP_VERSION} wurde gestartet.`
        );

    } catch (error) {

        console.error(
            "Facility OS konnte nicht gestartet werden:",
            error
        );

        renderFatalDataError(
            error.message ??
            error
        );
    }
}

/************************************************
 * EVENTS
 ************************************************/

window.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);

window.addEventListener(
    "facility-os-refresh",
    refreshRoute
);