/************************************************
 * Facility OS
 * router.js
 ************************************************/

import {
    APP_CONFIG
} from "./config/appConfig.js";

import {
    getAppState,
    setCurrentRoute
} from "./appState.js";

const PUBLIC_ROUTES = Object.freeze([
    "/login",
    "/datenschutz",
    "/impressum"
]);

const PROTECTED_ROUTES = Object.freeze([
    "/dashboard",
    "/object-detail",
    "/objects",
    "/employees",
    "/tasks",
    "/materials",
    "/tickets",
    "/reports",
    "/settings"
]);

let routeChangeCallback = null;

function normalizeRoute(route) {
    if (
        typeof route !== "string" ||
        route.trim() === ""
    ) {
        return APP_CONFIG.DEFAULT_ROUTE;
    }

    const normalizedRoute = route
        .trim()
        .replace(/^#/, "");

    return normalizedRoute.startsWith("/")
        ? normalizedRoute
        : `/${normalizedRoute}`;
}

function routeExists(route) {
    return (
        PUBLIC_ROUTES.includes(route) ||
        PROTECTED_ROUTES.includes(route)
    );
}

function protectRoute(route) {
    const state = getAppState();
    const isAuthenticated = Boolean(state.currentUser);
    const isProtected = PROTECTED_ROUTES.includes(route);

    if (isProtected && !isAuthenticated) {
        return "/login";
    }

    if (route === "/login" && isAuthenticated) {
        return APP_CONFIG.AUTHENTICATED_DEFAULT_ROUTE;
    }

    return route;
}

function resolveRoute(route) {
    const normalizedRoute = normalizeRoute(route);

    if (!routeExists(normalizedRoute)) {
        return protectRoute(
            APP_CONFIG.AUTHENTICATED_DEFAULT_ROUTE
        );
    }

    return protectRoute(normalizedRoute);
}

function emitRouteChange(route) {
    if (typeof routeChangeCallback === "function") {
        routeChangeCallback(
            route,
            getAppState()
        );
    }
}

function handleHashChange() {
    const requestedRoute =
        window.location.hash.slice(1);

    const resolvedRoute =
        resolveRoute(requestedRoute);

    const resolvedHash =
        `#${resolvedRoute}`;

    if (window.location.hash !== resolvedHash) {
        window.history.replaceState(
            null,
            "",
            resolvedHash
        );
    }

    setCurrentRoute(resolvedRoute);
    emitRouteChange(resolvedRoute);
}

export function initializeRouter(onRouteChange) {
    routeChangeCallback = onRouteChange;

    window.addEventListener(
        "hashchange",
        handleHashChange
    );

    handleHashChange();
}

export function navigateTo(route) {
    const resolvedRoute =
        resolveRoute(route);

    const newHash =
        `#${resolvedRoute}`;

    if (window.location.hash === newHash) {
        setCurrentRoute(resolvedRoute);
        emitRouteChange(resolvedRoute);
        return;
    }

    window.location.hash =
        resolvedRoute;
}

export function refreshRoute() {
    handleHashChange();
}