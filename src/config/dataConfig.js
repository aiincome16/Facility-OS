/************************************************
 * Facility OS
 * dataConfig.js
 ************************************************/

export const DATA_CONFIG = Object.freeze({

    /**
     * Später hier die veröffentlichte URL
     * des Google Apps Scripts eintragen.
     */
    API_URL: "",

    REQUEST_TIMEOUT_MS: 15000,

    SHEETS: Object.freeze({

        USERS: "01_Users",

        OBJECTS: "02_Objects",

        ROOMS: "03_Rooms",

        TASKS: "04_Tasks",

        SHIFTS: "05_Shifts",

        CHECKINS: "06_Checkins",

        CHECKOUTS: "07_Checkouts",

        TICKETS: "08_Tickets",

        MESSAGES: "09_Messages",

        MATERIALS: "10_Materials",

        MATERIAL_STOCK: "11_MaterialStock",

        OBJECT_GUIDE: "12_ObjectGuide",

        OBJECT_SETTINGS: "13_ObjectSettings",

        CUSTOMER_ACCESS: "14_CustomerAccess",

        TIME_DEVIATIONS: "16_TimeDeviation",

        OBJECT_SECURITY: "18_ObjectSecurity",

        OBJECT_WASTE: "18_ObjectWaste",

        TASK_LOGS: "TaskLogs",

        KEYBOOK: "Keybook",

        HELP: "Help",

        USER_PERFORMANCE: "UserPerformance",

        PRIVACY: "Datenschutz",

        IMPRINT: "Impressum"

    }),

    ACTIONS: Object.freeze({

        LOGIN: "LOGIN",

        LOGOUT: "LOGOUT",

        GET_USERS: "GET_USERS",

        GET_OBJECTS: "GET_OBJECTS",

        GET_ROOMS: "GET_ROOMS",

        GET_TASKS: "GET_TASKS",

        GET_SHIFTS: "GET_SHIFTS",

        GET_DASHBOARD_DATA: "GET_DASHBOARD_DATA",

        CHECK_IN: "CHECK_IN",

        CHECK_OUT: "CHECK_OUT",

        CREATE_TICKET: "CREATE_TICKET",

        UPDATE_TASK: "UPDATE_TASK"

    })

});