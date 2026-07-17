/************************************************
 * Facility OS
 * renderApp.js
 *
 * Zentrale Benutzeroberfläche
 * - bindet alle neuen App-Seiten ein
 * - mobile App-Struktur
 * - gemeinsamer Header
 * - rollenabhängige Navigation
 * - Login
 * - zentrale Ereignissteuerung
 * - Check-in und Check-out
 * - Objektauswahl
 * - vorbereitete Dialogaktionen
 ************************************************/

import {
    APP_CONFIG,
    USER_ROLES
} from "../config/appConfig.js";

import {
    ROUTES,
    getRouteTitle
} from "../router.js";

import {
    renderAppHeader
} from "./components/appHeader.js";

import {
    renderBottomNavigation
} from "./components/bottomNavigation.js";

import {
    renderOverviewPage
} from "./pages/overviewPage.js";

import {
    renderObjectsPage
} from "./pages/objectsPage.js";

import {
    renderObjectDetailPage
} from "./pages/objectDetailPage.js";

import {
    renderPersonnelPage
} from "./pages/personnelPage.js";

import {
    renderCommunicationPage
} from "./pages/communicationPage.js";

import {
    renderMaterialsPage
} from "./pages/materialsPage.js";

import {
    renderTasksPage
} from "./pages/tasksPage.js";

import {
    renderTimesPage
} from "./pages/timesPage.js";

import {
    renderAnalysisPage
} from "./pages/analysisPage.js";

import {
    renderReportsPage
} from "./pages/reportsPage.js";

import {
    renderMorePage
} from "./pages/morePage.js";

import {
    renderSettingsPage
} from "./pages/settingsPage.js";

import {
    renderHelpPage
} from "./pages/helpPage.js";

import {
    renderPrivacyPage
} from "./pages/privacyPage.js";

import {
    renderImprintPage
} from "./pages/imprintPage.js";

/************************************************
 * LOKALER UI-ZUSTAND
 ************************************************/

const uiState = {

    dialog:
        null,

    toast:
        null,

    toastTimer:
        null
};

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

