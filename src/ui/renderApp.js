/************************************************
 * Facility OS
 * renderApp.js
 ************************************************/

import {
    APP_CONFIG,
    USER_ROLES
} from "../config/appConfig.js";

import {
    renderObjectsPage
} from "./pages/objectsPage.js";

/************************************************
 * HTML-SICHERHEIT
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
 * ROLLENBEZEICHNUNGEN
 ************************************************/

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

    return roleLabels[role] ?? role ?? "Unbekannte Rolle";
}

/************************************************
 * HEADER
 ************************************************/

function renderHeader(state) {

    if (!state.currentUser) {
        return "";
    }

    const userName =
        escapeHtml(
            state.currentUser.name ??
            "Benutzer"
        );

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
                    ${escapeHtml(APP_CONFIG.APP_NAME)}
                </div>

                <div class="app-version">
                    Version
                    ${escapeHtml(APP_CONFIG.APP_VERSION)}
                </div>
            </div>

            <div class="header-user">

                <div>
                    <strong>
                        ${userName}
                    </strong>

                    <span>
                        ${roleLabel}
                    </span>
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

/************************************************
 * NAVIGATION
 ************************************************/

function renderNavigation(state) {

    const role =
        state.currentUser?.role;

    if (!role) {
        return "";
    }

    const navigationByRole = {

        [USER_ROLES.SUPER_ADMIN]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Benutzer",
                route: "/employees"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "System",
                route: "/settings"
            }
        ],

        [USER_ROLES.ADMIN]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Mitarbeiter",
                route: "/employees"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "Berichte",
                route: "/reports"
            }
        ],

        [USER_ROLES.OBJEKTLEITER]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Mitarbeiter",
                route: "/employees"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "Tickets",
                route: "/tickets"
            }
        ],

        [USER_ROLES.MITARBEITER]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Objekt",
                route: "/objects"
            },
            {
                label: "Aufgaben",
                route: "/tasks"
            },
            {
                label: "Meldungen",
                route: "/tickets"
            }
        ],

        [USER_ROLES.BUCHHALTUNG]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Berichte",
                route: "/reports"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "Zeiten",
                route: "/tasks"
            }
        ],

        [USER_ROLES.KUNDE]: [
            {
                label: "Start",
                route: "/dashboard"
            },
            {
                label: "Objekte",
                route: "/objects"
            },
            {
                label: "Meldung",
                route: "/tickets"
            },
            {
                label: "Berichte",
                route: "/reports"
            }
        ]
    };

    const navigationItems =
        navigationByRole[role] ?? [];

    return `
        <nav class="bottom-navigation">

            ${navigationItems
                .map((item) => `
                    <button
                        type="button"
                        data-route="${escapeHtml(item.route)}"
                    >
                        ${escapeHtml(item.label)}
                    </button>
                `)
                .join("")}

        </nav>
    `;
}

/************************************************
 * LOGIN
 ************************************************/

