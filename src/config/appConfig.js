/************************************************
 * Facility OS
 * appConfig.js
 ************************************************/

export const USER_ROLES = Object.freeze({
    SUPER_ADMIN: "SUPER_ADMIN",
    ADMIN: "ADMIN",
    OBJEKTLEITER: "OBJEKTLEITER",
    MITARBEITER: "MITARBEITER",
    BUCHHALTUNG: "BUCHHALTUNG",
    KUNDE: "KUNDE"
});

export const APP_CONFIG = Object.freeze({

    APP_NAME: "Facility OS",

    APP_VERSION: "2.0.0",

    ENVIRONMENT: "development",

    TEST_MODE: true,

    SESSION_TIMEOUT_MINUTES: 480,

    PASSWORD_MODE: "development",

    QR_REQUIRED: true,

    GPS_REQUIRED: true,

    OFFLINE_MODE: true,

    AUTO_REPLACEMENT_SEARCH: true,

    CONTACT_PERMISSION_REQUIRED: true,

    AUDIT_LOGGING: true,

    DEFAULT_LANGUAGE: "de",

    DEFAULT_ROUTE: "/login",

    AUTHENTICATED_DEFAULT_ROUTE: "/dashboard",

    STORAGE_KEYS: Object.freeze({
        APP_STATE: "facility_os_app_state",
        SESSION: "facility_os_session",
        CACHE: "facility_os_cache"
    })

});