function getAppName() {

    return (
        APP_CONFIG.APP_NAME ??
        APP_CONFIG.NAME ??
        "Facility OS"
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

    return (
        labels[
            normalizeStatus(role)
        ] ??
        "Benutzer"
    );
}

/************************************************
 * LOGIN-DATEN
 ************************************************/

function getLoginUsers(state) {

    return asArray(
        state.users
    ).filter(
        (user) =>
            user.active !== false
    );
}

function getLoginIdentifier(user) {

    return (
        user.username ??
        user.email ??
        user.employeeNumber ??
        user.id ??
        ""
    );
}

function getLoginDisplayName(user) {

    return (
        user.name ??
        user.fullName ??
        user.displayName ??
        user.email ??
        user.id ??
        "Benutzer"
    );
}

/************************************************
 * LOGIN-SEITE
 ************************************************/

function renderLoginUserOptions(state) {

    const users =
        getLoginUsers(state);

    if (
        users.length === 0
    ) {

        return `
            <option value="">
                Keine Benutzer verfügbar
            </option>
        `;
    }

    return users
        .map(
            (user) => {

                const identifier =
                    getLoginIdentifier(
                        user
                    );

                return `
                    <option
                        value="${escapeHtml(
                            identifier
                        )}"
                    >
                        ${escapeHtml(
                            getLoginDisplayName(
                                user
                            )
                        )}
                        ·
                        ${escapeHtml(
                            getRoleLabel(
                                user.role
                            )
                        )}
                    </option>
                `;
            }
        )
        .join("");
}

function renderLoginPage(state) {

    const testMode =
        APP_CONFIG.TEST_MODE ===
        true;

    return `
        <main class="facility-login-page">

            <section class="facility-login-shell">

                <div class="facility-login-brand">

                    <div class="facility-login-logo">
                        FO
                    </div>

                    <div>

                        <span class="facility-login-eyebrow">
                            Digitale Objektsteuerung
                        </span>

                        <h1>
                            ${escapeHtml(
                                getAppName()
                            )}
                        </h1>

                        <p>
                            Objekte, Personal, Aufgaben und Meldungen
                            in einer mobilen Anwendung.
                        </p>

                    </div>

                </div>

                <form
                    class="facility-login-card"
                    data-login-form
                    novalidate
                >

                    <header>

                        <span class="facility-login-card-label">
                            Willkommen
                        </span>

                        <h2>
                            Anmelden
                        </h2>

                        <p>
                            Melde dich mit deinem Facility-OS-Zugang an.
                        </p>

                    </header>

                    ${
                        testMode
                            ? `
                                <div class="facility-login-test-notice">

                                    <strong>
                                        Präsentationsmodus
                                    </strong>

                                    <span>
                                        Wähle einen Testbenutzer aus.
                                    </span>

                                </div>

                                <label class="facility-form-field">

                                    <span>
                                        Benutzer
                                    </span>

                                    <select
                                        name="identifier"
                                        required
                                        autocomplete="username"
                                    >
                                        ${renderLoginUserOptions(
                                            state
                                        )}
                                    </select>

                                </label>
                            `
                            : `
                                <label class="facility-form-field">

                                    <span>
                                        E-Mail oder Benutzername
                                    </span>

                                    <input
                                        type="text"
                                        name="identifier"
                                        placeholder="Benutzername"
                                        autocomplete="username"
                                        required
                                    >

                                </label>
                            `
                    }

                    <label class="facility-form-field">

                        <span>
                            Passwort
                        </span>

                        <div class="facility-password-field">

                            <input
                                type="password"
                                name="password"
                                placeholder="${
                                    testMode
                                        ? "Im Testmodus optional"
                                        : "Passwort"
                                }"
                                autocomplete="current-password"
                                ${
                                    testMode
                                        ? ""
                                        : "required"
                                }
                            >

                            <button
                                type="button"
                                class="facility-password-toggle"
                                data-action="toggle-password"
                                aria-label="Passwort anzeigen"
                            >
                                Anzeigen
                            </button>

                        </div>

                    </label>

                    <p
                        class="facility-login-error"
                        data-login-error
                        hidden
                    ></p>

                    <button
                        type="submit"
                        class="facility-login-submit"
                    >
                        <span>
                            Anmelden
                        </span>

                        <span aria-hidden="true">
                            →
                        </span>
                    </button>

                    <footer class="facility-login-footer">

                        <span>
                            Sichere rollenbasierte Anmeldung
                        </span>

                        <span>
                            Version
                            ${escapeHtml(
                                APP_CONFIG.VERSION ??
                                APP_CONFIG.APP_VERSION ??
                                "2.0.0"
                            )}
                        </span>

                    </footer>

                </form>

                <div class="facility-login-legal">

                    <button
                        type="button"
                        data-route="${ROUTES.PRIVACY}"
                    >
                        Datenschutz
                    </button>

                    <span>
                        ·
                    </span>

                    <button
                        type="button"
                        data-route="${ROUTES.IMPRINT}"
                    >
                        Impressum
                    </button>

                </div>

            </section>

        </main>
    `;
}

/************************************************
 * SEITEN RENDERN
 ************************************************/

function renderRouteContent(
    route,
    state,
    {
        onSelectObject
    }
) {

    switch (route) {

        case ROUTES.OVERVIEW:

            return renderOverviewPage(
                state
            );

        case ROUTES.OBJECTS:

            return renderObjectsPage(
                state,
                {
                    onSelectObject
                }
            );

        case ROUTES.OBJECT_DETAIL:

            return renderObjectDetailPage(
                state
            );

        case ROUTES.MATERIALS:

            return renderMaterialsPage(
                state
            );

        case ROUTES.TASKS:

            return renderTasksPage(
                state
            );

        case ROUTES.PERSONNEL:

            return renderPersonnelPage(
                state
            );

        case ROUTES.COMMUNICATION:

            return renderCommunicationPage(
                state
            );

        case ROUTES.TIMES:

            return renderTimesPage(
                state
            );

        case ROUTES.ANALYSIS:

            return renderAnalysisPage(
                state
            );

        case ROUTES.REPORTS:

            return renderReportsPage(
                state
            );

        case ROUTES.MORE:

            return renderMorePage(
                state
            );

        case ROUTES.SETTINGS:

            return renderSettingsPage(
                state
            );

        case ROUTES.HELP:

            return renderHelpPage(
                state
            );

        case ROUTES.PRIVACY:

            return renderPrivacyPage(
                state
            );

        case ROUTES.IMPRINT:

            return renderImprintPage(
                state
            );

        default:

            return renderOverviewPage(
                state
            );
    }
}

/************************************************
 * APP-ANSICHT
 ************************************************/

function renderAuthenticatedApp({
    route,
    state,
    onSelectObject
}) {

    const content =
        renderRouteContent(
            route,
            state,
            {
                onSelectObject
            }
        );

    return `
        <div class="facility-app">

            <div class="facility-app-background"></div>

            <div class="facility-app-shell">

                ${renderAppHeader(
                    state
                )}

                <main
                    class="facility-app-content"
                    aria-label="${escapeHtml(
                        getRouteTitle(
                            route
                        )
                    )}"
                >

                    ${content}

                </main>

                ${renderBottomNavigation({
                    state,
                    route
                })}

            </div>

            <div
                class="facility-live-region"
                aria-live="polite"
                aria-atomic="true"
            ></div>

        </div>
    `;
}

/************************************************
 * DIALOGDATEN
 ************************************************/

const ACTION_DIALOGS =
    Object.freeze({

        "create-ticket":
            {
                title:
                    "Neue Meldung",

                text:
                    "Erfasse ein Problem, einen Schaden oder einen wichtigen Hinweis.",

                fields:
                    [
                        {
                            name:
                                "title",

                            label:
                                "Betreff",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "description",

                            label:
                                "Beschreibung",

                            type:
                                "textarea",

                            required:
                                true
                        }
                    ],

                submitLabel:
                    "Meldung speichern"
            },

        "create-problem-ticket":
            {
                title:
                    "Problem melden",

                text:
                    "Dokumentiere ein Hindernis, einen Schaden oder eine nicht mögliche Aufgabe.",

                fields:
                    [
                        {
                            name:
                                "title",

                            label:
                                "Problem",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "description",

                            label:
                                "Beschreibung",

                            type:
                                "textarea",

                            required:
                                true
                        }
                    ],

                submitLabel:
                    "Problem melden"
            },

        "create-material-ticket":
            {
                title:
                    "Materialmangel",

                text:
                    "Melde fehlendes oder leeres Material am aktuellen Objekt.",

                fields:
                    [
                        {
                            name:
                                "material",

                            label:
                                "Material",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "description",

                            label:
                                "Hinweis",

                            type:
                                "textarea",

                            required:
                                false
                        }
                    ],

                submitLabel:
                    "Materialmangel melden"
            },

        "create-message":
            {
                title:
                    "Nachricht senden",

                text:
                    "Erstelle eine interne Nachricht oder eine Mitteilung an die zuständige Stelle.",

                fields:
                    [
                        {
                            name:
                                "subject",

                            label:
                                "Betreff",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "message",

                            label:
                                "Nachricht",

                            type:
                                "textarea",

                            required:
                                true
                        }
                    ],

                submitLabel:
                    "Nachricht senden"
            },

        "create-quick-note":
            {
                title:
                    "Sofort-Notiz",

                text:
                    "Speichere einen kurzen internen Hinweis.",

                fields:
                    [
                        {
                            name:
                                "message",

                            label:
                                "Notiz",

                            type:
                                "textarea",

                            required:
                                true
                        }
                    ],

                submitLabel:
                    "Notiz speichern"
            },

        "create-customer-request":
            {
                title:
                    "Neue Kundenanfrage",

                text:
                    "Erfasse eine Frage, einen Wunsch oder eine Serviceanfrage.",

                fields:
                    [
                        {
                            name:
                                "subject",

                            label:
                                "Betreff",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "message",

                            label:
                                "Anfrage",

                            type:
                                "textarea",

                            required:
                                true
                        }
                    ],

                submitLabel:
                    "Anfrage senden"
            },

        "create-customer-complaint":
            {
                title:
                    "Reklamation",

                text:
                    "Beschreibe das festgestellte Problem möglichst genau.",

                fields:
                    [
                        {
                            name:
                                "subject",

                            label:
                                "Betreff",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "message",

                            label:
                                "Beschreibung",

                            type:
                                "textarea",

                            required:
                                true
                        }
                    ],

                submitLabel:
                    "Reklamation senden"
            },

        "create-absence":
            {
                title:
                    "Abwesenheit melden",

                text:
                    "Erfasse Krankheit, Urlaub oder eine sonstige Abwesenheit.",

                fields:
                    [
                        {
                            name:
                                "type",

                            label:
                                "Art",

                            type:
                                "select",

                            options:
                                [
                                    "Krankheit",
                                    "Urlaub",
                                    "Sonstige Abwesenheit"
                                ],

                            required:
                                true
                        },
                        {
                            name:
                                "startDate",

                            label:
                                "Beginn",

                            type:
                                "date",

                            required:
                                true
                        },
                        {
                            name:
                                "endDate",

                            label:
                                "Ende",

                            type:
                                "date",

                            required:
                                false
                        },
                        {
                            name:
                                "note",

                            label:
                                "Hinweis",

                            type:
                                "textarea",

                            required:
                                false
                        }
                    ],

                submitLabel:
                    "Abwesenheit melden"
            },

        "create-employee":
            {
                title:
                    "Mitarbeiter anlegen",

                text:
                    "Erfasse die grundlegenden Benutzerdaten.",

                fields:
                    [
                        {
                            name:
                                "name",

                            label:
                                "Name",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "email",

                            label:
                                "E-Mail",

                            type:
                                "email",

                            required:
                                false
                        },
                        {
                            name:
                                "phone",

                            label:
                                "Telefon",

                            type:
                                "tel",

                            required:
                                false
                        }
                    ],

                submitLabel:
                    "Mitarbeiter speichern"
            },

        "create-shift":
            {
                title:
                    "Schicht anlegen",

                text:
                    "Plane einen neuen Arbeitseinsatz.",

                fields:
                    [
                        {
                            name:
                                "date",

                            label:
                                "Datum",

                            type:
                                "date",

                            required:
                                true
                        },
                        {
                            name:
                                "start",

                            label:
                                "Beginn",

                            type:
                                "time",

                            required:
                                true
                        },
                        {
                            name:
                                "end",

                            label:
                                "Ende",

                            type:
                                "time",

                            required:
                                true
                        }
                    ],

                submitLabel:
                    "Schicht speichern"
            },

        "create-material-order":
            {
                title:
                    "Material bestellen",

                text:
                    "Bereite eine Materialnachbestellung vor.",

                fields:
                    [
                        {
                            name:
                                "material",

                            label:
                                "Material",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "quantity",

                            label:
                                "Menge",

                            type:
                                "number",

                            required:
                                true
                        },
                        {
                            name:
                                "note",

                            label:
                                "Hinweis",

                            type:
                                "textarea",

                            required:
                                false
                        }
                    ],

                submitLabel:
                    "Bestellung vormerken"
            },

        "create-material":
            {
                title:
                    "Material anlegen",

                text:
                    "Erfasse einen neuen Artikel im Materialstamm.",

                fields:
                    [
                        {
                            name:
                                "name",

                            label:
                                "Bezeichnung",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "unit",

                            label:
                                "Einheit",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "dosage",

                            label:
                                "Dosierung",

                            type:
                                "text",

                            required:
                                false
                        }
                    ],

                submitLabel:
                    "Material speichern"
            },

        "create-task":
            {
                title:
                    "Aufgabe anlegen",

                text:
                    "Erstelle eine neue Aufgabe für das gewählte Objekt.",

                fields:
                    [
                        {
                            name:
                                "title",

                            label:
                                "Aufgabe",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "minutes",

                            label:
                                "Sollzeit in Minuten",

                            type:
                                "number",

                            required:
                                false
                        },
                        {
                            name:
                                "description",

                            label:
                                "Beschreibung",

                            type:
                                "textarea",

                            required:
                                false
                        }
                    ],

                submitLabel:
                    "Aufgabe speichern"
            },

        "edit-profile":
            {
                title:
                    "Profil bearbeiten",

                text:
                    "Aktualisiere deine persönlichen Kontaktdaten.",

                fields:
                    [
                        {
                            name:
                                "name",

                            label:
                                "Name",

                            type:
                                "text",

                            required:
                                true
                        },
                        {
                            name:
                                "email",

                            label:
                                "E-Mail",

                            type:
                                "email",

                            required:
                                false
                        },
                        {
                            name:
                                "phone",

                            label:
                                "Telefon",

                            type:
                                "tel",

                            required:
                                false
                        }
                    ],

                submitLabel:
                    "Änderungen speichern"
            },

        "change-password":
            {
                title:
                    "Passwort ändern",

                text:
                    "Lege ein neues Passwort für dein Benutzerkonto fest.",

                fields:
                    [
                        {
                            name:
                                "currentPassword",

                            label:
                                "Aktuelles Passwort",

                            type:
                                "password",

                            required:
                                true
                        },
                        {
                            name:
                                "newPassword",

                            label:
                                "Neues Passwort",

                            type:
                                "password",

                            required:
                                true
                        }
                    ],

                submitLabel:
                    "Passwort ändern"
            }
    });

/************************************************
 * DIALOGFELDER
 ************************************************/

function renderDialogField(field) {

    const requiredAttribute =
        field.required
            ? "required"
            : "";

    if (
        field.type ===
        "textarea"
    ) {

        return `
            <label class="facility-dialog-field">

                <span>
                    ${escapeHtml(
                        field.label
                    )}
                </span>

                <textarea
                    name="${escapeHtml(
                        field.name
                    )}"
                    rows="4"
                    ${requiredAttribute}
                ></textarea>

            </label>
        `;
    }

    if (
        field.type ===
        "select"
    ) {

        return `
            <label class="facility-dialog-field">

                <span>
                    ${escapeHtml(
                        field.label
                    )}
                </span>

                <select
                    name="${escapeHtml(
                        field.name
                    )}"
                    ${requiredAttribute}
                >

                    ${asArray(
                        field.options
                    )
                        .map(
                            (option) => `
                                <option
                                    value="${escapeHtml(
                                        option
                                    )}"
                                >
                                    ${escapeHtml(
                                        option
                                    )}
                                </option>
                            `
                        )
                        .join("")}

                </select>

            </label>
        `;
    }

    return `
        <label class="facility-dialog-field">

            <span>
                ${escapeHtml(
                    field.label
                )}
            </span>

            <input
                type="${escapeHtml(
                    field.type ??
                    "text"
                )}"
                name="${escapeHtml(
                    field.name
                )}"
                ${requiredAttribute}
            >

        </label>
    `;
}

