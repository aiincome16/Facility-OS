/************************************************
 * Facility OS
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

/************************************************
 * GRUNDZUSTAND
 ************************************************/

const INITIAL_STATE = Object.freeze({

    initialized: false,

    dataLoaded: false,

    loading: false,

    error: null,

    dataSource: null,

    dataLoadedAt: null,

    dataWarnings: [],

    currentRoute:
        APP_CONFIG.DEFAULT_ROUTE,

    currentUser: null,

    currentObject: null,

    currentShift: null,

    shiftStarted: false,

    users: [],

    objects: [],

    rooms: [],

    tasks: [],

    materials: [],

    materialStock: [],

    shifts: [],

    checkins: [],

    checkouts: [],

    tickets: [],

    messages: [],

    notifications: [],

    objectGuide: [],

    objectSettings: [],

    taskLogs: [],

    timeDeviations: [],

    keybook: [],

    customerAccess: [],

    customerRequests: [],

    workOrders: [],

    objectSecurity: [],

    objectWaste: [],

    userPerformance: [],

    help: []
});

/************************************************
 * INTERNE VARIABLEN
 ************************************************/

let appState =
    createInitialState();

const listeners =
    new Set();

/************************************************
 * INTERNE HELFER
 ************************************************/

function createInitialState() {

    return {

        ...INITIAL_STATE,

        dataWarnings: [],

        users: [],

        objects: [],

        rooms: [],

        tasks: [],

        materials: [],

        materialStock: [],

        shifts: [],

        checkins: [],

        checkouts: [],

        tickets: [],

        messages: [],

        notifications: [],

        objectGuide: [],

        objectSettings: [],

        taskLogs: [],

        timeDeviations: [],

        keybook: [],

        customerAccess: [],

        customerRequests: [],

        workOrders: [],

        objectSecurity: [],

        objectWaste: [],

        userPerformance: [],

        help: []
    };
}

function cloneValue(value) {

    if (
        typeof structuredClone ===
        "function"
    ) {

        return structuredClone(value);
    }

    return JSON.parse(
        JSON.stringify(value)
    );
}

function normalizeArray(value) {

    return Array.isArray(value)
        ? [...value]
        : [];
}

function notifyListeners() {

    const stateSnapshot =
        getAppState();

    listeners.forEach(
        (listener) => {

            try {

                listener(
                    stateSnapshot
                );

            } catch (error) {

                console.error(
                    "Fehler in einem App-State-Listener:",
                    error
                );
            }
        }
    );
}

function persistSession() {

    const session = {

        currentUser:
            appState.currentUser,

        currentObject:
            appState.currentObject,

        currentShift:
            appState.currentShift,

        shiftStarted:
            appState.shiftStarted,

        savedAt:
            new Date().toISOString()
    };

    saveToStorage(
        APP_CONFIG.STORAGE_KEYS.SESSION,
        session
    );
}

function isSessionExpired(
    savedAt
) {

    if (!savedAt) {
        return true;
    }

    const savedAtTime =
        new Date(savedAt).getTime();

    if (
        Number.isNaN(savedAtTime)
    ) {

        return true;
    }

    const timeoutMinutes =
        Number(
            APP_CONFIG
                .SESSION_TIMEOUT_MINUTES
        );

    const timeoutMs =
        timeoutMinutes *
        60 *
        1000;

    return (
        Date.now() - savedAtTime >
        timeoutMs
    );
}

/************************************************
 * INITIALISIERUNG
 ************************************************/

export function initializeAppState() {

    const storedSession =
        loadFromStorage(
            APP_CONFIG.STORAGE_KEYS.SESSION,
            null
        );

    if (
        storedSession?.currentUser &&
        !isSessionExpired(
            storedSession.savedAt
        )
    ) {

        appState = {

            ...appState,

            currentUser:
                cloneValue(
                    storedSession.currentUser
                ),

            currentObject:
                storedSession.currentObject
                    ? cloneValue(
                        storedSession.currentObject
                    )
                    : null,

            currentShift:
                storedSession.currentShift
                    ? cloneValue(
                        storedSession.currentShift
                    )
                    : null,

            shiftStarted:
                Boolean(
                    storedSession.shiftStarted
                ),

            currentRoute:
                APP_CONFIG
                    .AUTHENTICATED_DEFAULT_ROUTE
        };

    } else {

        removeFromStorage(
            APP_CONFIG.STORAGE_KEYS.SESSION
        );
    }

    appState.initialized = true;

    notifyListeners();

    return getAppState();
}

