/************************************************
 * Facility OS
 * helpPage.js
 *
 * Hilfe und Unterstützung
 * - rollenabhängige Anleitungen
 * - häufige Fragen
 * - Supportzugang
 * - Notfall- und Problemmeldung
 ************************************************/

import {
    USER_ROLES
} from "../../config/appConfig.js";

import {
    ROUTES
} from "../../router.js";

import {
    renderCompactModuleList
} from "../components/moduleCard.js";

import {
    renderPageTitle,
    renderSectionHeader,
    renderCollapsiblePanel,
    renderActionRows,
    renderSectionPanel,
    renderTextBlock
} from "../components/sectionPanel.js";

/************************************************
 * BASISHELFER
 ************************************************/

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

function normalizeStatus(value) {

    return normalizeText(value)
        .toUpperCase();
}

function getRole(state) {

    return normalizeStatus(
        state.currentUser?.role
    );
}

/************************************************
 * SCHNELLHILFE
 ************************************************/

function getQuickHelp(state) {

    const role =
        getRole(state);

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        return [
            {
                title:
                    "Objekt auswählen",

                subtitle:
                    "Einsatzort und Anleitung öffnen",

                icon:
                    "objects",

                color:
                    "objects",

                route:
                    ROUTES.OBJECTS
            },
            {
                title:
                    "Einchecken",

                subtitle:
                    "Schicht am Objekt starten",

                icon:
                    "times",

                color:
                    "success",

                action:
                    "checkin"
            },
            {
                title:
                    "Aufgaben öffnen",

                subtitle:
                    "Räume und Reihenfolge anzeigen",

                icon:
                    "tasks",

                color:
                    "tasks",

                route:
                    ROUTES.TASKS
            },
            {
                title:
                    "Problem melden",

                subtitle:
                    "Schaden oder Hindernis erfassen",

                icon:
                    "communication",

                color:
                    "communication",

                action:
                    "create-problem-ticket"
            }
        ];
    }

    if (
        role ===
        USER_ROLES.KUNDE
    ) {

        return [
            {
                title:
                    "Objekte öffnen",

                subtitle:
                    "Freigegebene Standorte ansehen",

                icon:
                    "objects",

                color:
                    "objects",

                route:
                    ROUTES.OBJECTS
            },
            {
                title:
                    "Anfrage senden",

                subtitle:
                    "Frage oder Wunsch übermitteln",

                icon:
                    "communication",

                color:
                    "communication",

                action:
                    "create-customer-request"
            },
            {
                title:
                    "Berichte öffnen",

                subtitle:
                    "Freigegebene Nachweise ansehen",

                icon:
                    "reports",

                color:
                    "reports",

                route:
                    ROUTES.REPORTS
            }
        ];
    }

    return [
        {
            title:
                "Objekte verwalten",

            subtitle:
                "Räume, Aufgaben und Einstellungen",

            icon:
                "objects",

            color:
                "objects",

            route:
                ROUTES.OBJECTS
        },
        {
            title:
                "Personal verwalten",

            subtitle:
                "Einsatz, Ausfall und Vertretung",

            icon:
                "personnel",

            color:
                "personnel",

            route:
                ROUTES.PERSONNEL
        },
        {
            title:
                "Meldungen prüfen",

            subtitle:
                "Tickets und Kundenanfragen",

            icon:
                "communication",

            color:
                "communication",

            route:
                ROUTES.COMMUNICATION
        },
        {
            title:
                "Berichte erstellen",

            subtitle:
                "Leistung und Zeiten auswerten",

            icon:
                "reports",

            color:
                "reports",

            route:
                ROUTES.REPORTS
        }
    ];
}

/************************************************
 * HILFETHEMEN
 ************************************************/

function getGeneralHelpRows() {

    return [
        {
            title:
                "Anmeldung und Abmeldung",

            description:
                "Sicher anmelden, Sitzung verwenden und abmelden",

            icon:
                "personnel",

            color:
                "personnel",

            action:
                "open-help-login"
        },
        {
            title:
                "Navigation",

            description:
                "Start, Hauptmodule und Mehr-Bereich verwenden",

            icon:
                "overview",

            color:
                "overview",

            action:
                "open-help-navigation"
        },
        {
            title:
                "Benachrichtigungen",

            description:
                "Hinweise, Warnungen und ungelesene Nachrichten",

            icon:
                "communication",

            color:
                "communication",

            action:
                "open-help-notifications"
        },
        {
            title:
                "Offline-Nutzung",

            description:
                "App bei schwacher oder fehlender Verbindung verwenden",

            icon:
                "overview",

            color:
                "more",

            action:
                "open-help-offline"
        }
    ];
}