/************************************************
 * DIALOG
 ************************************************/

function renderDialog() {

    const dialog =
        uiState.dialog;

    if (!dialog) {

        return "";
    }

    return `
        <div
            class="facility-dialog-backdrop"
            data-dialog-backdrop
        >

            <section
                class="facility-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="facility-dialog-title"
            >

                <header class="facility-dialog-header">

                    <div>

                        <span>
                            Facility OS
                        </span>

                        <h2 id="facility-dialog-title">
                            ${escapeHtml(
                                dialog.title
                            )}
                        </h2>

                    </div>

                    <button
                        type="button"
                        class="facility-dialog-close"
                        data-action="close-dialog"
                        aria-label="Dialog schließen"
                    >
                        ×
                    </button>

                </header>

                ${
                    dialog.text
                        ? `
                            <p class="facility-dialog-description">
                                ${escapeHtml(
                                    dialog.text
                                )}
                            </p>
                        `
                        : ""
                }

                ${
                    asArray(
                        dialog.fields
                    ).length > 0
                        ? `
                            <form
                                class="facility-dialog-form"
                                data-dialog-form
                            >

                                <div class="facility-dialog-fields">

                                    ${dialog.fields
                                        .map(
                                            renderDialogField
                                        )
                                        .join("")}

                                </div>

                                <div class="facility-dialog-actions">

                                    <button
                                        type="button"
                                        class="facility-dialog-secondary"
                                        data-action="close-dialog"
                                    >
                                        Abbrechen
                                    </button>

                                    <button
                                        type="submit"
                                        class="facility-dialog-primary"
                                    >
                                        ${escapeHtml(
                                            dialog.submitLabel ??
                                            "Speichern"
                                        )}
                                    </button>

                                </div>

                            </form>
                        `
                        : `
                            <div class="facility-dialog-actions">

                                <button
                                    type="button"
                                    class="facility-dialog-primary"
                                    data-action="close-dialog"
                                >
                                    Schließen
                                </button>

                            </div>
                        `
                }

            </section>

        </div>
    `;
}

