/************************************************
 * Facility OS
 * morePage.js
 *
 * Zentrale Mehr-Seite
 * - Profil
 * - Berichte
 * - Hilfe
 * - Einstellungen
 * - Datenschutz
 * - Impressum
 * - Rollenabhängige Verwaltungsbereiche
 * - Abmelden
 ************************************************/

import {
    APP_CONFIG,
    USER_ROLES
} from "../../config/appConfig.js";

import {
    ROUTES
} from "../../router.js";

import {
    renderStatusGrid
} from "../components/statusCard.js";

import {
    renderCompactModuleList
} from "../components/moduleCard.js";

import {
    renderPageTitle,
    renderSectionHeader,
    renderCollapsiblePanel,
    renderActionRows,
    renderInfoList,
    renderSectionPanel,
    renderTextBlock
} from "../components/sectionPanel.js";

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

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

function normalizeStatus(value) {

    return normalizeText(value)
        .toUpperCase();
}

/************************************************
 * ROLLE UND BENUTZER
 ************************************************/

function getRole(state) {

    return normalizeStatus(
        state.currentUser?.role
    );
}

function getUserName(state) {

    return (
        state.currentUser?.name ??
        state.currentUser?.fullName ??
        state.currentUser?.displayName ??
        state.currentUser?.email ??
        "Benutzer"
    );
}

function getUserInitials(state) {

    const name =
        getUserName(state)
            .trim();

    if (!name) {

        return "FO";
    }

    const parts =
        name
            .split(/\s+/)
            .filter(Boolean);

    if (
        parts.length === 1
    ) {

        return parts[0]
            .slice(0, 2)
            .toUpperCase();
    }

    return (
        `${parts[0][0]}${parts[
            parts.length - 1
        ][0]}`
    ).toUpperCase();
}

function getRoleLabel(role) {

    const labels = {

        [USER_ROLES.SUPER_ADMIN]:
            "Super-Administration",

        [USER_ROLES.ADMIN]:
            "Administration",

        [USER_ROLES.OBJEKTLEITER]:
            "Objektleitung",

        [USER_ROLES.MITARBEITER]:
            "Mitarbeiter",

        [USER_ROLES.BUCHHALTUNG]:
            "Buchhaltung",

        [USER_ROLES.KUNDE]:
            "Kundenportal"
    };

    return (
        labels[role] ??
        "Facility OS"
    );
}

/************************************************
 * ZUGRIFFSPRÜFUNGEN
 ************************************************/

function isAdministration(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN
    ].includes(
        getRole(state)
    );
}

function isManagement(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER
    ].includes(
        getRole(state)
    );
}

function canViewReports(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ].includes(
        getRole(state)
    );
}

function canViewTimes(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.MITARBEITER
    ].includes(
        getRole(state)
    );
}

/************************************************
 * APP-INFORMATIONEN
 ************************************************/

function getAppName() {

    return (
        APP_CONFIG.APP_NAME ??
        APP_CONFIG.NAME ??
        "Facility OS"
    );
}

function getAppVersion() {

    return (
        APP_CONFIG.VERSION ??
        APP_CONFIG.APP_VERSION ??
        "2.0.0"
    );
}

function getEnvironmentLabel() {

    if (
        APP_CONFIG.TEST_MODE === true
    ) {

        return "Testbetrieb";
    }

    return "Produktivbetrieb";
}

/************************************************
 * DATENSTATUS
 ************************************************/

function getDataCollectionCount(state) {

    const collections = [
        state.users,
        state.objects,
        state.rooms,
        state.tasks,
        state.materials,
        state.materialStock,
        state.shifts,
        state.tickets,
        state.notifications,
        state.messages,
        state.taskLogs
    ];

    return collections.filter(
        Array.isArray
    ).length;
}

function getObjectCount(state) {

    return asArray(state.objects)
        .filter(
            (object) =>
                object.active !== false
        )
        .length;
}

