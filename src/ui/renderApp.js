/************************************************
 * Facility OS
 * renderApp.js
 *
 * Zentrale UI-Ausgabe
 * - rollenbasierte Dashboards
 * - Objektübersicht
 * - vollständige Objektdetailseite
 * - zentrale Event-Verarbeitung
 ************************************************/

import {
    APP_CONFIG,
    USER_ROLES
} from "../config/appConfig.js";

import {
    renderObjectsPage
} from "./pages/objectsPage.js";

import {
    renderObjectDetailPage
} from "./pages/objectDetailPage.js";

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
 * BASISHELFER
 ************************************************/

function asArray(value) {

    return Array.isArray(value)
        ? value
        : [];
}

function getRoleLabel(role) {

    const labels = {

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

    return (
        labels[role] ??
        role ??
        "Unbekannte Rolle"
    );
}

function getOpenTickets(state) {

    const closedStatuses = [
        "RESOLVED",
        "CLOSED",
        "COMPLETED"
    ];

    return asArray(state.tickets)
        .filter(
            (ticket) =>
                !closedStatuses.includes(
                    String(
                        ticket.status ?? ""
                    ).toUpperCase()
                )
        );
}

function getMaterialWarnings(state) {

    return asArray(state.materialStock)
        .filter(
            (stock) => {

                const status =
                    String(
                        stock.status ?? ""
                    ).toUpperCase();

                if (
                    [
                        "LOW",
                        "CRITICAL"
                    ].includes(status)
                ) {

                    return true;
                }

                const currentAmount =
                    Number(
                        stock.currentAmount ??
                        stock.quantity ??
                        stock.stock ??
                        0
                    );

                const minimumAmount =
                    Number(
                        stock.minimumAmount ??
                        stock.minimumStock ??
                        stock.minStock ??
                        0
                    );

                return (
                    Number.isFinite(currentAmount) &&
                    Number.isFinite(minimumAmount) &&
                    currentAmount <= minimumAmount
                );
            }
        );
}

/************************************************
 * HEADER
 ************************************************/

function renderHeader(state) {

    const currentUser =
        state.currentUser;

    if (!currentUser) {
        return "";
    }

    const currentObject =
        state.currentObject;

    return `
        <header class="app-header">

            <div class="app-brand">

                <div>

                    <div class="app-title">
                        ${escapeHtml(
                            APP_CONFIG.APP_NAME ??
                            "Facility OS"
                        )}
                    </div>

                    <div class="app-version">
                        Version
                        ${escapeHtml(
                            APP_CONFIG.APP_VERSION ??
                            "2.0.0"
                        )}
                    </div>

                </div>

                ${
                    currentObject
                        ? `
                            <button
                                type="button"
                                class="current-object-button"
                                data-route="/object-detail"
                            >
                                <span>
                                    Aktuelles Objekt
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        currentObject.name ??
                                        currentObject.id
                                    )}
                                </strong>
                            </button>
                        `
                        : ""
                }

            </div>

            <div class="header-user">

                <div>

                    <strong>
                        ${escapeHtml(
                            currentUser.name ??
                            currentUser.fullName ??
                            "Benutzer"
                        )}
                    </strong>

                    <span>
                        ${escapeHtml(
                            getRoleLabel(
                                currentUser.role
                            )
                        )}
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

function getNavigationItems(role) {

    const navigationByRole = {

        [USER_ROLES.SUPER_ADMIN]: [
            {
                label:
                    "Start",

                route:
                    "/dashboard"
            },
            {
                label:
                    "Benutzer",

                route:
                    "/employees"
            },
            {
                label:
                    "Objekte",

                route:
                    "/objects"
            },
            {
                label:
                    "System",

                route:
                    "/settings"
            }
        ],

        [USER_ROLES.ADMIN]: [
            {
                label:
                    "Start",

                route:
                    "/dashboard"
            },
            {
                label:
                    "Mitarbeiter",

                route:
                    "/employees"
            },
            {
                label:
                    "Objekte",

                route:
                    "/objects"
            },
            {
                label:
                    "Berichte",

                route:
                    "/reports"
            }
        ],

        [USER_ROLES.OBJEKTLEITER]: [
            {
                label:
                    "Start",

                route:
                    "/dashboard"
            },
            {
                label:
                    "Mitarbeiter",

                route:
                    "/employees"
            },
            {
                label:
                    "Objekte",

                route:
                    "/objects"
            },
            {
                label:
                    "Tickets",

                route:
                    "/tickets"
            }
        ],

        [USER_ROLES.MITARBEITER]: [
            {
                label:
                    "Start",

                route:
                    "/dashboard"
            },
            {
                label:
                    "Objekt",

                route:
                    "/objects"
            },
            {
                label:
                    "Aufgaben",

                route:
                    "/tasks"
            },
            {
                label:
                    "Meldungen",

                route:
                    "/tickets"
            }
        ],

        [USER_ROLES.BUCHHALTUNG]: [
            {
                label:
                    "Start",

                route:
                    "/dashboard"
            },
            {
                label:
                    "Berichte",

                route:
                    "/reports"
            },
            {
                label:
                    "Objekte",

                route:
                    "/objects"
            },
            {
                label:
                    "Zeiten",

                route:
                    "/tasks"
            }
        ],

        [USER_ROLES.KUNDE]: [
            {
                label:
                    "Start",

                route:
                    "/dashboard"
            },
            {
                label:
                    "Objekte",

                route:
                    "/objects"
            },
            {
                label:
                    "Meldung",

                route:
                    "/tickets"
            },
            {
                label:
                    "Berichte",

                route:
                    "/reports"
            }
        ]
    };

    return (
        navigationByRole[role] ??
        []
    );
}

function renderNavigation(
    state,
    route
) {

    const role =
        state.currentUser?.role;

    if (!role) {
        return "";
    }

    const navigationItems =
        getNavigationItems(role);

    return `
        <nav class="bottom-navigation">

            ${navigationItems
                .map(
                    (item) => {

                        const isActive =
                            route === item.route ||
                            (
                                route ===
                                    "/object-detail" &&
                                item.route ===
                                    "/objects"
                            );

                        return `
                            <button
                                type="button"
                                class="${
                                    isActive
                                        ? "active"
                                        : ""
                                }"
                                data-route="${escapeHtml(
                                    item.route
                                )}"
                            >
                                ${escapeHtml(
                                    item.label
                                )}
                            </button>
                        `;
                    }
                )
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
                        ${escapeHtml(
                            APP_CONFIG.APP_NAME ??
                            "Facility OS"
                        )}
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
                    die produktive Anmeldung ersetzt.
                </p>

            </section>

        </main>
    `;
}

/************************************************
 * WIEDERVERWENDBARE ELEMENTE
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

function renderActionCard({
    title,
    description,
    route = null,
    action = null
}) {

    const routeAttribute =
        route
            ? `
                data-route="${escapeHtml(
                    route
                )}"
            `
            : "";

    const actionAttribute =
        action
            ? `
                data-action="${escapeHtml(
                    action
                )}"
            `
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

function renderActionGroup({
    title,
    description = "",
    items = [],
    open = false
}) {

    return `
        <details
            class="dashboard-action-group"
            ${open ? "open" : ""}
        >

            <summary>

                <div>

                    <strong>
                        ${escapeHtml(title)}
                    </strong>

                    ${
                        description
                            ? `
                                <span>
                                    ${escapeHtml(
                                        description
                                    )}
                                </span>
                            `
                            : ""
                    }

                </div>

                <span class="section-count">
                    ${items.length}
                </span>

            </summary>

            <div class="dashboard-action-group-content">

                ${items
                    .map(
                        (item) =>
                            renderActionCard(
                                item
                            )
                    )
                    .join("")}

            </div>

        </details>
    `;
}

/************************************************
 * SUPER-ADMIN-DASHBOARD
 ************************************************/

function renderSuperAdminDashboard(state) {

    const openTickets =
        getOpenTickets(state);

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
                    asArray(state.users).length,
                    "Alle Benutzer und Rollen"
                )}

                ${renderDashboardCard(
                    "Objekte",
                    asArray(state.objects).length,
                    "Alle Kunden- und Reinigungsobjekte"
                )}

                ${renderDashboardCard(
                    "Offene Tickets",
                    openTickets.length,
                    "Systemweite Probleme und Meldungen"
                )}

                ${renderDashboardCard(
                    "Version",
                    APP_CONFIG.APP_VERSION ??
                    "2.0.0",
                    "Aktuell installierte Version"
                )}

            </div>

            <div class="dashboard-action-groups">

                ${renderActionGroup({
                    title:
                        "Benutzer und Berechtigungen",

                    description:
                        "Rollen, Zugänge und Zuständigkeiten",

                    open:
                        true,

                    items: [
                        {
                            title:
                                "Benutzer verwalten",

                            description:
                                "Benutzer, Rollen und Aktivierung bearbeiten",

                            route:
                                "/employees"
                        },
                        {
                            title:
                                "Rollen und Rechte",

                            description:
                                "Zugriffsrechte aller Rollen verwalten",

                            route:
                                "/settings"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "Objekte und Betrieb",

                    description:
                        "Objekte, Aufgaben und Betriebsdaten",

                    items: [
                        {
                            title:
                                "Alle Objekte",

                            description:
                                "Kundenobjekte und Objektzuweisungen",

                            route:
                                "/objects"
                        },
                        {
                            title:
                                "Systemberichte",

                            description:
                                "Nutzung, Leistung und Auffälligkeiten",

                            route:
                                "/reports"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "System und Tarife",

                    description:
                        "Module, Versionen und rechtliche Inhalte",

                    items: [
                        {
                            title:
                                "Systemeinstellungen",

                            description:
                                "App-Konfiguration und Module",

                            route:
                                "/settings"
                        },
                        {
                            title:
                                "Tarife und Funktionen",

                            description:
                                "Free, Pro und Pro Plus verwalten",

                            route:
                                "/settings"
                        },
                        {
                            title:
                                "Audit-Protokoll",

                            description:
                                "Systemänderungen und sicherheitsrelevante Vorgänge",

                            route:
                                "/reports"
                        },
                        {
                            title:
                                "Datenschutz und Impressum",

                            description:
                                "Rechtliche Inhalte verwalten",

                            route:
                                "/settings"
                        }
                    ]
                })}

            </div>

        </section>
    `;
}

