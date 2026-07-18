/************************************************
 * Facility OS
 * renderApp.js
 *
 * Zentrale UI-Darstellung
 * - Loginansicht
 * - rollenabhängige App-Hülle
 * - Seitenrouting
 * - zentrale Event-Delegation
 * - Dialoge und Rückmeldungen
 * - genau einmal registrierte Listener
 ************************************************/

import {
    ROUTES
} from "../router.js";

import * as AppHeader
    from "./components/appHeader.js";

import * as BottomNavigation
    from "./components/bottomNavigation.js";

import * as OverviewPage
    from "./pages/overviewPage.js";

import * as ObjectsPage
    from "./pages/objectsPage.js";

import * as ObjectDetailPage
    from "./pages/objectDetailPage.js";

import * as PersonnelPage
    from "./pages/personnelPage.js";

import * as CommunicationPage
    from "./pages/communicationPage.js";

import * as MaterialsPage
    from "./pages/materialsPage.js";

import * as TasksPage
    from "./pages/tasksPage.js";

import * as TimesPage
    from "./pages/timesPage.js";

import * as AnalysisPage
    from "./pages/analysisPage.js";

import * as ReportsPage
    from "./pages/reportsPage.js";

import * as MorePage
    from "./pages/morePage.js";

import * as SettingsPage
    from "./pages/settingsPage.js";

import * as HelpPage
    from "./pages/helpPage.js";

import * as PrivacyPage
    from "./pages/privacyPage.js";

import * as ImprintPage
    from "./pages/imprintPage.js";

/************************************************
 * LAUFZEITKONTEXT
 ************************************************/

let currentContext = {
    route:
        ROUTES.LOGIN,

    state:
        null,

    onNavigate:
        null,

    onLogin:
        null,

    onLogout:
        null,

    onCheckin:
        null,

    onCheckout:
        null,

    onSelectObject:
        null
};

let activeDialogElement =
    null;

let toastTimeoutId =
    null;

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

function getAppRoot() {

    return document.getElementById(
        "app"
    );
}

function getUserDisplayName(user) {

    return normalizeText(
        user?.displayName ??
        user?.fullName ??
        user?.name ??
        user?.username ??
        user?.email
    ) ||
    "Benutzer";
}

function getRoleLabel(role) {

    const labels = {

        SUPER_ADMIN:
            "Super-Admin",

        ADMIN:
            "Administration",

        OBJEKTLEITER:
            "Objektleitung",

        MITARBEITER:
            "Mitarbeiter",

        BUCHHALTUNG:
            "Buchhaltung",

        KUNDE:
            "Kunde"
    };

    return (
        labels[
            normalizeRole(role)
        ] ??
        "Benutzer"
    );
}

function getObjectDisplayName(object) {

    return normalizeText(
        object?.name ??
        object?.objectName ??
        object?.Name ??
        object?.Objekt_Name
    ) ||
    "Kein Objekt ausgewählt";
}

/************************************************
 * MODULFUNKTION ERMITTELN
 ************************************************/

function resolveModuleFunction(
    moduleNamespace,
    candidateNames
) {

    for (
        const candidateName
        of candidateNames
    ) {

        if (
            typeof moduleNamespace?.[
                candidateName
            ] ===
            "function"
        ) {

            return moduleNamespace[
                candidateName
            ];
        }
    }

    const firstFunction =
        Object.values(
            moduleNamespace ??
            {}
        ).find(
            (value) =>
                typeof value ===
                "function"
        );

    return (
        firstFunction ??
        null
    );
}

function callPageRenderer(
    moduleNamespace,
    candidateNames,
    payload,
    fallback
) {

    const renderer =
        resolveModuleFunction(
            moduleNamespace,
            candidateNames
        );

    if (!renderer) {

        return fallback;
    }

    try {

        const renderedContent =
            renderer(
                payload
            );

        return (
            typeof renderedContent ===
            "string"
                ? renderedContent
                : fallback
        );
    }
    catch (error) {

        console.error(
            "Eine Seite konnte nicht dargestellt werden.",
            error
        );

        return renderPageError(
            "Diese Seite konnte nicht geladen werden.",
            error
        );
    }
}

/************************************************
 * STANDARDSEITEN
 ************************************************/

