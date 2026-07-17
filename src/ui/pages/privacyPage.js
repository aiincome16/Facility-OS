/************************************************
 * Facility OS
 * privacyPage.js
 *
 * Datenschutzinformation
 * - übersichtliche App-Darstellung
 * - Platzhalter für spätere rechtliche Prüfung
 * - keine rechtsverbindliche Endfassung
 ************************************************/

import {
    APP_CONFIG
} from "../../config/appConfig.js";

import {
    ROUTES
} from "../../router.js";

import {
    renderPageTitle,
    renderCollapsiblePanel,
    renderInfoList,
    renderSectionPanel,
    renderTextBlock
} from "../components/sectionPanel.js";

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

/************************************************
 * INHALTSBLÖCKE
 ************************************************/

function renderResponsibleBody() {

    return `
        <div class="app-legal-content">

            <p>
                Verantwortlich für die Verarbeitung personenbezogener
                Daten ist der jeweilige Betreiber der Facility-OS-Instanz.
            </p>

            <p>
                Die vollständigen Kontaktdaten des Betreibers müssen vor
                dem produktiven Einsatz im Impressum und in dieser
                Datenschutzerklärung ergänzt werden.
            </p>

        </div>
    `;
}

function renderProcessedData() {

    return `
        <div class="app-legal-content">

            <p>
                Abhängig von Benutzerrolle und freigeschalteten Modulen
                können insbesondere folgende Daten verarbeitet werden:
            </p>

            <ul>
                <li>
                    Benutzer- und Kontaktdaten
                </li>

                <li>
                    Rollen, Berechtigungen und Objektzuweisungen
                </li>

                <li>
                    Arbeitszeiten, Schichten, Check-ins und Check-outs
                </li>

                <li>
                    Aufgaben, Räume und Leistungsnachweise
                </li>

                <li>
                    Meldungen, Nachrichten und Kundenanfragen
                </li>

                <li>
                    Materialbestände und Nachbestellungen
                </li>

                <li>
                    Fotos, Audioaufnahmen oder Texte bei erforderlichen
                    Nachweisen
                </li>

                <li>
                    Sicherheits-, Schlüssel- und Abschlusskontrollen
                </li>
            </ul>

        </div>
    `;
}

function renderProcessingPurpose() {

    return `
        <div class="app-legal-content">

            <p>
                Die Datenverarbeitung dient insbesondere:
            </p>

            <ul>
                <li>
                    der Organisation und Dokumentation von
                    Reinigungsleistungen,
                </li>

                <li>
                    der Planung und Erfassung von Arbeitseinsätzen,
                </li>

                <li>
                    der Bearbeitung von Problemen, Reklamationen und
                    Kundenanfragen,
                </li>

                <li>
                    der Qualitätssicherung,
                </li>

                <li>
                    der Material- und Objektverwaltung,
                </li>

                <li>
                    der Erstellung von Leistungs- und Zeitberichten,
                </li>

                <li>
                    der Erfüllung vertraglicher und gesetzlicher Pflichten.
                </li>
            </ul>

        </div>
    `;
}

function renderAccessAndRoles() {

    return `
        <div class="app-legal-content">

            <p>
                Facility OS verwendet ein rollenbasiertes
                Berechtigungssystem. Benutzer sehen nur die Daten und
                Funktionen, die für ihre Rolle und die zugewiesenen
                Objekte freigegeben wurden.
            </p>

            <p>
                Mögliche Rollen sind insbesondere Administration,
                Objektleitung, Mitarbeiter, Buchhaltung und Kunde.
            </p>

        </div>
    `;
}

function renderLocationAndQr() {

    return `
        <div class="app-legal-content">

            <p>
                Je nach Konfiguration können QR-Codes und Standortdaten
                zur Bestätigung eines Check-ins oder Check-outs verwendet
                werden.
            </p>

            <p>
                Standortdaten sollen nur verarbeitet werden, soweit dies
                für den vorgesehenen Arbeitsablauf erforderlich und
                rechtlich zulässig ist. Eine dauerhafte
                Bewegungsüberwachung ist nicht vorgesehen.
            </p>

        </div>
    `;
}