/************************************************
 * TOAST
 ************************************************/

function renderToast() {

    if (!uiState.toast) {

        return "";
    }

    return `
        <div
            class="
                facility-toast
                facility-toast-${escapeHtml(
                    uiState.toast.type ??
                    "info"
                )}
            "
            role="status"
        >

            <strong>
                ${escapeHtml(
                    uiState.toast.title ??
                    "Facility OS"
                )}
            </strong>

            <span>
                ${escapeHtml(
                    uiState.toast.message
                )}
            </span>

        </div>
    `;
}

/************************************************
 * OVERLAYS AKTUALISIEREN
 ************************************************/

function updateOverlays(root) {

    root
        .querySelectorAll(
            ".facility-dialog-backdrop, .facility-toast"
        )
        .forEach(
            (element) =>
                element.remove()
        );

    root.insertAdjacentHTML(
        "beforeend",
        renderDialog()
    );

    root.insertAdjacentHTML(
        "beforeend",
        renderToast()
    );
}

/************************************************
 * TOAST ANZEIGEN
 ************************************************/

function showToast(
    root,
    {
        title = "Facility OS",
        message,
        type = "info"
    }
) {

    if (
        uiState.toastTimer
    ) {

        clearTimeout(
            uiState.toastTimer
        );
    }

    uiState.toast = {

        title,
        message,
        type
    };

    updateOverlays(
        root
    );

    uiState.toastTimer =
        window.setTimeout(
            () => {

                uiState.toast =
                    null;

                updateOverlays(
                    root
                );
            },
            3200
        );
}

