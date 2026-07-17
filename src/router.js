/************************************************
 * Facility OS
 * router.js
 *
 * Zentrale Navigation
 * - rollenbasierte Zugriffe
 * - GitHub-Pages-kompatible Hash-Routen
 * - Hauptnavigation je Benutzerrolle
 * - Weiterleitungen alter Routen
 * - Materialbereich als eigene Route
 ************************************************/

import {
    USER_ROLES
} from "./config/appConfig.js";

/************************************************
 * ROUTEN
 ************************************************/

export const ROUTES =
    Object.freeze({

        LOGIN:
            "/login",

        OVERVIEW:
            "/overview",

        OBJECTS:
            "/objects",

        OBJECT_DETAIL:
            "/object",

        MATERIALS:
            "/materials",

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
 * GÜLTIGE ROUTEN
 ************************************************/

const VALID_ROUTES =
    new Set(
        Object.values(
            ROUTES
        )
    );

/************************************************
 * ALTE ROUTEN UND WEITERLEITUNGEN
 ************************************************/

const LEGACY_ROUTE_REDIRECTS =
    Object.freeze({

        "/":
            ROUTES.OVERVIEW,

        "/home":
            ROUTES.OVERVIEW,

        "/start":
            ROUTES.OVERVIEW,

        "/dashboard":
            ROUTES.OVERVIEW,

        "/employee-dashboard":
            ROUTES.OVERVIEW,

        "/manager-dashboard":
            ROUTES.OVERVIEW,

        "/accounting-dashboard":
            ROUTES.OVERVIEW,

        "/admin-dashboard":
            ROUTES.OVERVIEW,

        "/object-selection":
            ROUTES.OBJECTS,

        "/object-detail":
            ROUTES.OBJECT_DETAIL,

        "/material":
            ROUTES.MATERIALS,

        "/material-stock":
            ROUTES.MATERIALS,

        "/employees":
            ROUTES.PERSONNEL,

        "/staff":
            ROUTES.PERSONNEL,

        "/messages":
            ROUTES.COMMUNICATION,

        "/tickets":
            ROUTES.COMMUNICATION,

        "/notifications":
            ROUTES.COMMUNICATION,

        "/shifts":
            ROUTES.TIMES,

        "/time":
            ROUTES.TIMES,

        "/analytics":
            ROUTES.ANALYSIS,

        "/reporting":
            ROUTES.REPORTS,

        "/profile":
            ROUTES.MORE,

        "/legal":
            ROUTES.IMPRINT
    });

/************************************************
 * ROLLENBERECHTIGUNGEN
 ************************************************/

const ROUTE_PERMISSIONS =
    Object.freeze({

        [ROUTES.LOGIN]:
            [],

        [ROUTES.OVERVIEW]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ],

        [ROUTES.OBJECTS]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ],

        [ROUTES.OBJECT_DETAIL]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ],

        [ROUTES.MATERIALS]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER
            ],

        [ROUTES.TASKS]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER
            ],

        [ROUTES.PERSONNEL]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER
            ],

        [ROUTES.COMMUNICATION]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ],

        [ROUTES.TIMES]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG
            ],

        [ROUTES.ANALYSIS]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.BUCHHALTUNG
            ],

        [ROUTES.REPORTS]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ],

        [ROUTES.MORE]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ],

        [ROUTES.SETTINGS]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ],

        [ROUTES.HELP]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ],

        [ROUTES.PRIVACY]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ],

        [ROUTES.IMPRINT]:
            [
                USER_ROLES.SUPER_ADMIN,
                USER_ROLES.ADMIN,
                USER_ROLES.OBJEKTLEITER,
                USER_ROLES.MITARBEITER,
                USER_ROLES.BUCHHALTUNG,
                USER_ROLES.KUNDE
            ]
    });

/************************************************
 * ROUTER-ZUSTAND
 ************************************************/

let currentRoute =
    ROUTES.LOGIN;

let routeState =
    {};

let routerContext =
    {
        currentUser:
            null
    };

const routeListeners =
    new Set();

let routerInitialized =
    false;

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

