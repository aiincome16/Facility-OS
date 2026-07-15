/************************************************
 * Facility OS
 * renderApp.js
 ************************************************/

import {
    APP_CONFIG,
    USER_ROLES
} from "../config/appConfig.js";

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getRoleLabel(role) {

    const roleLabels = {

        [USER_ROLES.SUPER_ADMIN]:
            "Super-Admin",

        [USER_ROLES.ADMIN]:
            "Administration",

        [USER_ROLES.OBJEKTLEITER]:
            "Objektleitung",

        [USER_ROLES.MITARBEITER]:
            "Mitarbeiter",

        [USER_ROLES.BUCHHALTUNG]:
            "Buchhaltung",

        [USER_ROLES.KUNDE]:
            "Kunde"
    };

    return roleLabels[role] ?? role;
}

function renderHeader(state) {

    if (!state.currentUser) {
        return "";
    }

    const userName =
        escapeHtml(state.currentUser.name);

    const roleLabel =
        escapeHtml(
            getRoleLabel(
                state.currentUser.role
            )
        );

    return `
        <header class="app-header">
            <div>
                <div class="app-title">
                    ${APP_CONFIG.APP_NAME}
                </div>

                <div class="app-version">
                    Version ${APP_CONFIG.APP_VERSION}
                </div>
            </div>

            <div class="header-user">
                <div>
                    <strong>${userName}</strong>
                    <span>${roleLabel}</span>
                </div>

                <button
                    type="button"
                    class="button button-secondary button-small"
                    data-action="logout"
                >
                    Abmelden
                </button>
            </div>
        </header>
    `;
}

function renderNavigation(state) {

    if (!state.currentUser) {
        return "";
    }

    return `
        <nav class="bottom-navigation">
            <button
                type="button"
                data-route="/dashboard"
            >
                Start
            </button>

            <button
                type="button"
                data-route="/objects"
            >
                Objekte
            </button>

            <button
                type="button"
                data-route="/tasks"
            >
                Aufgaben
            </button>

            <button
                type="button"
                data-route="/tickets"
            >
                Tickets
            </button>
        </nav>
    `;
}

function renderLogin() {

    return `
        <main class="login-page">
            <section class="login-card">

                <div class="brand-block">
                    <div class="brand-mark">
                        FO
                    </div>

                    <h1>${APP_CONFIG.APP_NAME}</h1>

                    <p>
                        Digitale Objekt- und
                        Reinigungsverwaltung
                    </p>
                </div>

                <form id="test-login-form">

                    <div class="form-group">
                        <label for="login-name">
                            Name
                        </label>

                        <input
                            id="login-name"
                            name="name"
                            type="text"
                            autocomplete="name"
                            value="Test Benutzer"
                            required
                        >
                    </div>

                    <div class="form-group">
                        <label for="login-role">
                            Testrolle
                        </label>

                        <select
                            id="login-role"
                            name="role"
                            required
                        >
                            <option value="OBJEKTLEITER">
                                Objektleiter
                            </option>

                            <option value="MITARBEITER">
                                Mitarbeiter
                            </option>

                            <option value="ADMIN">
                                Administration
                            </option>

                            <option value="BUCHHALTUNG">
                                Buchhaltung
                            </option>

                            <option value="KUNDE">
                                Kunde
                            </option>

                            <option value="SUPER_ADMIN">
                                Super-Admin
                            </option>
                        </select>
                    </div>

                    <button
                        type="submit"
                        class="button button-primary button-full"
                    >
                        Test-Login
                    </button>

                </form>

                <p class="login-note">
                    Der Test-Login wird später durch
                    die Google-Sheet-Anmeldung ersetzt.
                </p>

            </section>
        </main>
    `;
}

function renderDashboardCard(
    title,
    value,
    description
) {

    return `
        <article class="dashboard-card">

            <span class="dashboard-card-label">
                ${escapeHtml(title)}
            </span>

            <strong class="dashboard-card-value">
                ${escapeHtml(value)}
            </strong>

            <p>
                ${escapeHtml(description)}
            </p>

        </article>
    `;
}