function getEmployeeHelpRows() {

    return [
        {
            title:
                "Schicht starten",

            description:
                "Objekt wählen, QR-Code verwenden und einchecken",

            icon:
                "times",

            color:
                "success",

            action:
                "open-help-checkin"
        },
        {
            title:
                "Aufgaben bearbeiten",

            description:
                "Räume, Reihenfolge und Sollzeiten verstehen",

            icon:
                "tasks",

            color:
                "tasks",

            action:
                "open-help-tasks"
        },
        {
            title:
                "Aufgabe nicht möglich",

            description:
                "Problem dokumentieren und Objektleitung informieren",

            icon:
                "warning",

            color:
                "warning",

            action:
                "open-help-task-problem"
        },
        {
            title:
                "Materialmangel",

            description:
                "Fehlendes oder leeres Material melden",

            icon:
                "materials",

            color:
                "materials",

            action:
                "open-help-material"
        },
        {
            title:
                "Schicht beenden",

            description:
                "Abschlusskontrolle und Check-out durchführen",

            icon:
                "times",

            color:
                "times",

            action:
                "open-help-checkout"
        },
        {
            title:
                "Krankheit und Urlaub",

            description:
                "Abwesenheit rechtzeitig melden",

            icon:
                "personnel",

            color:
                "personnel",

            action:
                "open-help-absence"
        }
    ];
}

function getManagementHelpRows() {

    return [
        {
            title:
                "Objekt einrichten",

            description:
                "Räume, Aufgaben, Material und Sicherheit anlegen",

            icon:
                "objects",

            color:
                "objects",

            action:
                "open-help-object-setup"
        },
        {
            title:
                "Mitarbeiter zuweisen",

            description:
                "Personal mit Objekten und Schichten verbinden",

            icon:
                "personnel",

            color:
                "personnel",

            action:
                "open-help-assignment"
        },
        {
            title:
                "Vertretung organisieren",

            description:
                "Ausfall prüfen und Ersatzbesetzung festlegen",

            icon:
                "personnel",

            color:
                "warning",

            action:
                "open-help-replacement"
        },
        {
            title:
                "Meldungen bearbeiten",

            description:
                "Tickets priorisieren, beantworten und abschließen",

            icon:
                "communication",

            color:
                "communication",

            action:
                "open-help-tickets"
        },
        {
            title:
                "Zeitabweichungen prüfen",

            description:
                "Begründungen und Nachweise freigeben",

            icon:
                "times",

            color:
                "times",

            action:
                "open-help-time-deviations"
        },
        {
            title:
                "Kundenberichte freigeben",

            description:
                "Sichtbare Daten und Berichte auswählen",

            icon:
                "reports",

            color:
                "reports",

            action:
                "open-help-customer-release"
        }
    ];
}

function getCustomerHelpRows() {

    return [
        {
            title:
                "Objektstatus ansehen",

            description:
                "Freigegebene Informationen zum Standort öffnen",

            icon:
                "objects",

            color:
                "objects",

            action:
                "open-help-customer-object"
        },
        {
            title:
                "Anfrage oder Reklamation",

            description:
                "Neue Meldung an die Objektleitung senden",

            icon:
                "communication",

            color:
                "communication",

            action:
                "open-help-customer-request"
        },
        {
            title:
                "Berichte ansehen",

            description:
                "Freigegebene Leistungsnachweise öffnen",

            icon:
                "reports",

            color:
                "reports",

            action:
                "open-help-customer-reports"
        }
    ];
}

/************************************************
 * HÄUFIGE FRAGEN
 ************************************************/

function renderFaqItem({
    question,
    answer
}) {

    return `
        <details class="app-help-faq-item">

            <summary>
                ${question}
            </summary>

            <div class="app-help-faq-answer">

                <p>
                    ${answer}
                </p>

            </div>

        </details>
    `;
}

function renderFrequentlyAskedQuestions() {

    const questions = [
        {
            question:
                "Warum muss ein Objekt ausgewählt werden?",

            answer:
                "Aufgaben, Räume, Materialbestände, Sicherheitshinweise und Schichten sind jeweils einem bestimmten Objekt zugeordnet."
        },
        {
            question:
                "Wann ist eine Dokumentation erforderlich?",

            answer:
                "Ein zusätzlicher Nachweis wird hauptsächlich bei Zeitabweichungen, nicht möglichen Aufgaben oder ausdrücklich aktivierten Objektregeln verlangt."
        },
        {
            question:
                "Was passiert bei fehlendem Material?",

            answer:
                "Der Materialmangel wird als Meldung erfasst. Die Objektleitung kann den Bestand prüfen und eine Nachbestellung veranlassen."
        },
        {
            question:
                "Warum sehe ich manche Bereiche nicht?",

            answer:
                "Facility OS zeigt nur Module und Informationen an, die für die jeweilige Benutzerrolle freigegeben sind."
        },
        {
            question:
                "Wie beende ich eine Schicht richtig?",

            answer:
                "Vor dem Check-out werden die für das Objekt aktivierten Abschlussfragen geprüft, beispielsweise Müll, sichtbare Probleme und Objektsicherung."
        },
        {
            question:
                "Kann Facility OS ohne Internet funktionieren?",

            answer:
                "Der Offline-Modus ist vorbereitet. Daten können lokal weitergeführt und später mit einer zentralen Datenquelle synchronisiert werden."
        }
    ];

    return `
        <div class="app-help-faq-list">

            ${questions
                .map(
                    renderFaqItem
                )
                .join("")}

        </div>
    `;
}

