/************************************************
 * Facility OS
 * router.js
 *
 * Neue Informationsarchitektur
 * - maximal fünf Hauptbereiche je Rolle
 * - rollenbasierte Zugriffe
 * - Unterstützung für GitHub Pages
 * - Browser-Navigation
 * - automatische Weiterleitung alter Routen
 ************************************************/

import {
    USER_ROLES
} from "./config/appConfig.js";

/************************************************
 * ROUTEN
 ************************************************/

export const ROUTES = Object.freeze({

    LOGIN:
        "/login",

    OVERVIEW:
        "/overview",

    OBJECTS:
        "/objects",

    OBJECT_DETAIL:
        "/object-detail",

    TASKS:
        "/tasks",

    PERSONNEL:
        "/personnel",

    COMMUNICATION:
        "/communication",

    TIMES:
        "/times",

    ANALYSIS:
        "/analysis",

    REPORTS:
        "/reports",

    MORE:
        "/more",

    SETTINGS:
        "/settings",

    HELP:
        "/help",

    PRIVACY:
        "/privacy",

    IMPRINT:
        "/imprint"
});

/************************************************
 * ALTE ROUTEN WEITERLEITEN
 ************************************************/

const LEGACY_ROUTE_REDIRECTS = Object.freeze({

    "/dashboard":
        ROUTES.OVERVIEW,

    "/employees":
        ROUTES.PERSONNEL,

    "/tickets":
        ROUTES.COMMUNICATION,

    "/materials":
        ROUTES.OBJECTS,

    "/datenschutz":
        ROUTES.PRIVACY,

    "/impressum":
        ROUTES.IMPRINT
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
    ROUTES.OVERVIEW,
    ROUTES.OBJECTS,
    ROUTES.OBJECT_DETAIL,
    ROUTES.TASKS,
    ROUTES.PERSONNEL,
    ROUTES.COMMUNICATION,
    ROUTES.TIMES,
    ROUTES.ANALYSIS,
    ROUTES.REPORTS,
    ROUTES.MORE,
    ROUTES.SETTINGS,
    ROUTES.HELP
]);

/************************************************
 * ROLLENBERECHTIGUNGEN
 ************************************************/

const ROUTE_PERMISSIONS = Object.freeze({

    [ROUTES.OVERVIEW]: [
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

    [ROUTES.TASKS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.KUNDE
    ],

    [ROUTES.PERSONNEL]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER
    ],

    [ROUTES.COMMUNICATION]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.KUNDE
    ],

    [ROUTES.TIMES]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.BUCHHALTUNG
    ],

    [ROUTES.ANALYSIS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG
    ],

    [ROUTES.REPORTS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ],

    [ROUTES.MORE]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ],

    [ROUTES.SETTINGS]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER
    ],

    [ROUTES.HELP]: [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ]
});

/************************************************
 * ROUTER-STATUS
 ************************************************/

let currentRoute =
    ROUTES.OVERVIEW;

let routeChangeHandler =
    null;

let routerStarted =
    false;

let routerContext = {

    currentUser:
        null,

    currentObject:
        null
};

/************************************************
 * BASISHELFER
 ************************************************/

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

function getRole(user) {

    return normalizeText(
        user?.role
    ).toUpperCase();
}

/************************************************
 * ROUTE NORMALISIEREN
 ************************************************/

export function normalizeRoute(route) {

    let normalizedRoute =
        normalizeText(route);

    if (!normalizedRoute) {

        return ROUTES.OVERVIEW;
    }

    try {

        if (
            normalizedRoute.startsWith(
                "http://"
            ) ||
            normalizedRoute.startsWith(
                "https://"
            )
        ) {

            const url =
                new URL(
                    normalizedRoute
                );

            normalizedRoute =
                url.searchParams.get(
                    "route"
                ) ??
                url.hash.replace(
                    /^#/,
                    ""
                ) ??
                url.pathname;
        }
    }
    catch {

        normalizedRoute =
            ROUTES.OVERVIEW;
    }

    normalizedRoute =
        normalizedRoute
            .split("?")[0]
            .split("#")[0]
            .trim();

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

    return (
        LEGACY_ROUTE_REDIRECTS[
            normalizedRoute
        ] ??
        normalizedRoute
    );
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

/************************************************
 * ZUGRIFFSPRÜFUNG
 ************************************************/

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
        !currentUser
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
        getRole(
            currentUser
        )
    );
}

/************************************************
 * STANDARDROUTE
 ************************************************/

export function getDefaultRouteForUser(
    currentUser
) {

    if (!currentUser) {

        return ROUTES.LOGIN;
    }

    return ROUTES.OVERVIEW;
}

/************************************************
 * HAUPTNAVIGATION PRO ROLLE
 ************************************************/

