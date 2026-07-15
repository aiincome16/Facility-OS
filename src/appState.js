/************************************************
 * Facility OS 2.0
 * appState.js
 ************************************************/

import {
    APP_CONFIG
} from "./config/appConfig.js";

import {
    loadFromStorage,
    saveToStorage,
    removeFromStorage
} from "./services/storageService.js";

const initialState = Object.freeze({

    initialized: false,

    loading: false,

    error: null,

    currentRoute: APP_CONFIG.DEFAULT_ROUTE,

    currentUser: null,

    currentObject: null,

    currentShift: null,

    shiftStarted: false,

    users: [],

    objects: [],

    rooms: [],

    tasks: [],

    shifts: [],

    tickets: [],

    messages: [],

    materials: [],

    notifications: []

});

let appState = createInitialState();

const listeners = new Set();

function createInitialState() {

    return {
        ...initialState,

        users: [],
        objects: [],
        rooms: [],
        tasks: [],
        shifts: [],
        tickets: [],
        messages: [],
        materials: [],
        notifications: []
    };
}

function notifyListeners() {

    listeners.forEach((listener) => {

        try {

            listener(getAppState());

        } catch (error) {

            console.error(
                "Fehler in einem App-State-Listener:",
                error
            );
        }
    });
}

function persistSession() {

    const session = {

        currentUser: appState.currentUser,

        currentObject: appState.currentObject,

        currentShift: appState.currentShift,

        shiftStarted: appState.shiftStarted,

        savedAt: new Date().toISOString()

    };

    saveToStorage(
        APP_CONFIG.STORAGE_KEYS.SESSION,
        session
    );
}

export function initializeAppState() {

    const storedSession = loadFromStorage(
        APP_CONFIG.STORAGE_KEYS.SESSION,
        null
    );

    if (storedSession?.currentUser) {

        appState = {
            ...appState,

            currentUser: storedSession.currentUser,

            currentObject:
                storedSession.currentObject ?? null,

            currentShift:
                storedSession.currentShift ?? null,

            shiftStarted:
                Boolean(storedSession.shiftStarted),

            currentRoute:
                APP_CONFIG.AUTHENTICATED_DEFAULT_ROUTE
        };
    }

    appState.initialized = true;

    notifyListeners();

    return getAppState();
}

export function getAppState() {

    return {
        ...appState,

        users: [...appState.users],

        objects: [...appState.objects],

        rooms: [...appState.rooms],

        tasks: [...appState.tasks],

        shifts: [...appState.shifts],

        tickets: [...appState.tickets],

        messages: [...appState.messages],

        materials: [...appState.materials],

        notifications: [...appState.notifications]
    };
}

export function updateAppState(partialState) {

    if (
        !partialState ||
        typeof partialState !== "object" ||
        Array.isArray(partialState)
    ) {

        throw new TypeError(
            "updateAppState erwartet ein Objekt."
        );
    }

    appState = {
        ...appState,
        ...partialState
    };

    notifyListeners();

    return getAppState();
}

export function setLoading(loading) {

    updateAppState({
        loading: Boolean(loading)
    });
}

export function setError(error) {

    updateAppState({
        error: error
            ? String(error.message ?? error)
            : null
    });
}

export function setCurrentRoute(route) {

    updateAppState({
        currentRoute: route
    });
}

export function setCurrentUser(user) {

    if (!user?.id || !user?.role) {

        throw new Error(
            "Der Benutzer benötigt mindestens eine ID und eine Rolle."
        );
    }

    appState = {
        ...appState,

        currentUser: {
            ...user
        },

        error: null
    };

    persistSession();

    notifyListeners();
}

export function logoutCurrentUser() {

    appState = createInitialState();

    appState.initialized = true;

    removeFromStorage(
        APP_CONFIG.STORAGE_KEYS.SESSION
    );

    notifyListeners();
}

export function setCurrentObject(object) {

    appState = {
        ...appState,

        currentObject: object
            ? { ...object }
            : null
    };

    persistSession();

    notifyListeners();
}

export function startShift(shift = null) {

    appState = {
        ...appState,

        currentShift: shift
            ? { ...shift }
            : null,

        shiftStarted: true
    };

    persistSession();

    notifyListeners();
}

export function stopShift() {

    appState = {
        ...appState,

        currentShift: null,

        shiftStarted: false
    };

    persistSession();

    notifyListeners();
}

export function resetAppState() {

    appState = createInitialState();

    appState.initialized = true;

    removeFromStorage(
        APP_CONFIG.STORAGE_KEYS.SESSION
    );

    notifyListeners();
}

export function subscribeToAppState(listener) {

    if (typeof listener !== "function") {

        throw new TypeError(
            "Der App-State-Listener muss eine Funktion sein."
        );
    }

    listeners.add(listener);

    return function unsubscribe() {

        listeners.delete(listener);
    };
}