function renderManagerDashboard(state) {

    return `
        <section class="page-section">

            <div class="page-heading">
                <div>
                    <span class="eyebrow">
                        Objektleitung
                    </span>

                    <h1>
                        Guten Tag,
                        ${escapeHtml(state.currentUser.name)}
                    </h1>
                </div>
            </div>

            <div class="dashboard-grid">

                ${renderDashboardCard(
                    "Mitarbeiter",
                    state.users.length,
                    "Zugeordnete und aktive Mitarbeiter"
                )}

                ${renderDashboardCard(
                    "Objekte",
                    state.objects.length,
                    "Verantwortete Reinigungsobjekte"
                )}

                ${renderDashboardCard(
                    "Offene Tickets",
                    state.tickets.length,
                    "Probleme, Schäden und Kundenmeldungen"
                )}

                ${renderDashboardCard(
                    "Material",
                    state.materials.length,
                    "Materialbestände und Nachbestellungen"
                )}

            </div>

            <section class="content-card">

                <h2>Heute im Überblick</h2>

                <p>
                    Hier erscheinen später laufende
                    Schichten, fehlende Check-ins,
                    Abwesenheiten und Materialwarnungen.
                </p>

            </section>

        </section>
    `;
}

function renderEmployeeDashboard(state) {

    const shiftText =
        state.shiftStarted
            ? "Schicht läuft"
            : "Noch nicht eingecheckt";

    return `
        <section class="page-section">

            <div class="page-heading">
                <div>
                    <span class="eyebrow">
                        Mitarbeiter
                    </span>

                    <h1>
                        Hallo,
                        ${escapeHtml(state.currentUser.name)}
                    </h1>
                </div>
            </div>

            <section class="content-card status-card">

                <span class="status-label">
                    Aktueller Status
                </span>

                <strong>
                    ${escapeHtml(shiftText)}
                </strong>

                <p>
                    Nach der Objektwahl erscheinen hier
                    Schicht, Räume und Aufgaben.
                </p>

            </section>

            <div class="action-grid">

                <button
                    type="button"
                    class="action-card"
                    data-action="checkin"
                >
                    <strong>Einchecken</strong>
                    <span>QR-Code oder Testmodus</span>
                </button>

                <button
                    type="button"
                    class="action-card"
                    data-route="/tasks"
                >
                    <strong>Aufgaben</strong>
                    <span>Räume und Reinigungsschritte</span>
                </button>

                <button
                    type="button"
                    class="action-card"
                    data-route="/tickets"
                >
                    <strong>Problem melden</strong>
                    <span>Foto, Text oder Audio</span>
                </button>

                <button
                    type="button"
                    class="action-card"
                    data-action="checkout"
                >
                    <strong>Auschecken</strong>
                    <span>Abschlussprüfung starten</span>
                </button>

            </div>

        </section>
    `;
}

function renderGenericDashboard(state) {

    return `
        <section class="page-section">

            <div class="page-heading">

                <div>
                    <span class="eyebrow">
                        ${escapeHtml(
                            getRoleLabel(
                                state.currentUser.role
                            )
                        )}
                    </span>

                    <h1>
                        Dashboard
                    </h1>
                </div>

            </div>

            <section class="content-card">

                <h2>
                    ${escapeHtml(
                        state.currentUser.name
                    )}
                </h2>

                <p>
                    Das Dashboard für die Rolle
                    ${escapeHtml(
                        getRoleLabel(
                            state.currentUser.role
                        )
                    )}
                    wird als separates Modul aufgebaut.
                </p>

            </section>

        </section>
    `;
}