/************************************************
 * STATE LESEN
 ************************************************/

export function getAppState() {

    return cloneValue(
        appState
    );
}

/************************************************
 * STATE AKTUALISIEREN
 ************************************************/

export function updateAppState(
    partialState
) {

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

        ...cloneValue(
            partialState
        )
    };

    notifyListeners();

    return getAppState();
}

/************************************************
 * DATEN ÜBERNEHMEN
 ************************************************/

export function setDataCollections(
    collections,
    metadata = {}
) {

    if (
        !collections ||
        typeof collections !== "object" ||
        Array.isArray(collections)
    ) {

        throw new TypeError(
            "Die geladenen Daten müssen als Objekt übergeben werden."
        );
    }

    appState = {

        ...appState,

        users:
            normalizeArray(
                collections.users
            ),

        objects:
            normalizeArray(
                collections.objects
            ),

        rooms:
            normalizeArray(
                collections.rooms
            ),

        tasks:
            normalizeArray(
                collections.tasks
            ),

        materials:
            normalizeArray(
                collections.materials
            ),

        materialStock:
            normalizeArray(
                collections.materialStock
            ),

        shifts:
            normalizeArray(
                collections.shifts
            ),

        checkins:
            normalizeArray(
                collections.checkins
            ),

        checkouts:
            normalizeArray(
                collections.checkouts
            ),

        tickets:
            normalizeArray(
                collections.tickets
            ),

        messages:
            normalizeArray(
                collections.messages
            ),

        notifications:
            normalizeArray(
                collections.notifications
            ),

        objectGuide:
            normalizeArray(
                collections.objectGuide
            ),

        objectSettings:
            normalizeArray(
                collections.objectSettings
            ),

        taskLogs:
            normalizeArray(
                collections.taskLogs
            ),

        timeDeviations:
            normalizeArray(
                collections.timeDeviations
            ),

        keybook:
            normalizeArray(
                collections.keybook
            ),

        customerAccess:
            normalizeArray(
                collections.customerAccess
            ),

        customerRequests:
            normalizeArray(
                collections.customerRequests
            ),

        workOrders:
            normalizeArray(
                collections.workOrders
            ),

        objectSecurity:
            normalizeArray(
                collections.objectSecurity
            ),

        objectWaste:
            normalizeArray(
                collections.objectWaste
            ),

        userPerformance:
            normalizeArray(
                collections.userPerformance
            ),

        help:
            normalizeArray(
                collections.help
            ),

        dataLoaded: true,

        dataSource:
            metadata.source ??
            null,

        dataLoadedAt:
            metadata.loadedAt ??
            new Date().toISOString(),

        dataWarnings:
            normalizeArray(
                metadata.warnings
            ),

        loading: false,

        error: null
    };

    notifyListeners();

    return getAppState();
}

/************************************************
 * LADESTATUS
 ************************************************/

export function setLoading(
    loading
) {

    updateAppState({

        loading:
            Boolean(loading)
    });
}

export function setError(
    error
) {

    updateAppState({

        error:
            error
                ? String(
                    error.message ??
                    error
                )
                : null,

        loading: false
    });
}

export function clearError() {

    updateAppState({
        error: null
    });
}

/************************************************
 * ROUTING
 ************************************************/

export function setCurrentRoute(
    route
) {

    if (
        typeof route !== "string" ||
        route.trim() === ""
    ) {

        return;
    }

    updateAppState({

        currentRoute:
            route.trim()
    });
}

/************************************************
 * BENUTZER
 ************************************************/

export function setCurrentUser(
    user
) {

    if (
        !user ||
        typeof user !== "object"
    ) {

        throw new TypeError(
            "Es wurde kein gültiger Benutzer übergeben."
        );
    }

    if (!user.id) {

        throw new Error(
            "Der Benutzer benötigt eine ID."
        );
    }

    if (!user.role) {

        throw new Error(
            "Der Benutzer benötigt eine Rolle."
        );
    }

    appState = {

        ...appState,

        currentUser:
            cloneValue(user),

        currentObject: null,

        currentShift: null,

        shiftStarted: false,

        error: null
    };

    persistSession();

    notifyListeners();

    return getAppState();
}

export function logoutCurrentUser() {

    appState = {

        ...appState,

        currentUser: null,

        currentObject: null,

        currentShift: null,

        shiftStarted: false,

        currentRoute:
            APP_CONFIG.DEFAULT_ROUTE,

        error: null
    };

    removeFromStorage(
        APP_CONFIG.STORAGE_KEYS.SESSION
    );

    notifyListeners();

    return getAppState();
}