function renderLogin() {

    return `
        <main class="login-page">

            <section class="login-card">

                <div class="brand-block">

                    <div class="brand-mark">
                        FO
                    </div>

                    <h1>
                        ${escapeHtml(APP_CONFIG.APP_NAME)}
                    </h1>

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

/************************************************
 * WIEDERVERWENDBARE KARTEN
 ************************************************/

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

function renderActionCard(
    title,
    description,
    route = null,
    action = null
) {

    const routeAttribute =
        route
            ? `data-route="${escapeHtml(route)}"`
            : "";

    const actionAttribute =
        action
            ? `data-action="${escapeHtml(action)}"`
            : "";

    return `
        <button
            type="button"
            class="action-card"
            ${routeAttribute}
            ${actionAttribute}
        >
            <strong>
                ${escapeHtml(title)}
            </strong>

            <span>
                ${escapeHtml(description)}
            </span>
        </button>
    `;
}

/************************************************
 * SUPER-ADMIN-DASHBOARD
 ************************************************/

function renderSuperAdminDashboard(state) {

    return `
        <section class="page-section">

            <div class="page-heading">

                <div>
                    <span class="eyebrow">
                        Super-Administration
                    </span>

                    <h1>
                        Systemübersicht
                    </h1>
                </div>

            </div>

            <div class="dashboard-grid">

                ${renderDashboardCard(
                    "Benutzer",
                    state.users.length,
                    "Alle Benutzer und Rollen im System"
                )}

                ${renderDashboardCard(
                    "Objekte",
                    state.objects.length,
                    "Alle Kunden- und Reinigungsobjekte"
                )}

                ${renderDashboardCard(
                    "Offene Tickets",
                    state.tickets.length,
                    "Systemweite Probleme und Meldungen"
                )}

                ${renderDashboardCard(
                    "Version",
                    APP_CONFIG.APP_VERSION,
                    "Aktuell installierte Version"
                )}

            </div>

            <section class="content-card">

                <h2>
                    Systemverwaltung
                </h2>

                <div class="action-grid">

                    ${renderActionCard(
                        "Benutzer verwalten",
                        "Rollen, Rechte, Aktivierung und Zugänge",
                        "/employees"
                    )}

                    ${renderActionCard(
                        "Alle Objekte",
                        "Unternehmen, Kunden und Objektzuweisungen",
                        "/objects"
                    )}

                    ${renderActionCard(
                        "Systemberichte",
                        "Nutzung, Leistung und Auffälligkeiten",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Systemeinstellungen",
                        "App-Konfiguration, Module und Tarife",
                        "/settings"
                    )}

                    ${renderActionCard(
                        "Rollen und Rechte",
                        "Zugriffsrechte für alle Benutzerrollen",
                        "/settings"
                    )}

                    ${renderActionCard(
                        "Tarife und Funktionen",
                        "Free, Pro und Pro Plus verwalten",
                        "/settings"
                    )}

                    ${renderActionCard(
                        "Audit-Protokoll",
                        "Systemänderungen und sicherheitsrelevante Vorgänge",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Datenschutz",
                        "Datenschutz, Impressum und rechtliche Inhalte",
                        "/settings"
                    )}

                </div>

            </section>

        </section>
    `;
}

/************************************************
 * ADMIN-DASHBOARD
 ************************************************/

function renderAdminDashboard(state) {

    return `
        <section class="page-section">

            <div class="page-heading">

                <div>
                    <span class="eyebrow">
                        Administration
                    </span>

                    <h1>
                        Verwaltungsübersicht
                    </h1>
                </div>

            </div>

            <div class="dashboard-grid">

                ${renderDashboardCard(
                    "Mitarbeiter",
                    state.users.length,
                    "Mitarbeiter und Benutzer verwalten"
                )}

                ${renderDashboardCard(
                    "Objekte",
                    state.objects.length,
                    "Objekte, Räume und Einstellungen"
                )}

                ${renderDashboardCard(
                    "Aufgaben",
                    state.tasks.length,
                    "Reinigungspläne und Tätigkeiten"
                )}

                ${renderDashboardCard(
                    "Tickets",
                    state.tickets.length,
                    "Offene Probleme und Meldungen"
                )}

            </div>

            <section class="content-card">

                <h2>
                    Administration
                </h2>

                <div class="action-grid">

                    ${renderActionCard(
                        "Mitarbeiterverwaltung",
                        "Benutzer, Rollen und Objektzuweisungen",
                        "/employees"
                    )}

                    ${renderActionCard(
                        "Objektverwaltung",
                        "Objekte, Räume und Anleitungen",
                        "/objects"
                    )}

                    ${renderActionCard(
                        "Aufgabenverwaltung",
                        "Reinigungspläne und wiederkehrende Aufgaben",
                        "/tasks"
                    )}

                    ${renderActionCard(
                        "Schichtplanung",
                        "Arbeitszeiten, Einsätze und Vertretungen",
                        "/tasks"
                    )}

                    ${renderActionCard(
                        "Materialverwaltung",
                        "Bestände, Mindestmengen und Bestellungen",
                        "/materials"
                    )}

                    ${renderActionCard(
                        "Tickets und Nachrichten",
                        "Probleme, Schäden und interne Kommunikation",
                        "/tickets"
                    )}

                    ${renderActionCard(
                        "Berichte",
                        "Zeiten, Leistungen und Abweichungen",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Einstellungen",
                        "Unternehmens- und App-Einstellungen",
                        "/settings"
                    )}

                </div>

            </section>

        </section>
    `;
}

/************************************************
 * OBJEKTLEITER-DASHBOARD
 ************************************************/

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
                        ${escapeHtml(
                            state.currentUser.name
                        )}
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

                <h2>
                    Objektleitung
                </h2>

                <div class="action-grid">

                    ${renderActionCard(
                        "Mitarbeiter",
                        "Mitarbeiter, Einsätze und Zuständigkeiten",
                        "/employees"
                    )}

                    ${renderActionCard(
                        "Objekte",
                        "Räume, Aufgaben und Objektinformationen",
                        "/objects"
                    )}

                    ${renderActionCard(
                        "Laufende Schichten",
                        "Check-ins, Check-outs und Anwesenheiten",
                        "/tasks"
                    )}

                    ${renderActionCard(
                        "Vertretung suchen",
                        "Passende Vertretung bei Ausfall finden",
                        "/employees"
                    )}

                    ${renderActionCard(
                        "Tickets",
                        "Probleme, Schäden und Reklamationen bearbeiten",
                        "/tickets"
                    )}

                    ${renderActionCard(
                        "Material",
                        "Bestände prüfen und Nachbestellungen verwalten",
                        "/materials"
                    )}

                    ${renderActionCard(
                        "Berichte",
                        "Leistung, Zeiten und Abweichungen prüfen",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Objekteinstellungen",
                        "Pflichtfragen, Sicherheit und Kundenansicht",
                        "/settings"
                    )}

                </div>

            </section>

        </section>
    `;
}