function normalizeRoute(value) {

    let route =
        normalizeText(value);

    if (!route) {

        return ROUTES.OVERVIEW;
    }

    try {

        route =
            decodeURIComponent(
                route
            );
    }
    catch {

        route =
            String(route);
    }

    route =
        route
            .replace(/^#/, "")
            .split("?")[0]
            .trim();

    if (!route) {

        return ROUTES.OVERVIEW;
    }

    if (
        !route.startsWith("/")
    ) {

        route =
            `/${route}`;
    }

    route =
        route
            .replace(/\/+/g, "/");

    if (
        route.length > 1 &&
        route.endsWith("/")
    ) {

        route =
            route.slice(
                0,
                -1
            );
    }

    const redirectedRoute =
        LEGACY_ROUTE_REDIRECTS[
            route
        ];

    if (redirectedRoute) {

        return redirectedRoute;
    }

    return VALID_ROUTES.has(route)
        ? route
        : ROUTES.OVERVIEW;
}

/************************************************
 * URL AUSLESEN
 ************************************************/

function readRouteFromLocation() {

    const hash =
        normalizeText(
            window.location.hash
        );

    if (
        hash &&
        hash !== "#"
    ) {

        return normalizeRoute(
            hash
        );
    }

    const searchParameters =
        new URLSearchParams(
            window.location.search
        );

    const queryRoute =
        searchParameters.get(
            "route"
        );

    if (queryRoute) {

        return normalizeRoute(
            queryRoute
        );
    }

    const pathname =
        normalizeText(
            window.location.pathname
        );

    const knownRoute =
        Object.values(
            ROUTES
        ).find(
            (route) =>
                pathname.endsWith(
                    route
                )
        );

    if (knownRoute) {

        return knownRoute;
    }

    return ROUTES.OVERVIEW;
}

/************************************************
 * URL SCHREIBEN
 ************************************************/

function writeRouteToLocation(
    route,
    {
        replace = false
    } = {}
) {

    const normalizedRoute =
        normalizeRoute(route);

    const nextHash =
        `#${normalizedRoute}`;

    if (
        window.location.hash ===
        nextHash
    ) {

        return;
    }

    const nextUrl =
        `${window.location.pathname}${window.location.search}${nextHash}`;

    if (replace) {

        window.history.replaceState(
            {
                route:
                    normalizedRoute
            },
            "",
            nextUrl
        );

        return;
    }

    window.history.pushState(
        {
            route:
                normalizedRoute
        },
        "",
        nextUrl
    );
}

/************************************************
 * ROLLENZUGRIFF
 ************************************************/

export function canAccessRoute(
    route,
    role
) {

    const normalizedRoute =
        normalizeRoute(route);

    if (
        normalizedRoute ===
        ROUTES.LOGIN
    ) {

        return true;
    }

    const normalizedRole =
        normalizeRole(role);

    if (!normalizedRole) {

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
        normalizedRole
    );
}

/************************************************
 * STARTROUTE EINER ROLLE
 ************************************************/

export function getDefaultRouteForRole(role) {

    const normalizedRole =
        normalizeRole(role);

    if (
        !normalizedRole
    ) {

        return ROUTES.LOGIN;
    }

    return ROUTES.OVERVIEW;
}

/************************************************
 * ROUTE AUFLÖSEN
 ************************************************/

function resolveRouteForContext(
    requestedRoute,
    context =
        routerContext
) {

    const user =
        context?.currentUser ??
        null;

    const requested =
        normalizeRoute(
            requestedRoute
        );

    if (!user) {

        return ROUTES.LOGIN;
    }

    if (
        requested ===
        ROUTES.LOGIN
    ) {

        return getDefaultRouteForRole(
            user.role
        );
    }

    if (
        canAccessRoute(
            requested,
            user.role
        )
    ) {

        return requested;
    }

    return getDefaultRouteForRole(
        user.role
    );
}

/************************************************
 * LISTENER INFORMIEREN
 ************************************************/

function notifyRouteListeners() {

    const snapshot = {

        route:
            currentRoute,

        state:
            {
                ...routeState
            },

        context:
            {
                ...routerContext
            }
    };

    routeListeners.forEach(
        (listener) => {

            try {

                listener(
                    currentRoute,
                    snapshot
                );
            }
            catch (error) {

                console.error(
                    "Router-Listener konnte nicht ausgeführt werden:",
                    error
                );
            }
        }
    );
}

/************************************************
 * ROUTE SETZEN
 ************************************************/

function applyRoute(
    requestedRoute,
    {
        replace = false,
        updateUrl = true,
        notify = true
    } = {}
) {

    const resolvedRoute =
        resolveRouteForContext(
            requestedRoute,
            routerContext
        );

    const changed =
        resolvedRoute !==
        currentRoute;

    currentRoute =
        resolvedRoute;

    if (updateUrl) {

        writeRouteToLocation(
            resolvedRoute,
            {
                replace
            }
        );
    }

    if (
        changed ||
        notify
    ) {

        notifyRouteListeners();
    }

    return currentRoute;
}

/************************************************
 * ÖFFENTLICHE NAVIGATION
 ************************************************/

export function navigateTo(
    route,
    options =
        {}
) {

    return applyRoute(
        route,
        {
            replace:
                options.replace ===
                true,

            updateUrl:
                options.updateUrl !==
                false,

            notify:
                options.notify !==
                false
        }
    );
}

export function replaceRoute(route) {

    return navigateTo(
        route,
        {
            replace:
                true
        }
    );
}

export function getCurrentRoute() {

    return currentRoute;
}

/************************************************
 * ROUTENZUSTAND
 ************************************************/

export function getRouteState() {

    return {
        ...routeState
    };
}

export function setRouteState(
    nextState,
    {
        replace = false,
        notify = true
    } = {}
) {

    if (
        nextState === null ||
        nextState === undefined
    ) {

        routeState =
            {};
    }
    else if (replace) {

        routeState =
            {
                ...nextState
            };
    }
    else {

        routeState =
            {
                ...routeState,
                ...nextState
            };
    }

    if (notify) {

        notifyRouteListeners();
    }

    return getRouteState();
}

export function clearRouteState(
    {
        notify = true
    } = {}
) {

    routeState =
        {};

    if (notify) {

        notifyRouteListeners();
    }
}

/************************************************
 * ROUTER-KONTEXT
 ************************************************/

export function setRouterContext(
    context,
    {
        notify = false,
        resolve = true
    } = {}
) {

    routerContext =
        {
            ...routerContext,
            ...context
        };

    if (resolve) {

        currentRoute =
            resolveRouteForContext(
                currentRoute,
                routerContext
            );
    }

    if (notify) {

        notifyRouteListeners();
    }

    return {
        ...routerContext
    };
}

export function getRouterContext() {

    return {
        ...routerContext
    };
}

/************************************************
 * ROUTER-ABONNEMENT
 ************************************************/

export function subscribeToRoute(
    listener
) {

    if (
        typeof listener !==
        "function"
    ) {

        throw new TypeError(
            "Der Router-Listener muss eine Funktion sein."
        );
    }

    routeListeners.add(
        listener
    );

    return function unsubscribe() {

        routeListeners.delete(
            listener
        );
    };
}

/************************************************
 * BROWSER-NAVIGATION
 ************************************************/

function handleBrowserNavigation() {

    const requestedRoute =
        readRouteFromLocation();

    applyRoute(
        requestedRoute,
        {
            replace:
                true,

            updateUrl:
                false,

            notify:
                true
        }
    );
}

/************************************************
 * ROUTER INITIALISIEREN
 ************************************************/

export function initializeRouter(
    context =
        {}
) {

    routerContext =
        {
            ...routerContext,
            ...context
        };

    const requestedRoute =
        readRouteFromLocation();

    currentRoute =
        resolveRouteForContext(
            requestedRoute,
            routerContext
        );

    if (!routerInitialized) {

        window.addEventListener(
            "popstate",
            handleBrowserNavigation
        );

        window.addEventListener(
            "hashchange",
            handleBrowserNavigation
        );

        routerInitialized =
            true;
    }

    writeRouteToLocation(
        currentRoute,
        {
            replace:
                true
        }
    );

    return currentRoute;
}

/************************************************
 * ROUTER ZURÜCKSETZEN
 ************************************************/

export function resetRouter() {

    currentRoute =
        ROUTES.LOGIN;

    routeState =
        {};

    routerContext =
        {
            currentUser:
                null
        };

    writeRouteToLocation(
        ROUTES.LOGIN,
        {
            replace:
                true
        }
    );

    notifyRouteListeners();
}

/************************************************
 * HAUPTNAVIGATION NACH ROLLE
 ************************************************/

export function getMainNavigationForRole(role) {

    const normalizedRole =
        normalizeRole(role);

    const managementNavigation = [
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

            return managementNavigation;

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
                        "objects",

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
 * AKTIVE HAUPTROUTE
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
        ROUTES.MATERIALS
    ) {

        const normalizedRole =
            normalizeRole(role);

        if (
            normalizedRole ===
            USER_ROLES.MITARBEITER
        ) {

            return ROUTES.OBJECTS;
        }

        return ROUTES.OBJECTS;
    }

    if (
        [
            ROUTES.SETTINGS,
            ROUTES.HELP,
            ROUTES.PRIVACY,
            ROUTES.IMPRINT
        ].includes(
            normalizedRoute
        )
    ) {

        return ROUTES.MORE;
    }

    const navigation =
        getMainNavigationForRole(
            role
        );

    const matchingItem =
        navigation.find(
            (item) =>
                item.route ===
                normalizedRoute
        );

    return matchingItem
        ? matchingItem.route
        : ROUTES.OVERVIEW;
}

/************************************************
 * ROUTENINFORMATIONEN
 ************************************************/

export function getRouteTitle(route) {

    const normalizedRoute =
        normalizeRoute(route);

    const titles = {

        [ROUTES.LOGIN]:
            "Anmeldung",

        [ROUTES.OVERVIEW]:
            "Start",

        [ROUTES.OBJECTS]:
            "Objekte",

        [ROUTES.OBJECT_DETAIL]:
            "Objektdetails",

        [ROUTES.MATERIALS]:
            "Material",

        [ROUTES.TASKS]:
            "Aufgaben",

        [ROUTES.PERSONNEL]:
            "Personal",

        [ROUTES.COMMUNICATION]:
            "Kommunikation",

        [ROUTES.TIMES]:
            "Zeiten",

        [ROUTES.ANALYSIS]:
            "Auswertung",

        [ROUTES.REPORTS]:
            "Berichte",

        [ROUTES.MORE]:
            "Mehr",

        [ROUTES.SETTINGS]:
            "Einstellungen",

        [ROUTES.HELP]:
            "Hilfe",

        [ROUTES.PRIVACY]:
            "Datenschutz",

        [ROUTES.IMPRINT]:
            "Impressum"
    };

    return (
        titles[
            normalizedRoute
        ] ??
        "Facility OS"
    );
}

export function isValidRoute(route) {

    return VALID_ROUTES.has(
        normalizeRoute(route)
    );
}