/************************************************
 * SUPPORT
 ************************************************/

function getSupportRows() {

    return [
        {
            title:
                "Technisches Problem melden",

            description:
                "Fehler oder Darstellungsproblem übermitteln",

            icon:
                "warning",

            color:
                "warning",

            action:
                "contact-support"
        },
        {
            title:
                "App neu laden",

            description:
                "Aktuelle Ansicht und Daten erneut laden",

            icon:
                "overview",

            color:
                "success",

            action:
                "reload-app"
        },
        {
            title:
                "Einstellungen öffnen",

            description:
                "Benutzerkonto und App-Verhalten prüfen",

            icon:
                "settings",

            color:
                "more",

            route:
                ROUTES.SETTINGS
        },
        {
            title:
                "Datenschutz öffnen",

            description:
                "Informationen zur Datenverarbeitung",

            icon:
                "reports",

            color:
                "more",

            route:
                ROUTES.PRIVACY
        }
    ];
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderHelpPage(state) {

    const role =
        getRole(state);

    const showEmployeeHelp =
        role ===
        USER_ROLES.MITARBEITER;

    const showManagementHelp =
        [
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN,
            USER_ROLES.OBJEKTLEITER,
            USER_ROLES.BUCHHALTUNG
        ].includes(role);

    const showCustomerHelp =
        role ===
        USER_ROLES.KUNDE;

    return `
        <section class="app-help-page">

            ${renderPageTitle({
                eyebrow:
                    "Support",

                title:
                    "Hilfe",

                description:
                    "Anleitungen und Antworten zu Facility OS.",

                color:
                    "overview",

                backRoute:
                    ROUTES.MORE,

                compact:
                    true
            })}

            <section class="app-help-quick-actions">

                ${renderSectionHeader({
                    title:
                        "Schnellhilfe",

                    description:
                        "Direkt zum benötigten Bereich",

                    compact:
                        true
                })}

                ${renderCompactModuleList(
                    getQuickHelp(
                        state
                    )
                )}

            </section>

            <section class="app-help-content">

                ${renderCollapsiblePanel({
                    title:
                        "Allgemeine Bedienung",

                    description:
                        "Anmeldung, Navigation und Benachrichtigungen",

                    icon:
                        "overview",

                    color:
                        "overview",

                    count:
                        getGeneralHelpRows().length,

                    open:
                        true,

                    content:
                        renderActionRows(
                            getGeneralHelpRows()
                        )
                })}

                ${
                    showEmployeeHelp
                        ? renderCollapsiblePanel({
                            title:
                                "Arbeiten im Objekt",

                            description:
                                "Schicht, Aufgaben und Meldungen",

                            icon:
                                "tasks",

                            color:
                                "tasks",

                            count:
                                getEmployeeHelpRows().length,

                            content:
                                renderActionRows(
                                    getEmployeeHelpRows()
                                )
                        })
                        : ""
                }

                ${
                    showManagementHelp
                        ? renderCollapsiblePanel({
                            title:
                                "Verwaltung und Steuerung",

                            description:
                                "Objekte, Personal und Auswertung",

                            icon:
                                "analysis",

                            color:
                                "analysis",

                            count:
                                getManagementHelpRows().length,

                            content:
                                renderActionRows(
                                    getManagementHelpRows()
                                )
                        })
                        : ""
                }

                ${
                    showCustomerHelp
                        ? renderCollapsiblePanel({
                            title:
                                "Kundenportal",

                            description:
                                "Objekte, Anfragen und Berichte",

                            icon:
                                "reports",

                            color:
                                "reports",

                            count:
                                getCustomerHelpRows().length,

                            content:
                                renderActionRows(
                                    getCustomerHelpRows()
                                )
                        })
                        : ""
                }

                ${renderCollapsiblePanel({
                    title:
                        "Häufige Fragen",

                    description:
                        "Antworten zu den wichtigsten Abläufen",

                    icon:
                        "help",

                    color:
                        "more",

                    open:
                        true,

                    content:
                        renderFrequentlyAskedQuestions()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Support und Technik",

                    description:
                        "Fehler melden und Einstellungen prüfen",

                    icon:
                        "communication",

                    color:
                        "communication",

                    count:
                        getSupportRows().length,

                    content:
                        renderActionRows(
                            getSupportRows()
                        )
                })}

                ${renderSectionPanel({
                    title:
                        "Meldungszentrale",

                    description:
                        "Probleme, Fragen oder Hinweise erfassen",

                    icon:
                        "communication",

                    color:
                        "communication",

                    route:
                        ROUTES.COMMUNICATION,

                    highlighted:
                        true
                })}

            </section>

            ${renderTextBlock({
                title:
                    "Facility OS Support",

                text:
                    "Die Hilfe wird später um mehrsprachige Anleitungen, Audioausgabe und objektbezogene Schritt-für-Schritt-Guides ergänzt.",

                color:
                    "overview",

                icon:
                    "help"
            })}

        </section>
    `;
}