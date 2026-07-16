/************************************************
 * Facility OS
 * router.js
 *
 * Zentrale Navigation
 * - öffentliche und geschützte Routen
 * - rollenbasierte Zugriffsprüfung
 * - Browser-Historie
 * - direkte Seitenaufrufe
 * - Fallback auf sichere Standardrouten
 ************************************************/

import {
    USER_ROLES
} from "./config/appConfig.js";

/************************************************
 * ROUTENDEFINITIONEN
 ************************************************/

export const ROUTES = Object.freeze({

    LOGIN:
        "/login",

    DASHBOARD:
        "/dashboard",

    OBJECTS:
        "/objects",

    OBJECT_DETAIL:
        "/object-detail",

    EMPLOYEES:
        "/employees",

    TASKS:
        "/tasks",

    MATERIALS:
        "/materials",

    TICKETS:
        "/tickets",

    REPORTS:
        "/reports",

    SETTINGS:
        "/settings",

    PRIVACY:
        "/datenschutz",

    IMPRINT:
        "/impressum"
});

/************************************************
 * ÖFFENTLICHE ROUTEN
 ************************************************/

const PUBLIC_ROUTES = Object.freeze([
    ROUTES.LOGIN,
    ROUTES.PRIVACY,
    ROUTES.IMPRINT
]);

/************************************************
 * GESCHÜTZTE ROUTEN
 ************************************************/

const PROTECTED_ROUTES = Object.freeze([
    ROUTES.DASHBOARD,
    ROUTES.OBJECTS,
    ROUTES.OBJECT_DETAIL,
    ROUTES.EMPLOYEES,
    ROUTES.TASKS,
    ROUTES.MATERIALS,
    ROUTES.TICKETS,
    ROUTES.REPORTS,
    ROUTES.SETTINGS
]);

/************************************************
 * ROLLENBERECHTIGUNGEN
 ************************************************/

const ROUTE_PERMISSIONS = Object.freeze({

    [ROUTES.DASHBOARD]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ],

    [ROUTES.OBJECTS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ],

    [ROUTES.OBJECT_DETAIL]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ],

    [ROUTES.EMPLOYEES]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER
    ],

    [ROUTES.TASKS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ],

    [ROUTES.MATERIALS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER
    ],

    [ROUTES.TICKETS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.KUNDE
    ],

    [ROUTES.REPORTS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ],

    [ROUTES.SETTINGS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER
    ]
});

/************************************************
 * ROUTENNORMALISIERUNG
 ************************************************/

function normalizeRoute(route) {

    const rawRoute =
        String(route ?? "")
            .trim();

    if (!rawRoute) {
        return ROUTES.DASHBOARD;
    }

    let normalizedRoute =
        rawRoute;

    if (
        normalizedRoute.startsWith(
            window.location.origin
        )
    ) {

        try {

            const url =
                new URL(
                    normalizedRoute
                );

            normalizedRoute =
                url.pathname;
        }
        catch {

            normalizedRoute =
                ROUTES.DASHBOARD;
        }
    }

    normalizedRoute =
        normalizedRoute
            .split("?")[0]
            .split("#")[0];

    if (
        !normalizedRoute.startsWith("/")
    ) {

        normalizedRoute =
            `/${normalizedRoute}`;
    }

    normalizedRoute =
        normalizedRoute.replace(
            /\/{2,}/g,
            "/"
        );

    if (
        normalizedRoute.length > 1 &&
        normalizedRoute.endsWith("/")
    ) {

        normalizedRoute =
            normalizedRoute.slice(
                0,
                -1
            );
    }

    return normalizedRoute;
}

/************************************************
 * ROUTENPRÜFUNG
 ************************************************/

export function isKnownRoute(route) {

    const normalizedRoute =
        normalizeRoute(route);

    return [
        ...PUBLIC_ROUTES,
        ...PROTECTED_ROUTES
    ].includes(
        normalizedRoute
    );
}