function renderPageError(
    message,
    error = null
) {

    const technicalMessage =
        error instanceof Error
            ? error.message
            : normalizeText(error);

    return `
        <section class="page-shell">

            <div class="page-heading">

                <div>
                    <span class="page-eyebrow">
                        Facility OS
                    </span>

                    <h1 class="page-title">
                        Darstellungsfehler
                    </h1>
                </div>

            </div>

            <div class="alert-card alert-error">

                <strong>
                    ${escapeHtml(message)}
                </strong>

                ${
                    technicalMessage
                        ? `
                            <p>
                                ${escapeHtml(
                                    technicalMessage
                                )}
                            </p>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="button button-secondary"
                    data-route="${escapeHtml(
                        ROUTES.OVERVIEW
                    )}"
                >
                    Zur Startseite
                </button>

            </div>

        </section>
    `;
}

function renderUnknownRoute(route) {

    return `
        <section class="page-shell">

            <div class="page-heading">

                <div>
                    <span class="page-eyebrow">
                        Facility OS
                    </span>

                    <h1 class="page-title">
                        Seite nicht gefunden
                    </h1>

                    <p class="page-subtitle">
                        Die angeforderte Ansicht ist nicht vorhanden.
                    </p>
                </div>

            </div>

            <div class="section-card">

                <p>
                    Unbekannte Route:
                    <strong>
                        ${escapeHtml(route)}
                    </strong>
                </p>

                <button
                    type="button"
                    class="button button-primary button-full"
                    data-route="${escapeHtml(
                        ROUTES.OVERVIEW
                    )}"
                >
                    Zur Startseite
                </button>

            </div>

        </section>
    `;
}

/************************************************
 * LOGIN
 ************************************************/

function getLoginUsers(state) {

    return asArray(
        state?.users
    )
        .filter(
            (user) =>
                user?.active !== false
        )
        .sort(
            (
                firstUser,
                secondUser
            ) =>
                getUserDisplayName(
                    firstUser
                ).localeCompare(
                    getUserDisplayName(
                        secondUser
                    ),
                    "de"
                )
        );
}

function getLoginIdentifier(user) {

    return normalizeText(
        user?.username ??
        user?.email ??
        user?.employeeNumber ??
        user?.login ??
        user?.id ??
        user?.name
    );
}

function renderLoginPage(state) {

    const users =
        getLoginUsers(
            state
        );

    const userOptions =
        users
            .map(
                (user) => {

                    const identifier =
                        getLoginIdentifier(
                            user
                        );

                    const label =
                        `${getUserDisplayName(
                            user
                        )} · ${getRoleLabel(
                            user?.role
                        )}`;

                    return `
                        <option
                            value="${escapeHtml(
                                identifier
                            )}"
                        >
                            ${escapeHtml(label)}
                        </option>
                    `;
                }
            )
            .join("");

    return `
        <main class="login-page">

            <section class="login-card">

                <div class="login-brand">

                    <div
                        class="login-logo"
                        aria-hidden="true"
                    >
                        FO
                    </div>

                    <div>
                        <span class="login-brand-name">
                            Facility OS
                        </span>

                        <span class="login-version">
                            Version 2.0
                        </span>
                    </div>

                </div>

                <div class="login-introduction">

                    <span class="login-badge">
                        Präsentationsmodus
                    </span>

                    <h1>
                        Anmelden
                    </h1>

                    <p>
                        Wähle einen Testbenutzer und öffne die passende Arbeitsansicht.
                    </p>

                </div>

                ${
                    state?.error
                        ? `
                            <div class="alert-card alert-error">
                                ${escapeHtml(
                                    state.error
                                )}
                            </div>
                        `
                        : ""
                }

                <form
                    id="login-form"
                    class="login-form"
                    novalidate
                >

                    <div class="form-group">

                        <label for="login-identifier">
                            Benutzer
                        </label>

                        ${
                            users.length > 0
                                ? `
                                    <select
                                        id="login-identifier"
                                        name="identifier"
                                        required
                                    >
                                        <option value="">
                                            Benutzer auswählen
                                        </option>

                                        ${userOptions}
                                    </select>
                                `
                                : `
                                    <input
                                        id="login-identifier"
                                        name="identifier"
                                        type="text"
                                        autocomplete="username"
                                        placeholder="Benutzername oder E-Mail"
                                        required
                                    >
                                `
                        }

                    </div>

                    <div class="form-group">

                        <label for="login-password">
                            Passwort
                        </label>

                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            autocomplete="current-password"
                            placeholder="Im Testmodus gegebenenfalls leer lassen"
                        >

                    </div>

                    <div
                        id="login-message"
                        class="form-message"
                        role="alert"
                        aria-live="polite"
                    ></div>

                    <button
                        type="submit"
                        class="button button-primary button-full button-large"
                    >
                        Anmelden
                    </button>

                </form>

                <div class="login-footer">

                    <button
                        type="button"
                        class="text-button"
                        data-route="${escapeHtml(
                            ROUTES.PRIVACY
                        )}"
                    >
                        Datenschutz
                    </button>

                    <span aria-hidden="true">
                        ·
                    </span>

                    <button
                        type="button"
                        class="text-button"
                        data-route="${escapeHtml(
                            ROUTES.IMPRINT
                        )}"
                    >
                        Impressum
                    </button>

                </div>

            </section>

        </main>
    `;
}

/************************************************
 * ÖFFENTLICHE SEITEN
 ************************************************/

function renderPublicPage(
    moduleNamespace,
    candidateNames,
    title
) {

    const content =
        callPageRenderer(
            moduleNamespace,
            candidateNames,
            {
                route:
                    currentContext.route,

                state:
                    currentContext.state
            },
            `
                <section class="page-shell">

                    <div class="page-heading">

                        <div>
                            <h1 class="page-title">
                                ${escapeHtml(title)}
                            </h1>
                        </div>

                    </div>

                    <div class="section-card">
                        <p>
                            Für diese Seite sind derzeit keine Inhalte hinterlegt.
                        </p>
                    </div>

                </section>
            `
        );

    return `
        <main class="public-page">

            <div class="public-page-toolbar">

                <button
                    type="button"
                    class="button button-secondary"
                    data-action="return-login"
                >
                    Zurück zur Anmeldung
                </button>

            </div>

            ${content}

        </main>
    `;
}

/************************************************
 * HEADER UND NAVIGATION
 ************************************************/

function renderHeader(state) {

    const renderer =
        resolveModuleFunction(
            AppHeader,
            [
                "renderAppHeader",
                "renderHeader"
            ]
        );

    if (renderer) {

        try {

            const renderedHeader =
                renderer(
                    state
                );

            if (
                typeof renderedHeader ===
                "string"
            ) {

                return renderedHeader;
            }
        }
        catch (error) {

            console.error(
                "Der App-Header konnte nicht dargestellt werden.",
                error
            );
        }
    }

    return `
        <header class="app-header">

            <div class="app-header-main">

                <div class="app-header-brand">
                    Facility OS
                </div>

                <button
                    type="button"
                    class="app-header-user"
                    data-route="${escapeHtml(
                        ROUTES.MORE
                    )}"
                >
                    <span class="app-header-user-name">
                        ${escapeHtml(
                            getUserDisplayName(
                                state?.currentUser
                            )
                        )}
                    </span>

                    <span class="app-header-user-role">
                        ${escapeHtml(
                            getRoleLabel(
                                state?.currentUser?.role
                            )
                        )}
                    </span>
                </button>

            </div>

            <div class="app-header-context">
                ${escapeHtml(
                    getObjectDisplayName(
                        state?.currentObject
                    )
                )}
            </div>

        </header>
    `;
}

function renderNavigation(
    state,
    route
) {

    const renderer =
        resolveModuleFunction(
            BottomNavigation,
            [
                "renderBottomNavigation",
                "renderNavigation"
            ]
        );

    if (!renderer) {

        return "";
    }

    try {

        return (
            renderer({
                state,
                route
            }) ??
            ""
        );
    }
    catch (error) {

        console.error(
            "Die Hauptnavigation konnte nicht dargestellt werden.",
            error
        );

        return "";
    }
}

/************************************************
 * SEITENAUSWAHL
 ************************************************/

function renderRouteContent(
    route,
    state
) {

    const payload = {
        route,
        state,

        currentUser:
            state?.currentUser,

        currentObject:
            state?.currentObject,

        currentShift:
            state?.currentShift,

        onNavigate:
            currentContext.onNavigate,

        onCheckin:
            currentContext.onCheckin,

        onCheckout:
            currentContext.onCheckout,

        onSelectObject:
            currentContext.onSelectObject
    };

    switch (route) {

        case ROUTES.OVERVIEW:

            return callPageRenderer(
                OverviewPage,
                [
                    "renderOverviewPage",
                    "renderOverview",
                    "renderEmployeeDashboard"
                ],
                payload,
                renderPageError(
                    "Die Startseite ist nicht verfügbar."
                )
            );

        case ROUTES.OBJECTS:

            return callPageRenderer(
                ObjectsPage,
                [
                    "renderObjectsPage",
                    "renderObjectSelection",
                    "renderObjects"
                ],
                payload,
                renderPageError(
                    "Die Objektübersicht ist nicht verfügbar."
                )
            );

        case ROUTES.OBJECT_DETAIL:

            return callPageRenderer(
                ObjectDetailPage,
                [
                    "renderObjectDetailPage",
                    "renderObjectDetail"
                ],
                payload,
                renderPageError(
                    "Die Objektdetails sind nicht verfügbar."
                )
            );

        case ROUTES.PERSONNEL:

            return callPageRenderer(
                PersonnelPage,
                [
                    "renderPersonnelPage",
                    "renderPersonnel"
                ],
                payload,
                renderPageError(
                    "Die Personalansicht ist nicht verfügbar."
                )
            );

        case ROUTES.COMMUNICATION:

            return callPageRenderer(
                CommunicationPage,
                [
                    "renderCommunicationPage",
                    "renderCommunication"
                ],
                payload,
                renderPageError(
                    "Die Kommunikationsansicht ist nicht verfügbar."
                )
            );

        case ROUTES.MATERIALS:

            return callPageRenderer(
                MaterialsPage,
                [
                    "renderMaterialsPage",
                    "renderMaterials"
                ],
                payload,
                renderPageError(
                    "Die Materialansicht ist nicht verfügbar."
                )
            );

        case ROUTES.TASKS:

            return callPageRenderer(
                TasksPage,
                [
                    "renderTasksPage",
                    "renderTasks"
                ],
                payload,
                renderPageError(
                    "Die Aufgabenansicht ist nicht verfügbar."
                )
            );

        case ROUTES.TIMES:

            return callPageRenderer(
                TimesPage,
                [
                    "renderTimesPage",
                    "renderTimes"
                ],
                payload,
                renderPageError(
                    "Die Zeitenansicht ist nicht verfügbar."
                )
            );

        case ROUTES.ANALYSIS:

            return callPageRenderer(
                AnalysisPage,
                [
                    "renderAnalysisPage",
                    "renderAnalysis"
                ],
                payload,
                renderPageError(
                    "Die Auswertung ist nicht verfügbar."
                )
            );

        case ROUTES.REPORTS:

            return callPageRenderer(
                ReportsPage,
                [
                    "renderReportsPage",
                    "renderReports"
                ],
                payload,
                renderPageError(
                    "Die Berichtsansicht ist nicht verfügbar."
                )
            );

        case ROUTES.MORE:

            return callPageRenderer(
                MorePage,
                [
                    "renderMorePage",
                    "renderMore"
                ],
                payload,
                renderPageError(
                    "Das Menü ist nicht verfügbar."
                )
            );

        case ROUTES.SETTINGS:

            return callPageRenderer(
                SettingsPage,
                [
                    "renderSettingsPage",
                    "renderSettings"
                ],
                payload,
                renderPageError(
                    "Die Einstellungen sind nicht verfügbar."
                )
            );

        case ROUTES.HELP:

            return callPageRenderer(
                HelpPage,
                [
                    "renderHelpPage",
                    "renderHelp"
                ],
                payload,
                renderPageError(
                    "Die Hilfe ist nicht verfügbar."
                )
            );

        case ROUTES.PRIVACY:

            return callPageRenderer(
                PrivacyPage,
                [
                    "renderPrivacyPage",
                    "renderPrivacy"
                ],
                payload,
                renderPageError(
                    "Die Datenschutzhinweise sind nicht verfügbar."
                )
            );

        case ROUTES.IMPRINT:

            return callPageRenderer(
                ImprintPage,
                [
                    "renderImprintPage",
                    "renderImprint"
                ],
                payload,
                renderPageError(
                    "Das Impressum ist nicht verfügbar."
                )
            );

        default:

            return renderUnknownRoute(
                route
            );
    }
}

/************************************************
 * AUTHENTIFIZIERTE APP
 ************************************************/

function renderAuthenticatedApp(
    route,
    state
) {

    return `
        <div class="app-layout">

            ${renderHeader(state)}

            <main
                id="app-main-content"
                class="app-main-content"
                tabindex="-1"
            >
                ${renderRouteContent(
                    route,
                    state
                )}
            </main>

            ${renderNavigation(
                state,
                route
            )}

        </div>

        <div
            id="app-overlay-root"
            class="app-overlay-root"
            aria-live="polite"
        ></div>
    `;
}

/************************************************
 * TOAST
 ************************************************/

function showToast(
    message,
    type =
        "info"
) {

    const text =
        normalizeText(
            message
        );

    if (!text) {

        return;
    }

    let toast =
        document.getElementById(
            "app-toast"
        );

    if (!toast) {

        toast =
            document.createElement(
                "div"
            );

        toast.id =
            "app-toast";

        toast.className =
            "app-toast";

        toast.setAttribute(
            "role",
            "status"
        );

        toast.setAttribute(
            "aria-live",
            "polite"
        );

        document.body.appendChild(
            toast
        );
    }

    toast.className =
        `app-toast app-toast-${normalizeText(
            type
        ) || "info"} is-visible`;

    toast.textContent =
        text;

    if (toastTimeoutId) {

        window.clearTimeout(
            toastTimeoutId
        );
    }

    toastTimeoutId =
        window.setTimeout(
            () => {

                toast.classList.remove(
                    "is-visible"
                );
            },
            3200
        );
}

/************************************************
 * DIALOG
 ************************************************/

function closeDialog() {

    if (!activeDialogElement) {

        return;
    }

    activeDialogElement.remove();

    activeDialogElement =
        null;

    document.body.classList.remove(
        "dialog-open"
    );
}

function openConfirmDialog({
    title,
    message,
    confirmLabel =
        "Bestätigen",
    cancelLabel =
        "Abbrechen",
    destructive =
        false,
    onConfirm
}) {

    closeDialog();

   