/************************************************
 * DIALOG ÖFFNEN
 ************************************************/

function openDialog(
    root,
    action
) {

    const definition =
        ACTION_DIALOGS[
            action
        ];

    if (definition) {

        uiState.dialog = {

            action,
            ...definition
        };
    }
    else {

        uiState.dialog = {

            action,

            title:
                "Funktion vorbereitet",

            text:
                "Dieser Bereich ist bereits in der Benutzeroberfläche vorgesehen. Die dauerhafte Speicherung wird mit der zentralen Datenanbindung aktiviert.",

            fields:
                []
        };
    }

    updateOverlays(
        root
    );

    window.setTimeout(
        () => {

            const firstField =
                root.querySelector(
                    ".facility-dialog input, .facility-dialog textarea, .facility-dialog select"
                );

            firstField?.focus();
        },
        0
    );
}

function closeDialog(root) {

    uiState.dialog =
        null;

    updateOverlays(
        root
    );
}

/************************************************
 * LOGIN-EREIGNIS
 ************************************************/

async function handleLoginSubmit(
    event,
    {
        root,
        onLogin
    }
) {

    event.preventDefault();

    const form =
        event.currentTarget;

    const formData =
        new FormData(
            form
        );

    const identifier =
        normalizeText(
            formData.get(
                "identifier"
            )
        );

    const password =
        String(
            formData.get(
                "password"
            ) ??
            ""
        );

    const errorElement =
        form.querySelector(
            "[data-login-error]"
        );

    if (!identifier) {

        if (errorElement) {

            errorElement.textContent =
                "Bitte wähle einen Benutzer oder gib einen Benutzernamen ein.";

            errorElement.hidden =
                false;
        }

        return;
    }

    const submitButton =
        form.querySelector(
            "button[type='submit']"
        );

    submitButton?.setAttribute(
        "disabled",
        "disabled"
    );

    try {

        const result =
            await onLogin?.({
                identifier,
                password
            });

        if (
            result === false
        ) {

            throw new Error(
                "Anmeldung nicht möglich."
            );
        }
    }
    catch (error) {

        if (errorElement) {

            errorElement.textContent =
                error?.message ??
                "Die Anmeldung ist fehlgeschlagen.";

            errorElement.hidden =
                false;
        }

        submitButton?.removeAttribute(
            "disabled"
        );

        showToast(
            root,
            {
                title:
                    "Anmeldung fehlgeschlagen",

                message:
                    error?.message ??
                    "Bitte überprüfe deine Zugangsdaten.",

                type:
                    "error"
            }
        );
    }
}