export function isPublicRoute(route) {

    return PUBLIC_ROUTES.includes(
        normalizeRoute(route)
    );
}

export function isProtectedRoute(route) {

    return PROTECTED_ROUTES.includes(
        normalizeRoute(route)
    );
}

export function canAccessRoute(
    route,
    currentUser
) {

    const normalizedRoute =
        normalizeRoute(route);

    if (
        isPublicRoute(
            normalizedRoute
        )
    ) {

        return true;
    }

    if (
        !currentUser ||
        !currentUser.role
    ) {

        return false;
    }

    const allowedRoles =
        ROUTE_PERMISSIONS[
            normalizedRoute
        ];

    if (
        !Array.isArray(
            allowedRoles
        )
    ) {

        return false;
    }

    return allowedRoles.includes(
        currentUser.role
    );
}

/************************************************
 * STANDARDROUTE PRO ROLLE
 ************************************************/

export function getDefaultRouteForUser(
    currentUser
) {

    if (!currentUser) {
        return ROUTES.LOGIN;
    }

    switch (
        currentUser.role
    ) {

        case USER_ROLES.SUPER_ADMIN:
        case USER_ROLES.ADMIN:
        case USER_ROLES.OBJEKTLEITER:
        case USER_ROLES.MITARBEITER:
        case USER_ROLES.BUCHHALTUNG:
        case USER_ROLES.KUNDE:

            return ROUTES.DASHBOARD;

        default:

            return ROUTES.LOGIN;
    }
}

/************************************************
 * ROUTE AUS URL LESEN
 ************************************************/

export function getRouteFromLocation() {

    const url =
        new URL(
            window.location.href
        );

    const routeParameter =
        url.searchParams.get(
            "route"
        );

    if (routeParameter) {

        return normalizeRoute(
            routeParameter
        );
    }

    const hash =
        String(
            window.location.hash ?? ""
        ).trim();

    if (
        hash.startsWith("#/")
    ) {

        return normalizeRoute(
            hash.slice(1)
        );
    }

    const pathname =
        normalizeRoute(
            window.location.pathname
        );

    const repositoryBasePath =
        getRepositoryBasePath();

    if (
        repositoryBasePath !== "/" &&
        pathname.startsWith(
            repositoryBasePath
        )
    ) {

        const relativePath =
            pathname.slice(
                repositoryBasePath.length
            );

        if (
            relativePath &&
            relativePath !== "/"
        ) {

            return normalizeRoute(
                relativePath
            );
        }
    }

    return ROUTES.DASHBOARD;
}

/************************************************
 * GITHUB-PAGES-BASISPFAD
 ************************************************/

function getRepositoryBasePath() {

    const pathname =
        window.location.pathname;

    const segments =
        pathname
            .split("/")
            .filter(Boolean);

    if (
        window.location.hostname.endsWith(
            "github.io"
        ) &&
        segments.length > 0
    ) {

        return `/${segments[0]}/`;
    }

    return "/";
}

/************************************************
 * URL ERZEUGEN
 ************************************************/

function createRouteUrl(route) {

    const normalizedRoute =
        normalizeRoute(route);

    const url =
        new URL(
            window.location.href
        );

    url.searchParams.set(
        "route",
        normalizedRoute
    );

    url.hash =
        normalizedRoute;

    return url;
}

/************************************************
 * ROUTER-STATUS
 ************************************************/

let currentRoute =
    ROUTES.DASHBOARD;

let routeChangeHandler =
    null;

/************************************************
 * ROUTE AUFLÖSEN
 ************************************************/