function renderProofData() {

    return `
        <div class="app-legal-content">

            <p>
                Fotos, Audioaufnahmen und Textnachweise sollen nur dann
                angefordert werden, wenn eine Aufgabe nicht durchgeführt
                werden kann, eine erhebliche Zeitabweichung vorliegt oder
                für den jeweiligen Einsatz eine besondere
                Dokumentationspflicht aktiviert wurde.
            </p>

            <p>
                Aufnahmen dürfen keine unbeteiligten Personen oder
                vertraulichen Informationen enthalten, soweit dies nicht
                zwingend erforderlich und rechtlich erlaubt ist.
            </p>

        </div>
    `;
}

function renderStorageAndDeletion() {

    return `
        <div class="app-legal-content">

            <p>
                Personenbezogene Daten werden nur so lange gespeichert,
                wie sie für den jeweiligen Zweck, zur Vertragserfüllung
                oder aufgrund gesetzlicher Aufbewahrungspflichten benötigt
                werden.
            </p>

            <p>
                Konkrete Lösch- und Aufbewahrungsfristen müssen vom
                Betreiber vor dem produktiven Einsatz festgelegt und
                dokumentiert werden.
            </p>

        </div>
    `;
}

function renderDataRecipients() {

    return `
        <div class="app-legal-content">

            <p>
                Daten können innerhalb des berechtigten Unternehmens an
                zuständige Mitarbeiter, Objektleitungen, Administration
                oder Buchhaltung weitergegeben werden.
            </p>

            <p>
                Kunden erhalten ausschließlich Informationen, die für ihr
                Konto und das jeweilige Objekt ausdrücklich freigegeben
                wurden.
            </p>

            <p>
                Bei späterer Nutzung externer Hosting-, Speicher-,
                Benachrichtigungs- oder Analysedienste müssen diese
                Dienstleister und die entsprechenden Rechtsgrundlagen
                ergänzt werden.
            </p>

        </div>
    `;
}

function renderUserRights() {

    return `
        <div class="app-legal-content">

            <p>
                Betroffene Personen können im Rahmen der gesetzlichen
                Voraussetzungen insbesondere folgende Rechte haben:
            </p>

            <ul>
                <li>
                    Auskunft über gespeicherte Daten
                </li>

                <li>
                    Berichtigung unrichtiger Daten
                </li>

                <li>
                    Löschung oder Einschränkung der Verarbeitung
                </li>

                <li>
                    Datenübertragbarkeit
                </li>

                <li>
                    Widerspruch gegen bestimmte Verarbeitungen
                </li>

                <li>
                    Widerruf einer erteilten Einwilligung
                </li>

                <li>
                    Beschwerde bei einer Datenschutzaufsichtsbehörde
                </li>
            </ul>

        </div>
    `;
}