/************************************************
 * OBJEKTAUSWAHL
 ************************************************/

function getObjectIdFromElement(element) {

    return (
        element.dataset.objectId ??
        element.dataset.selectObject ??
        element.dataset.id ??
        ""
    );
}

async function handleObjectSelection(
    element,
    {
        state,
        onSelectObject,
        onNavigate,
        root
    }
) {

    const objectId =
        getObjectIdFromElement(
            element
        );

    if (!objectId) {

        return;
    }

    const object =
        asArray(state.objects)
            .find(
                (entry) =>
                    entry.id ===
                    objectId
            ) ??
        null;

    try {

        await onSelectObject?.(
            objectId,
            object
        );

        const shouldOpenDetail =
            element.dataset.openObject ===
                "true" ||
            element.dataset.route ===
                ROUTES.OBJECT_DETAIL ||
            element.hasAttribute(
                "data-object-detail"
            );

        if (shouldOpenDetail) {

            onNavigate?.(
                ROUTES.OBJECT_DETAIL
            );
        }
    }
    catch (error) {

        showToast(
            root,
            {
                title:
                    "Objekt konnte nicht geöffnet werden",

                message:
                    error?.message ??
                    "Die Objektauswahl ist fehlgeschlagen.",

                type:
                    "error"
            }
        );
    }
}

