/************************************************
 * Facility OS
 * dataConfig.js
 ************************************************/

/**
 * Zentrale Konfiguration aller Datenquellen.
 *
 * Aktuell verwendet Facility OS lokale JSON-Testdaten.
 * Später kann jede Datenquelle über dieselben Schlüssel
 * auf eine geschützte API umgestellt werden.
 */

export const DATA_SOURCE_TYPES = Object.freeze({
    LOCAL_JSON: "LOCAL_JSON",
    API: "API",
    GOOGLE_SHEETS: "GOOGLE_SHEETS"
});

export const DATA_CONFIG = Object.freeze({

    /**
     * Aktuelle Datenquelle.
     *
     * LOCAL_JSON:
     * Daten werden aus src/data geladen.
     *
     * API:
     * Daten werden später über ein geschütztes Backend geladen.
     */
    SOURCE_TYPE: DATA_SOURCE_TYPES.LOCAL_JSON,

    /**
     * Basisverzeichnis relativ zur index.html.
     */
    LOCAL_DATA_BASE_PATH: "./src/data",

    /**
     * Spätere Backend-Adresse.
     * Im Frontend dürfen keine geheimen Zugangsdaten stehen.
     */
    API_BASE_URL: "",

    /**
     * Maximale Wartezeit pro Anfrage.
     */
    REQUEST_TIMEOUT_MS: 15000,

    /**
     * Anzahl der Wiederholungsversuche bei Ladefehlern.
     */
    REQUEST_RETRY_COUNT: 2,

    /**
     * Verzögerung zwischen Wiederholungsversuchen.
     */
    REQUEST_RETRY_DELAY_MS: 750,

    /**
     * Cache-Einstellungen.
     */
    CACHE: Object.freeze({
        ENABLED: true,
        STORAGE_KEY: "facility_os_data_cache",
        MAX_AGE_MINUTES: 60
    }),

    /**
     * Alle verfügbaren Datensammlungen.
     */
    COLLECTIONS: Object.freeze({

        USERS: "users",

        OBJECTS: "objects",

        ROOMS: "rooms",

        TASKS: "tasks",

        MATERIALS: "materials",

        MATERIAL_STOCK: "materialStock",

        SHIFTS: "shifts",

        CHECKINS: "checkins",

        CHECKOUTS: "checkouts",

        TICKETS: "tickets",

        MESSAGES: "messages",

        NOTIFICATIONS: "notifications",

        OBJECT_GUIDE: "objectGuide",

        OBJECT_SETTINGS: "objectSettings",

        TASK_LOGS: "taskLogs",

        TIME_DEVIATIONS: "timeDeviations",

        KEYBOOK: "keybook",

        CUSTOMER_ACCESS: "customerAccess",

        CUSTOMER_REQUESTS: "customerRequests",

        WORK_ORDERS: "workOrders",

        OBJECT_SECURITY: "objectSecurity",

        OBJECT_WASTE: "objectWaste",

        USER_PERFORMANCE: "userPerformance",

        HELP: "help"
    }),

    /**
     * Zuordnung der Sammlungen zu ihren JSON-Dateien.
     */
    FILES: Object.freeze({

        users:
            "./src/data/users.json",

        objects:
            "./src/data/objects.json",

        rooms:
            "./src/data/rooms.json",

        tasks:
            "./src/data/tasks.json",

        materials:
            "./src/data/materials.json",

        materialStock:
            "./src/data/materialStock.json",

        shifts:
            "./src/data/shifts.json",

        checkins:
            "./src/data/checkins.json",

        checkouts:
            "./src/data/checkouts.json",

        tickets:
            "./src/data/tickets.json",

        messages:
            "./src/data/messages.json",

        notifications:
            "./src/data/notifications.json",

        objectGuide:
            "./src/data/objectGuide.json",

        objectSettings:
            "./src/data/objectSettings.json",

        taskLogs:
            "./src/data/taskLogs.json",

        timeDeviations:
            "./src/data/timeDeviations.json",

        keybook:
            "./src/data/keybook.json",

        customerAccess:
            "./src/data/customerAccess.json",

        customerRequests:
            "./src/data/customerRequests.json",

        workOrders:
            "./src/data/workOrders.json",

        objectSecurity:
            "./src/data/objectSecurity.json",

        objectWaste:
            "./src/data/objectWaste.json",

        userPerformance:
            "./src/data/userPerformance.json",

        help:
            "./src/data/help.json"
    }),

    /**
     * Pflichtsammlungen.
     *
     * Wenn eine dieser Dateien fehlt oder ungültig ist,
     * gilt der App-Start als fehlgeschlagen.
     */
    REQUIRED_COLLECTIONS: Object.freeze([
        "users",
        "objects",
        "rooms",
        "tasks",
        "materials",
        "shifts",
        "tickets"
    ]),

    /**
     * Optionale Sammlungen.
     *
     * Diese dürfen leer sein, ohne den App-Start zu blockieren.
     */
    OPTIONAL_COLLECTIONS: Object.freeze([
        "materialStock",
        "checkins",
        "checkouts",
        "messages",
        "notifications",
        "objectGuide",
        "objectSettings",
        "taskLogs",
        "timeDeviations",
        "keybook",
        "customerAccess",
        "customerRequests",
        "workOrders",
        "objectSecurity",
        "objectWaste",
        "userPerformance",
        "help"
    ]),

    /**
     * API-Aktionen für eine spätere Backend-Anbindung.
     */
    ACTIONS: Object.freeze({

        LOGIN: "LOGIN",

        LOGOUT: "LOGOUT",

        GET_ALL_DATA: "GET_ALL_DATA",

        GET_USERS: "GET_USERS",

        GET_OBJECTS: "GET_OBJECTS",

        GET_ROOMS: "GET_ROOMS",

        GET_TASKS: "GET_TASKS",

        GET_MATERIALS: "GET_MATERIALS",

        GET_MATERIAL_STOCK:
            "GET_MATERIAL_STOCK",

        GET_SHIFTS: "GET_SHIFTS",

        GET_CHECKINS: "GET_CHECKINS",

        GET_CHECKOUTS: "GET_CHECKOUTS",

        GET_TICKETS: "GET_TICKETS",

        GET_MESSAGES: "GET_MESSAGES",

        GET_NOTIFICATIONS:
            "GET_NOTIFICATIONS",

        GET_OBJECT_GUIDE:
            "GET_OBJECT_GUIDE",

        GET_OBJECT_SETTINGS:
            "GET_OBJECT_SETTINGS",

        GET_TASK_LOGS:
            "GET_TASK_LOGS",

        GET_TIME_DEVIATIONS:
            "GET_TIME_DEVIATIONS",

        GET_KEYBOOK: "GET_KEYBOOK",

        GET_CUSTOMER_ACCESS:
            "GET_CUSTOMER_ACCESS",

        GET_CUSTOMER_REQUESTS:
            "GET_CUSTOMER_REQUESTS",

        GET_WORK_ORDERS:
            "GET_WORK_ORDERS",

        GET_OBJECT_SECURITY:
            "GET_OBJECT_SECURITY",

        GET_OBJECT_WASTE:
            "GET_OBJECT_WASTE",

        GET_USER_PERFORMANCE:
            "GET_USER_PERFORMANCE",

        GET_HELP: "GET_HELP",

        CHECK_IN: "CHECK_IN",

        CHECK_OUT: "CHECK_OUT",

        CREATE_TICKET: "CREATE_TICKET",

        UPDATE_TICKET: "UPDATE_TICKET",

        UPDATE_TASK: "UPDATE_TASK",

        CREATE_CUSTOMER_REQUEST:
            "CREATE_CUSTOMER_REQUEST",

        CREATE_WORK_ORDER:
            "CREATE_WORK_ORDER"
    })
});