function renderDashboard(state) {

    switch (state.currentUser?.role) {

        case USER_ROLES.OBJEKTLEITER:
        case USER_ROLES.ADMIN:
        case USER_ROLES.SUPER_ADMIN:

            return renderManagerDashboard(state);

        case USER_ROLES.MITARBEITER:

            return renderEmployeeDashboard(state);

        default:

            return renderGenericDashboard(state);
    }
}

function renderPlaceholderPage(title, description) {

    return `
        <section class="page-section">

            <div class="page-heading">
                <div>
                    <span class="eyebrow">
                        Facility OS
                    </span>

                    <h1>
                        ${escapeHtml(title)}
                    </h1>
                </div>
            </div>

            <section class="content-card">

                <p>
                    ${escapeHtml(description)}
                </p>

            </section>

        </section>
    `;
}

function renderRoute(route, state) {

    if (!state.currentUser) {
        return renderLogin();
    }

    switch (route) {

        case "/dashboard":

            return renderDashboard(state);

        case "/objects":

            return renderPlaceholderPage(
                "Objekte",
                "Hier werden Objekte, Räume, Einstellungen und Objektanleitungen verwaltet."
            );

        case "/employees":

            return renderPlaceholderPage(
                "Mitarbeiter",
                "Hier werden Mitarbeiter, Rollen, Abwesenheiten und Objektzuweisungen verwaltet."
            );

        case "/tasks":

            return renderPlaceholderPage(
                "Aufgaben",
                "Hier erscheinen Reinigungsaufgaben, Räume, Reihenfolge und Dokumentationspflichten."
            );

        case "/materials":

            return renderPlaceholderPage(
                "Material",
                "Hier werden Materialbestände, Mindestbestände und Nachbestellungen verwaltet."
            );

        case "/tickets":

            return renderPlaceholderPage(
                "Tickets",
                "Hier erscheinen Probleme, Schäden, Kundenmeldungen und interne Nachrichten."
            );

        case "/reports":

            return renderPlaceholderPage(
                "Berichte",
                "Hier werden Zeiten, Leistungen, Abweichungen und Kennzahlen ausgewertet."
            );

        case "/settings":

            return renderPlaceholderPage(
                "Einstellungen",
                "Hier werden App-, Objekt- und Benutzeroptionen festgelegt."
            );

        default:

            return renderDashboard(state);
    }
}

export function renderApp({
    route,
    state,
    onNavigate,
    onLogin,
    onLogout,
    onCheckin,
    onCheckout
}) {

    const appElement =
        document.getElementById("app");

    if (!appElement) {

        throw new Error(
            "Das HTML-Element #app wurde nicht gefunden."
        );
    }

    appElement.innerHTML = `

        <div class="app-shell">

            ${renderHeader(state)}

            <main class="app-content">
                ${renderRoute(route, state)}
            </main>

            ${renderNavigation(state)}

        </div>
    `;

    appElement
        .querySelectorAll("[data-route]")
        .forEach((element) => {

            element.addEventListener(
                "click",
                () => {

                    const targetRoute =
                        element.dataset.route;

                    onNavigate(targetRoute);
                }
            );
        });

    const loginForm =
        document.getElementById(
            "test-login-form"
        );

    if (loginForm) {

        loginForm.addEventListener(
            "submit",
            (event) => {

                event.preventDefault();

                const formData =
                    new FormData(loginForm);

                onLogin({

                    name:
                        String(
                            formData.get("name")
                        ).trim(),

                    role:
                        String(
                            formData.get("role")
                        ).trim()
                });
            }
        );
    }

    const logoutButton =
        appElement.querySelector(
            '[data-action="logout"]'
        );

    logoutButton?.addEventListener(
        "click",
        onLogout
    );

    const checkinButton =
        appElement.querySelector(
            '[data-action="checkin"]'
        );

    checkinButton?.addEventListener(
        "click",
        onCheckin
    );

    const checkoutButton =
        appElement.querySelector(
            '[data-action="checkout"]'
        );

    checkoutButton?.addEventListener(
        "click",
        onCheckout
    );
}