/************************************************
 * CHECK-IN UND CHECK-OUT
 ************************************************/

async function handleShiftAction(
    action,
    {
        state,
        onCheckin,
        onCheckout,
        root
    }
) {

    if (
        action ===
        "checkin"
    ) {

        if (
            !state.currentObject
        ) {

            showToast(
                root,
                {
                    title:
                        "Objekt erforderlich",

                    message:
                        "Wähle zuerst ein Objekt aus.",

                    type:
                        "warning"
                }
            );

            return;
        }

        try {

            await onCheckin?.();

            showToast(
                root,
                {
                    title:
                        "Schicht gestartet",

                    message:
                        `Check-in für ${
                            state.currentObject.name ??
                            state.currentObject.id ??
                            "das Objekt"
                        } wurde ausgeführt.`,

                    type:
                        "success"
                }
            );
        }
        catch (error) {

            showToast(
                root,
                {
                    title:
                        "Check-in fehlgeschlagen",

                    message:
                        error?.message ??
                        "Die Schicht konnte nicht gestartet werden.",

                    type:
                        "error"
                }
            );
        }

        return;
    }

    if (
        action ===
        "checkout"
    ) {

        try {

            await onCheckout?.();

            showToast(
                root,
                {
                    title:
                        "Schicht beendet",

                    message:
                        "Der Check-out wurde ausgeführt.",

                    type:
                        "success"
                }
            );
        }
        catch (error) {

            showToast(
                root,
                {
                    title:
                        "Check-out fehlgeschlagen",

                    message:
                        error?.message ??
                        "Die Schicht konnte nicht beendet werden.",

                    type:
                        "error"
                }
            );
        }
    }
}

/************************************************
 * SONSTIGE AKTIONEN
 ************************************************/

async function handleUtilityAction(
    action,
    {
        root,
        onLogout
    }
) {

    switch (action) {

        case "logout":

            await onLogout?.();

            return true;

        case "reload-app":

            window.location.reload();

            return true;

        case "close-dialog":

            closeDialog(
                root
            );

            return true;

        case "toggle-password": {

            const input =
                root.querySelector(
                    ".facility-password-field input"
                );

            const button =
                root.querySelector(
                    "[data-action='toggle-password']"
                );

            if (!input) {

                return true;
            }

            const showPassword =
                input.type ===
                "password";

            input.type =
                showPassword
                    ? "text"
                    : "password";

            if (button) {

                button.textContent =
                    showPassword
                        ? "Ausblenden"
                        : "Anzeigen";
            }

            return true;
        }

        case "reset-test-data":

            if (
                APP_CONFIG.TEST_MODE !==
                true
            ) {

                return true;
            }

            if (
                window.confirm(
                    "Lokale Testdaten wirklich zurücksetzen?"
                )
            ) {

                localStorage.clear();

                window.location.reload();
            }

            return true;

        default:

            return false;
    }
}

/************************************************
 * ZENTRALES KLICKEREIGNIS
 ************************************************/

async function handleRootClick(
    event,
    context
) {

    const {
        root,
        route,
        state,
        onNavigate,
        onLogout,
        onCheckin,
        onCheckout,
        onSelectObject
    } = context;

    const routeElement =
        event.target.closest(
            "[data-route]"
        );

    const actionElement =
        event.target.closest(
            "[data-action]"
        );

    const objectElement =
        event.target.closest(
            "[data-object-id], [data-select-object], [data-object-detail]"
        );

    if (
        event.target ===
        root.querySelector(
            "[data-dialog-backdrop]"
        )
    ) {

        closeDialog(
            root
        );

        return;
    }

    if (
        objectElement
    ) {

        await handleObjectSelection(
            objectElement,
            {
                state,
                onSelectObject,
                onNavigate,
                root
            }
        );

        const objectRoute =
            objectElement.dataset.route;

        if (
            objectRoute
        ) {

            onNavigate?.(
                objectRoute
            );
        }

        return;
    }

    if (
        actionElement
    ) {

        const action =
            normalizeText(
                actionElement.dataset.action
            );

        if (!action) {

            return;
        }

        const handledUtility =
            await handleUtilityAction(
                action,
                {
                    root,
                    onLogout
                }
            );

        if (handledUtility) {

            return;
        }

        if (
            [
                "checkin",
                "checkout"
            ].includes(action)
        ) {

            await handleShiftAction(
                action,
                {
                    state,
                    onCheckin,
                    onCheckout,
                    root
                }
            );

            return;
        }

        openDialog(
            root,
            action
        );

        return;
    }

    if (
        routeElement
    ) {

        const targetRoute =
            normalizeText(
                routeElement.dataset.route
            );

        if (!targetRoute) {

            return;
        }

        if (
            !state.currentUser &&
            [
                ROUTES.PRIVACY,
                ROUTES.IMPRINT
            ].includes(targetRoute)
        ) {

            root.innerHTML = `
                <div class="facility-public-legal-view">

                    <button
                        type="button"
                        class="facility-public-back-button"
                        data-action="return-login"
                    >
                        ‹ Zur Anmeldung
                    </button>

                    ${
                        targetRoute ===
                        ROUTES.PRIVACY
                            ? renderPrivacyPage(
                                state
                            )
                            : renderImprintPage(
                                state
                            )
                    }

                </div>
            `;

            bindEvents(
                root,
                {
                    ...context,
                    route
                }
            );

            return;
        }

        onNavigate?.(
            targetRoute
        );
    }
}

