/************************************************
 * Facility OS
 * settingsPage.js
 *
 * Einstellungen für Benutzer und App
 * - Benutzerkonto
 * - Benachrichtigungen
 * - Darstellung
 * - Sprache
 * - Objekt- und Systemeinstellungen
 * - rollenabhängige Bereiche
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
    renderPageTitle,
    renderCollapsiblePanel,
    renderActionRows,
    renderInfoList,
    renderSectionPanel,
    renderTextBlock
} from "../components/sectionPanel.js";

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
 * BENUTZER UND ROLLE
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

    return labels[role] ??
        "Facility OS";
}

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

/************************************************
 * APP-INFORMATIONEN
 ************************************************/

function getAppVersion() {

    return (
        APP_CONFIG.VERSION ??
        APP_CONFIG.APP_VERSION ??
        "2.0.0"
    );
}

function getSessionTimeoutLabel() {

    const minutes =
        Number(
            APP_CONFIG.SESSION_TIMEOUT
        );

    if (
        !Number.isFinite(minutes) ||
        minutes <= 0
    ) {

        return "Standard";
    }

    if (
        minutes < 60
    ) {

        return `${minutes} Minuten`;
    }

    const hours =
        Math.floor(
            minutes / 60
        );

    const remainingMinutes =
        minutes % 60;

    if (
        remainingMinutes === 0
    ) {

        return `${hours} Stunden`;
    }

    return `${hours} Std. ${remainingMinutes} Min.`;
}

/************************************************
 * STATUSKARTEN
 ************************************************/