/************************************************
 * ADMIN-DASHBOARD
 ************************************************/

function renderAdminDashboard(state) {

    const openTickets =
        getOpenTickets(state);

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
                    asArray(state.users).length,
                    "Mitarbeiter und Benutzer"
                )}

                ${renderDashboardCard(
                    "Objekte",
                    asArray(state.objects).length,
                    "Objekte, Räume und Einstellungen"
                )}

                ${renderDashboardCard(
                    "Aufgaben",
                    asArray(state.tasks).length,
                    "Reinigungspläne und Tätigkeiten"
                )}

                ${renderDashboardCard(
                    "Offene Tickets",
                    openTickets.length,
                    "Probleme und Meldungen"
                )}

            </div>

            <div class="dashboard-action-groups">

                ${renderActionGroup({
                    title:
                        "Personal",

                    description:
                        "Mitarbeiter, Schichten und Vertretungen",

                    open:
                        true,

                    items: [
                        {
                            title:
                                "Mitarbeiterverwaltung",

                            description:
                                "Benutzer, Rollen und Objektzuweisungen",

                            route:
                                "/employees"
                        },
                        {
                            title:
                                "Schichtplanung",

                            description:
                                "Einsätze, Arbeitszeiten und Vertretungen",

                            route:
                                "/tasks"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "Objekte und Leistungen",

                    description:
                        "Objekte, Räume und Reinigungspläne",

                    items: [
                        {
                            title:
                                "Objektverwaltung",

                            description:
                                "Objekte, Räume und Anleitungen",

                            route:
                                "/objects"
                        },
                        {
                            title:
                                "Aufgabenverwaltung",

                            description:
                                "Reinigungspläne und wiederkehrende Aufgaben",

                            route:
                                "/tasks"
                        },
                        {
                            title:
                                "Materialverwaltung",

                            description:
                                "Bestände, Mindestmengen und Bestellungen",

                            route:
                                "/materials"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "Kommunikation und Auswertung",

                    description:
                        "Tickets, Berichte und Einstellungen",

                    items: [
                        {
                            title:
                                "Tickets und Nachrichten",

                            description:
                                "Probleme, Schäden und Kommunikation",

                            route:
                                "/tickets"
                        },
                        {
                            title:
                                "Berichte",

                            description:
                                "Zeiten, Leistungen und Abweichungen",

                            route:
                                "/reports"
                        },
                        {
                            title:
                                "Einstellungen",

                            description:
                                "Unternehmens- und App-Einstellungen",

                            route:
                                "/settings"
                        }
                    ]
                })}

            </div>

        </section>
    `;
}

/************************************************
 * OBJEKTLEITER-DASHBOARD
 ************************************************/

function renderManagerDashboard(state) {

    const openTickets =
        getOpenTickets(state);

    const warnings =
        getMaterialWarnings(state);

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
                            state.currentUser?.name ??
                            "Objektleitung"
                        )}
                    </h1>

                </div>

            </div>

            <div class="dashboard-grid">

                ${renderDashboardCard(
                    "Mitarbeiter",
                    asArray(state.users).length,
                    "Aktive und zugeordnete Mitarbeiter"
                )}

                ${renderDashboardCard(
                    "Objekte",
                    asArray(state.objects).length,
                    "Verantwortete Reinigungsobjekte"
                )}

                ${renderDashboardCard(
                    "Offene Tickets",
                    openTickets.length,
                    "Probleme, Schäden und Meldungen"
                )}

                ${renderDashboardCard(
                    "Materialwarnungen",
                    warnings.length,
                    "Niedrige und kritische Bestände"
                )}

            </div>

            <div class="dashboard-action-groups">

                ${renderActionGroup({
                    title:
                        "Tagessteuerung",

                    description:
                        "Aktuelle Einsätze und Abweichungen",

                    open:
                        true,

                    items: [
                        {
                            title:
                                "Laufende Schichten",

                            description:
                                "Check-ins, Check-outs und Anwesenheiten",

                            route:
                                "/tasks"
                        },
                        {
                            title:
                                "Vertretung suchen",

                            description:
                                "Passende Vertretung bei Ausfall finden",

                            route:
                                "/employees"
                        },
                        {
                            title:
                                "Offene Tickets",

                            description:
                                "Probleme und Reklamationen bearbeiten",

                            route:
                                "/tickets"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "Objekte und Personal",

                    description:
                        "Mitarbeiter, Räume und Objektinformationen",

                    items: [
                        {
                            title:
                                "Mitarbeiter",

                            description:
                                "Einsätze und Zuständigkeiten",

                            route:
                                "/employees"
                        },
                        {
                            title:
                                "Objekte",

                            description:
                                "Räume, Aufgaben und Objektinformationen",

                            route:
                                "/objects"
                        },
                        {
                            title:
                                "Material",

                            description:
                                "Bestände und Nachbestellungen",

                            route:
                                "/materials"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "Auswertung und Einstellungen",

                    description:
                        "Leistung, Zeiten und Objektvorgaben",

                    items: [
                        {
                            title:
                                "Berichte",

                            description:
                                "Leistung, Zeiten und Abweichungen",

                            route:
                                "/reports"
                        },
                        {
                            title:
                                "Objekteinstellungen",

                            description:
                                "Pflichtfragen, Sicherheit und Kundenansicht",

                            route:
                                "/settings"
                        }
                    ]
                })}

            </div>

        </section>
    `;
}

/************************************************
 * MITARBEITER-DASHBOARD
 ************************************************/

function renderEmployeeDashboard(state) {

    const shiftStarted =
        state.shiftStarted === true;

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
                            state.currentUser?.name ??
                            "Mitarbeiter"
                        )}
                    </h1>

                </div>

            </div>

            <section class="content-card status-card">

                <span class="status-label">
                    Aktueller Status
                </span>

                <strong>
                    ${
                        shiftStarted
                            ? "Schicht läuft"
                            : "Noch nicht eingecheckt"
                    }
                </strong>

                <p>
                    ${
                        state.currentObject
                            ? `
                                Aktuelles Objekt:
                                ${escapeHtml(
                                    state.currentObject.name ??
                                    state.currentObject.id
                                )}
                            `
                            : `
                                Wähle zuerst dein Objekt aus.
                            `
                    }
                </p>

            </section>

            <div class="dashboard-action-groups">

                ${renderActionGroup({
                    title:
                        "Aktuelle Schicht",

                    description:
                        "Check-in, Aufgaben und Abschluss",

                    open:
                        true,

                    items: [
                        shiftStarted
                            ? {
                                title:
                                    "Auschecken",

                                description:
                                    "Abschlussprüfung durchführen und Schicht beenden",

                                action:
                                    "checkout"
                            }
                            : {
                                title:
                                    "Einchecken",

                                description:
                                    "QR-Code scannen oder Testmodus verwenden",

                                action:
                                    "checkin"
                            },
                        {
                            title:
                                "Mein Objekt",

                            description:
                                "Objektinformationen und Besonderheiten",

                            route:
                                state.currentObject
                                    ? "/object-detail"
                                    : "/objects"
                        },
                        {
                            title:
                                "Meine Aufgaben",

                            description:
                                "Räume, Reihenfolge und Reinigungsschritte",

                            route:
                                "/tasks"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "Meldungen und Material",

                    description:
                        "Probleme, Bestände und Abwesenheiten",

                    items: [
                        {
                            title:
                                "Problem melden",

                            description:
                                "Schaden, Materialmangel oder Hindernis",

                            route:
                                "/tickets"
                        },
                        {
                            title:
                                "Material",

                            description:
                                "Bestand prüfen oder Nachbestellung melden",

                            route:
                                "/materials"
                        },
                        {
                            title:
                                "Krank oder abwesend",

                            description:
                                "Abwesenheit an die Objektleitung melden",

                            route:
                                "/tickets"
                        },
                        {
                            title:
                                "Urlaub",

                            description:
                                "Urlaub beantragen und Resturlaub prüfen",

                            route:
                                "/tickets"
                        },
                        {
                            title:
                                "Sofort-Notiz",

                            description:
                                "Schnelle Dokumentation mit Foto, Text oder Audio",

                            route:
                                "/tickets"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "Anleitungen und Kommunikation",

                    description:
                        "Objektwissen, Schlüssel und Hilfe",

                    items: [
                        {
                            title:
                                "Objektanleitung",

                            description:
                                "Zugang, Dosierung und Sicherheitsregeln",

                            route:
                                state.currentObject
                                    ? "/object-detail"
                                    : "/objects"
                        },
                        {
                            title:
                                "Schlüsselbuch",

                            description:
                                "Schlüsselübernahme und Rückgabe",

                            route:
                                state.currentObject
                                    ? "/object-detail"
                                    : "/objects"
                        },
                        {
                            title:
                                "Nachrichten",

                            description:
                                "Nachrichten der Objektleitung",

                            route:
                                "/tickets"
                        },
                        {
                            title:
                                "Hilfe",

                            description:
                                "Anleitungen und Unterstützung",

                            route:
                                "/settings"
                        }
                    ]
                })}

            </div>

        </section>
    `;
}

/************************************************
 * BUCHHALTUNG
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
                    asArray(state.users).length,
                    "Abrechnungsrelevante Mitarbeiter"
                )}

                ${renderDashboardCard(
                    "Schichten",
                    asArray(state.shifts).length,
                    "Erfasste Arbeitszeiten"
                )}

                ${renderDashboardCard(
                    "Objekte",
                    asArray(state.objects).length,
                    "Kostenstellen und Kundenobjekte"
                )}

                ${renderDashboardCard(
                    "Abweichungen",
                    asArray(state.timeDeviations).length,
                    "Erfasste Zeitabweichungen"
                )}

            </div>

            <div class="dashboard-action-groups">

                ${renderActionGroup({
                    title:
                        "Arbeitszeiten",

                    description:
                        "Zeiten, Fehlzeiten und Abweichungen",

                    open:
                        true,

                    items: [
                        {
                            title:
                                "Arbeitszeitberichte",

                            description:
                                "Check-ins, Check-outs und Gesamtstunden",

                            route:
                                "/reports"
                        },
                        {
                            title:
                                "Monatsabrechnung",

                            description:
                                "Arbeitszeiten nach Mitarbeiter und Monat",

                            route:
                                "/reports"
                        },
                        {
                            title:
                                "Zeitabweichungen",

                            description:
                                "Abweichende Einsatzzeiten prüfen",

                            route:
                                "/tasks"
                        },
                        {
                            title:
                                "Fehlzeiten",

                            description:
                                "Krankheit, Urlaub und Abwesenheiten",

                            route:
                                "/reports"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "Objekte und Export",

                    description:
                        "Kostenstellen, Fahrten und Abrechnungsdaten",

                    items: [
                        {
                            title:
                                "Objektabrechnung",

                            description:
                                "Kundenobjekte und Kostenstellen",

                            route:
                                "/objects"
                        },
                        {
                            title:
                                "Kilometer und Fahrten",

                            description:
                                "Fahrten zwischen Objekten und Vergütung",

                            route:
                                "/reports"
                        },
                        {
                            title:
                                "Export",

                            description:
                                "Monatsauswertung für Lohn und Abrechnung",

                            route:
                                "/reports"
                        },
                        {
                            title:
                                "Prüfung",

                            description:
                                "Unvollständige oder auffällige Zeiterfassungen",

                            route:
                                "/reports"
                        }
                    ]
                })}

            </div>

        </section>
    `;
}

/************************************************
 * KUNDEN-DASHBOARD
 ************************************************/

function renderCustomerDashboard(state) {

    const openTickets =
        getOpenTickets(state);

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
                    asArray(state.objects).length,
                    "Freigegebene Kundenobjekte"
                )}

                ${renderDashboardCard(
                    "Offene Meldungen",
                    openTickets.length,
                    "Probleme und Kundenanfragen"
                )}

                ${renderDashboardCard(
                    "Aufgaben",
                    asArray(state.tasks).length,
                    "Freigegebene Reinigungsleistungen"
                )}

                ${renderDashboardCard(
                    "Status",
                    "Aktiv",
                    "Aktueller Objektstatus"
                )}

            </div>

            <div class="dashboard-action-groups">

                ${renderActionGroup({
                    title:
                        "Objekte und Leistungen",

                    description:
                        "Status, Reinigungsplan und Nachweise",

                    open:
                        true,

                    items: [
                        {
                            title:
                                "Meine Objekte",

                            description:
                                "Objektstatus und freigegebene Informationen",

                            route:
                                "/objects"
                        },
                        {
                            title:
                                "Reinigungsplan",

                            description:
                                "Freigegebene Räume und Leistungen",

                            route:
                                "/tasks"
                        },
                        {
                            title:
                                "Leistungsnachweise",

                            description:
                                "Freigegebene Berichte und Dokumentationen",

                            route:
                                "/reports"
                        },
                        {
                            title:
                                "Dokumente",

                            description:
                                "Verträge und freigegebene Dateien",

                            route:
                                "/reports"
                        }
                    ]
                })}

                ${renderActionGroup({
                    title:
                        "Meldungen und Kontakt",

                    description:
                        "Anfragen, Status und Kommunikation",

                    items: [
                        {
                            title:
                                "Anfrage erstellen",

                            description:
                                "Problem, Wunsch oder Reklamation melden",

                            route:
                                "/tickets"
                        },
                        {
                            title:
                                "Meldungsstatus",

                            description:
                                "Bearbeitungsstand eigener Meldungen",

                            route:
                                "/tickets"
                        },
                        {
                            title:
                                "Nachrichten",

                            description:
                                "Kommunikation mit der Objektleitung",

                            route:
                                "/tickets"
                        },
                        {
                            title:
                                "Kontakt",

                            description:
                                "Zuständige Objektleitung kontaktieren",

                            route:
                                "/tickets"
                        }
                    ]
                })}

            </div>

        </section>
    `;
}

/************************************************
 * DASHBOARD-AUSWAHL
 ************************************************/

function renderDashboard(state) {

    switch (
        state.currentUser?.role
    ) {

        case USER_ROLES.SUPER_ADMIN:

            return renderSuperAdminDashboard(
                state
            );

        case USER_ROLES.ADMIN:

            return renderAdminDashboard(
                state
            );

        case USER_ROLES.OBJEKTLEITER:

            return renderManagerDashboard(
                state
            );

        case USER_ROLES.MITARBEITER:

            return renderEmployeeDashboard(
                state
            );

        case USER_ROLES.BUCHHALTUNG:

            return renderAccountingDashboard(
                state
            );

        case USER_ROLES.KUNDE:

            return renderCustomerDashboard(
                state
            );

        default:

            return `
                <section class="page-section">

                    <section class="content-card">

                        <h1>
                            Dashboard
                        </h1>

                        <p>
                            Für diese Rolle ist noch
                            kein Dashboard verfügbar.
                        </p>

                    </section>

                </section>
            `;
    }
}

/************************************************
 * PLATZHALTERSEITEN
 ************************************************/

function renderPlaceholderPage({
    title,
    description,
    groups = []
}) {

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

            ${
                groups.length > 0
                    ? `
                        <div class="dashboard-action-groups">

                            ${groups
                                .map(
                                    renderActionGroup
                                )
                                .join("")}

                        </div>
                    `
                    : ""
            }

        </section>
    `;
}

/************************************************
 * ROUTEN
 ************************************************/

function renderRoute(
    route,
    state
) {

    if (!state.currentUser) {
        return renderLogin();
    }

    switch (route) {

        case "/dashboard":

            return renderDashboard(
                state
            );

        case "/objects":

            return renderObjectsPage(
                state
            );

        case "/object-detail":

            return renderObjectDetailPage(
                state
            );

        case "/employees":

            return renderPlaceholderPage({
                title:
                    "Mitarbeiter",

                description:
                    "Mitarbeiter, Rollen, Abwesenheiten und Objektzuweisungen.",

                groups: [
                    {
                        title:
                            "Personalübersicht",

                        description:
                            "Mitarbeiter und Zuständigkeiten",

                        open:
                            true,

                        items: [
                            {
                                title:
                                    "Mitarbeiterübersicht",

                                description:
                                    "Aktive und zugewiesene Mitarbeiter"
                            },
                            {
                                title:
                                    "Objektzuweisungen",

                                description:
                                    "Mitarbeiter auf Objekte verteilen"
                            },
                            {
                                title:
                                    "Leistungsdaten",

                                description:
                                    "Bewertungen und Leistungsentwicklung"
                            }
                        ]
                    },
                    {
                        title:
                            "Abwesenheit und Vertretung",

                        description:
                            "Krankheit, Urlaub und Ausfälle",

                        items: [
                            {
                                title:
                                    "Abwesenheiten",

                                description:
                                    "Krankheit und Urlaub verwalten"
                            },
                            {
                                title:
                                    "Vertretungen",

                                description:
                                    "Passende Vertretungen suchen"
                            }
                        ]
                    }
                ]
            });

        case "/tasks":

            return renderPlaceholderPage({
                title:
                    "Aufgaben",

                description:
                    "Reinigungsaufgaben, Räume, Reihenfolge und Dokumentationspflichten.",

                groups: [
                    {
                        title:
                            "Tagesaufgaben",

                        description:
                            "Aktuelle Aufgaben und Räume",

                        open:
                            true,

                        items: [
                            {
                                title:
                                    "Heutige Aufgaben",

                                description:
                                    "Aktuelle Räume und Arbeitsschritte"
                            },
                            {
                                title:
                                    "Aufgabenstatus",

                                description:
                                    "Offene und erledigte Aufgaben"
                            }
                        ]
                    },
                    {
                        title:
                            "Planung und Abweichungen",

                        description:
                            "Reinigungspläne und Sollzeiten",

                        items: [
                            {
                                title:
                                    "Reinigungspläne",

                                description:
                                    "Wiederkehrende Aufgaben verwalten"
                            },
                            {
                                title:
                                    "Zeiten",

                                description:
                                    "Soll- und Istzeiten vergleichen"
                            },
                            {
                                title:
                                    "Abweichungen",

                                description:
                                    "Begründungen und Nachweise prüfen"
                            }
                        ]
                    }
                ]
            });

        case "/materials":

            return renderPlaceholderPage({
                title:
                    "Material",

                description:
                    "Materialbestände, Mindestbestände und Nachbestellungen.",

                groups: [
                    {
                        title:
                            "Bestand",

                        description:
                            "Aktuelle Mengen und Warnungen",

                        open:
                            true,

                        items: [
                            {
                                title:
                                    "Bestände",

                                description:
                                    "Aktuelle Materialbestände"
                            },
                            {
                                title:
                                    "Mindestbestand",

                                description:
                                    "Warnwerte pro Objekt"
                            },
                            {
                                title:
                                    "Materialschrank",

                                description:
                                    "QR-Zugriff und Schrankinhalt"
                            }
                        ]
                    },
                    {
                        title:
                            "Bestellung",

                        description:
                            "Fehlmengen und Nachbestellungen",

                        items: [
                            {
                                title:
                                    "Nachbestellung",

                                description:
                                    "Fehlendes Material melden"
                            },
                            {
                                title:
                                    "Bestellstatus",

                                description:
                                    "Offene Bestellungen verfolgen"
                            }
                        ]
                    }
                ]
            });

        case "/tickets":

            return renderPlaceholderPage({
                title:
                    "Tickets und Meldungen",

                description:
                    "Probleme, Schäden, Kundenmeldungen und interne Nachrichten.",

                groups: [
                    {
                        title:
                            "Meldungen",

                        description:
                            "Neue und offene Vorgänge",

                        open:
                            true,

                        items: [
                            {
                                title:
                                    "Neue Meldung",

                                description:
                                    "Problem, Schaden oder Anfrage erfassen"
                            },
                            {
                                title:
                                    "Offene Tickets",

                                description:
                                    "Noch nicht abgeschlossene Vorgänge"
                            },
                            {
                                title:
                                    "Sofort-Notiz",

                                description:
                                    "Foto, Text oder Audio dokumentieren"
                            }
                        ]
                    },
                    {
                        title:
                            "Kommunikation",

                        description:
                            "Nachrichten und Bearbeitung",

                        items: [
                            {
                                title:
                                    "Nachrichten",

                                description:
                                    "Kommunikation zwischen den Rollen"
                            },
                            {
                                title:
                                    "Verlauf",

                                description:
                                    "Abgeschlossene Meldungen anzeigen"
                            }
                        ]
                    }
                ]
            });

        case "/reports":

            return renderPlaceholderPage({
                title:
                    "Berichte",

                description:
                    "Zeiten, Leistungen, Abweichungen und Kennzahlen.",

                groups: [
                    {
                        title:
                            "Arbeitszeit und Leistung",

                        description:
                            "Zeiten, Aufgaben und Qualität",

                        open:
                            true,

                        items: [
                            {
                                title:
                                    "Arbeitszeiten",

                                description:
                                    "Check-ins, Check-outs und Stunden"
                            },
                            {
                                title:
                                    "Leistung",

                                description:
                                    "Aufgabenstatus und Objektleistung"
                            },
                            {
                                title:
                                    "Abweichungen",

                                description:
                                    "Auffällige Zeiten und Nachweise"
                            }
                        ]
                    },
                    {
                        title:
                            "Ausgabe und Export",

                        description:
                            "Berichte für interne und externe Nutzung",

                        items: [
                            {
                                title:
                                    "Kundenberichte",

                                description:
                                    "Freigegebene Leistungsnachweise"
                            },
                            {
                                title:
                                    "Lohnexport",

                                description:
                                    "Abrechnungsdaten vorbereiten"
                            },
                            {
                                title:
                                    "Datenexport",

                                description:
                                    "Berichte herunterladen oder übertragen"
                            }
                        ]
                    }
                ]
            });

        case "/settings":

            return renderPlaceholderPage({
                title:
                    "Einstellungen",

                description:
                    "App-, Objekt-, Benutzer- und Unternehmensoptionen.",

                groups: [
                    {
                        title:
                            "Unternehmen und Design",

                        description:
                            "Darstellung und Stammdaten",

                        open:
                            true,

                        items: [
                            {
                                title:
                                    "Unternehmensdaten",

                                description:
                                    "Name, Kontakt und rechtliche Angaben"
                            },
                            {
                                title:
                                    "Design",

                                description:
                                    "Farben und Unternehmensdarstellung"
                            }
                        ]
                    },
                    {
                        title:
                            "Objekte und Prozesse",

                        description:
                            "Pflichtprüfungen und Betriebsregeln",

                        items: [
                            {
                                title:
                                    "Objekteinstellungen",

                                description:
                                    "Check-in, Check-out und Sicherheit"
                            },
                            {
                                title:
                                    "Benachrichtigungen",

                                description:
                                    "Meldungen und Erinnerungen"
                            },
                            {
                                title:
                                    "Offline-Modus",

                                description:
                                    "Lokale Zwischenspeicherung"
                            }
                        ]
                    },
                    {
                        title:
                            "Zugriff und System",

                        description:
                            "Rollen, Tarife und Datenschutz",

                        items: [
                            {
                                title:
                                    "Rollen und Rechte",

                                description:
                                    "Zugriffe und Freigaben"
                            },
                            {
                                title:
                                    "Tarif und Module",

                                description:
                                    "Free, Pro und Pro Plus"
                            },
                            {
                                title:
                                    "Datenschutz",

                                description:
                                    "Datenschutz und Impressum",

                                route:
                                    "/datenschutz"
                            }
                        ]
                    }
                ]
            });

        case "/datenschutz":

            return renderPlaceholderPage({
                title:
                    "Datenschutz",

                description:
                    "Datenschutzinformationen und Verarbeitungshinweise."
            });

        case "/impressum":

            return renderPlaceholderPage({
                title:
                    "Impressum",

                description:
                    "Anbieter-, Unternehmens- und Kontaktinformationen."
            });

        default:

            return renderDashboard(
                state
            );
    }
}

/************************************************
 * EVENT-HELFER
 ************************************************/

function bindRouteEvents(
    appElement,
    onNavigate
) {

    appElement
        .querySelectorAll(
            "[data-route]"
        )
        .forEach(
            (element) => {

                element.addEventListener(
                    "click",
                    () => {

                        const targetRoute =
                            element.dataset.route;

                        if (
                            targetRoute &&
                            typeof onNavigate ===
                                "function"
                        ) {

                            onNavigate(
                                targetRoute
                            );
                        }
                    }
                );
            }
        );
}

function bindActionEvents({
    appElement,
    action,
    handler
}) {

    if (
        typeof handler !==
        "function"
    ) {

        return;
    }

    appElement
        .querySelectorAll(
            `[data-action="${action}"]`
        )
        .forEach(
            (element) => {

                element.addEventListener(
                    "click",
                    handler
                );
            }
        );
}

function bindObjectSelection(
    appElement,
    onSelectObject
) {

    if (
        typeof onSelectObject !==
        "function"
    ) {

        return;
    }

    appElement
        .querySelectorAll(
            '[data-action="select-object"]'
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const objectId =
                            button.dataset.objectId;

                        if (objectId) {

                            onSelectObject(
                                objectId
                            );
                        }
                    }
                );
            }
        );
}

