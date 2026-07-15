/************************************************
 * Facility OS
 * app.js
 ************************************************/

import {
    APP_CONFIG
} from "./config/appConfig.js";

import {
    getAppState,
    initializeAppState,
    logoutCurrentUser,
    setCurrentUser,
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
    renderApp
} from "./ui/renderApp.js";

function createTestUser({
    name,
    role
}) {

    if (!name) {

        throw new Error(
            "Bitte einen Namen eingeben."
        );
    }

    if (!role) {

        throw new Error(
            "Bitte eine Rolle auswählen."
        );
    }

    return {

        id: `USR-TEST-${Date.now()}`,

        name,

        firstName:
            name.split(" ")[0] ?? name,

        lastName:
            name.split(" ").slice(1).join(" "),

        role,

        active: true,

        testUser: true,

        createdAt:
            new Date().toISOString()
    };
}

function handleLogin(loginData) {

    try {

        const user =
            createTestUser(loginData);

        setCurrentUser(user);

        navigateTo(
            APP_CONFIG.AUTHENTICATED_DEFAULT_ROUTE
        );

    } catch (error) {

        console.error(
            "Login fehlgeschlagen:",
            error
        );

        window.alert(
            error.message
        );
    }
}

function handleLogout() {

    logoutCurrentUser();

    navigateTo("/login");
}

function handleCheckin() {

    const state =
        getAppState();

    if (state.shiftStarted) {

        window.alert(
            "Du bist bereits eingecheckt."
        );

        return;
    }

    startShift({

        id: `SHIFT-TEST-${Date.now()}`,

        userId:
            state.currentUser?.id ?? null,

        objectId:
            state.currentObject?.id ?? null,

        checkinAt:
            new Date().toISOString(),

        status: "ACTIVE",

        testMode: true
    });

    window.alert(
        "Test-Check-in wurde gespeichert."
    );
}

function handleCheckout() {

    const state =
        getAppState();

    if (!state.shiftStarted) {

        window.alert(
            "Es ist keine laufende Schicht vorhanden."
        );

        return;
    }

    stopShift();

    window.alert(
        "Test-Check-out wurde gespeichert."
    );
}

function renderCurrentApp(
    route = null,
    state = null
) {

    const currentState =
        state ?? getAppState();

    const currentRoute =
        route ??
        currentState.currentRoute;

    renderApp({

        route: currentRoute,

        state: currentState,

        onNavigate: navigateTo,

        onLogin: handleLogin,

        onLogout: handleLogout,

        onCheckin: handleCheckin,

        onCheckout: handleCheckout
    });
}

function initializeApplication() {

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

        console.info(
            `${APP_CONFIG.APP_NAME} ${APP_CONFIG.APP_VERSION} wurde gestartet.`
        );

    } catch (error) {

        console.error(
            "Facility OS konnte nicht gestartet werden:",
            error
        );

        const appElement =
            document.getElementById("app");

        if (appElement) {

            appElement.innerHTML = `

                <section class="fatal-error">

                    <h1>
                        Facility OS konnte nicht gestartet werden
                    </h1>

                    <p>
                        ${String(
                            error.message ?? error
                        )}
                    </p>

                    <button
                        type="button"
                        onclick="window.location.reload()"
                    >
                        Neu laden
                    </button>

                </section>
            `;
        }
    }
}

window.addEventListener(
    "DOMContentLoaded",
    initializeApplication
);

window.addEventListener(
    "facility-os-refresh",
    refreshRoute
);