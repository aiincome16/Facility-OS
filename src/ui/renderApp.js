/************************************************
 * Facility OS
 * renderApp.js
 *
 * Zentrale UI-Darstellung
 * - Login und öffentliche Seiten
 * - rollenabhängige App-Hülle
 * - Seitenrouting
 * - zentrale Event-Delegation
 * - Dialoge und Toast-Meldungen
 * - Event-Listener werden genau einmal registriert
 ************************************************/

import { ROUTES } from "../router.js";

import * as AppHeader from "./components/appHeader.js";
import * as BottomNavigation from "./components/bottomNavigation.js";

import * as OverviewPage from "./pages/overviewPage.js";
import * as ObjectsPage from "./pages/objectsPage.js";
import * as ObjectDetailPage from "./pages/objectDetailPage.js";
import * as PersonnelPage from "./pages/personnelPage.js";
import * as CommunicationPage from "./pages/communicationPage.js";
import * as MaterialsPage from "./pages/materialsPage.js";
import * as TasksPage from "./pages/tasksPage.js";
import * as TimesPage from "./pages/timesPage.js";
import * as AnalysisPage from "./pages/analysisPage.js";
import * as ReportsPage from "./pages/reportsPage.js";
import * as MorePage from "./pages/morePage.js";
import * as SettingsPage from "./pages/settingsPage.js";
import * as HelpPage from "./pages/helpPage.js";
import * as PrivacyPage from "./pages/privacyPage.js";
import * as ImprintPage from "./pages/imprintPage.js";

/************************************************
 * LAUFZEITKONTEXT
 ************************************************/

const runtime = {
    route: ROUTES.LOGIN,
    state: {},
    onNavigate: null,
    onLogin: null,
    onLogout: null,
    onCheckin: null,
    onCheckout: null,
    onSelectObject: null
};

let activeDialog = null;
let toastTimer = null;

/************************************************
 * BASISHELFER
 ************************************************/

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function asObject(value) {
    return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
}

function normalizeText(value) {
    return String(value ?? "").trim();
}

function normalizeRole(value) {
    return normalizeText(value).toUpperCase();
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
    return document.getElementById("app");
}

function getUserName(user) {
    return normalizeText(
        user?.displayName ??
        user?.fullName ??
        user?.name ??
        user?.username ??
        user?.email
    ) || "Benutzer";
}

function getRoleLabel(role) {
    const labels = {
        SUPER_ADMIN: "Super-Admin",
        ADMIN: "Administration",
        OBJEKTLEITER: "Objektleitung",
        MITARBEITER: "Mitarbeiter",
        BUCHHALTUNG: "Buchhaltung",
        KUNDE: "Kunde"
    };

    return labels[normalizeRole(role)] ?? "Benutzer";
}

function getObjectName(object) {
    return normalizeText(
        object?.name ??
        object?.objectName ??
        object?.Name ??
        object?.Objekt_Name
    ) || "Kein Objekt ausgewählt";
}

/************************************************
 * MODUL-RENDERER
 ************************************************/

function getModuleRenderer(moduleNamespace, candidateNames) {
    for (const candidateName of candidateNames) {
        if (typeof moduleNamespace?.[candidateName] === "function") {
            return moduleNamespace[candidateName];
        }
    }

    return null;
}

function renderModulePage(
    moduleNamespace,
    candidateNames,
    payload,
    fallbackTitle
) {
    const renderer = getModuleRenderer(
        moduleNamespace,
        candidateNames
    );

    if (!renderer) {
        return renderUnavailablePage(fallbackTitle);
    }

    try {
        const result = renderer(payload);

        if (typeof result !== "string") {
            throw new Error(
                `${candidateNames[0]}() hat keinen HTML-String zurückgegeben.`
            );
        }

        return result;
    }
    catch (error) {
        console.error(
            `Seite "${fallbackTitle}" konnte nicht gerendert werden.`,
            error
        );

        return renderErrorPage(
            `${fallbackTitle} konnte nicht geladen werden.`,
            error
        );
    }
}

/************************************************
 * STANDARDSEITEN
 ************************************************/

