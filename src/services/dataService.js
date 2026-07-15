/************************************************
 * Facility OS
 * dataService.js
 ************************************************/

import {
    DATA_CONFIG,
    DATA_SOURCE_TYPES,
    getConfiguredCollections,
    getDataFilePath,
    isRequiredCollection,
    validateDataConfig
} from "../config/dataConfig.js";

import {
    loadFromStorage,
    saveToStorage,
    removeFromStorage
} from "./storageService.js";

/************************************************
 * INTERNE HILFSFUNKTIONEN
 ************************************************/

/**
 * Wartet eine bestimmte Zeit.
 *
 * @param {number} milliseconds
 * @returns {Promise<void>}
 */
function wait(milliseconds) {

    return new Promise((resolve) => {

        window.setTimeout(
            resolve,
            milliseconds
        );
    });
}

/**
 * Prüft, ob ein Wert ein einfaches Objekt ist.
 *
 * @param {*} value
 * @returns {boolean}
 */
function isPlainObject(value) {

    return (
        value !== null &&
        typeof value === "object" &&
        !Array.isArray(value)
    );
}

/**
 * Erstellt eine sichere Kopie von Daten.
 *
 * @param {*} value
 * @returns {*}
 */
function cloneData(value) {

    if (
        typeof structuredClone === "function"
    ) {

        return structuredClone(value);
    }

    return JSON.parse(
        JSON.stringify(value)
    );
}

/**
 * Erzeugt einen Timeout für Fetch-Anfragen.
 *
 * @param {number} timeoutMs
 * @returns {{
 *   controller: AbortController,
 *   timeoutId: number
 * }}
 */
function createRequestTimeout(
    timeoutMs
) {

    const controller =
        new AbortController();

    const timeoutId =
        window.setTimeout(
            () => {

                controller.abort();

            },
            timeoutMs
        );

    return {
        controller,
        timeoutId
    };
}

/************************************************
 * DATENPRÜFUNG
 ************************************************/

/**
 * Prüft eine einzelne Datensammlung.
 *
 * @param {string} collectionName
 * @param {*} data
 * @returns {Array}
 */
function validateCollectionData(
    collectionName,
    data
) {

    if (!Array.isArray(data)) {

        throw new TypeError(
            `Die Datensammlung "${collectionName}" muss ein JSON-Array enthalten.`
        );
    }

    const invalidEntries = [];

    data.forEach(
        (entry, index) => {

            if (!isPlainObject(entry)) {

                invalidEntries.push(
                    `Eintrag ${index + 1} ist kein Objekt.`
                );

                return;
            }

            if (
                entry.id === undefined ||
                entry.id === null ||
                String(entry.id).trim() === ""
            ) {

                invalidEntries.push(
                    `Eintrag ${index + 1} besitzt keine gültige ID.`
                );
            }
        }
    );

    if (invalidEntries.length > 0) {

        throw new Error(
            `Ungültige Daten in "${collectionName}": ${invalidEntries.join(" ")}`
        );
    }

    const ids =
        data.map(
            (entry) =>
                String(entry.id).trim()
        );

    const duplicateIds =
        ids.filter(
            (id, index) =>
                ids.indexOf(id) !== index
        );

    if (duplicateIds.length > 0) {

        const uniqueDuplicateIds =
            [...new Set(duplicateIds)];

        throw new Error(
            `Doppelte IDs in "${collectionName}": ${uniqueDuplicateIds.join(", ")}`
        );
    }

    return data;
}

/************************************************
 * JSON LADEN
 ************************************************/

/**
 * Lädt eine JSON-Datei.
 *
 * @param {string} url
 * @param {string} collectionName
 * @returns {Promise<Array>}
 */
