/************************************************
 * Facility OS
 * imprintPage.js
 *
 * Impressumsvorlage
 * - Anbieterinformationen
 * - Kontakt
 * - Verantwortlichkeit
 * - technische Produktinformationen
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
 * BASISHELFER
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

function getOperatingMode() {

    return APP_CONFIG.TEST_MODE === true
        ? "Testbetrieb"
        : "Produktivbetrieb";
}

/************************************************
 * ANBIETERDATEN
 ************************************************/

function getProviderInformation() {

    const provider =
        APP_CONFIG.PROVIDER ??
        APP_CONFIG.COMPANY ??
        {};

    return {
        company:
            provider.name ??
            APP_CONFIG.COMPANY_NAME ??
            "[Unternehmensname ergänzen]",

        owner:
            provider.owner ??
            provider.representative ??
            APP_CONFIG.REPRESENTATIVE ??
            "[Vertretungsberechtigte Person ergänzen]",

        street:
            provider.street ??
            APP_CONFIG.COMPANY_STREET ??
            "[Straße und Hausnummer ergänzen]",

        city:
            provider.city ??
            APP_CONFIG.COMPANY_CITY ??
            "[PLZ und Ort ergänzen]",

        country:
            provider.country ??
            APP_CONFIG.COMPANY_COUNTRY ??
            "Deutschland",

        email:
            provider.email ??
            APP_CONFIG.CONTACT_EMAIL ??
            "[E-Mail-Adresse ergänzen]",

        phone:
            provider.phone ??
            APP_CONFIG.CONTACT_PHONE ??
            "[Telefonnummer ergänzen]",

        registration:
            provider.registration ??
            APP_CONFIG.REGISTRATION_INFO ??
            "[Registerangaben ergänzen, falls erforderlich]",

        vatId:
            provider.vatId ??
            APP_CONFIG.VAT_ID ??
            "[Umsatzsteuer-ID ergänzen, falls vorhanden]",

        responsible:
            provider.contentResponsible ??
            APP_CONFIG.CONTENT_RESPONSIBLE ??
            "[Inhaltlich verantwortliche Person ergänzen]"
    };
}

/************************************************
 * INHALTE
 ************************************************/

function renderProviderContent() {

    const provider =
        getProviderInformation();

    return `
        <div class="app-legal-content app-imprint-provider">

            <address>

                <strong>
                    ${escapeHtml(
                        provider.company
                    )}
                </strong>

                <span>
                    Vertreten durch:
                    ${escapeHtml(
                        provider.owner
                    )}
                </span>

                <span>
                    ${escapeHtml(
                        provider.street
                    )}
                </span>

                <span>
                    ${escapeHtml(
                        provider.city
                    )}
                </span>

                <span>
                    ${escapeHtml(
                        provider.country
                    )}
                </span>

            </address>

        </div>
    `;
}

function renderContactContent() {

    const provider =
        getProviderInformation();

    return `
        <div class="app-legal-content">

            <p>
                <strong>E-Mail:</strong>
                ${escapeHtml(
                    provider.email
                )}
            </p>

            <p>
                <strong>Telefon:</strong>
                ${escapeHtml(
                    provider.phone
                )}
            </p>

        </div>
    `;
}

function renderRegistrationContent() {

    const provider =
        getProviderInformation();

    return `
        <div class="app-legal-content">

            <p>
                <strong>Registerangaben:</strong>
                ${escapeHtml(
                    provider.registration
                )}
            </p>

            <p>
                <strong>Umsatzsteuer-Identifikationsnummer:</strong>
                ${escapeHtml(
                    provider.vatId
                )}
            </p>

        </div>
    `;
}

function renderResponsibleContent() {

    const provider =
        getProviderInformation();

    return `
        <div class="app-legal-content">

            <p>
                Inhaltlich verantwortlich:
            </p>

            <p>
                <strong>
                    ${escapeHtml(
                        provider.responsible
                    )}
                </strong>
            </p>

        </div>
    `;
}

function renderLiabilityContent() {

    return `
        <div class="app-legal-content">

            <p>
                Die Inhalte dieser Anwendung werden mit angemessener
                Sorgfalt erstellt und gepflegt. Eine Gewähr für
                Vollständigkeit, Richtigkeit und jederzeitige
                Verfügbarkeit kann nur im gesetzlich vorgesehenen Umfang
                übernommen werden.
            </p>

            <p>
                Die in Facility OS angezeigten Kennzahlen und Bewertungen
                unterstützen die operative Organisation. Sie ersetzen
                keine rechtliche, steuerliche, arbeitsmedizinische oder
                fachtechnische Prüfung.
            </p>

        </div>
    `;
}