/************************************************
 * HELFER
 ************************************************/

/**
 * Gibt den Dateipfad einer Sammlung zurück.
 *
 * @param {string} collectionName
 * @returns {string}
 */
export function getDataFilePath(
    collectionName
) {

    if (
        typeof collectionName !== "string" ||
        collectionName.trim() === ""
    ) {

        throw new TypeError(
            "Der Name der Datensammlung fehlt."
        );
    }

    const normalizedName =
        collectionName.trim();

    const filePath =
        DATA_CONFIG.FILES[normalizedName];

    if (!filePath) {

        throw new Error(
            `Für die Datensammlung "${normalizedName}" wurde keine Datei konfiguriert.`
        );
    }

    return filePath;
}

/**
 * Prüft, ob eine Sammlung zwingend erforderlich ist.
 *
 * @param {string} collectionName
 * @returns {boolean}
 */
export function isRequiredCollection(
    collectionName
) {

    return DATA_CONFIG
        .REQUIRED_COLLECTIONS
        .includes(collectionName);
}

/**
 * Gibt alle konfigurierten Sammlungsnamen zurück.
 *
 * @returns {string[]}
 */
export function getConfiguredCollections() {

    return Object.keys(
        DATA_CONFIG.FILES
    );
}

/**
 * Prüft die Datenkonfiguration.
 *
 * @returns {{
 *   valid: boolean,
 *   errors: string[],
 *   collections: string[]
 * }}
 */
export function validateDataConfig() {

    const errors = [];

    const collections =
        getConfiguredCollections();

    DATA_CONFIG
        .REQUIRED_COLLECTIONS
        .forEach((collectionName) => {

            if (
                !DATA_CONFIG.FILES[
                    collectionName
                ]
            ) {

                errors.push(
                    `Pflichtsammlung ohne Dateipfad: ${collectionName}`
                );
            }
        });

    collections.forEach(
        (collectionName) => {

            const filePath =
                DATA_CONFIG.FILES[
                    collectionName
                ];

            if (
                typeof filePath !== "string" ||
                !filePath.endsWith(".json")
            ) {

                errors.push(
                    `Ungültiger JSON-Dateipfad für ${collectionName}`
                );
            }
        }
    );

    return {

        valid:
            errors.length === 0,

        errors,

        collections
    };
}