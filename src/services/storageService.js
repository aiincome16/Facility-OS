/************************************************
 * Facility OS
 * storageService.js
 ************************************************/

function isStorageAvailable() {

    try {

        const testKey = "__facility_os_storage_test__";

        localStorage.setItem(testKey, "1");

        localStorage.removeItem(testKey);

        return true;

    } catch (error) {

        console.warn(
            "LocalStorage ist nicht verfügbar:",
            error
        );

        return false;
    }
}

export function saveToStorage(key, value) {

    if (!key) {
        throw new Error(
            "Beim Speichern fehlt der Storage-Key."
        );
    }

    if (!isStorageAvailable()) {
        return false;
    }

    try {

        const serializedValue = JSON.stringify(value);

        localStorage.setItem(
            key,
            serializedValue
        );

        return true;

    } catch (error) {

        console.error(
            `Daten konnten nicht gespeichert werden: ${key}`,
            error
        );

        return false;
    }
}

export function loadFromStorage(
    key,
    fallbackValue = null
) {

    if (!key) {
        return fallbackValue;
    }

    if (!isStorageAvailable()) {
        return fallbackValue;
    }

    try {

        const serializedValue = localStorage.getItem(key);

        if (serializedValue === null) {
            return fallbackValue;
        }

        return JSON.parse(serializedValue);

    } catch (error) {

        console.error(
            `Daten konnten nicht geladen werden: ${key}`,
            error
        );

        return fallbackValue;
    }
}

export function removeFromStorage(key) {

    if (!key || !isStorageAvailable()) {
        return false;
    }

    try {

        localStorage.removeItem(key);

        return true;

    } catch (error) {

        console.error(
            `Storage-Eintrag konnte nicht entfernt werden: ${key}`,
            error
        );

        return false;
    }
}

export function clearStorage() {

    if (!isStorageAvailable()) {
        return false;
    }

    try {

        localStorage.clear();

        return true;

    } catch (error) {

        console.error(
            "LocalStorage konnte nicht geleert werden.",
            error
        );

        return false;
    }
}