export function resolveRoute({
    requestedRoute,
    currentUser,
    currentObject = null
}) {

    const normalizedRoute =
        normalizeRoute(
            requestedRoute
        );

    if (!currentUser) {

        if (
            isPublicRoute(
                normalizedRoute
            )
        ) {

            return normalizedRoute;
        }

        return ROUTES.LOGIN;
    }

    if (
        normalizedRoute ===
        ROUTES.LOGIN
    ) {

        return getDefaultRouteForUser(
            currentUser
        );
    }

    if (
        normalizedRoute ===
            ROUTES.OBJECT_DETAIL &&
        !currentObject
    ) {

        return ROUTES.OBJECTS;
    }

    if (
        !isKnownRoute(
            normalizedRoute
        )
    ) {

        return getDefaultRouteForUser(
            currentUser
        );
    }

    if (
        !canAccessRoute(
            normalizedRoute,
            currentUser
        )
    ) {

        return getDefaultRouteForUser(
            currentUser
        );
    }

    return normalizedRoute;
}

/************************************************
 * NAVIGATION
 ************************************************/

export function navigateTo(
    route,
    {
        replace = false,
        currentUser = null,
        currentObject = null
    } = {}
) {

    const resolvedRoute =
        resolveRoute({
            requestedRoute:
                route,

            currentUser,

            currentObject
        });

    currentRoute =
        resolvedRoute;

    const targetUrl =
        createRouteUrl(
            resolvedRoute
        );

    const state = {
        route:
            resolvedRoute
    };

    if (replace) {

        window.history.replaceState(
            state,
            "",
            targetUrl
        );
    }
    else {

        window.history.pushState(
            state,
            "",
            targetUrl
        );
    }

    if (
        typeof routeChangeHandler ===
            "function"
    ) {

        routeChangeHandler(
            resolvedRoute
        );
    }

    return resolvedRoute;
}

/************************************************
 * ROUTER STARTEN
 ************************************************/

export function initializeRouter({
    currentUser = null,
    currentObject = null,
    onRouteChange
} = {}) {

    routeChangeHandler =
        typeof onRouteChange ===
            "function"
            ? onRouteChange
            : null;

    const initialRoute =
        resolveRoute({
            requestedRoute:
                getRouteFromLocation(),

            currentUser,

            currentObject
        });

    currentRoute =
        initialRoute;

    const initialUrl =
        createRouteUrl(
            initialRoute
        );

    window.history.replaceState(
        {
            route:
                initialRoute
        },
        "",
        initialUrl
    );

    window.addEventListener(
        "popstate",
        (event) => {

            const requestedRoute =
                event.state?.route ??
                getRouteFromLocation();

            const resolvedRoute =
                resolveRoute({
                    requestedRoute,

                    currentUser,

                    currentObject
                });

            currentRoute =
                resolvedRoute;

            if (
                typeof routeChangeHandler ===
                    "function"
            ) {

                routeChangeHandler(
                    resolvedRoute
                );
            }
        }
    );

    return initialRoute;
}

/************************************************
 * ROUTER AKTUALISIEREN
 ************************************************/

export function updateRouterContext({
    currentUser = null,
    currentObject = null
} = {}) {

    const resolvedRoute =
        resolveRoute({
            requestedRoute:
                currentRoute,

            currentUser,

            currentObject
        });

    if (
        resolvedRoute !==
        currentRoute
    ) {

        currentRoute =
            resolvedRoute;

        const targetUrl =
            createRouteUrl(
                resolvedRoute
            );

        window.history.replaceState(
            {
                route:
                    resolvedRoute
            },
            "",
            targetUrl
        );

        if (
            typeof routeChangeHandler ===
                "function"
        ) {

            routeChangeHandler(
                resolvedRoute
            );
        }
    }

    return currentRoute;
}

/************************************************
 * ROUTER AUSLESEN
 ************************************************/

export function getCurrentRoute() {

    return currentRoute;
}

/************************************************
 * ROUTER ZURÜCKSETZEN
 ************************************************/

export function resetRouter() {

    currentRoute =
        ROUTES.DASHBOARD;

    routeChangeHandler =
        null;
}