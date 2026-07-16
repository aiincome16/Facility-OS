/************************************************
 * Facility OS
 * appHeader.js
 *
 * Gemeinsamer Kopfbereich der App-Ansicht
 * - rollenabhängige Bezeichnung
 * - aktuelles Objekt
 * - Profilzugang
 * - Benachrichtigungsanzeige
 * - vorbereitet für mobile App-Nutzung
 ************************************************/

import {
    APP_CONFIG,
    USER_ROLES
} from "../../config/appConfig.js";

import {
    ROUTES
} from "../../router.js";

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

function normalizeStatus(value) {

    return String(value ?? "")
        .trim()
        .toUpperCase();
}

/************************************************
 * BENUTZERDATEN
 ************************************************/

function getUserName(state) {

    return (
        state.currentUser?.name ??
        state.currentUser?.fullName ??
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
 * BENACHRICHTIGUNGEN
 ************************************************/

function getUnreadNotificationCount(state) {

    return asArray(
        state.notifications
    ).filter(
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
    ).length;
}

/************************************************
 * OBJEKTANZEIGE
 ************************************************/

function renderCurrentObject(state) {

    const object =
        state.currentObject;

    if (!object) {

        return `
            <button
                type="button"
                class="app-header-object app-header-object-empty"
                data-route="${ROUTES.OBJECTS}"
                aria-label="Objekt auswählen"
            >
                <span class="app-header-object-label">
                    Objekt
                </span>

                <strong>
                    Auswählen
                </strong>
            </button>
        `;
    }

    return `
        <button
            type="button"
            class="app-header-object"
            data-route="${ROUTES.OBJECT_DETAIL}"
            aria-label="Aktuelles Objekt öffnen"
        >
            <span class="app-header-object-label">
                Aktuelles Objekt
            </span>

            <strong>
                ${escapeHtml(
                    object.name ??
                    object.id ??
                    "Objekt"
                )}
            </strong>
        </button>
    `;
}

/************************************************
 * BENACHRICHTIGUNGSBUTTON
 ************************************************/

function renderNotificationButton(state) {

    const unreadCount =
        getUnreadNotificationCount(
            state
        );

    return `
        <button
            type="button"
            class="app-header-icon-button"
            data-route="${ROUTES.COMMUNICATION}"
            aria-label="${
                unreadCount > 0
                    ? `${unreadCount} ungelesene Benachrichtigungen`
                    : "Benachrichtigungen öffnen"
            }"
        >
            <span
                class="app-header-icon"
                aria-hidden="true"
            >
                ♢
            </span>

            ${
                unreadCount > 0
                    ? `
                        <span class="app-header-badge">
                            ${
                                unreadCount > 99
                                    ? "99+"
                                    : unreadCount
                            }
                        </span>
                    `
                    : ""
            }
        </button>
    `;
}

/************************************************
 * PROFILBUTTON
 ************************************************/

function renderProfileButton(state) {

    return `
        <button
            type="button"
            class="app-header-profile"
            data-route="${ROUTES.MORE}"
            aria-label="Profil und weitere Funktionen öffnen"
        >
            <span class="app-header-profile-initials">
                ${escapeHtml(
                    getUserInitials(state)
                )}
            </span>
        </button>
    `;
}

/************************************************
 * HAUPTFUNKTION
 ************************************************/

export function renderAppHeader(state) {

    if (!state?.currentUser) {

        return "";
    }

    const appName =
        APP_CONFIG.APP_NAME ??
        APP_CONFIG.NAME ??
        "Facility OS";

    return `
        <header class="app-header app-view-header">

            <div class="app-header-main">

                <div class="app-header-brand">

                    <strong class="app-header-brand-name">
                        ${escapeHtml(
                            appName
                        )}
                    </strong>

                    <span class="app-header-role">
                        ${escapeHtml(
                            getRoleLabel(
                                state.currentUser.role
                            )
                        )}
                    </span>

                </div>

                <div class="app-header-actions">

                    ${renderNotificationButton(
                        state
                    )}

                    ${renderProfileButton(
                        state
                    )}

                </div>

            </div>

            <div class="app-header-context">

                <div class="app-header-user">

                    <span>
                        Angemeldet als
                    </span>

                    <strong>
                        ${escapeHtml(
                            getUserName(state)
                        )}
                    </strong>

                </div>

                ${renderCurrentObject(
                    state
                )}

            </div>

        </header>
    `;
}