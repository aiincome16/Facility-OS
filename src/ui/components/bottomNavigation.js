/************************************************
 * Facility OS
 * bottomNavigation.js
 *
 * Gemeinsame mobile Hauptnavigation
 * - maximal fünf Hauptbereiche
 * - rollenabhängige Menüpunkte
 * - farblich getrennte Module
 * - aktiver Bereich wird hervorgehoben
 * - vorbereitet für Smartphone und Tablet
 ************************************************/

import {
    USER_ROLES
} from "../../config/appConfig.js";

import {
    ROUTES,
    getMainNavigationForRole,
    getActiveMainRoute
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

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

function normalizeRole(value) {

    return normalizeText(value)
        .toUpperCase();
}

/************************************************
 * ICONS
 ************************************************/

function getNavigationIcon(itemId) {

    const icons = {

        overview:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M3 11.5 12 4l9 7.5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.9"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M5.5 10.5V20h13v-9.5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.9"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M9.5 20v-5.5h5V20"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.9"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        objects:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <rect
                        x="4"
                        y="3.5"
                        width="16"
                        height="17"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M10 20v-3h4v3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        object:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <rect
                        x="4"
                        y="3.5"
                        width="16"
                        height="17"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <path
                        d="M10 20v-3h4v3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        personnel:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle
                        cx="9"
                        cy="8"
                        r="3"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M3.5 19c.5-3.4 2.5-5.2 5.5-5.2s5 1.8 5.5 5.2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />

                    <circle
                        cx="17"
                        cy="9"
                        r="2.2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                    />

                    <path
                        d="M15.8 14.4c2.7.1 4.2 1.6 4.7 4.6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                    />
                </svg>
            `,

        communication:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M7.5 9.5h9M7.5 13h6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />
                </svg>
            `,

        tasks:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <rect
                        x="4"
                        y="3.5"
                        width="16"
                        height="17"
                        rx="2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9h2.5M14 15h2.5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        times:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle
                        cx="12"
                        cy="12"
                        r="8.5"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                    />

                    <path
                        d="M12 7.5V12l3.2 2"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
            `,

        analysis:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M5 20V10M12 20V4M19 20v-7"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                    />

                    <path
                        d="M3.5 20.5h17"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.6"
                        stroke-linecap="round"
                    />
                </svg>
            `,

        reports:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <path
                        d="M6 3.5h8l4 4V20H6Z"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linejoin="round"
                    />

                    <path
                        d="M14 3.5V8h4M9 12h6M9 15.5h6"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="1.8"
                        stroke-linecap="round"
                    />
                </svg>
            `,

        more:
            `
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                >
                    <circle
                        cx="5"
                        cy="12"
                        r="1.5"
                        fill="currentColor"
                    />

                    <circle
                        cx="12"
                        cy="12"
                        r="1.5"
                        fill="currentColor"
                    />

                    <circle
                        cx="19"
                        cy="12"
                        r="1.5"
                        fill="currentColor"
                    />
                </svg>
            `
    };

    return (
        icons[itemId] ??
        icons.more
    );
}

/************************************************
 * FALLBACK-NAVIGATION
 ************************************************/

function getFallbackNavigation(role) {

    const normalizedRole =
        normalizeRole(role);

    const commonManagementNavigation = [
        {
            id:
                "overview",

            label:
                "Start",

            route:
                ROUTES.OVERVIEW,

            color:
                "overview"
        },
        {
            id:
                "objects",

            label:
                "Objekte",

            route:
                ROUTES.OBJECTS,

            color:
                "objects"
        },
        {
            id:
                "personnel",

            label:
                "Personal",

            route:
                ROUTES.PERSONNEL,

            color:
                "personnel"
        },
        {
            id:
                "communication",

            label:
                "Meldungen",

            route:
                ROUTES.COMMUNICATION,

            color:
                "communication"
        },
        {
            id:
                "more",

            label:
                "Mehr",

            route:
                ROUTES.MORE,

            color:
                "more"
        }
    ];

    switch (normalizedRole) {

        case USER_ROLES.SUPER_ADMIN:
        case USER_ROLES.ADMIN:
        case USER_ROLES.OBJEKTLEITER:

            return commonManagementNavigation;

        case USER_ROLES.MITARBEITER:

            return [
                {
                    id:
                        "overview",

                    label:
                        "Start",

                    route:
                        ROUTES.OVERVIEW,

                    color:
                        "overview"
                },
                {
                    id:
                        "object",

                    label:
                        "Objekt",

                    route:
                        ROUTES.OBJECTS,

                    color:
                        "objects"
                },
                {
                    id:
                        "tasks",

                    label:
                        "Aufgaben",

                    route:
                        ROUTES.TASKS,

                    color:
                        "tasks"
                },
                {
                    id:
                        "communication",

                    label:
                        "Meldungen",

                    route:
                        ROUTES.COMMUNICATION,

                    color:
                        "communication"
                },
                {
                    id:
                        "more",

                    label:
                        "Mehr",

                    route:
                        ROUTES.MORE,

                    color:
                        "more"
                }
            ];

        case USER_ROLES.BUCHHALTUNG:

            return [
                {
                    id:
                        "overview",

                    label:
                        "Start",

                    route:
                        ROUTES.OVERVIEW,

                    color:
                        "overview"
                },
                {
                    id:
                        "times",

                    label:
                        "Zeiten",

                    route:
                        ROUTES.TIMES,

                    color:
                        "times"
                },
                {
                    id:
                        "objects",

                    label:
                        "Objekte",

                    route:
                        ROUTES.OBJECTS,

                    color:
                        "objects"
                },
                {
                    id:
                        "analysis",

                    label:
                        "Auswertung",

                    route:
                        ROUTES.ANALYSIS,

                    color:
                        "analysis"
                },
                {
                    id:
                        "more",

                    label:
                        "Mehr",

                    route:
                        ROUTES.MORE,

                    color:
                        "more"
                }
            ];

        case USER_ROLES.KUNDE:

            return [
                {
                    id:
                        "overview",

                    label:
                        "Start",

                    route:
                        ROUTES.OVERVIEW,

                    color:
                        "overview"
                },
                {
                    id:
                        "objects",

                    label:
                        "Objekte",

                    route:
                        ROUTES.OBJECTS,

                    color:
                        "objects"
                },
                {
                    id:
                        "communication",

                    label:
                        "Meldungen",

                    route:
                        ROUTES.COMMUNICATION,

                    color:
                        "communication"
                },
                {
                    id:
                        "reports",

                    label:
                        "Berichte",

                    route:
                        ROUTES.REPORTS,

                    color:
                        "reports"
                },
                {
                    id:
                        "more",

                    label:
                        "Mehr",

                    route:
                        ROUTES.MORE,

                    color:
                        "more"
                }
            ];

        default:

            return [];
    }
}

/************************************************
 * NAVIGATION ERMITTELN
 ************************************************/

function getNavigationItems(role) {

    if (
        typeof getMainNavigationForRole ===
        "function"
    ) {

        const configuredItems =
            getMainNavigationForRole(
                role
            );

        if (
            Array.isArray(
                configuredItems
            ) &&
            configuredItems.length > 0
        ) {

            return configuredItems
                .slice(0, 5);
        }
    }

    return getFallbackNavigation(
        role
    ).slice(0, 5);
}

/************************************************
 * AKTIVEN BEREICH ERMITTELN
 ************************************************/

function resolveActiveRoute(
    route,
    role
) {

    if (
        typeof getActiveMainRoute ===
        "function"
    ) {

        return getActiveMainRoute(
            route,
            role
        );
    }

    if (
        route ===
        ROUTES.OBJECT_DETAIL
    ) {

        return ROUTES.OBJECTS;
    }

    if (
        [
            ROUTES.SETTINGS,
            ROUTES.HELP,
            ROUTES.PRIVACY,
            ROUTES.IMPRINT
        ].includes(route)
    ) {

        return ROUTES.MORE;
    }

    return route;
}

/************************************************
 * EINZELNEN NAVIGATIONSPUNKT RENDERN
 ************************************************/

function renderNavigationItem({
    item,
    activeRoute
}) {

    const active =
        item.route ===
        activeRoute;

    const itemId =
        normalizeText(
            item.id
        ) ||
        "more";

    const itemColor =
        normalizeText(
            item.color
        ) ||
        itemId;

    return `
        <button
            type="button"
            class="
                app-bottom-nav-item
                app-bottom-nav-${escapeHtml(
                    itemColor
                )}
                ${active ? "is-active" : ""}
            "
            data-route="${escapeHtml(
                item.route
            )}"
            aria-label="${escapeHtml(
                item.label
            )}"
            aria-current="${
                active
                    ? "page"
                    : "false"
            }"
        >
            <span class="app-bottom-nav-icon">

                ${getNavigationIcon(
                    itemId
                )}

            </span>

            <span class="app-bottom-nav-label">

                ${escapeHtml(
                    item.label
                )}

            </span>
        </button>
    `;
}

/************************************************
 * HAUPTFUNKTION
 ************************************************/

export function renderBottomNavigation({
    state,
    route
}) {

    const currentUser =
        state?.currentUser;

    if (!currentUser) {

        return "";
    }

    const role =
        normalizeRole(
            currentUser.role
        );

    const navigationItems =
        getNavigationItems(
            role
        );

    if (
        navigationItems.length === 0
    ) {

        return "";
    }

    const activeRoute =
        resolveActiveRoute(
            route,
            role
        );

    return `
        <nav
            class="app-bottom-navigation"
            aria-label="Hauptnavigation"
        >
            <div class="app-bottom-navigation-inner">

                ${navigationItems
                    .map(
                        (item) =>
                            renderNavigationItem({
                                item,
                                activeRoute
                            })
                    )
                    .join("")}

            </div>
        </nav>
    `;
}