function renderSettingsStatus(state) {

    return renderStatusGrid(
        [
            {
                title:
                    "Benutzer",

                value:
                    getUserName(state),

                description:
                    getRoleLabel(
                        getRole(state)
                    ),

                status:
                    "personnel",

                icon:
                    "personnel"
            },
            {
                title:
                    "Version",

                value:
                    getAppVersion(),

                description:
                    "Facility OS",

                status:
                    "overview",

                icon:
                    "overview"
            },
            {
                title:
                    "Testmodus",

                value:
                    APP_CONFIG.TEST_MODE === true
                        ? "Aktiv"
                        : "Inaktiv",

                description:
                    "Betriebsumgebung",

                status:
                    APP_CONFIG.TEST_MODE === true
                        ? "warning"
                        : "success",

                icon:
                    "warning"
            },
            {
                title:
                    "Offline",

                value:
                    APP_CONFIG.OFFLINE_MODE === true
                        ? "Aktiv"
                        : "Inaktiv",

                description:
                    "lokale Nutzung",

                status:
                    APP_CONFIG.OFFLINE_MODE === true
                        ? "success"
                        : "neutral",

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
 * BENUTZEREINSTELLUNGEN
 ************************************************/

function getAccountRows(state) {

    const user =
        state.currentUser;

    return [
        {
            title:
                "Persönliche Daten",

            description:
                "Name, E-Mail und Telefonnummer",

            icon:
                "personnel",

            color:
                "personnel",

            value:
                getUserName(state),

            action:
                "edit-profile"
        },
        {
            title:
                "Passwort ändern",

            description:
                "Zugangsdaten aktualisieren",

            icon:
                "settings",

            color:
                "more",

            action:
                "change-password"
        },
        {
            title:
                "Sprache",

            description:
                "App-Sprache und Audioausgabe",

            icon:
                "communication",

            color:
                "communication",

            value:
                user?.language ??
                user?.preferredLanguage ??
                "Deutsch",

            action:
                "change-language"
        },
        {
            title:
                "Darstellung",

            description:
                "Farben, Kontrast und Schriftgröße",

            icon:
                "overview",

            color:
                "overview",

            value:
                "Standard",

            action:
                "change-appearance"
        }
    ];
}

/************************************************
 * BENACHRICHTIGUNGEN
 ************************************************/

function getNotificationRows(state) {

    const user =
        state.currentUser;

    return [
        {
            title:
                "Push-Benachrichtigungen",

            description:
                "Wichtige Ereignisse direkt anzeigen",

            icon:
                "communication",

            color:
                "communication",

            status:
                user?.pushNotifications === false
                    ? "Inaktiv"
                    : "Aktiv",

            action:
                "toggle-push-notifications"
        },
        {
            title:
                "Meldungen und Tickets",

            description:
                "Hinweise zu neuen oder kritischen Vorgängen",

            icon:
                "warning",

            color:
                "warning",

            status:
                "Aktiv",

            action:
                "configure-ticket-notifications"
        },
        {
            title:
                "Schichten und Zeiten",

            description:
                "Erinnerungen an Check-in und Check-out",

            icon:
                "times",

            color:
                "times",

            status:
                "Aktiv",

            action:
                "configure-shift-notifications"
        },
        {
            title:
                "Materialwarnungen",

            description:
                "Mindestbestand und Nachbestellungen",

            icon:
                "materials",

            color:
                "materials",

            status:
                isManagement(state)
                    ? "Aktiv"
                    : "Nach Rolle",

            action:
                "configure-material-notifications"
        }
    ];
}

/************************************************
 * OBJEKTEINSTELLUNGEN
 ************************************************/

function getObjectSettingRows(state) {

    if (
        !isManagement(state)
    ) {

        return [];
    }

    return [
        {
            title:
                "Check-in und Check-out",

            description:
                "QR, GPS und Abschlusskontrolle",

            icon:
                "times",

            color:
                "times",

            status:
                APP_CONFIG.QR_REQUIRED === true
                    ? "QR aktiv"
                    : "QR optional",

            route:
                ROUTES.OBJECTS
        },
        {
            title:
                "Aufgaben und Räume",

            description:
                "Arbeitsplan, Reihenfolge und Sollzeiten",

            icon:
                "tasks",

            color:
                "tasks",

            route:
                ROUTES.OBJECTS
        },
        {
            title:
                "Materialverwaltung",

            description:
                "Bestände, Mindestmengen und Lagerorte",

            icon:
                "materials",

            color:
                "materials",

            route:
                ROUTES.OBJECTS
        },
        {
            title:
                "Sicherheit und Müll",

            description:
                "Pflichtkontrollen je Objekt",

            icon:
                "warning",

            color:
                "warning",

            route:
                ROUTES.OBJECTS
        },
        {
            title:
                "Kundenfreigaben",

            description:
                "Sichtbare Daten und Berichte festlegen",

            icon:
                "reports",

            color:
                "reports",

            route:
                ROUTES.OBJECTS
        }
    ];
}

/************************************************
 * SYSTEMEINSTELLUNGEN
 ************************************************/

function getSystemRows(state) {

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
                "Berechtigungen und Kontozugriffe",

            icon:
                "personnel",

            color:
                "personnel",

            route:
                ROUTES.PERSONNEL
        },
        {
            title:
                "Session-Einstellungen",

            description:
                "Anmeldedauer und automatische Abmeldung",

            icon:
                "times",

            color:
                "times",

            value:
                getSessionTimeoutLabel(),

            action:
                "configure-session"
        },
        {
            title:
                "Testmodus",

            description:
                "Lokale Testdaten und Entwicklungsfunktionen",

            icon:
                "warning",

            color:
                APP_CONFIG.TEST_MODE === true
                    ? "warning"
                    : "success",

            status:
                APP_CONFIG.TEST_MODE === true
                    ? "Aktiv"
                    : "Inaktiv",

            action:
                "configure-test-mode"
        },
        {
            title:
                "Offline-Modus",

            description:
                "App bei unterbrochener Verbindung verwenden",

            icon:
                "overview",

            color:
                "overview",

            status:
                APP_CONFIG.OFFLINE_MODE === true
                    ? "Aktiv"
                    : "Inaktiv",

            action:
                "configure-offline-mode"
        },
        {
            title:
                "Audit-Protokoll",

            description:
                "Änderungen und Systemaktionen erfassen",

            icon:
                "reports",

            color:
                "analysis",

            status:
                APP_CONFIG.AUDIT_LOGGING === true
                    ? "Aktiv"
                    : "Inaktiv",

            action:
                "open-audit-log"
        },
        {
            title:
                "Datenverbindung",

            description:
                "Lokale Daten und spätere API-Anbindung",

            icon:
                "analysis",

            color:
                "analysis",

            action:
                "configure-data-source"
        }
    ];
}

/************************************************
 * DATENSTATUS
 ************************************************/

function renderDataStatus(state) {

    const collections = [
        {
            label:
                "Benutzer",

            value:
                asArray(
                    state.users
                ).length,

            status:
                "personnel",

            icon:
                "personnel"
        },
        {
            label:
                "Objekte",

            value:
                asArray(
                    state.objects
                ).length,

            status:
                "objects",

            icon:
                "objects"
        },
        {
            label:
                "Aufgaben",

            value:
                asArray(
                    state.tasks
                ).length,

            status:
                "tasks",

            icon:
                "tasks"
        },
        {
            label:
                "Meldungen",

            value:
                asArray(
                    state.tickets
                ).length,

            status:
                "communication",

            icon:
                "communication"
        },
        {
            label:
                "Materialbestände",

            value:
                asArray(
                    state.materialStock
                ).length,

            status:
                "materials",

            icon:
                "materials"
        },
        {
            label:
                "Schichten",

            value:
                asArray(
                    state.shifts
                ).length,

            status:
                "times",

            icon:
                "times"
        }
    ];

    return renderInfoList(
        collections,
        {
            columns:
                2
        }
    );
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderSettingsPage(state) {

    const objectRows =
        getObjectSettingRows(state);

    const systemRows =
        getSystemRows(state);

    return `
        <section class="app-settings-page">

            ${renderPageTitle({
                eyebrow:
                    "Mehr",

                title:
                    "Einstellungen",

                description:
                    "Benutzerkonto, App-Verhalten und Systemkonfiguration.",

                color:
                    "more",

                backRoute:
                    ROUTES.MORE,

                compact:
                    true
            })}

            <section class="app-settings-status">

                ${renderSettingsStatus(
                    state
                )}

            </section>

            <section class="app-settings-content">

                ${renderCollapsiblePanel({
                    title:
                        "Benutzerkonto",

                    description:
                        "Persönliche Daten und Darstellung",

                    icon:
                        "personnel",

                    color:
                        "personnel",

                    count:
                        getAccountRows(
                            state
                        ).length,

                    open:
                        true,

                    content:
                        renderActionRows(
                            getAccountRows(
                                state
                            )
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Benachrichtigungen",

                    description:
                        "Festlegen, welche Hinweise angezeigt werden",

                    icon:
                        "communication",

                    color:
                        "communication",

                    count:
                        getNotificationRows(
                            state
                        ).length,

                    content:
                        renderActionRows(
                            getNotificationRows(
                                state
                            )
                        )
                })}

                ${
                    objectRows.length > 0
                        ? renderCollapsiblePanel({
                            title:
                                "Objekteinstellungen",

                            description:
                                "Abläufe und Pflichtkontrollen",

                            icon:
                                "objects",

                            color:
                                "objects",

                            count:
                                objectRows.length,

                            content:
                                renderActionRows(
                                    objectRows
                                )
                        })
                        : ""
                }

                ${
                    systemRows.length > 0
                        ? renderCollapsiblePanel({
                            title:
                                "System",

                            description:
                                "Technische Einstellungen und Datenquellen",

                            icon:
                                "settings",

                            color:
                                "analysis",

                            count:
                                systemRows.length,

                            content:
                                renderActionRows(
                                    systemRows
                                )
                        })
                        : ""
                }

                ${
                    isAdministration(state)
                        ? renderCollapsiblePanel({
                            title:
                                "Datenstatus",

                            description:
                                "Aktuell geladene Datensätze",

                            icon:
                                "analysis",

                            color:
                                "analysis",

                            content:
                                renderDataStatus(
                                    state
                                )
                        })
                        : ""
                }

                ${renderSectionPanel({
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
                })}

                ${renderSectionPanel({
                    title:
                        "Hilfe",

                    description:
                        "Erklärungen zu Einstellungen und Funktionen",

                    icon:
                        "help",

                    color:
                        "overview",

                    route:
                        ROUTES.HELP
                })}

            </section>

            ${renderTextBlock({
                title:
                    "Konfiguration",

                text:
                    "Objektbezogene Pflichtprüfungen, Kundenfreigaben und technische Einstellungen werden entsprechend der Benutzerrolle angezeigt.",

                color:
                    "more",

                icon:
                    "settings"
            })}

        </section>
    `;
}