/************************************************
 * MITARBEITER-DASHBOARD
 ************************************************/

function renderEmployeeDashboard(state) {

    const shiftText =
        state.shiftStarted
            ? "Schicht läuft"
            : "Noch nicht eingecheckt";

    const shiftAction =
        state.shiftStarted
            ? renderActionCard(
                "Auschecken",
                "Abschlussprüfung durchführen und Schicht beenden",
                null,
                "checkout"
            )
            : renderActionCard(
                "Einchecken",
                "QR-Code scannen oder Testmodus verwenden",
                null,
                "checkin"
            );

    return `
        <section class="page-section">

            <div class="page-heading">

                <div>
                    <span class="eyebrow">
                        Mitarbeiter
                    </span>

                    <h1>
                        Hallo,
                        ${escapeHtml(
                            state.currentUser.name
                        )}
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

                ${shiftAction}

                ${renderActionCard(
                    "Mein Objekt",
                    "Objektinformationen und Besonderheiten",
                    "/objects"
                )}

                ${renderActionCard(
                    "Meine Aufgaben",
                    "Räume, Reihenfolge und Reinigungsschritte",
                    "/tasks"
                )}

                ${renderActionCard(
                    "Objektanleitung",
                    "Räume, Dosierungen und Sicherheitsregeln",
                    "/objects"
                )}

                ${renderActionCard(
                    "Problem melden",
                    "Schaden, Materialmangel oder Hindernis melden",
                    "/tickets"
                )}

                ${renderActionCard(
                    "Material",
                    "Bestand prüfen oder Nachbestellung melden",
                    "/materials"
                )}

                ${renderActionCard(
                    "Krank oder abwesend",
                    "Abwesenheit an die Objektleitung melden",
                    "/tickets"
                )}

                ${renderActionCard(
                    "Urlaub",
                    "Urlaub beantragen und Resturlaub prüfen",
                    "/tickets"
                )}

                ${renderActionCard(
                    "Sofort-Notiz",
                    "Schnelle Notiz mit Foto, Text oder Audio",
                    "/tickets"
                )}

                ${renderActionCard(
                    "Nachrichten",
                    "Nachrichten der Objektleitung lesen",
                    "/tickets"
                )}

                ${renderActionCard(
                    "Schlüsselbuch",
                    "Schlüsselübernahme und Rückgabe dokumentieren",
                    "/objects"
                )}

                ${renderActionCard(
                    "Hilfe",
                    "Anleitungen, häufige Fragen und Unterstützung",
                    "/settings"
                )}

            </div>

        </section>
    `;
}

/************************************************
 * BUCHHALTUNGS-DASHBOARD
 ************************************************/