function getNotificationCount(state) {

    return asArray(state.notifications)
        .filter(
            (notification) => {

                const status =
                    normalizeStatus(
                        notification.status
                    );

                return (
                    notification.read !== true &&
                    notification.isRead !== true &&
                    ![
                        "READ",
                        "ARCHIVED",
                        "CLOSED"
                    ].includes(status)
                );
            }
        )
        .length;
}

/************************************************
 * PROFILKARTE
 ************************************************/

function renderProfileCard(state) {

    const user =
        state.currentUser;

    const contactParts = [];

    if (
        user?.email
    ) {

        contactParts.push(
            user.email
        );
    }

    if (
        user?.phone
    ) {

        contactParts.push(
            user.phone
        );
    }

    return `
        <section class="app-more-profile-card">

            <div class="app-more-profile-avatar">

                ${escapeHtml(
                    getUserInitials(state)
                )}

            </div>

            <div class="app-more-profile-content">

                <span class="app-more-profile-role">

                    ${escapeHtml(
                        getRoleLabel(
                            getRole(state)
                        )
                    )}

                </span>

                <h2>

                    ${escapeHtml(
                        getUserName(state)
                    )}

                </h2>

                ${
                    contactParts.length > 0
                        ? `
                            <p>
                                ${escapeHtml(
                                    contactParts.join(
                                        " · "
                                    )
                                )}
                            </p>
                        `
                        : ""
                }

            </div>

            <button
                type="button"
                class="app-more-profile-button"
                data-action="edit-profile"
                aria-label="Profil bearbeiten"
            >
                Bearbeiten
            </button>

        </section>
    `;
}

/************************************************
 * STATUSKARTEN
 ************************************************/

function renderAccountStatus(state) {

    return renderStatusGrid(
        [
            {
                title:
                    "Rolle",

                value:
                    getRoleLabel(
                        getRole(state)
                    ),

                description:
                    "Zugriffsprofil",

                status:
                    "personnel",

                icon:
                    "personnel"
            },
            {
                title:
                    "Objekte",

                value:
                    getObjectCount(
                        state
                    ),

                description:
                    "verfügbar",

                status:
                    "objects",

                icon:
                    "objects"
            },
            {
                title:
                    "Hinweise",

                value:
                    getNotificationCount(
                        state
                    ),

                description:
                    "ungelesen",

                status:
                    getNotificationCount(
                        state
                    ) > 0
                        ? "warning"
                        : "success",

                icon:
                    "communication"
            },
            {
                title:
                    "Datenbereiche",

                value:
                    getDataCollectionCount(
                        state
                    ),

                description:
                    "geladen",

                status:
                    "success",

                icon:
                    "overview"
            }
        ],
        {
            columns:
                2,

            compact:
                true
        }
    );
}

/************************************************
 * SCHNELLZUGRIFFE
 ************************************************/

function getQuickActions(state) {

    const actions = [];

    if (
        canViewReports(state)
    ) {

        actions.push({
            title:
                "Berichte",

            subtitle:
                "Leistung und Nachweise",

            icon:
                "reports",

            color:
                "reports",

            route:
                ROUTES.REPORTS
        });
    }

    if (
        canViewTimes(state)
    ) {

        actions.push({
            title:
                "Zeiten",

            subtitle:
                "Schichten und Buchungen",

            icon:
                "times",

            color:
                "times",

            route:
                ROUTES.TIMES
        });
    }

    actions.push(
        {
            title:
                "Hilfe",

            subtitle:
                "Anleitungen und Support",

            icon:
                "more",

            color:
                "overview",

            route:
                ROUTES.HELP
        },
        {
            title:
                "Einstellungen",

            subtitle:
                "App und Benutzerkonto",

            icon:
                "more",

            color:
                "more",

            route:
                ROUTES.SETTINGS
        }
    );

    return actions;
}

/************************************************
 * ARBEITSBEREICH
 ************************************************/