export function getMainNavigationForRole(role) {

    const normalizedRole =
        normalizeText(role)
            .toUpperCase();

    const navigationByRole = {

        [USER_ROLES.SUPER_ADMIN]: [
            {
                id:
                    "overview",

                label:
                    "Übersicht",

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
                    "Kommunikation",

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
        ],

        [USER_ROLES.ADMIN]: [
            {
                id:
                    "overview",

                label:
                    "Übersicht",

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
                    "Kommunikation",

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
        ],

        [USER_ROLES.OBJEKTLEITER]: [
            {
                id:
                    "overview",

                label:
                    "Übersicht",

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
                    "Kommunikation",

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
        ],

        [USER_ROLES.MITARBEITER]: [
            {
                id:
                    "overview",

                label:
                    "Übersicht",

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
        ],

        [USER_ROLES.BUCHHALTUNG]: [
            {
                id:
                    "overview",

                label:
                    "Übersicht",

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
        ],

        [USER_ROLES.KUNDE]: [
            {
                id:
                    "overview",

                label:
                    "Übersicht",

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
        ]
    };

    return (
        navigationByRole[
            normalizedRole
        ] ??
        []
    );
}

/************************************************
 * AKTIVEN HAUPTBEREICH ERMITTELN
 ************************************************/

export function getActiveMainRoute(
    route,
    role
) {

    const normalizedRoute =
        normalizeRoute(route);

    if (
        normalizedRoute ===
        ROUTES.OBJECT_DETAIL
    ) {

        return ROUTES.OBJECTS;
    }

    if (
        normalizedRoute ===
        ROUTES.SETTINGS ||
        normalizedRoute ===
        ROUTES.HELP ||
        normalizedRoute ===
        ROUTES.PRIVACY ||
        normalizedRoute ===
        ROUTES.IMPRINT
    ) {

        return ROUTES.MORE;
    }

    const navigationItems =
        getMainNavigationForRole(
            role
        );

    const directMatch =
        navigationItems.find(
            (item) =>
                item.route ===
                normalizedRoute
        );

    return (
        directMatch?.route ??
        normalizedRoute
    );
}

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
 * ROUTE AUS URL
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
        normalizeText(
            window.location.hash
        );

    if (
        hash.startsWith("#/")
    ) {

        return normalizeRoute(
            hash.slice(1)
        );
    }

    const repositoryBasePath =
        getRepositoryBasePath();

    const pathname =
        window.location.pathname;

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
            relativePath
        ) {

            return normalizeRoute(
                relativePath
            );
        }
    }

    return ROUTES.OVERVIEW;
}

/************************************************
 * ROUTEN-URL ERZEUGEN
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
 * ROUTER-KONTEXT
 ************************************************/

function setRouterContext({
    currentUser = null,
    currentObject = null
} = {}) {

    routerContext = {

        currentUser,

        currentObject
    };
}

/************************************************
 * ROUTENWECHSEL MELDEN
 ************************************************/

function emitRouteChange(route) {

    if (
        typeof routeChangeHandler ===
        "function"
    ) {

        routeChangeHandler(
            route
        );
    }
}

/************************************************
 * NAVIGIEREN
 ************************************************/

export function navigateTo(
    route,
    {
        replace = false,
        currentUser =
            routerContext.currentUser,
        currentObject =
            routerContext.currentObject
    } = {}
) {

    setRouterContext({
        currentUser,
        currentObject
    });

    const resolvedRoute =
        resolveRoute({
            requestedRoute:
                route,

            currentUser,

            currentObject
        });

    currentRoute =
        resolvedRoute;

    const url =
        createRouteUrl(
            resolvedRoute
        );

    const historyState = {

        route:
            resolvedRoute
    };

    if (replace) {

        window.history.replaceState(
            historyState,
            "",
            url
        );
    }
    else {

        window.history.pushState(
            historyState,
            "",
            url
        );
    }

    emitRouteChange(
        resolvedRoute
    );

    return resolvedRoute;
}

/************************************************
 * ROUTER INITIALISIEREN
 ************************************************/

export function initializeRouter({
    currentUser = null,
    currentObject = null,
    onRouteChange = null
} = {}) {

    setRouterContext({
        currentUser,
        currentObject
    });

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

    window.history.replaceState(
        {
            route:
                initialRoute
        },
        "",
        createRouteUrl(
            initialRoute
        )
    );

    if (!routerStarted) {

        window.addEventListener(
            "popstate",
            (event) => {

                const requestedRoute =
                    event.state?.route ??
                    getRouteFromLocation();

                const resolvedRoute =
                    resolveRoute({
                        requestedRoute,

                        currentUser:
                            routerContext.currentUser,

                        currentObject:
                            routerContext.currentObject
                    });

                currentRoute =
                    resolvedRoute;

                emitRouteChange(
                    resolvedRoute
                );
            }
        );

        routerStarted =
            true;
    }

    return initialRoute;
}

/************************************************
 * ROUTER-KONTEXT AKTUALISIEREN
 ************************************************/

export function updateRouterContext({
    currentUser = null,
    currentObject = null
} = {}) {

    setRouterContext({
        currentUser,
        currentObject
    });

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

        window.history.replaceState(
            {
                route:
                    resolvedRoute
            },
            "",
            createRouteUrl(
                resolvedRoute
            )
        );

        emitRouteChange(
            resolvedRoute
        );
    }

    return currentRoute;
}

/************************************************
 * AKTUELLE ROUTE
 ************************************************/

export function getCurrentRoute() {

    return currentRoute;
}

/************************************************
 * ROUTER ZURÜCKSETZEN
 ************************************************/

export function resetRouter() {

    currentRoute =
        ROUTES.OVERVIEW;

    routeChangeHandler =
        null;

    routerContext = {

        currentUser:
            null,

        currentObject:
            null
    };
}