function renderAccountingDashboard(state) {

    return `
        <section class="page-section">

            <div class="page-heading">

                <div>
                    <span class="eyebrow">
                        Buchhaltung
                    </span>

                    <h1>
                        Abrechnung und Zeiten
                    </h1>
                </div>

            </div>

            <div class="dashboard-grid">

                ${renderDashboardCard(
                    "Mitarbeiter",
                    state.users.length,
                    "Abrechnungsrelevante Mitarbeiter"
                )}

                ${renderDashboardCard(
                    "Schichten",
                    state.shifts.length,
                    "Erfasste Arbeitszeiten"
                )}

                ${renderDashboardCard(
                    "Objekte",
                    state.objects.length,
                    "Kostenstellen und Kundenobjekte"
                )}

                ${renderDashboardCard(
                    "Abweichungen",
                    "0",
                    "Noch ungeprüfte Zeitabweichungen"
                )}

            </div>

            <section class="content-card">

                <h2>
                    Buchhaltung
                </h2>

                <div class="action-grid">

                    ${renderActionCard(
                        "Arbeitszeitberichte",
                        "Check-ins, Check-outs und Gesamtstunden",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Monatsabrechnung",
                        "Arbeitszeiten nach Mitarbeiter und Monat",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Objektabrechnung",
                        "Kundenobjekte und Kostenstellen",
                        "/objects"
                    )}

                    ${renderActionCard(
                        "Zeitabweichungen",
                        "Fehlzeiten und abweichende Einsatzzeiten",
                        "/tasks"
                    )}

                    ${renderActionCard(
                        "Fehlzeiten",
                        "Krankheit, Urlaub und unentschuldigte Abwesenheit",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Kilometer und Fahrten",
                        "Fahrten zwischen Objekten und Vergütung",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Export",
                        "Monatsauswertung für Lohn und Abrechnung",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Prüfung",
                        "Unvollständige oder auffällige Zeiterfassungen",
                        "/reports"
                    )}

                </div>

            </section>

        </section>
    `;
}

/************************************************
 * KUNDEN-DASHBOARD
 ************************************************/

function renderCustomerDashboard(state) {

    return `
        <section class="page-section">

            <div class="page-heading">

                <div>
                    <span class="eyebrow">
                        Kundenportal
                    </span>

                    <h1>
                        Objektübersicht
                    </h1>
                </div>

            </div>

            <div class="dashboard-grid">

                ${renderDashboardCard(
                    "Objekte",
                    state.objects.length,
                    "Für den Kunden freigegebene Objekte"
                )}

                ${renderDashboardCard(
                    "Offene Meldungen",
                    state.tickets.length,
                    "Probleme und Kundenanfragen"
                )}

                ${renderDashboardCard(
                    "Aufgaben",
                    state.tasks.length,
                    "Freigegebene Reinigungsleistungen"
                )}

                ${renderDashboardCard(
                    "Status",
                    "Aktiv",
                    "Aktueller Vertrags- und Objektstatus"
                )}

            </div>

            <section class="content-card">

                <h2>
                    Kundenbereich
                </h2>

                <div class="action-grid">

                    ${renderActionCard(
                        "Meine Objekte",
                        "Objektstatus und freigegebene Informationen",
                        "/objects"
                    )}

                    ${renderActionCard(
                        "Anfrage erstellen",
                        "Problem, Wunsch oder Reklamation melden",
                        "/tickets"
                    )}

                    ${renderActionCard(
                        "Leistungsnachweise",
                        "Freigegebene Berichte und Dokumentationen",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Nachrichten",
                        "Kommunikation mit der Objektleitung",
                        "/tickets"
                    )}

                    ${renderActionCard(
                        "Reinigungsplan",
                        "Freigegebene Räume und Leistungen ansehen",
                        "/tasks"
                    )}

                    ${renderActionCard(
                        "Meldungsstatus",
                        "Bearbeitungsstand eigener Meldungen prüfen",
                        "/tickets"
                    )}

                    ${renderActionCard(
                        "Dokumente",
                        "Verträge, Nachweise und freigegebene Dateien",
                        "/reports"
                    )}

                    ${renderActionCard(
                        "Kontakt",
                        "Zuständige Objektleitung kontaktieren",
                        "/tickets"
                    )}

                </div>

            </section>

        </section>
    `;
}

/************************************************
 * GENERISCHES DASHBOARD
 ************************************************/

function renderGenericDashboard(state) {

    return `
        <section class="page-section">

            <div class="page-heading">

                <div>
                    <span class="eyebrow">
                        ${escapeHtml(
                            getRoleLabel(
                                state.currentUser?.role
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
                        state.currentUser?.name ??
                        "Benutzer"
                    )}
                </h2>

                <p>
                    Für diese Rolle ist noch kein
                    eigenes Dashboard eingerichtet.
                </p>

            </section>

        </section>
    `;
}