function getWorkRows(state) {

    const role =
        getRole(state);

    const rows = [];

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        rows.push(
            {
                title:
                    "Mein Objekt",

                description:
                    state.currentObject
                        ? (
                            state.currentObject.name ??
                            state.currentObject.id
                        )
                        : "Noch kein Objekt ausgewählt",

                icon:
                    "objects",

                color:
                    "objects",

                route:
                    state.currentObject
                        ? ROUTES.OBJECT_DETAIL
                        : ROUTES.OBJECTS
            },
            {
                title:
                    "Meine Aufgaben",

                description:
                    "Räume, Reihenfolge und Nachweise",

                icon:
                    "tasks",

                color:
                    "tasks",

                route:
                    ROUTES.TASKS
            },
            {
                title:
                    "Meine Arbeitszeit",

                description:
                    "Schichten und Abweichungen",

                icon:
                    "times",

                color:
                    "times",

                route:
                    ROUTES.TIMES
            },
            {
                title:
                    "Krankheit oder Urlaub",

                description:
                    "Abwesenheit melden",

                icon:
                    "personnel",

                color:
                    "personnel",

                action:
                    "create-absence"
            }
        );
    }

    if (
        role ===
        USER_ROLES.KUNDE
    ) {

        rows.push(
            {
                title:
                    "Meine Objekte",

                description:
                    "Freigegebene Standorte",

                icon:
                    "objects",

                color:
                    "objects",

                route:
                    ROUTES.OBJECTS
            },
            {
                title:
                    "Meine Anfragen",

                description:
                    "Fragen und Reklamationen",

                icon:
                    "communication",

                color:
                    "communication",

                route:
                    ROUTES.COMMUNICATION
            },
            {
                title:
                    "Meine Berichte",

                description:
                    "Freigegebene Leistungsnachweise",

                icon:
                    "reports",

                color:
                    "reports",

                route:
                    ROUTES.REPORTS
            }
        );
    }

    if (
        isManagement(state)
    ) {

        rows.push(
            {
                title:
                    "Objektverwaltung",

                description:
                    "Standorte, Räume und Leistungen",

                icon:
                    "objects",

                color:
                    "objects",

                route:
                    ROUTES.OBJECTS
            },
            {
                title:
                    "Personalverwaltung",

                description:
                    "Mitarbeiter, Einsatz und Vertretung",

                icon:
                    "personnel",

                color:
                    "personnel",

                route:
                    ROUTES.PERSONNEL
            },
            {
                title:
                    "Kommunikation",

                description:
                    "Tickets, Nachrichten und Anfragen",

                icon:
                    "communication",

                color:
                    "communication",

                route:
                    ROUTES.COMMUNICATION
            },
            {
                title:
                    "Auswertung",

                description:
                    "Leistung und Kennzahlen",

                icon:
                    "analysis",

                color:
                    "analysis",

                route:
                    ROUTES.ANALYSIS
            }
        );
    }

    if (
        role ===
        USER_ROLES.BUCHHALTUNG
    ) {

        rows.push(
            {
                title:
                    "Zeitübersicht",

                description:
                    "Arbeitszeiten und Abweichungen",

                icon:
                    "times",

                color:
                    "times",

                route:
                    ROUTES.TIMES
            },
            {
                title:
                    "Auswertung",

                description:
                    "Monatswerte und Objektzeiten",

                icon:
                    "analysis",

                color:
                    "analysis",

                route:
                    ROUTES.ANALYSIS
            },
            {
                title:
                    "Berichte",

                description:
                    "Abrechnung und Export",

                icon:
                    "reports",

                color:
                    "reports",

                route:
                    ROUTES.REPORTS
            }
        );
    }

    return rows;
}

/************************************************
 * VERWALTUNG
 ************************************************/