function renderSecurity() {

    return `
        <div class="app-legal-content">

            <p>
                Facility OS soll durch rollenbasierte Zugriffe,
                Sitzungsverwaltung, Eingabevalidierung, Protokollierung und
                geeignete technische Schutzmaßnahmen abgesichert werden.
            </p>

            <p>
                Der Betreiber ist für eine sichere Hosting-,
                Zugriffs- und Datensicherungskonfiguration verantwortlich.
            </p>

        </div>
    `;
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderPrivacyPage() {

    return `
        <section class="app-privacy-page app-legal-page">

            ${renderPageTitle({
                eyebrow:
                    getAppName(),

                title:
                    "Datenschutz",

                description:
                    "Informationen zur Verarbeitung personenbezogener Daten.",

                color:
                    "more",

                backRoute:
                    ROUTES.MORE,

                compact:
                    true
            })}

            ${renderTextBlock({
                title:
                    "Entwurfsstatus",

                text:
                    "Diese Seite ist eine technische und inhaltliche Vorlage. Vor einem produktiven Einsatz muss sie an den tatsächlichen Betreiber, die eingesetzten Dienste und die geltenden rechtlichen Anforderungen angepasst und fachlich geprüft werden.",

                color:
                    "warning",

                icon:
                    "warning"
            })}

            <section class="app-legal-summary">

                ${renderInfoList(
                    [
                        {
                            label:
                                "Anwendung",

                            value:
                                getAppName(),

                            status:
                                "overview",

                            icon:
                                "overview"
                        },
                        {
                            label:
                                "Zugriff",

                            value:
                                "Rollenbasiert",

                            status:
                                "personnel",

                            icon:
                                "personnel"
                        },
                        {
                            label:
                                "Nachweise",

                            value:
                                "Nur bei Bedarf",

                            status:
                                "tasks",

                            icon:
                                "tasks"
                        },
                        {
                            label:
                                "Kundendaten",

                            value:
                                "Nur nach Freigabe",

                            status:
                                "reports",

                            icon:
                                "reports"
                        }
                    ],
                    {
                        columns:
                            2
                    }
                )}

            </section>

            <section class="app-legal-sections">

                ${renderCollapsiblePanel({
                    title:
                        "Verantwortliche Stelle",

                    description:
                        "Betreiber und Kontakt",

                    icon:
                        "personnel",

                    color:
                        "personnel",

                    open:
                        true,

                    content:
                        renderResponsibleBody()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Verarbeitete Daten",

                    description:
                        "Datenkategorien innerhalb der Anwendung",

                    icon:
                        "analysis",

                    color:
                        "analysis",

                    content:
                        renderProcessedData()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Zwecke der Verarbeitung",

                    description:
                        "Organisation, Dokumentation und Qualitätssicherung",

                    icon:
                        "overview",

                    color:
                        "overview",

                    content:
                        renderProcessingPurpose()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Rollen und Zugriffsrechte",

                    description:
                        "Sichtbarkeit entsprechend der Benutzerrolle",

                    icon:
                        "personnel",

                    color:
                        "personnel",

                    content:
                        renderAccessAndRoles()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "QR-Code und Standortdaten",

                    description:
                        "Check-in und Check-out am Objekt",

                    icon:
                        "objects",

                    color:
                        "objects",

                    content:
                        renderLocationAndQr()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Fotos, Audio und Textnachweise",

                    description:
                        "Dokumentation bei besonderem Bedarf",

                    icon:
                        "tasks",

                    color:
                        "tasks",

                    content:
                        renderProofData()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Empfänger und Kundenfreigaben",

                    description:
                        "Interne Zugriffe und externe Sichtbarkeit",

                    icon:
                        "communication",

                    color:
                        "communication",

                    content:
                        renderDataRecipients()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Speicherung und Löschung",

                    description:
                        "Aufbewahrung und Entfernung von Daten",

                    icon:
                        "reports",

                    color:
                        "reports",

                    content:
                        renderStorageAndDeletion()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Rechte betroffener Personen",

                    description:
                        "Auskunft, Berichtigung und weitere Rechte",

                    icon:
                        "personnel",

                    color:
                        "more",

                    content:
                        renderUserRights()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Datensicherheit",

                    description:
                        "Technische und organisatorische Maßnahmen",

                    icon:
                        "settings",

                    color:
                        "analysis",

                    content:
                        renderSecurity()
                })}

                ${renderSectionPanel({
                    title:
                        "Impressum",

                    description:
                        "Angaben zum Anbieter der Anwendung",

                    icon:
                        "reports",

                    color:
                        "more",

                    route:
                        ROUTES.IMPRINT
                })}

                ${renderSectionPanel({
                    title:
                        "Einstellungen",

                    description:
                        "Benachrichtigungen und App-Konfiguration",

                    icon:
                        "settings",

                    color:
                        "more",

                    route:
                        ROUTES.SETTINGS
                })}

            </section>

        </section>
    `;
}