/************************************************
 * DASHBOARD-AUSWAHL
 ************************************************/

function renderDashboard(state) {

    switch (state.currentUser?.role) {

        case USER_ROLES.SUPER_ADMIN:
            return renderSuperAdminDashboard(state);

        case USER_ROLES.ADMIN:
            return renderAdminDashboard(state);

        case USER_ROLES.OBJEKTLEITER:
            return renderManagerDashboard(state);

        case USER_ROLES.MITARBEITER:
            return renderEmployeeDashboard(state);

        case USER_ROLES.BUCHHALTUNG:
            return renderAccountingDashboard(state);

        case USER_ROLES.KUNDE:
            return renderCustomerDashboard(state);

        default:
            return renderGenericDashboard(state);
    }
}

/************************************************
 * PLATZHALTERSEITEN
 ************************************************/

function renderPlaceholderPage(
    title,
    description,
    items = []
) {

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

                ${
                    items.length > 0
                        ? `
                            <div class="action-grid">

                                ${items
                                    .map((item) =>
                                        renderActionCard(
                                            item.title,
                                            item.description,
                                            item.route ?? null,
                                            item.action ?? null
                                        )
                                    )
                                    .join("")}

                            </div>
                        `
                        : ""
                }

            </section>

        </section>
    `;
}

/************************************************
 * ROUTEN
 ************************************************/

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
                "Hier werden Objekte, Räume, Einstellungen und Objektanleitungen verwaltet.",
                [
                    {
                        title: "Objektübersicht",
                        description:
                            "Alle zugewiesenen Objekte anzeigen"
                    },
                    {
                        title: "Räume",
                        description:
                            "Räume und Reinigungsbereiche verwalten"
                    },
                    {
                        title: "Objektanleitung",
                        description:
                            "Hinweise, Fotos, Dosierungen und Sicherheit"
                    },
                    {
                        title: "Schlüsselbuch",
                        description:
                            "Schlüsselübergaben und Rückgaben dokumentieren"
                    }
                ]
            );

        case "/employees":

            return renderPlaceholderPage(
                "Mitarbeiter",
                "Hier werden Mitarbeiter, Rollen, Abwesenheiten und Objektzuweisungen verwaltet.",
                [
                    {
                        title: "Mitarbeiterübersicht",
                        description:
                            "Aktive und zugewiesene Mitarbeiter anzeigen"
                    },
                    {
                        title: "Abwesenheiten",
                        description:
                            "Krankheit, Urlaub und Ausfälle verwalten"
                    },
                    {
                        title: "Vertretungen",
                        description:
                            "Passende Vertretungen suchen und zuweisen"
                    },
                    {
                        title: "Leistung",
                        description:
                            "Bewertungen und Leistungsdaten prüfen"
                    }
                ]
            );

        case "/tasks":

            return renderPlaceholderPage(
                "Aufgaben",
                "Hier erscheinen Reinigungsaufgaben, Räume, Reihenfolge und Dokumentationspflichten.",
                [
                    {
                        title: "Heutige Aufgaben",
                        description:
                            "Aktuelle Räume und Arbeitsschritte"
                    },
                    {
                        title: "Reinigungspläne",
                        description:
                            "Wiederkehrende Aufgaben verwalten"
                    },
                    {
                        title: "Zeiten",
                        description:
                            "Sollzeiten und tatsächliche Zeiten vergleichen"
                    },
                    {
                        title: "Abweichungen",
                        description:
                            "Zeitabweichungen und Begründungen prüfen"
                    }
                ]
            );

        case "/materials":

            return renderPlaceholderPage(
                "Material",
                "Hier werden Materialbestände, Mindestbestände und Nachbestellungen verwaltet.",
                [
                    {
                        title: "Bestände",
                        description:
                            "Aktuelle Materialbestände anzeigen"
                    },
                    {
                        title: "Nachbestellung",
                        description:
                            "Fehlendes Material melden oder bestellen"
                    },
                    {
                        title: "Mindestbestand",
                        description:
                            "Warnwerte pro Objekt festlegen"
                    },
                    {
                        title: "Materialschrank",
                        description:
                            "QR-Zugriff und Schrankinhalt verwalten"
                    }
                ]
            );

        case "/tickets":

            return renderPlaceholderPage(
                "Tickets und Meldungen",
                "Hier erscheinen Probleme, Schäden, Kundenmeldungen und interne Nachrichten.",
                [
                    {
                        title: "Neue Meldung",
                        description:
                            "Problem, Schaden oder Anfrage erfassen"
                    },
                    {
                        title: "Offene Tickets",
                        description:
                            "Noch nicht abgeschlossene Vorgänge"
                    },
                    {
                        title: "Nachrichten",
                        description:
                            "Kommunikation zwischen den Rollen"
                    },
                    {
                        title: "Sofort-Notiz",
                        description:
                            "Schnelle Dokumentation mit Foto, Text oder Audio"
                    }
                ]
            );

        case "/reports":

            return renderPlaceholderPage(
                "Berichte",
                "Hier werden Zeiten, Leistungen, Abweichungen und Kennzahlen ausgewertet.",
                [
                    {
                        title: "Arbeitszeiten",
                        description:
                            "Check-ins, Check-outs und Gesamtstunden"
                    },
                    {
                        title: "Leistung",
                        description:
                            "Aufgabenstatus und Objektleistung"
                    },
                    {
                        title: "Abweichungen",
                        description:
                            "Auffällige Zeiten und fehlende Nachweise"
                    },
                    {
                        title: "Export",
                        description:
                            "Berichte für Lohn, Kunden und Controlling"
                    }
                ]
            );

        case "/settings":

            return renderPlaceholderPage(
                "Einstellungen",
                "Hier werden App-, Objekt- und Benutzeroptionen festgelegt.",
                [
                    {
                        title: "App-Einstellungen",
                        description:
                            "Allgemeine Funktionen und Module"
                    },
                    {
                        title: "Objekteinstellungen",
                        description:
                            "Check-out-Fragen und Sicherheitsvorgaben"
                    },
                    {
                        title: "Design",
                        description:
                            "Farben und Unternehmensdarstellung anpassen"
                    },
                    {
                        title: "Rollen und Rechte",
                        description:
                            "Zugriffe und Freigaben verwalten"
                    }
                ]
            );

        case "/datenschutz":

            return renderPlaceholderPage(
                "Datenschutz",
                "Hier werden die Datenschutzinformationen angezeigt."
            );

        case "/impressum":

            return renderPlaceholderPage(
                "Impressum",
                "Hier werden die Anbieter- und Kontaktinformationen angezeigt."
            );

        default:

            return renderDashboard(state);
    }
}

/************************************************
 * HAUPT-RENDERFUNKTION
 ************************************************/

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

                ${renderRoute(
                    route,
                    state
                )}

            </main>

            ${renderNavigation(state)}

        </div>
    `;

    /********************************************
     * ROUTEN-BUTTONS
     ********************************************/

    appElement
        .querySelectorAll("[data-route]")
        .forEach((element) => {

            element.addEventListener(
                "click",
                () => {

                    const targetRoute =
                        element.dataset.route;

                    if (
                        targetRoute &&
                        typeof onNavigate === "function"
                    ) {
                        onNavigate(targetRoute);
                    }
                }
            );
        });

    /********************************************
     * LOGIN
     ********************************************/

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

                const loginData = {

                    name:
                        String(
                            formData.get("name") ?? ""
                        ).trim(),

                    role:
                        String(
                            formData.get("role") ?? ""
                        ).trim()
                };

                if (
                    typeof onLogin === "function"
                ) {
                    onLogin(loginData);
                }
            }
        );
    }

    /********************************************
     * LOGOUT
     ********************************************/

    const logoutButton =
        appElement.querySelector(
            '[data-action="logout"]'
        );

    if (
        logoutButton &&
        typeof onLogout === "function"
    ) {

        logoutButton.addEventListener(
            "click",
            onLogout
        );
    }

    /********************************************
     * CHECK-IN
     ********************************************/

    const checkinButtons =
        appElement.querySelectorAll(
            '[data-action="checkin"]'
        );

    checkinButtons.forEach(
        (button) => {

            if (
                typeof onCheckin === "function"
            ) {

                button.addEventListener(
                    "click",
                    onCheckin
                );
            }
        }
    );

    /********************************************
     * CHECK-OUT
     ********************************************/

    const checkoutButtons =
        appElement.querySelectorAll(
            '[data-action="checkout"]'
        );

    checkoutButtons.forEach(
        (button) => {

            if (
                typeof onCheckout === "function"
            ) {

                button.addEventListener(
                    "click",
                    onCheckout
                );
            }
        }
    );
}