function getAdministrationRows(state) {

    if (
        !isAdministration(state)
    ) {

        return [];
    }

    return [
        {
            title:
                "Benutzer und Rollen",

            description:
                "Konten, Rechte und Zugriffe",

            icon:
                "personnel",

            color:
                "personnel",

            route:
                ROUTES.PERSONNEL
        },
        {
            title:
                "Objekteinstellungen",

            description:
                "Checklisten, Sicherheit und Freigaben",

            icon:
                "objects",

            color:
                "objects",

            route:
                ROUTES.OBJECTS
        },
        {
            title:
                "Systemeinstellungen",

            description:
                "App-Konfiguration und Betriebsmodus",

            icon:
                "more",

            color:
                "more",

            route:
                ROUTES.SETTINGS
        },
        {
            title:
                "Audit und Protokolle",

            description:
                "Systemaktionen und Änderungen",

            icon:
                "reports",

            color:
                "analysis",

            action:
                "open-audit-log"
        },
        {
            title:
                "Tarife und Module",

            description:
                "Free, Pro und Pro Plus",

            icon:
                "analysis",

            color:
                "reports",

            action:
                "open-subscription-modules"
        }
    ];
}

/************************************************
 * SUPPORT
 ************************************************/

function getSupportRows() {

    return [
        {
            title:
                "Hilfe und Anleitungen",

            description:
                "Antworten und Schritt-für-Schritt-Hilfe",

            icon:
                "help",

            color:
                "overview",

            route:
                ROUTES.HELP
        },
        {
            title:
                "Support kontaktieren",

            description:
                "Technisches Problem melden",

            icon:
                "communication",

            color:
                "communication",

            action:
                "contact-support"
        },
        {
            title:
                "App neu laden",

            description:
                "Ansicht und Daten aktualisieren",

            icon:
                "overview",

            color:
                "success",

            action:
                "reload-app"
        },
        {
            title:
                "Testdaten zurücksetzen",

            description:
                "Lokale Testdaten entfernen",

            icon:
                "warning",

            color:
                "warning",

            action:
                "reset-test-data",

            disabled:
                APP_CONFIG.TEST_MODE !==
                true
        }
    ];
}

/************************************************
 * RECHTLICHES
 ************************************************/

function getLegalRows() {

    return [
        {
            title:
                "Datenschutz",

            description:
                "Informationen zur Datenverarbeitung",

            icon:
                "reports",

            color:
                "more",

            route:
                ROUTES.PRIVACY
        },
        {
            title:
                "Impressum",

            description:
                "Anbieterinformationen",

            icon:
                "reports",

            color:
                "more",

            route:
                ROUTES.IMPRINT
        }
    ];
}

/************************************************
 * APP-INFORMATIONEN
 ************************************************/

function renderAppInformation() {

    return renderInfoList(
        [
            {
                label:
                    "Produkt",

                value:
                    getAppName(),

                status:
                    "overview",

                icon:
                    "overview"
            },
            {
                label:
                    "Version",

                value:
                    getAppVersion(),

                status:
                    "neutral",

                icon:
                    "reports"
            },
            {
                label:
                    "Betriebsmodus",

                value:
                    getEnvironmentLabel(),

                status:
                    APP_CONFIG.TEST_MODE ===
                    true
                        ? "warning"
                        : "success",

                icon:
                    "warning",

                emphasize:
                    APP_CONFIG.TEST_MODE ===
                    true
            },
            {
                label:
                    "Offline-Modus",

                value:
                    APP_CONFIG.OFFLINE_MODE ===
                    true
                        ? "Aktiv"
                        : "Inaktiv",

                status:
                    APP_CONFIG.OFFLINE_MODE ===
                    true
                        ? "success"
                        : "neutral",

                icon:
                    "overview"
            },
            {
                label:
                    "QR erforderlich",

                value:
                    APP_CONFIG.QR_REQUIRED ===
                    true
                        ? "Ja"
                        : "Nein",

                status:
                    APP_CONFIG.QR_REQUIRED ===
                    true
                        ? "success"
                        : "warning",

                icon:
                    "objects"
            },
            {
                label:
                    "Audit-Protokoll",

                value:
                    APP_CONFIG.AUDIT_LOGGING ===
                    true
                        ? "Aktiv"
                        : "Inaktiv",

                status:
                    APP_CONFIG.AUDIT_LOGGING ===
                    true
                        ? "success"
                        : "neutral",

                icon:
                    "reports"
            }
        ],
        {
            columns:
                1
        }
    );
}