/************************************************
 * DIALOG SPEICHERN
 ************************************************/

function handleDialogSubmit(
    event,
    {
        root
    }
) {

    event.preventDefault();

    const form =
        event.currentTarget;

    if (
        !form.checkValidity()
    ) {

        form.reportValidity();

        return;
    }

    const action =
        uiState.dialog?.action ??
        "save";

    uiState.dialog =
        null;

    updateOverlays(
        root
    );

    showToast(
        root,
        {
            title:
                "Eingabe übernommen",

            message:
                action.includes(
                    "message"
                )
                    ? "Die Nachricht wurde für die spätere Datenanbindung vorbereitet."
                    : "Die Eingabe wurde in der Präsentationsansicht bestätigt.",

            type:
                "success"
        }
    );
}

/************************************************
 * EREIGNISSE BINDEN
 ************************************************/

function bindEvents(
    root,
    context
) {

    root
        .querySelectorAll(
            "[data-login-form]"
        )
        .forEach(
            (form) => {

                form.addEventListener(
                    "submit",
                    (event) =>
                        handleLoginSubmit(
                            event,
                            {
                                root,
                                onLogin:
                                    context.onLogin
                            }
                        )
                );
            }
        );

    root
        .querySelectorAll(
            "[data-dialog-form]"
        )
        .forEach(
            (form) => {

                form.addEventListener(
                    "submit",
                    (event) =>
                        handleDialogSubmit(
                            event,
                            {
                                root
                            }
                        )
                );
            }
        );

    root.addEventListener(
        "click",
        (event) =>
            handleRootClick(
                event,
                context
            ),
        {
            once:
                true
        }
    );

    root.addEventListener(
        "click",
        (event) => {

            if (
                event.target.closest(
                    "[data-action='return-login']"
                )
            ) {

                context.render?.();
            }
        },
        {
            once:
                true
        }
    );
}

/************************************************
 * DOKUMENTTITEL
 ************************************************/

function updateDocumentTitle(route) {

    const routeTitle =
        getRouteTitle(
            route
        );

    document.title =
        `${routeTitle} · ${getAppName()}`;
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

    const root =
        document.getElementById(
            "app"
        );

    if (!root) {

        throw new Error(
            "Das App-Element mit der ID „app“ wurde nicht gefunden."
        );
    }

    const safeState =
        state &&
        typeof state ===
        "object"
            ? state
            : {};

    const currentRoute =
        route ??
        (
            safeState.currentUser
                ? ROUTES.OVERVIEW
                : ROUTES.LOGIN
        );

    updateDocumentTitle(
        currentRoute
    );

    const renderCurrentView =
        () => {

            if (
                !safeState.currentUser
            ) {

                root.innerHTML =
                    renderLoginPage(
                        safeState
                    );
            }
            else {

                root.innerHTML =
                    renderAuthenticatedApp({
                        route:
                            currentRoute,

                        state:
                            safeState,

                        onSelectObject
                    });
            }

            root.insertAdjacentHTML(
                "beforeend",
                renderDialog()
            );

            root.insertAdjacentHTML(
                "beforeend",
                renderToast()
            );

            bindEvents(
                root,
                {
                    root,
                    route:
                        currentRoute,
                    state:
                        safeState,
                    onNavigate,
                    onLogin,
                    onLogout,
                    onCheckin,
                    onCheckout,
                    onSelectObject,
                    render:
                        renderCurrentView
                }
            );
        };

    renderCurrentView();
}