async function fetchJsonFile(
    url,
    collectionName
) {

    const {
        controller,
        timeoutId
    } = createRequestTimeout(
        DATA_CONFIG.REQUEST_TIMEOUT_MS
    );

    try {

        const response =
            await fetch(
                url,
                {
                    method: "GET",

                    headers: {
                        Accept:
                            "application/json"
                    },

                    cache: "no-store",

                    signal:
                        controller.signal
                }
            );

        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}: ${response.statusText}`
            );
        }

        const contentType =
            response.headers.get(
                "content-type"
            ) ?? "";

        if (
            !contentType.includes(
                "application/json"
            )
        ) {

            throw new Error(
                `Die Datei "${url}" liefert kein gültiges JSON.`
            );
        }

        const data =
            await response.json();

        return validateCollectionData(
            collectionName,
            data
        );

    } catch (error) {

        if (
            error?.name ===
            "AbortError"
        ) {

            throw new Error(
                `Zeitüberschreitung beim Laden von "${collectionName}".`
            );
        }

        throw new Error(
            `Die Datensammlung "${collectionName}" konnte nicht geladen werden: ${error.message}`
        );

    } finally {

        window.clearTimeout(
            timeoutId
        );
    }
}

/**
 * Lädt eine Sammlung mit Wiederholungsversuchen.
 *
 * @param {string} collectionName
 * @returns {Promise<Array>}
 */
async function loadCollectionWithRetry(
    collectionName
) {

    const filePath =
        getDataFilePath(
            collectionName
        );

    const maximumAttempts =
        DATA_CONFIG.REQUEST_RETRY_COUNT + 1;

    let lastError = null;

    for (
        let attempt = 1;
        attempt <= maximumAttempts;
        attempt += 1
    ) {

        try {

            return await fetchJsonFile(
                filePath,
                collectionName
            );

        } catch (error) {

            lastError = error;

            console.warn(
                `Ladeversuch ${attempt} von ${maximumAttempts} für "${collectionName}" fehlgeschlagen.`,
                error
            );

            if (
                attempt < maximumAttempts
            ) {

                await wait(
                    DATA_CONFIG
                        .REQUEST_RETRY_DELAY_MS *
                    attempt
                );
            }
        }
    }

    throw lastError;
}

/************************************************
 * CACHE
 ************************************************/

/**
 * Prüft, ob ein Cache gültig ist.
 *
 * @param {*} cache
 * @returns {boolean}
 */
function isValidCache(cache) {

    if (
        !DATA_CONFIG.CACHE.ENABLED ||
        !isPlainObject(cache) ||
        !cache.savedAt ||
        !isPlainObject(cache.data)
    ) {

        return false;
    }

    const savedAt =
        new Date(
            cache.savedAt
        ).getTime();

    if (
        Number.isNaN(savedAt)
    ) {

        return false;
    }

    const maximumAgeMs =
        DATA_CONFIG
            .CACHE
            .MAX_AGE_MINUTES *
        60 *
        1000;

    return (
        Date.now() - savedAt <=
        maximumAgeMs
    );
}

/**
 * Lädt den Daten-Cache.
 *
 * @returns {Object|null}
 */
function loadDataCache() {

    if (
        !DATA_CONFIG.CACHE.ENABLED
    ) {

        return null;
    }

    const cache =
        loadFromStorage(
            DATA_CONFIG.CACHE.STORAGE_KEY,
            null
        );

    if (!isValidCache(cache)) {

        return null;
    }

    return cloneData(
        cache.data
    );
}

/**
 * Speichert Daten im Cache.
 *
 * @param {Object} data
 * @returns {boolean}
 */
function saveDataCache(data) {

    if (
        !DATA_CONFIG.CACHE.ENABLED
    ) {

        return false;
    }

    return saveToStorage(
        DATA_CONFIG.CACHE.STORAGE_KEY,
        {
            savedAt:
                new Date().toISOString(),

            data:
                cloneData(data)
        }
    );
}

/**
 * Löscht den Daten-Cache.
 *
 * @returns {boolean}
 */
export function clearDataCache() {

    return removeFromStorage(
        DATA_CONFIG.CACHE.STORAGE_KEY
    );
}

/************************************************
 * LOKALE JSON-DATEN
 ************************************************/

/**
 * Lädt alle lokalen JSON-Sammlungen.
 *
 * @returns {Promise<{
 *   data: Object,
 *   errors: Array,
 *   source: string
 * }>}
 */
async function loadLocalJsonData() {

    const collections =
        getConfiguredCollections();

    const results =
        await Promise.allSettled(
            collections.map(
                async (
                    collectionName
                ) => {

                    const data =
                        await loadCollectionWithRetry(
                            collectionName
                        );

                    return {
                        collectionName,
                        data
                    };
                }
            )
        );

    const data = {};

    const errors = [];

    results.forEach(
        (result, index) => {

            const collectionName =
                collections[index];

            if (
                result.status ===
                "fulfilled"
            ) {

                data[collectionName] =
                    result.value.data;

                return;
            }

            const required =
                isRequiredCollection(
                    collectionName
                );

            const errorEntry = {

                collection:
                    collectionName,

                required,

                message:
                    result.reason?.message ??
                    String(result.reason)
            };

            errors.push(
                errorEntry
            );

            if (!required) {

                data[collectionName] = [];
            }
        }
    );

    const requiredErrors =
        errors.filter(
            (error) =>
                error.required
        );

    if (
        requiredErrors.length > 0
    ) {

        const message =
            requiredErrors
                .map(
                    (error) =>
                        `${error.collection}: ${error.message}`
                )
                .join(" | ");

        throw new Error(
            `Pflichtdaten konnten nicht geladen werden. ${message}`
        );
    }

    return {
        data,
        errors,
        source:
            DATA_SOURCE_TYPES.LOCAL_JSON
    };
}

/************************************************
 * API-DATEN
 ************************************************/

/**
 * Platzhalter für eine spätere geschützte API.
 *
 * @returns {Promise<never>}
 */
async function loadApiData() {

    if (
        !DATA_CONFIG.API_BASE_URL
    ) {

        throw new Error(
            "Für die API-Datenquelle wurde keine Backend-Adresse konfiguriert."
        );
    }

    throw new Error(
        "Die geschützte API-Anbindung ist noch nicht eingerichtet."
    );
}

/************************************************
 * HAUPTFUNKTIONEN
 ************************************************/

/**
 * Lädt alle Facility-OS-Daten.
 *
 * @param {{
 *   forceReload?: boolean,
 *   useCache?: boolean
 * }} options
 *
 * @returns {Promise<{
 *   data: Object,
 *   errors: Array,
 *   source: string,
 *   loadedAt: string,
 *   fromCache: boolean
 * }>}
 */
export async function loadAllData(
    options = {}
) {

    const {
        forceReload = false,
        useCache = true
    } = options;

    const configValidation =
        validateDataConfig();

    if (
        !configValidation.valid
    ) {

        throw new Error(
            `Ungültige Datenkonfiguration: ${configValidation.errors.join(" | ")}`
        );
    }

    if (
        useCache &&
        !forceReload
    ) {

        const cachedData =
            loadDataCache();

        if (cachedData) {

            return {

                data: cachedData,

                errors: [],

                source: "CACHE",

                loadedAt:
                    new Date().toISOString(),

                fromCache: true
            };
        }
    }

    let result;

    switch (
        DATA_CONFIG.SOURCE_TYPE
    ) {

        case DATA_SOURCE_TYPES.LOCAL_JSON:

            result =
                await loadLocalJsonData();

            break;

        case DATA_SOURCE_TYPES.API:

            result =
                await loadApiData();

            break;

        case DATA_SOURCE_TYPES.GOOGLE_SHEETS:

            throw new Error(
                "Eine direkte Google-Sheets-Anbindung im Frontend ist aus Sicherheitsgründen nicht aktiviert."
            );

        default:

            throw new Error(
                `Unbekannte Datenquelle: ${DATA_CONFIG.SOURCE_TYPE}`
            );
    }

    saveDataCache(
        result.data
    );

    return {

        ...result,

        loadedAt:
            new Date().toISOString(),

        fromCache: false
    };
}

/**
 * Lädt eine einzelne Sammlung.
 *
 * @param {string} collectionName
 * @param {{
 *   useCache?: boolean
 * }} options
 *
 * @returns {Promise<Array>}
 */
export async function loadCollection(
    collectionName,
    options = {}
) {

    const {
        useCache = true
    } = options;

    if (
        typeof collectionName !==
            "string" ||
        collectionName.trim() === ""
    ) {

        throw new TypeError(
            "Der Name der Datensammlung fehlt."
        );
    }

    const normalizedName =
        collectionName.trim();

    if (useCache) {

        const cachedData =
            loadDataCache();

        if (
            cachedData &&
            Array.isArray(
                cachedData[
                    normalizedName
                ]
            )
        ) {

            return cloneData(
                cachedData[
                    normalizedName
                ]
            );
        }
    }

    switch (
        DATA_CONFIG.SOURCE_TYPE
    ) {

        case DATA_SOURCE_TYPES.LOCAL_JSON:

            return loadCollectionWithRetry(
                normalizedName
            );

        case DATA_SOURCE_TYPES.API:

            throw new Error(
                "Das Laden einzelner Sammlungen über die API ist noch nicht eingerichtet."
            );

        default:

            throw new Error(
                `Die Datenquelle "${DATA_CONFIG.SOURCE_TYPE}" wird nicht unterstützt.`
            );
    }
}

/**
 * Gibt eine Zusammenfassung der geladenen Daten zurück.
 *
 * @param {Object} data
 * @returns {Object}
 */
export function createDataSummary(
    data
) {

    if (!isPlainObject(data)) {

        return {
            collectionCount: 0,
            totalRecords: 0,
            collections: {}
        };
    }

    const collections = {};

    let totalRecords = 0;

    Object.entries(data)
        .forEach(
            ([
                collectionName,
                collectionData
            ]) => {

                const recordCount =
                    Array.isArray(
                        collectionData
                    )
                        ? collectionData.length
                        : 0;

                collections[
                    collectionName
                ] = recordCount;

                totalRecords +=
                    recordCount;
            }
        );

    return {

        collectionCount:
            Object.keys(
                collections
            ).length,

        totalRecords,

        collections
    };
}

/**
 * Prüft Beziehungen zwischen wichtigen Datensätzen.
 *
 * @param {Object} data
 * @returns {{
 *   valid: boolean,
 *   warnings: string[]
 * }}
 */
export function validateDataRelations(
    data
) {

    const warnings = [];

    const users =
        Array.isArray(data?.users)
            ? data.users
            : [];

    const objects =
        Array.isArray(data?.objects)
            ? data.objects
            : [];

    const rooms =
        Array.isArray(data?.rooms)
            ? data.rooms
            : [];

    const tasks =
        Array.isArray(data?.tasks)
            ? data.tasks
            : [];

    const userIds =
        new Set(
            users.map(
                (user) => user.id
            )
        );

    const objectIds =
        new Set(
            objects.map(
                (object) => object.id
            )
        );

    const roomIds =
        new Set(
            rooms.map(
                (room) => room.id
            )
        );

    objects.forEach(
        (object) => {

            if (
                object.objectLeaderId &&
                !userIds.has(
                    object.objectLeaderId
                )
            ) {

                warnings.push(
                    `Objekt "${object.id}" verweist auf einen unbekannten Objektleiter "${object.objectLeaderId}".`
                );
            }
        }
    );

    rooms.forEach(
        (room) => {

            if (
                room.objectId &&
                !objectIds.has(
                    room.objectId
                )
            ) {

                warnings.push(
                    `Raum "${room.id}" verweist auf ein unbekanntes Objekt "${room.objectId}".`
                );
            }
        }
    );

    tasks.forEach(
        (task) => {

            if (
                task.objectId &&
                !objectIds.has(
                    task.objectId
                )
            ) {

                warnings.push(
                    `Aufgabe "${task.id}" verweist auf ein unbekanntes Objekt "${task.objectId}".`
                );
            }

            if (
                task.roomId &&
                !roomIds.has(
                    task.roomId
                )
            ) {

                warnings.push(
                    `Aufgabe "${task.id}" verweist auf einen unbekannten Raum "${task.roomId}".`
                );
            }
        }
    );

    return {

        valid:
            warnings.length === 0,

        warnings
    };
}