/************************************************
 * ABMELDEBEREICH
 ************************************************/

function renderLogoutSection() {

    return `
        <section class="app-more-logout-section">

            <button
                type="button"
                class="app-more-logout-button"
                data-action="logout"
            >

                <span class="app-more-logout-icon">
                    ↪
                </span>

                <span>

                    <strong>
                        Abmelden
                    </strong>

                    <small>
                        Aktuelle Sitzung sicher beenden
                    </small>

                </span>

            </button>

        </section>
    `;
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderMorePage(state) {

    const workRows =
        getWorkRows(state);

    const administrationRows =
        getAdministrationRows(state);

    const supportRows =
        getSupportRows();

    const legalRows =
        getLegalRows();

    return `
        <section class="app-more-page">

            ${renderPageTitle({
                eyebrow:
                    "Facility OS",

                title:
                    "Mehr",

                description:
                    "Profil, Einstellungen und weitere Bereiche.",

                color:
                    "more",

                compact:
                    true
            })}

            ${renderProfileCard(
                state
            )}

            <section class="app-more-status">

                ${renderAccountStatus(
                    state
                )}

            </section>

            <section class="app-more-quick-actions">

                ${renderSectionHeader({
                    title:
                        "Schnellzugriff",

                    compact:
                        true
                })}

                ${renderCompactModuleList(
                    getQuickActions(
                        state
                    )
                )}

            </section>

            <section class="app-more-content">

                ${
                    workRows.length > 0
                        ? renderCollapsiblePanel({
                            title:
                                "Arbeitsbereich",

                            description:
                                "Wichtige Funktionen für deine Rolle",

                            icon:
                                "overview",

                            color:
                                "overview",

                            count:
                                workRows.length,

                            open:
                                true,

                            content:
                                renderActionRows(
                                    workRows
                                )
                        })
                        : ""
                }

                ${
                    administrationRows.length > 0
                        ? renderCollapsiblePanel({
                            title:
                                "Administration",

                            description:
                                "Benutzer, System und Module",

                            icon:
                                "settings",

                            color:
                                "analysis",

                            count:
                                administrationRows.length,

                            content:
                                renderActionRows(
                                    administrationRows
                                )
                        })
                        : ""
                }

                ${renderCollapsiblePanel({
                    title:
                        "Support und Wartung",

                    description:
                        "Hilfe, Aktualisierung und Testfunktionen",

                    icon:
                        "help",

                    color:
                        "overview",

                    count:
                        supportRows.length,

                    content:
                        renderActionRows(
                            supportRows
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "App-Informationen",

                    description:
                        "Version und aktuelle Konfiguration",

                    icon:
                        "settings",

                    color:
                        "more",

                    content:
                        renderAppInformation()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Rechtliches",

                    description:
                        "Datenschutz und Anbieterinformationen",

                    icon:
                        "reports",

                    color:
                        "more",

                    count:
                        legalRows.length,

                    content:
                        renderActionRows(
                            legalRows
                        )
                })}

                ${renderSectionPanel({
                    title:
                        "Benachrichtigungen",

                    description:
                        `${getNotificationCount(
                            state
                        )} ungelesene Hinweise`,

                    icon:
                        "communication",

                    color:
                        "communication",

                    route:
                        ROUTES.COMMUNICATION,

                    highlighted:
                        getNotificationCount(
                            state
                        ) > 0
                })}

                ${renderSectionPanel({
                    title:
                        "Einstellungen",

                    description:
                        "Benutzerkonto und App-Verhalten",

                    icon:
                        "settings",

                    color:
                        "more",

                    route:
                        ROUTES.SETTINGS
                })}

            </section>

            ${renderLogoutSection()}

            ${renderTextBlock({
                title:
                    getAppName(),

                text:
                    `Version ${getAppVersion()} · ${getEnvironmentLabel()}`,

                color:
                    "more",

                icon:
                    "overview"
            })}

        </section>
    `;
}