function renderCopyrightContent() {

    return `
        <div class="app-legal-content">

            <p>
                Inhalte, Gestaltung, Softwarebestandteile und
                Produktbezeichnungen dieser Anwendung können
                urheberrechtlich oder durch andere Schutzrechte geschützt
                sein.
            </p>

            <p>
                Eine Vervielfältigung, Bearbeitung oder Verbreitung ist nur
                im Rahmen der jeweils erteilten Nutzungsrechte zulässig.
            </p>

        </div>
    `;
}

function renderDisputeResolutionContent() {

    return `
        <div class="app-legal-content">

            <p>
                Angaben zur Teilnahme an einem
                Streitbeilegungsverfahren vor einer
                Verbraucherschlichtungsstelle müssen entsprechend der
                tatsächlichen Unternehmenssituation ergänzt werden.
            </p>

        </div>
    `;
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderImprintPage() {

    const provider =
        getProviderInformation();

    return `
        <section class="app-imprint-page app-legal-page">

            ${renderPageTitle({
                eyebrow:
                    getAppName(),

                title:
                    "Impressum",

                description:
                    "Anbieter- und Kontaktinformationen.",

                color:
                    "more",

                backRoute:
                    ROUTES.MORE,

                compact:
                    true
            })}

            ${renderTextBlock({
                title:
                    "Vorlage vor Veröffentlichung ergänzen",

                text:
                    "Die gekennzeichneten Platzhalter müssen vor einem öffentlichen oder kommerziellen Einsatz durch die vollständigen Daten des tatsächlichen Anbieters ersetzt und rechtlich geprüft werden.",

                color:
                    "warning",

                icon:
                    "warning"
            })}

            <section class="app-imprint-summary">

                ${renderInfoList(
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
                                "more",

                            icon:
                                "reports"
                        },
                        {
                            label:
                                "Betriebsmodus",

                            value:
                                getOperatingMode(),

                            status:
                                APP_CONFIG.TEST_MODE === true
                                    ? "warning"
                                    : "success",

                            icon:
                                "warning"
                        },
                        {
                            label:
                                "Anbieter",

                            value:
                                provider.company,

                            status:
                                "personnel",

                            icon:
                                "personnel"
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
                        "Anbieter",

                    description:
                        "Unternehmen und Geschäftsanschrift",

                    icon:
                        "personnel",

                    color:
                        "personnel",

                    open:
                        true,

                    content:
                        renderProviderContent()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Kontakt",

                    description:
                        "E-Mail und Telefonnummer",

                    icon:
                        "communication",

                    color:
                        "communication",

                    content:
                        renderContactContent()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Register und Steuerangaben",

                    description:
                        "Unternehmens- und Umsatzsteuerinformationen",

                    icon:
                        "reports",

                    color:
                        "reports",

                    content:
                        renderRegistrationContent()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Inhaltlich verantwortlich",

                    description:
                        "Verantwortung für veröffentlichte Inhalte",

                    icon:
                        "personnel",

                    color:
                        "more",

                    content:
                        renderResponsibleContent()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Haftungshinweise",

                    description:
                        "Inhalte und operative Auswertungen",

                    icon:
                        "warning",

                    color:
                        "warning",

                    content:
                        renderLiabilityContent()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Urheberrecht und Nutzungsrechte",

                    description:
                        "Software, Inhalte und Produktgestaltung",

                    icon:
                        "reports",

                    color:
                        "analysis",

                    content:
                        renderCopyrightContent()
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Streitbeilegung",

                    description:
                        "Hinweise für Verbraucher und Unternehmen",

                    icon:
                        "reports",

                    color:
                        "more",

                    content:
                        renderDisputeResolutionContent()
                })}

                ${renderSectionPanel({
                    title:
                        "Datenschutz",

                    description:
                        "Informationen zur Verarbeitung personenbezogener Daten",

                    icon:
                        "reports",

                    color:
                        "more",

                    route:
                        ROUTES.PRIVACY
                })}

                ${renderSectionPanel({
                    title:
                        "Hilfe und Support",

                    description:
                        "Anleitungen und technische Unterstützung",

                    icon:
                        "help",

                    color:
                        "overview",

                    route:
                        ROUTES.HELP
                })}

            </section>

        </section>
    `;
}