function bindLoginForm(
    onLogin
) {

    const loginForm =
        document.getElementById(
            "test-login-form"
        );

    if (
        !loginForm ||
        typeof onLogin !==
            "function"
    ) {

        return;
    }

    loginForm.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            const formData =
                new FormData(
                    loginForm
                );

            const loginData = {

                name:
                    String(
                        formData.get(
                            "name"
                        ) ?? ""
                    ).trim(),

                role:
                    String(
                        formData.get(
                            "role"
                        ) ?? ""
                    ).trim()
            };

            onLogin(
                loginData
            );
        }
    );
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
    onCheckout,
    onSelectObject
}) {

    const appElement =
        document.getElementById(
            "app"
        );

    if (!appElement) {

        throw new Error(
            "Das HTML-Element #app wurde nicht gefunden."
        );
    }

    appElement.innerHTML = `

        <div class="app-shell">

            ${renderHeader(
                state
            )}

            <main class="app-content">

                ${renderRoute(
                    route,
                    state
                )}

            </main>

            ${renderNavigation(
                state,
                route
            )}

        </div>
    `;

    bindRouteEvents(
        appElement,
        onNavigate
    );

    bindObjectSelection(
        appElement,
        onSelectObject
    );

    bindLoginForm(
        onLogin
    );

    bindActionEvents({
        appElement,
        action:
            "logout",
        handler:
            onLogout
    });

    bindActionEvents({
        appElement,
        action:
            "checkin",
        handler:
            onCheckin
    });

    bindActionEvents({
        appElement,
        action:
            "checkout",
        handler:
            onCheckout
    });
}