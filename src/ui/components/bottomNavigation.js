/************************************************
 * Facility OS
 * bottomNavigation.js
 *
 * Mobile Hauptnavigation
 * - maximal fünf Menüpunkte
 * - rollenabhängige Navigation
 * - stabile data-route-Attribute
 * - gut lesbare Touchflächen
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
 * BASISHELFER
 ************************************************/

function normalizeText(value) {
    return String(value ?? "").trim();
}

function normalizeRole(value) {
    return normalizeText(value).toUpperCase();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/************************************************
 * NAVIGATIONSEINTRAG
 ************************************************/

function createNavigationItem(
    id,
    label,
    route,
    color = id
) {
    return {
        id,
        label,
        route,
        color
    };
}

/************************************************
 * ICONS
 ************************************************/

function getNavigationIcon(itemId) {
    const icons = {
        overview: `
            <path d="M3 11.5 12 4l9 7.5"/>
            <path d="M5.5 10.5V20h13v-9.5"/>
            <path d="M9.5 20v-5.5h5V20"/>
        `,

        objects: `
            <rect x="4" y="3.5" width="16" height="17" rx="2"/>
            <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>
            <path d="M10 20v-3h4v3"/>
        `,

        object: `
            <rect x="4" y="3.5" width="16" height="17" rx="2"/>
            <path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>
            <path d="M10 20v-3h4v3"/>
        `,

        personnel: `
            <circle cx="9" cy="8" r="3"/>
            <path d="M3.5 19c.5-3.4 2.5-5.2 5.5-5.2s5 1.8 5.5 5.2"/>
            <circle cx="17" cy="9" r="2.2"/>
            <path d="M15.8 14.4c2.7.1 4.2 1.6 4.7 4.6"/>
        `,

        communication: `
            <path d="M5 5h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H10l-5 3v-3a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z"/>
            <path d="M7.5 9.5h9M7.5 13h6"/>
        `,

        tasks: `
            <rect x="4" y="3.5" width="16" height="17" rx="2"/>
            <path d="m8 9 1.5 1.5L12 8M8 15l1.5 1.5L12 14M14 9h2.5M14 15h2.5"/>
        `,

        times: `
            <circle cx="12" cy="12" r="8.5"/>
            <path d="M12 7.5V12l3.2 2"/>
        `,

        analysis: `
            <path d="M5 20V10M12 20V4M19 20v-7"/>
            <path d="M3.5 20.5h17"/>
        `,

        reports: `
            <path d="M6 3.5h8l4 4V20H6Z"/>
            <path d="M14 3.5V8h4M9 12h6M9 15.5h6"/>
        `,

        more: `
            <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
            <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>
        `
    };

    return `
        <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
        >
            ${icons[itemId] ?? icons.more}
        </svg>
    `;
}

/************************************************
 * FALLBACK-NAVIGATION
 ************************************************/

function getFallbackNavigation(role) {
    const normalizedRole =
        normalizeRole(role);

    switch (normalizedRole) {
        case USER_ROLES.SUPER_ADMIN:
        case USER_ROLES.ADMIN:
        case USER_ROLES.OBJEKTLEITER:
            return [
                createNavigationItem(
                    "overview",
                    "Start",
                    ROUTES.OVERVIEW
                ),
                createNavigationItem(
                    "objects",
                    "Objekte",
                    ROUTES.OBJECTS
                ),
                createNavigationItem(
                    "personnel",
                    "Personal",
                    ROUTES.PERSONNEL
                ),
                createNavigationItem(
                    "communication",
                    "Meldungen",
                    ROUTES.COMMUNICATION
                ),
                createNavigationItem(
                    "more",
                    "Mehr",
                    ROUTES.MORE
                )
            ];

        case USER_ROLES.MITARBEITER:
            return [
                createNavigationItem(
                    "overview",
                    "Start",
                    ROUTES.OVERVIEW
                ),
                createNavigationItem(
                    "object",
                    "Objekt",
                    ROUTES.OBJECTS,
                    "objects"
                ),
                createNavigationItem(
                    "tasks",
                    "Aufgaben",
                    ROUTES.TASKS
                ),
                createNavigationItem(
                    "communication",
                    "Meldungen",
                    ROUTES.COMMUNICATION
                ),
                createNavigationItem(
                    "more",
                    "Mehr",
                    ROUTES.MORE
                )
            ];

        case USER_ROLES.BUCHHALTUNG:
            return [
                createNavigationItem(
                    "overview",
                    "Start",
                    ROUTES.OVERVIEW
                ),
                createNavigationItem(
                    "times",
                    "Zeiten",
                    ROUTES.TIMES
                ),
                createNavigationItem(
                    "objects",
                    "Objekte",
                    ROUTES.OBJECTS
                ),
                createNavigationItem(
                    "analysis",
                    "Auswertung",
                    ROUTES.ANALYSIS
                ),
                createNavigationItem(
                    "more",
                    "Mehr",
                    ROUTES.MORE
                )
            ];

        case USER_ROLES.KUNDE:
            return [
                createNavigationItem(
                    "overview",
                    "Start",
                    ROUTES.OVERVIEW
                ),
                createNavigationItem(
                    "objects",
                    "Objekte",
                    ROUTES.OBJECTS
                ),
                createNavigationItem(
                    "communication",
                    "Meldungen",
                    ROUTES.COMMUNICATION
                ),
                createNavigationItem(
                    "reports",
                    "Berichte",
                    ROUTES.REPORTS
                ),
                createNavigationItem(
                    "more",
                    "Mehr",
                    ROUTES.MORE
                )
            ];

        default:
            return [];
    }
}

/************************************************
 * NAVIGATION ERMITTELN
 ************************************************/

function getNavigationItems(role) {
    try {
        const configuredItems =
            typeof getMainNavigationForRole ===
            "function"
                ? getMainNavigationForRole(role)
                : [];

        if (
            Array.isArray(configuredItems) &&
            configuredItems.length > 0
        ) {
            return configuredItems
                .filter(
                    (item) =>
                        item &&
                        normalizeText(item.route)
                )
                .slice(0, 5);
        }
    }
    catch (error) {
        console.warn(
            "Router-Navigation konnte nicht gelesen werden. Fallback wird verwendet.",
            error
        );
    }

    return getFallbackNavigation(role)
        .slice(0, 5);
}

/************************************************
 * AKTIVE ROUTE
 ************************************************/

function resolveActiveRoute(route, role) {
    try {
        if (
            typeof getActiveMainRoute ===
            "function"
        ) {
            const result =
                getActiveMainRoute(
                    route,
                    role
                );

            if (result) {
                return result;
            }
        }
    }
    catch (error) {
        console.warn(
            "Aktive Navigation konnte nicht ermittelt werden.",
            error
        );
    }

    if (
        route === ROUTES.OBJECT_DETAIL ||
        route === ROUTES.MATERIALS
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
 * NAVIGATIONSPUNKT RENDERN
 ************************************************/

function renderNavigationItem({
    item,
    activeRoute
}) {
    const id =
        normalizeText(item.id) ||
        "more";

    const label =
        normalizeText(item.label) ||
        "Menü";

    const route =
        normalizeText(item.route);

    const color =
        normalizeText(item.color) ||
        id;

    const active =
        route === activeRoute;

    return `
        <button
            type="button"
            class="app-bottom-nav-item app-bottom-nav-${escapeHtml(
                color
            )} ${active ? "is-active" : ""}"
            data-route="${escapeHtml(route)}"
            aria-label="${escapeHtml(label)}"
            ${
                active
                    ? 'aria-current="page"'
                    : ""
            }
        >
            <span
                class="app-bottom-nav-active-indicator"
                aria-hidden="true"
            ></span>

            <span class="app-bottom-nav-icon">
                ${getNavigationIcon(id)}
            </span>

            <span class="app-bottom-nav-label">
                ${escapeHtml(label)}
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

    const items =
        getNavigationItems(role);

    if (items.length === 0) {
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
                ${items
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