function renderUnavailablePage(title) {
    return `
        <section class="page-shell">
            <div class="page-heading">
                <div>
                    <span class="page-eyebrow">Facility OS</span>
                    <h1 class="page-title">${escapeHtml(title)}</h1>
                    <p class="page-subtitle">
                        Diese Ansicht ist derzeit nicht verfügbar.
                    </p>
                </div>
            </div>

            <div class="section-card">
                <button
                    type="button"
                    class="button button-primary button-full"
                    data-route="${escapeHtml(ROUTES.OVERVIEW)}"
                >
                    Zur Startseite
                </button>
            </div>
        </section>
    `;
}

function renderErrorPage(message, error = null) {
    const technicalMessage =
        error instanceof Error
            ? error.message
            : normalizeText(error);

    return `
        <section class="page-shell">
            <div class="page-heading">
                <div>
                    <span class="page-eyebrow">Facility OS</span>
                    <h1 class="page-title">Fehler</h1>
                </div>
            </div>

            <div class="alert-card alert-error">
                <strong>${escapeHtml(message)}</strong>

                ${
                    technicalMessage
                        ? `<p>${escapeHtml(technicalMessage)}</p>`
                        : ""
                }

                <button
                    type="button"
                    class="button button-secondary button-full"
                    data-route="${escapeHtml(ROUTES.OVERVIEW)}"
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
                    <span class="page-eyebrow">Facility OS</span>
                    <h1 class="page-title">Seite nicht gefunden</h1>
                    <p class="page-subtitle">
                        Die Route ${escapeHtml(route)} ist nicht bekannt.
                    </p>
                </div>
            </div>

            <div class="section-card">
                <button
                    type="button"
                    class="button button-primary button-full"
                    data-route="${escapeHtml(ROUTES.OVERVIEW)}"
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
    const users = asArray(state?.users)
        .filter((user) => user?.active !== false)
        .sort((firstUser, secondUser) =>
            getUserName(firstUser).localeCompare(
                getUserName(secondUser),
                "de"
            )
        );

    const userOptions = users
        .map((user) => `
            <option value="${escapeHtml(getLoginIdentifier(user))}">
                ${escapeHtml(
                    `${getUserName(user)} · ${getRoleLabel(user?.role)}`
                )}
            </option>
        `)
        .join("");

    return `
        <main class="login-page">
            <section class="login-card">
                <div class="login-brand">
                    <div class="login-logo" aria-hidden="true">FO</div>

                    <div class="login-brand-copy">
                        <span class="login-brand-name">Facility OS</span>
                        <span class="login-version">Version 2.0</span>
                    </div>
                </div>

                <div class="login-introduction">
                    <span class="login-badge">Präsentationsmodus</span>
                    <h1>Anmelden</h1>
                    <p>
                        Wähle einen Testbenutzer und öffne die passende Arbeitsansicht.
                    </p>
                </div>

                ${
                    state?.error
                        ? `
                            <div class="alert-card alert-error">
                                ${escapeHtml(state.error)}
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
                        <label for="login-identifier">Benutzer</label>

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
                        <label for="login-password">Passwort</label>

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
                        data-route="${escapeHtml(ROUTES.PRIVACY)}"
                    >
                        Datenschutz
                    </button>

                    <span aria-hidden="true">·</span>

                    <button
                        type="button"
                        class="text-button"
                        data-route="${escapeHtml(ROUTES.IMPRINT)}"
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
    const content = renderModulePage(
        moduleNamespace,
        candidateNames,
        {
            route: runtime.route,
            state: runtime.state
        },
        title
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
    const renderer = getModuleRenderer(
        AppHeader,
        [
            "renderAppHeader",
            "renderHeader"
        ]
    );

    if (renderer) {
        try {
            const result = renderer(state);

            if (typeof result === "string") {
                return result;
            }
        }
        catch (error) {
            console.error(
                "Der App-Header konnte nicht gerendert werden.",
                error
            );
        }
    }

    return `
        <header class="app-header">
            <div class="app-header-main">
                <div class="app-header-brand">Facility OS</div>

                <button
                    type="button"
                    class="app-header-user"
                    data-route="${escapeHtml(ROUTES.MORE)}"
                >
                    <span class="app-header-user-name">
                        ${escapeHtml(getUserName(state?.currentUser))}
                    </span>

                    <span class="app-header-user-role">
                        ${escapeHtml(
                            getRoleLabel(state?.currentUser?.role)
                        )}
                    </span>
                </button>
            </div>

            <div class="app-header-context">
                ${escapeHtml(getObjectName(state?.currentObject))}
            </div>
        </header>
    `;
}

function renderNavigation(state, route) {
    const renderer = getModuleRenderer(
        BottomNavigation,
        [
            "renderBottomNavigation",
            "renderNavigation"
        ]
    );

    if (!renderer) {
        console.error(
            "renderBottomNavigation() wurde nicht gefunden."
        );

        return "";
    }

    try {
        const result = renderer({
            state,
            route
        });

        return typeof result === "string"
            ? result
            : "";
    }
    catch (error) {
        console.error(
            "Die Bottom-Navigation konnte nicht gerendert werden.",
            error
        );

        return "";
    }
}

/************************************************
 * ROUTENINHALT
 ************************************************/

function renderRouteContent(route, state) {
    const payload = {
        route,
        state,
        currentUser: state?.currentUser,
        currentObject: state?.currentObject,
        currentShift: state?.currentShift,
        onNavigate: runtime.onNavigate,
        onCheckin: runtime.onCheckin,
        onCheckout: runtime.onCheckout,
        onSelectObject: runtime.onSelectObject
    };

    switch (route) {
        case ROUTES.OVERVIEW:
            return renderModulePage(
                OverviewPage,
                [
                    "renderOverviewPage",
                    "renderOverview",
                    "renderEmployeeDashboard"
                ],
                payload,
                "Startseite"
            );

        case ROUTES.OBJECTS:
            return renderModulePage(
                ObjectsPage,
                [
                    "renderObjectsPage",
                    "renderObjectSelection",
                    "renderObjects"
                ],
                payload,
                "Objekte"
            );

        case ROUTES.OBJECT_DETAIL:
            return renderModulePage(
                ObjectDetailPage,
                [
                    "renderObjectDetailPage",
                    "renderObjectDetail"
                ],
                payload,
                "Objektdetails"
            );

        case ROUTES.PERSONNEL:
            return renderModulePage(
                PersonnelPage,
                [
                    "renderPersonnelPage",
                    "renderPersonnel"
                ],
                payload,
                "Personal"
            );

        case ROUTES.COMMUNICATION:
            return renderModulePage(
                CommunicationPage,
                [
                    "renderCommunicationPage",
                    "renderCommunication"
                ],
                payload,
                "Meldungen"
            );

        case ROUTES.MATERIALS:
            return renderModulePage(
                MaterialsPage,
                [
                    "renderMaterialsPage",
                    "renderMaterials"
                ],
                payload,
                "Material"
            );

        case ROUTES.TASKS:
            return renderModulePage(
                TasksPage,
                [
                    "renderTasksPage",
                    "renderTasks"
                ],
                payload,
                "Aufgaben"
            );

        case ROUTES.TIMES:
            return renderModulePage(
                TimesPage,
                [
                    "renderTimesPage",
                    "renderTimes"
                ],
                payload,
                "Zeiten"
            );

        case ROUTES.ANALYSIS:
            return renderModulePage(
                AnalysisPage,
                [
                    "renderAnalysisPage",
                    "renderAnalysis"
                ],
                payload,
                "Auswertung"
            );

        case ROUTES.REPORTS:
            return renderModulePage(
                ReportsPage,
                [
                    "renderReportsPage",
                    "renderReports"
                ],
                payload,
                "Berichte"
            );

        case ROUTES.MORE:
            return renderModulePage(
                MorePage,
                [
                    "renderMorePage",
                    "renderMore"
                ],
                payload,
                "Mehr"
            );

        case ROUTES.SETTINGS:
            return renderModulePage(
                SettingsPage,
                [
                    "renderSettingsPage",
                    "renderSettings"
                ],
                payload,
                "Einstellungen"
            );

        case ROUTES.HELP:
            return renderModulePage(
                HelpPage,
                [
                    "renderHelpPage",
                    "renderHelp"
                ],
                payload,
                "Hilfe"
            );

        case ROUTES.PRIVACY:
            return renderModulePage(
                PrivacyPage,
                [
                    "renderPrivacyPage",
                    "renderPrivacy"
                ],
                payload,
                "Datenschutz"
            );

        case ROUTES.IMPRINT:
            return renderModulePage(
                ImprintPage,
                [
                    "renderImprintPage",
                    "renderImprint"
                ],
                payload,
                "Impressum"
            );

        default:
            return renderUnknownRoute(route);
    }
}

function renderAuthenticatedApp(route, state) {
    return `
        <div class="app-layout">
            ${renderHeader(state)}

            <main
                id="app-main-content"
                class="app-main-content"
                tabindex="-1"
            >
                ${renderRouteContent(route, state)}
            </main>

            ${renderNavigation(state, route)}
        </div>
    `;
}

/************************************************
 * TOAST
 ************************************************/

function showToast(message, type = "info") {
    const text = normalizeText(message);

    if (!text) {
        return;
    }

    let toast = document.getElementById("app-toast");

    if (!toast) {
        toast = document.createElement("div");
        toast.id = "app-toast";
        toast.setAttribute("role", "status");
        toast.setAttribute("aria-live", "polite");
        document.body.appendChild(toast);
    }

    toast.className =
        `app-toast app-toast-${normalizeText(type) || "info"} is-visible`;

    toast.textContent = text;

    if (toastTimer) {
        window.clearTimeout(toastTimer);
    }

    toastTimer = window.setTimeout(
        () => {
            toast.classList.remove("is-visible");
        },
        3200
    );
}

/************************************************
 * DIALOG
 ************************************************/

function closeDialog() {
    if (!activeDialog) {
        return;
    }

    activeDialog.remove();
    activeDialog = null;

    document.body.classList.remove("dialog-open");
}

function openConfirmDialog({
    title,
    message,
    confirmLabel = "Bestätigen",
    cancelLabel = "Abbrechen",
    destructive = false,
    onConfirm
}) {
    closeDialog();

    const dialog = document.createElement("div");
    dialog.className = "dialog-backdrop";

    dialog.innerHTML = `
        <section
            class="app-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="facility-dialog-title"
        >
            <div class="app-dialog-header">
                <h2 id="facility-dialog-title">
                    ${escapeHtml(title)}
                </h2>

                <button
                    type="button"
                    class="icon-button"
                    data-dialog-close
                    aria-label="Dialog schließen"
                >
                    ×
                </button>
            </div>

            <div class="app-dialog-body">
                <p>${escapeHtml(message)}</p>
            </div>

            <div class="app-dialog-actions">
                <button
                    type="button"
                    class="button button-secondary"
                    data-dialog-close
                >
                    ${escapeHtml(cancelLabel)}
                </button>

                <button
                    type="button"
                    class="button ${
                        destructive
                            ? "button-danger"
                            : "button-primary"
                    }"
                    data-dialog-confirm
                >
                    ${escapeHtml(confirmLabel)}
                </button>
            </div>
        </section>
    `;

    dialog.addEventListener(
        "click",
        async (event) => {
            const target = event.target;

            if (!(target instanceof Element)) {
                return;
            }

            if (
                target === dialog ||
                target.closest("[data-dialog-close]")
            ) {
                closeDialog();
                return;
            }

            if (target.closest("[data-dialog-confirm]")) {
                const confirmButton =
                    dialog.querySelector("[data-dialog-confirm]");

                if (confirmButton instanceof HTMLButtonElement) {
                    confirmButton.disabled = true;
                }

                try {
                    await onConfirm?.();
                    closeDialog();
                }
                catch (error) {
                    console.error(
                        "Dialogaktion fehlgeschlagen.",
                        error
                    );

                    showToast(
                        error instanceof Error
                            ? error.message
                            : "Die Aktion konnte nicht ausgeführt werden.",
                        "error"
                    );

                    if (confirmButton instanceof HTMLButtonElement) {
                        confirmButton.disabled = false;
                    }
                }
            }
        }
    );

    document.body.appendChild(dialog);
    document.body.classList.add("dialog-open");

    activeDialog = dialog;

    dialog
        .querySelector("[data-dialog-confirm]")
        ?.focus();
}

/************************************************
 * LOGIN-MELDUNG
 ************************************************/

function setLoginMessage(message, type = "error") {
    const element =
        document.getElementById("login-message");

    if (!element) {
        return;
    }

    element.textContent = normalizeText(message);
    element.className =
        `form-message form-message-${type}`;
}

/************************************************
 * NAVIGATION
 ************************************************/

function navigate(route) {
    const targetRoute = normalizeText(route);

    if (!targetRoute) {
        showToast(
            "Das Navigationsziel fehlt.",
            "error"
        );

        return false;
    }

    if (typeof runtime.onNavigate !== "function") {
        console.error(
            "Der Navigations-Handler fehlt.",
            targetRoute
        );

        showToast(
            "Die Navigation ist derzeit nicht verfügbar.",
            "error"
        );

        return false;
    }

    try {
        runtime.onNavigate(targetRoute);
        return true;
    }
    catch (error) {
        console.error(
            "Navigation fehlgeschlagen.",
            error
        );

        showToast(
            error instanceof Error
                ? error.message
                : "Die Seite konnte nicht geöffnet werden.",
            "error"
        );

        return false;
    }
}

/************************************************
 * FACHLICHE AKTIONEN
 ************************************************/

async function executeLogout() {
    if (typeof runtime.onLogout !== "function") {
        throw new Error(
            "Die Abmeldefunktion ist nicht verfügbar."
        );
    }

    await runtime.onLogout();
}

async function executeCheckin() {
    if (typeof runtime.onCheckin !== "function") {
        throw new Error(
            "Die Check-in-Funktion ist nicht verfügbar."
        );
    }

    await runtime.onCheckin();

    showToast(
        "Schicht wurde gestartet.",
        "success"
    );
}

async function executeCheckout() {
    if (typeof runtime.onCheckout !== "function") {
        throw new Error(
            "Die Check-out-Funktion ist nicht verfügbar."
        );
    }

    await runtime.onCheckout();

    showToast(
        "Schicht wurde beendet.",
        "success"
    );
}

async function executeObjectSelection(objectId) {
    const normalizedObjectId =
        normalizeText(objectId);

    if (!normalizedObjectId) {
        throw new Error(
            "Es wurde kein Objekt ausgewählt."
        );
    }

    if (
        typeof runtime.onSelectObject !==
        "function"
    ) {
        throw new Error(
            "Die Objektauswahl ist nicht verfügbar."
        );
    }

    await runtime.onSelectObject(
        normalizedObjectId
    );

    navigate(ROUTES.OBJECT_DETAIL);
}

/************************************************
 * KLICK-EVENT
 ************************************************/

async function handleAppClick(event) {
    const target = event.target;

    if (!(target instanceof Element)) {
        return;
    }

    const routeElement =
        target.closest("[data-route]");

    if (routeElement) {
        event.preventDefault();

        navigate(
            routeElement.getAttribute("data-route")
        );

        return;
    }

    const objectElement =
        target.closest("[data-object-id]");

    if (objectElement) {
        event.preventDefault();

        try {
            await executeObjectSelection(
                objectElement.getAttribute(
                    "data-object-id"
                )
            );
        }
        catch (error) {
            console.error(
                "Objektauswahl fehlgeschlagen.",
                error
            );

            showToast(
                error instanceof Error
                    ? error.message
                    : "Das Objekt konnte nicht geöffnet werden.",
                "error"
            );
        }

        return;
    }

    const actionElement =
        target.closest("[data-action]");

    if (!actionElement) {
        return;
    }

    event.preventDefault();

    const action =
        normalizeText(
            actionElement.getAttribute(
                "data-action"
            )
        ).toLowerCase();

    switch (action) {
        case "logout":
        case "sign-out":
            openConfirmDialog({
                title: "Abmelden",
                message:
                    "Möchtest du dich wirklich von Facility OS abmelden?",
                confirmLabel: "Abmelden",
                destructive: true,
                onConfirm: executeLogout
            });
            break;

        case "checkin":
        case "check-in":
        case "start-shift":
            try {
                await executeCheckin();
            }
            catch (error) {
                console.error(
                    "Check-in fehlgeschlagen.",
                    error
                );

                showToast(
                    error instanceof Error
                        ? error.message
                        : "Der Check-in konnte nicht ausgeführt werden.",
                    "error"
                );
            }
            break;

        case "checkout":
        case "check-out":
        case "stop-shift":
            openConfirmDialog({
                title: "Schicht beenden",
                message:
                    "Möchtest du die laufende Schicht jetzt beenden?",
                confirmLabel: "Schicht beenden",
                onConfirm: executeCheckout
            });
            break;

        case "return-login":
            navigate(ROUTES.LOGIN);
            break;

        case "close-dialog":
            closeDialog();
            break;

        default:
            console.info(
                `Noch nicht implementierte UI-Aktion: ${action}`
            );

            showToast(
                "Diese Funktion ist vorbereitet, aber noch nicht vollständig umgesetzt.",
                "info"
            );
    }
}

/************************************************
 * FORMULAR-EVENT
 ************************************************/

async function handleAppSubmit(event) {
    const form = event.target;

    if (!(form instanceof HTMLFormElement)) {
        return;
    }

    if (form.id !== "login-form") {
        return;
    }

    event.preventDefault();

    const formData = new FormData(form);

    const identifier =
        normalizeText(
            formData.get("identifier")
        );

    const password =
        String(
            formData.get("password") ??
            ""
        );

    if (!identifier) {
        setLoginMessage(
            "Bitte wähle einen Benutzer aus."
        );

        return;
    }

    if (typeof runtime.onLogin !== "function") {
        setLoginMessage(
            "Die Anmeldefunktion ist nicht verfügbar."
        );

        return;
    }

    const submitButton =
        form.querySelector(
            "button[type='submit']"
        );

    if (submitButton instanceof HTMLButtonElement) {
        submitButton.disabled = true;
        submitButton.textContent =
            "Anmeldung läuft …";
    }

    setLoginMessage("", "success");

    try {
        await runtime.onLogin({
            identifier,
            password
        });
    }
    catch (error) {
        console.error(
            "Anmeldung fehlgeschlagen.",
            error
        );

        setLoginMessage(
            error instanceof Error
                ? error.message
                : "Die Anmeldung ist fehlgeschlagen."
        );
    }
    finally {
        if (submitButton instanceof HTMLButtonElement) {
            submitButton.disabled = false;
            submitButton.textContent = "Anmelden";
        }
    }
}

/************************************************
 * LISTENER GENAU EINMAL BINDEN
 ************************************************/

function bindRootEvents(root) {
    if (
        root.dataset.facilityOsEventsBound ===
        "true"
    ) {
        return;
    }

    root.addEventListener(
        "click",
        handleAppClick
    );

    root.addEventListener(
        "submit",
        handleAppSubmit
    );

    root.dataset.facilityOsEventsBound =
        "true";
}

/************************************************
 * HAUPTFUNKTION
 ************************************************/

export function renderApp({
    route,
    state,
    onNavigate,
    onLogin,
    onLogout,
    onCheckin,
    onCheckout,
    onSelectObject
}) {
    const root = getAppRoot();

    if (!root) {
        console.error(
            "Das App-Element #app wurde nicht gefunden."
        );

        return false;
    }

    runtime.route =
        normalizeText(route) ||
        ROUTES.LOGIN;

    runtime.state =
        asObject(state);

    runtime.onNavigate =
        onNavigate;

    runtime.onLogin =
        onLogin;

    runtime.onLogout =
        onLogout;

    runtime.onCheckin =
        onCheckin;

    runtime.onCheckout =
        onCheckout;

    runtime.onSelectObject =
        onSelectObject;

    bindRootEvents(root);

    if (!runtime.state.currentUser) {
        if (
            runtime.route ===
            ROUTES.PRIVACY
        ) {
            root.innerHTML =
                renderPublicPage(
                    PrivacyPage,
                    [
                        "renderPrivacyPage",
                        "renderPrivacy"
                    ],
                    "Datenschutz"
                );

            return true;
        }

        if (
            runtime.route ===
            ROUTES.IMPRINT
        ) {
            root.innerHTML =
                renderPublicPage(
                    ImprintPage,
                    [
                        "renderImprintPage",
                        "renderImprint"
                    ],
                    "Impressum"
                );

            return true;
        }

        root.innerHTML =
            renderLoginPage(
                runtime.state
            );

        return true;
    }

    root.innerHTML =
        renderAuthenticatedApp(
            runtime.route,
            runtime.state
        );

    return true;
}