/************************************************
 * OBJEKT
 ************************************************/

export function setCurrentObject(
    object
) {

    appState = {

        ...appState,

        currentObject:
            object
                ? cloneValue(object)
                : null
    };

    persistSession();

    notifyListeners();

    return getAppState();
}

/************************************************
 * SCHICHT
 ************************************************/

export function setCurrentShift(
    shift
) {

    appState = {

        ...appState,

        currentShift:
            shift
                ? cloneValue(shift)
                : null,

        shiftStarted:
            Boolean(
                shift &&
                shift.status === "ACTIVE"
            )
    };

    persistSession();

    notifyListeners();

    return getAppState();
}

export function startShift(
    shift = null
) {

    const activeShift = {

        ...(shift
            ? cloneValue(shift)
            : {}),

        status: "ACTIVE"
    };

    appState = {

        ...appState,

        currentShift:
            activeShift,

        shiftStarted: true
    };

    persistSession();

    notifyListeners();

    return getAppState();
}

export function stopShift() {

    appState = {

        ...appState,

        currentShift: null,

        shiftStarted: false
    };

    persistSession();

    notifyListeners();

    return getAppState();
}

/************************************************
 * DATENSUCHE
 ************************************************/

export function findUserById(
    userId
) {

    return (
        appState.users.find(
            (user) =>
                user.id === userId
        ) ?? null
    );
}

export function findObjectById(
    objectId
) {

    return (
        appState.objects.find(
            (object) =>
                object.id === objectId
        ) ?? null
    );
}

export function findRoomById(
    roomId
) {

    return (
        appState.rooms.find(
            (room) =>
                room.id === roomId
        ) ?? null
    );
}

export function findTaskById(
    taskId
) {

    return (
        appState.tasks.find(
            (task) =>
                task.id === taskId
        ) ?? null
    );
}

export function getObjectsForUser(
    userId
) {

    const user =
        findUserById(
            userId
        );

    if (!user) {
        return [];
    }

    const assignedObjectIds =
        Array.isArray(
            user.assignedObjectIds
        )
            ? user.assignedObjectIds
            : [];

    return appState.objects.filter(
        (object) => {

            return (
                assignedObjectIds.includes(
                    object.id
                ) ||
                object.objectLeaderId ===
                    userId
            );
        }
    );
}

export function getRoomsForObject(
    objectId
) {

    return appState.rooms
        .filter(
            (room) =>
                room.objectId ===
                objectId
        )
        .sort(
            (firstRoom, secondRoom) => {

                return (
                    Number(
                        firstRoom.sequence ?? 0
                    ) -
                    Number(
                        secondRoom.sequence ?? 0
                    )
                );
            }
        );
}

export function getTasksForObject(
    objectId
) {

    return appState.tasks
        .filter(
            (task) =>
                task.objectId ===
                objectId
        )
        .sort(
            (firstTask, secondTask) => {

                return (
                    Number(
                        firstTask.sequence ?? 0
                    ) -
                    Number(
                        secondTask.sequence ?? 0
                    )
                );
            }
        );
}

export function getTasksForRoom(
    roomId
) {

    return appState.tasks
        .filter(
            (task) =>
                task.roomId ===
                roomId
        )
        .sort(
            (firstTask, secondTask) => {

                return (
                    Number(
                        firstTask.sequence ?? 0
                    ) -
                    Number(
                        secondTask.sequence ?? 0
                    )
                );
            }
        );
}

export function getTicketsForObject(
    objectId
) {

    return appState.tickets.filter(
        (ticket) =>
            ticket.objectId ===
            objectId
    );
}

export function getNotificationsForUser(
    userId
) {

    return appState.notifications.filter(
        (notification) =>
            notification.userId ===
            userId
    );
}

/************************************************
 * STATE ZURÜCKSETZEN
 ************************************************/

export function resetAppState() {

    appState =
        createInitialState();

    appState.initialized = true;

    removeFromStorage(
        APP_CONFIG.STORAGE_KEYS.SESSION
    );

    notifyListeners();

    return getAppState();
}

/************************************************
 * LISTENER
 ************************************************/

export function subscribeToAppState(
    listener
) {

    if (
        typeof listener !==
        "function"
    ) {

        throw new TypeError(
            "Der App-State-Listener muss eine Funktion sein."
        );
    }

    listeners.add(
        listener
    );

    return function unsubscribe() {

        listeners.delete(
            listener
        );
    };
}