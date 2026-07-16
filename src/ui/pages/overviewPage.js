/************************************************
 * Facility OS
 * overviewPage.js
 *
 * Visuelle Präsentations-Startseite
 * - große farbige Hauptmodule
 * - rollenabhängige Inhalte
 * - Tagesstatus und Warnungen
 * - wenig Text
 * - Smartphone-first
 ************************************************/

import {
    USER_ROLES
} from "../../config/appConfig.js";

import {
    ROUTES
} from "../../router.js";

import {
    renderModuleGrid,
    renderCompactModuleList
} from "../components/moduleCard.js";

import {
    renderDailyStatus,
    renderAlertList,
    renderProgressCard
} from "../components/statusCard.js";

import {
    renderPageTitle,
    renderSectionHeader,
    renderSectionPanel,
    renderInfoList
} from "../components/sectionPanel.js";

/************************************************
 * BASISHELFER
 ************************************************/

function asArray(value) {

    return Array.isArray(value)
        ? value
        : [];
}

function asNumber(
    value,
    fallback = 0
) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : fallback;
}

function normalizeText(value) {

    return String(value ?? "")
        .trim();
}

function normalizeStatus(value) {

    return normalizeText(value)
        .toUpperCase();
}

function isActive(entry) {

    return entry?.active !== false;
}

/************************************************
 * BENUTZER
 ************************************************/

function getUserName(state) {

    return (
        state.currentUser?.name ??
        state.currentUser?.fullName ??
        "Benutzer"
    );
}

function getFirstName(state) {

    const fullName =
        getUserName(state);

    return (
        fullName
            .split(/\s+/)
            .filter(Boolean)[0] ??
        fullName
    );
}

function getRole(state) {

    return normalizeStatus(
        state.currentUser?.role
    );
}

/************************************************
 * DATUM
 ************************************************/

function formatToday() {

    try {

        return new Intl.DateTimeFormat(
            "de-DE",
            {
                weekday:
                    "long",

                day:
                    "2-digit",

                month:
                    "long"
            }
        ).format(
            new Date()
        );
    }
    catch {

        return "Heute";
    }
}

/************************************************
 * SICHTBARE OBJEKTE
 ************************************************/

function getVisibleObjects(state) {

    const currentUser =
        state.currentUser;

    const objects =
        asArray(state.objects)
            .filter(isActive);

    if (!currentUser) {

        return [];
    }

    switch (
        normalizeStatus(
            currentUser.role
        )
    ) {

        case USER_ROLES.SUPER_ADMIN:
        case USER_ROLES.ADMIN:
        case USER_ROLES.BUCHHALTUNG:

            return objects;

        case USER_ROLES.OBJEKTLEITER: {

            const assignedObjects =
                objects.filter(
                    (object) =>
                        object.objectLeaderId ===
                            currentUser.id ||
                        object.managerId ===
                            currentUser.id ||
                        object.leaderId ===
                            currentUser.id
                );

            return assignedObjects.length > 0
                ? assignedObjects
                : objects;
        }

        case USER_ROLES.MITARBEITER: {

            const assignedObjectIds =
                asArray(
                    currentUser.assignedObjectIds ??
                    currentUser.objectIds
                );

            const assignedObjects =
                objects.filter(
                    (object) =>
                        assignedObjectIds.includes(
                            object.id
                        ) ||
                        asArray(
                            object.assignedEmployeeIds ??
                            object.employeeIds ??
                            object.assignedUserIds
                        ).includes(
                            currentUser.id
                        )
                );

            return assignedObjects.length > 0
                ? assignedObjects
                : objects;
        }

        case USER_ROLES.KUNDE: {

            const allowedObjectIds =
                asArray(state.customerAccess)
                    .filter(
                        (access) =>
                            access.active !== false &&
                            (
                                access.customerUserId ===
                                    currentUser.id ||
                                access.userId ===
                                    currentUser.id
                            )
                    )
                    .map(
                        (access) =>
                            access.objectId
                    );

            return objects.filter(
                (object) =>
                    allowedObjectIds.includes(
                        object.id
                    ) ||
                    object.customerUserId ===
                        currentUser.id
            );
        }

        default:

            return [];
    }
}

/************************************************
 * TICKETS UND MELDUNGEN
 ************************************************/

function isClosedStatus(status) {

    return [
        "CLOSED",
        "COMPLETED",
        "RESOLVED",
        "ARCHIVED",
        "CANCELLED"
    ].includes(
        normalizeStatus(status)
    );
}

function getOpenTickets(state) {

    return asArray(state.tickets)
        .filter(
            (ticket) =>
                !isClosedStatus(
                    ticket.status
                )
        );
}

function getCriticalTickets(state) {

    return getOpenTickets(state)
        .filter(
            (ticket) =>
                [
                    "CRITICAL",
                    "URGENT",
                    "HIGH"
                ].includes(
                    normalizeStatus(
                        ticket.priority ??
                        ticket.severity
                    )
                )
        );
}

function getOwnOpenTickets(state) {

    const userId =
        state.currentUser?.id;

    if (!userId) {

        return [];
    }

    return getOpenTickets(state)
        .filter(
            (ticket) =>
                ticket.userId ===
                    userId ||
                ticket.createdByUserId ===
                    userId ||
                ticket.assignedUserId ===
                    userId ||
                ticket.customerUserId ===
                    userId
        );
}

/************************************************
 * MATERIAL
 ************************************************/

function getMaterialWarnings(state) {

    return asArray(state.materialStock)
        .filter(
            (stock) => {

                const status =
                    normalizeStatus(
                        stock.status
                    );

                if (
                    [
                        "LOW",
                        "CRITICAL",
                        "EMPTY",
                        "OUT_OF_STOCK"
                    ].includes(status)
                ) {

                    return true;
                }

                const currentAmount =
                    asNumber(
                        stock.currentAmount ??
                        stock.quantity ??
                        stock.stock
                    );

                const minimumAmount =
                    asNumber(
                        stock.minimumAmount ??
                        stock.minimumStock ??
                        stock.minStock
                    );

                return (
                    minimumAmount > 0 &&
                    currentAmount <=
                        minimumAmount
                );
            }
        );
}

/************************************************
 * SCHICHTEN
 ************************************************/

function isRunningShift(shift) {

    const status =
        normalizeStatus(
            shift.status
        );

    return (
        status === "RUNNING" ||
        status === "ACTIVE" ||
        (
            Boolean(
                shift.startTime
            ) &&
            !shift.endTime &&
            ![
                "FINISHED",
                "COMPLETED",
                "CANCELLED"
            ].includes(status)
        )
    );
}

function getRunningShifts(state) {

    return asArray(state.shifts)
        .filter(
            isRunningShift
        );
}

function getOwnRunningShift(state) {

    const userId =
        state.currentUser?.id;

    return getRunningShifts(state)
        .find(
            (shift) =>
                shift.userId ===
                    userId ||
                shift.employeeId ===
                    userId
        ) ??
        null;
}

/************************************************
 * AUFGABEN
 ************************************************/

function getCurrentObjectTasks(state) {

    const objectId =
        state.currentObject?.id;

    if (!objectId) {

        return [];
    }

    return asArray(state.tasks)
        .filter(
            (task) =>
                task.objectId ===
                    objectId &&
                isActive(task)
        );
}

function getCompletedTaskLogs(state) {

    const objectId =
        state.currentObject?.id;

    const userId =
        state.currentUser?.id;

    return asArray(state.taskLogs)
        .filter(
            (taskLog) => {

                const status =
                    normalizeStatus(
                        taskLog.status
                    );

                const completed =
                    taskLog.completed === true ||
                    [
                        "COMPLETED",
                        "DONE",
                        "FINISHED"
                    ].includes(status);

                const correctObject =
                    !objectId ||
                    taskLog.objectId ===
                        objectId;

                const correctUser =
                    !userId ||
                    !taskLog.userId ||
                    taskLog.userId ===
                        userId ||
                    taskLog.employeeId ===
                        userId;

                return (
                    completed &&
                    correctObject &&
                    correctUser
                );
            }
        );
}

/************************************************
 * PERSONAL
 ************************************************/

function getActiveEmployees(state) {

    return asArray(state.users)
        .filter(
            (user) =>
                isActive(user) &&
                normalizeStatus(
                    user.role
                ) ===
                    USER_ROLES.MITARBEITER
        );
}

function getAbsenceRequests(state) {

    return asArray(state.customerRequests)
        .filter(
            (request) => {

                const type =
                    normalizeStatus(
                        request.type ??
                        request.requestType
                    );

                const status =
                    normalizeStatus(
                        request.status
                    );

                return (
                    [
                        "SICK",
                        "SICKNESS",
                        "VACATION",
                        "ABSENCE",
                        "URLAUB",
                        "KRANK"
                    ].includes(type) &&
                    !isClosedStatus(status)
                );
            }
        );
}

/************************************************
 * ZEITABWEICHUNGEN
 ************************************************/

function getOpenTimeDeviations(state) {

    return asArray(state.timeDeviations)
        .filter(
            (deviation) =>
                !isClosedStatus(
                    deviation.status
                )
        );
}

/************************************************
 * OBJEKTLEITER-MODULE
 ************************************************/

function getManagerModules(state) {

    const objects =
        getVisibleObjects(state);

    const employees =
        getActiveEmployees(state);

    const openTickets =
        getOpenTickets(state);

    const materialWarnings =
        getMaterialWarnings(state);

    return [
        {
            title:
                "Objekte",

            subtitle:
                "Räume, Aufgaben und Status",

            icon:
                "objects",

            color:
                "objects",

            route:
                ROUTES.OBJECTS,

            value:
                objects.length,

            valueLabel:
                objects.length === 1
                    ? "Objekt"
                    : "Objekte",

            large:
                true
        },
        {
            title:
                "Personal",

            subtitle:
                "Einsatz und Vertretung",

            icon:
                "personnel",

            color:
                "personnel",

            route:
                ROUTES.PERSONNEL,

            value:
                employees.length,

            valueLabel:
                "Mitarbeiter"
        },
        {
            title:
                "Meldungen",

            subtitle:
                "Tickets und Hinweise",

            icon:
                "communication",

            color:
                "communication",

            route:
                ROUTES.COMMUNICATION,

            value:
                openTickets.length,

            valueLabel:
                "offen",

            badge:
                getCriticalTickets(
                    state
                ).length
        },
        {
            title:
                "Material",

            subtitle:
                "Bestände und Nachbestellung",

            icon:
                "materials",

            color:
                "materials",

            route:
                ROUTES.OBJECTS,

            value:
                materialWarnings.length,

            valueLabel:
                materialWarnings.length === 1
                    ? "Warnung"
                    : "Warnungen",

            statusLabel:
                materialWarnings.length > 0
                    ? "Prüfen"
                    : "In Ordnung",

            status:
                materialWarnings.length > 0
                    ? "warning"
                    : "success"
        },
        {
            title:
                "Mehr",

            subtitle:
                "Berichte und Einstellungen",

            icon:
                "more",

            color:
                "more",

            route:
                ROUTES.MORE
        }
    ];
}

/************************************************
 * MITARBEITER-MODULE
 ************************************************/

function getEmployeeModules(state) {

    const ownShift =
        getOwnRunningShift(state);

    const tasks =
        getCurrentObjectTasks(state);

    const ownTickets =
        getOwnOpenTickets(state);

    return [
        {
            title:
                ownShift
                    ? "Schicht läuft"
                    : "Einchecken",

            subtitle:
                state.currentObject
                    ? (
                        state.currentObject.name ??
                        "Aktuelles Objekt"
                    )
                    : "Zuerst Objekt auswählen",

            icon:
                "times",

            color:
                ownShift
                    ? "success"
                    : "overview",

            action:
                ownShift
                    ? "checkout"
                    : (
                        state.currentObject
                            ? "checkin"
                            : null
                    ),

            route:
                !ownShift &&
                !state.currentObject
                    ? ROUTES.OBJECTS
                    : null,

            statusLabel:
                ownShift
                    ? "Aktiv"
                    : "Bereit",

            status:
                ownShift
                    ? "success"
                    : "neutral",

            large:
                true
        },
        {
            title:
                "Aufgaben",

            subtitle:
                "Räume und Arbeitsschritte",

            icon:
                "tasks",

            color:
                "tasks",

            route:
                ROUTES.TASKS,

            value:
                tasks.length,

            valueLabel:
                "heute"
        },
        {
            title:
                "Objekt",

            subtitle:
                "Anleitung und Sicherheit",

            icon:
                "objects",

            color:
                "objects",

            route:
                state.currentObject
                    ? ROUTES.OBJECT_DETAIL
                    : ROUTES.OBJECTS,

            statusLabel:
                state.currentObject
                    ? "Gewählt"
                    : "Auswählen",

            status:
                state.currentObject
                    ? "success"
                    : "warning"
        },
        {
            title:
                "Meldung",

            subtitle:
                "Problem oder Materialmangel",

            icon:
                "communication",

            color:
                "communication",

            route:
                ROUTES.COMMUNICATION,

            value:
                ownTickets.length,

            valueLabel:
                "offen"
        },
        {
            title:
                "Mehr",

            subtitle:
                "Zeiten, Urlaub und Hilfe",

            icon:
                "more",

            color:
                "more",

            route:
                ROUTES.MORE
        }
    ];
}

/************************************************
 * ADMIN-MODULE
 ************************************************/

function getAdminModules(state) {

    return [
        {
            title:
                "Objekte",

            subtitle:
                "Standorte und Leistungen",

            icon:
                "objects",

            color:
                "objects",

            route:
                ROUTES.OBJECTS,

            value:
                asArray(
                    state.objects
                ).filter(
                    isActive
                ).length,

            valueLabel:
                "aktiv",

            large:
                true
        },
        {
            title:
                "Personal",

            subtitle:
                "Benutzer und Rechte",

            icon:
                "personnel",

            color:
                "personnel",

            route:
                ROUTES.PERSONNEL,

            value:
                asArray(
                    state.users
                ).filter(
                    isActive
                ).length,

            valueLabel:
                "Benutzer"
        },
        {
            title:
                "Meldungen",

            subtitle:
                "Offene Vorgänge",

            icon:
                "communication",

            color:
                "communication",

            route:
                ROUTES.COMMUNICATION,

            value:
                getOpenTickets(
                    state
                ).length,

            valueLabel:
                "offen",

            badge:
                getCriticalTickets(
                    state
                ).length
        },
        {
            title:
                "Auswertung",

            subtitle:
                "Zeiten und Berichte",

            icon:
                "analysis",

            color:
                "analysis",

            route:
                ROUTES.REPORTS
        },
        {
            title:
                "System",

            subtitle:
                "Einstellungen und Module",

            icon:
                "more",

            color:
                "more",

            route:
                ROUTES.MORE
        }
    ];
}

/************************************************
 * BUCHHALTUNGS-MODULE
 ************************************************/

function getAccountingModules(state) {

    const deviations =
        getOpenTimeDeviations(state);

    return [
        {
            title:
                "Zeiten",

            subtitle:
                "Schichten und Buchungen",

            icon:
                "times",

            color:
                "times",

            route:
                ROUTES.TIMES,

            value:
                asArray(
                    state.shifts
                ).length,

            valueLabel:
                "Schichten",

            large:
                true
        },
        {
            title:
                "Abweichungen",

            subtitle:
                "Ungeklärte Zeiten",

            icon:
                "warning",

            color:
                deviations.length > 0
                    ? "warning"
                    : "success",

            route:
                ROUTES.TIMES,

            value:
                deviations.length,

            valueLabel:
                "offen"
        },
        {
            title:
                "Objekte",

            subtitle:
                "Stunden und Kostenstellen",

            icon:
                "objects",

            color:
                "objects",

            route:
                ROUTES.OBJECTS,

            value:
                getVisibleObjects(
                    state
                ).length,

            valueLabel:
                "Objekte"
        },
        {
            title:
                "Auswertung",

            subtitle:
                "Monat und Export",

            icon:
                "analysis",

            color:
                "analysis",

            route:
                ROUTES.ANALYSIS
        },
        {
            title:
                "Mehr",

            subtitle:
                "Archiv und Hilfe",

            icon:
                "more",

            color:
                "more",

            route:
                ROUTES.MORE
        }
    ];
}

/************************************************
 * KUNDEN-MODULE
 ************************************************/

function getCustomerModules(state) {

    return [
        {
            title:
                "Meine Objekte",

            subtitle:
                "Status und Leistungen",

            icon:
                "objects",

            color:
                "objects",

            route:
                ROUTES.OBJECTS,

            value:
                getVisibleObjects(
                    state
                ).length,

            valueLabel:
                "freigegeben",

            large:
                true
        },
        {
            title:
                "Meldung senden",

            subtitle:
                "Anfrage oder Reklamation",

            icon:
                "communication",

            color:
                "communication",

            route:
                ROUTES.COMMUNICATION,

            value:
                getOwnOpenTickets(
                    state
                ).length,

            valueLabel:
                "offen"
        },
        {
            title:
                "Berichte",

            subtitle:
                "Leistungsnachweise",

            icon:
                "reports",

            color:
                "reports",

            route:
                ROUTES.REPORTS
        },
        {
            title:
                "Ansprechpartner",

            subtitle:
                "Kontakt zur Objektleitung",

            icon:
                "personnel",

            color:
                "personnel",

            route:
                ROUTES.MORE
        },
        {
            title:
                "Mehr",

            subtitle:
                "Profil und Hilfe",

            icon:
                "more",

            color:
                "more",

            route:
                ROUTES.MORE
        }
    ];
}

/************************************************
 * MODULE PRO ROLLE
 ************************************************/

function getModulesForRole(state) {

    switch (
        getRole(state)
    ) {

        case USER_ROLES.SUPER_ADMIN:
        case USER_ROLES.ADMIN:

            return getAdminModules(
                state
            );

        case USER_ROLES.OBJEKTLEITER:

            return getManagerModules(
                state
            );

        case USER_ROLES.MITARBEITER:

            return getEmployeeModules(
                state
            );

        case USER_ROLES.BUCHHALTUNG:

            return getAccountingModules(
                state
            );

        case USER_ROLES.KUNDE:

            return getCustomerModules(
                state
            );

        default:

            return [];
    }
}

/************************************************
 * TAGESSTATUS
 ************************************************/

function getDailyStatusItems(state) {

    const role =
        getRole(state);

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        const tasks =
            getCurrentObjectTasks(state);

        const completedTasks =
            getCompletedTaskLogs(state);

        return [
            {
                label:
                    "Schicht",

                value:
                    getOwnRunningShift(state)
                        ? "Läuft"
                        : "Offen",

                status:
                    getOwnRunningShift(state)
                        ? "success"
                        : "warning"
            },
            {
                label:
                    "Aufgaben",

                value:
                    tasks.length,

                status:
                    "tasks"
            },
            {
                label:
                    "Erledigt",

                value:
                    Math.min(
                        completedTasks.length,
                        tasks.length
                    ),

                status:
                    "success"
            },
            {
                label:
                    "Meldungen",

                value:
                    getOwnOpenTickets(
                        state
                    ).length,

                status:
                    "communication"
            }
        ];
    }

    if (
        role ===
        USER_ROLES.BUCHHALTUNG
    ) {

        return [
            {
                label:
                    "Schichten",

                value:
                    asArray(
                        state.shifts
                    ).length,

                status:
                    "times"
            },
            {
                label:
                    "Check-ins",

                value:
                    asArray(
                        state.checkins
                    ).length,

                status:
                    "success"
            },
            {
                label:
                    "Abweichungen",

                value:
                    getOpenTimeDeviations(
                        state
                    ).length,

                status:
                    "warning"
            },
            {
                label:
                    "Objekte",

                value:
                    getVisibleObjects(
                        state
                    ).length,

                status:
                    "objects"
            }
        ];
    }

    if (
        role ===
        USER_ROLES.KUNDE
    ) {

        return [
            {
                label:
                    "Objekte",

                value:
                    getVisibleObjects(
                        state
                    ).length,

                status:
                    "objects"
            },
            {
                label:
                    "Meldungen",

                value:
                    getOwnOpenTickets(
                        state
                    ).length,

                status:
                    "communication"
            },
            {
                label:
                    "Berichte",

                value:
                    asArray(
                        state.taskLogs
                    ).length,

                status:
                    "reports"
            },
            {
                label:
                    "Status",

                value:
                    "Aktiv",

                status:
                    "success"
            }
        ];
    }

    return [
        {
            label:
                "Schichten",

            value:
                getRunningShifts(
                    state
                ).length,

            status:
                "success"
        },
        {
            label:
                "Meldungen",

            value:
                getOpenTickets(
                    state
                ).length,

            status:
                "communication"
        },
        {
            label:
                "Material",

            value:
                getMaterialWarnings(
                    state
                ).length,

            status:
                "warning"
        },
        {
            label:
                "Abwesenheit",

            value:
                getAbsenceRequests(
                    state
                ).length,

            status:
                "personnel"
        }
    ];
}

/************************************************
 * WARNUNGEN
 ************************************************/

function getAlerts(state) {

    const alerts = [];

    const role =
        getRole(state);

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        if (!state.currentObject) {

            alerts.push({
                title:
                    "Kein Objekt ausgewählt",

                message:
                    "Wähle dein Einsatzobjekt, bevor du eincheckst.",

                status:
                    "warning",

                icon:
                    "objects",

                route:
                    ROUTES.OBJECTS,

                buttonLabel:
                    "Objekt wählen"
            });
        }

        if (
            state.currentObject &&
            !getOwnRunningShift(state)
        ) {

            alerts.push({
                title:
                    "Schicht noch nicht gestartet",

                message:
                    "Starte die Schicht, sobald du am Objekt angekommen bist.",

                status:
                    "info",

                icon:
                    "times",

                action:
                    "checkin",

                buttonLabel:
                    "Einchecken"
            });
        }

        return alerts;
    }

    const criticalTickets =
        getCriticalTickets(state);

    if (
        criticalTickets.length > 0
    ) {

        alerts.push({
            title:
                "Kritische Meldungen",

            message:
                `${criticalTickets.length} Vorgänge benötigen sofortige Aufmerksamkeit.`,

            status:
                "danger",

            icon:
                "warning",

            route:
                ROUTES.COMMUNICATION,

            buttonLabel:
                "Meldungen öffnen"
        });
    }

    const materialWarnings =
        getMaterialWarnings(state);

    if (
        materialWarnings.length > 0
    ) {

        alerts.push({
            title:
                "Materialbestand prüfen",

            message:
                `${materialWarnings.length} Bestände liegen am oder unter dem Mindestbestand.`,

            status:
                "warning",

            icon:
                "materials",

            route:
                ROUTES.OBJECTS,

            buttonLabel:
                "Bestände öffnen"
        });
    }

    const deviations =
        getOpenTimeDeviations(state);

    if (
        deviations.length > 0 &&
        role !==
            USER_ROLES.KUNDE
    ) {

        alerts.push({
            title:
                "Offene Zeitabweichungen",

            message:
                `${deviations.length} Zeitabweichungen sind noch nicht geklärt.`,

            status:
                "info",

            icon:
                "times",

            route:
                ROUTES.TIMES,

            buttonLabel:
                "Zeiten prüfen"
        });
    }

    return alerts;
}

/************************************************
 * AUFGABENFORTSCHRITT
 ************************************************/

function renderEmployeeProgress(state) {

    const tasks =
        getCurrentObjectTasks(state);

    if (
        tasks.length === 0
    ) {

        return "";
    }

    const completedTasks =
        getCompletedTaskLogs(state);

    return `
        <section class="app-overview-progress">

            ${renderSectionHeader({
                title:
                    "Heutige Aufgaben",

                description:
                    state.currentObject
                        ? (
                            state.currentObject.name ??
                            "Aktuelles Objekt"
                        )
                        : "",

                actionLabel:
                    "Öffnen",

                actionRoute:
                    ROUTES.TASKS,

                compact:
                    true
            })}

            ${renderProgressCard({
                title:
                    "Arbeitsfortschritt",

                current:
                    Math.min(
                        completedTasks.length,
                        tasks.length
                    ),

                total:
                    tasks.length,

                description:
                    "Erledigte Aufgaben im aktuellen Objekt",

                status:
                    "tasks",

                route:
                    ROUTES.TASKS
            })}

        </section>
    `;
}

/************************************************
 * MANAGEMENT-KURZSTATUS
 ************************************************/

function renderManagementStatus(state) {

    const objects =
        getVisibleObjects(state);

    const runningShifts =
        getRunningShifts(state);

    const activeEmployees =
        getActiveEmployees(state);

    return `
        ${renderSectionHeader({
            title:
                "Betriebsstatus",

            description:
                "Aktuelle Lage auf einen Blick",

            compact:
                true
        })}

        ${renderInfoList(
            [
                {
                    label:
                        "Aktive Objekte",

                    value:
                        objects.length,

                    status:
                        "objects",

                    icon:
                        "objects"
                },
                {
                    label:
                        "Mitarbeiter im Einsatz",

                    value:
                        runningShifts.length,

                    status:
                        "success",

                    icon:
                        "personnel"
                },
                {
                    label:
                        "Verfügbare Mitarbeiter",

                    value:
                        activeEmployees.length,

                    status:
                        "personnel",

                    icon:
                        "personnel"
                },
                {
                    label:
                        "Offene Hinweise",

                    value:
                        (
                            getOpenTickets(state).length +
                            getMaterialWarnings(state).length
                        ),

                    status:
                        "warning",

                    icon:
                        "warning",

                    emphasize:
                        true
                }
            ],
            {
                columns:
                    2
            }
        )}
    `;
}

/************************************************
 * SCHNELLZUGRIFFE
 ************************************************/

function getQuickActions(state) {

    const role =
        getRole(state);

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        return [
            {
                title:
                    "Problem melden",

                subtitle:
                    "Schaden oder Hindernis",

                icon:
                    "communication",

                color:
                    "communication",

                route:
                    ROUTES.COMMUNICATION
            },
            {
                title:
                    "Materialmangel",

                subtitle:
                    "Fehlendes Material melden",

                icon:
                    "materials",

                color:
                    "materials",

                route:
                    ROUTES.COMMUNICATION
            },
            {
                title:
                    "Objektanleitung",

                subtitle:
                    "Ablauf und Sicherheit",

                icon:
                    "objects",

                color:
                    "objects",

                route:
                    state.currentObject
                        ? ROUTES.OBJECT_DETAIL
                        : ROUTES.OBJECTS
            }
        ];
    }

    if (
        role ===
        USER_ROLES.KUNDE
    ) {

        return [
            {
                title:
                    "Neue Anfrage",

                subtitle:
                    "Frage oder Wunsch senden",

                icon:
                    "communication",

                color:
                    "communication",

                route:
                    ROUTES.COMMUNICATION
            },
            {
                title:
                    "Leistungsnachweise",

                subtitle:
                    "Freigegebene Berichte",

                icon:
                    "reports",

                color:
                    "reports",

                route:
                    ROUTES.REPORTS
            },
            {
                title:
                    "Hilfe",

                subtitle:
                    "Unterstützung öffnen",

                icon:
                    "more",

                color:
                    "more",

                route:
                    ROUTES.HELP
            }
        ];
    }

    return [
        {
            title:
                "Neue Meldung",

            subtitle:
                "Problem oder Hinweis erfassen",

            icon:
                "communication",

            color:
                "communication",

            route:
                ROUTES.COMMUNICATION
        },
        {
            title:
                "Objekt öffnen",

            subtitle:
                "Räume und Aufgaben prüfen",

            icon:
                "objects",

            color:
                "objects",

            route:
                ROUTES.OBJECTS
        },
        {
            title:
                "Berichte",

            subtitle:
                "Leistung und Zeiten",

            icon:
                "reports",

            color:
                "reports",

            route:
                ROUTES.REPORTS
        }
    ];
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderOverviewPage(state) {

    const role =
        getRole(state);

    const modules =
        getModulesForRole(state);

    const alerts =
        getAlerts(state);

    const managementRole =
        [
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN,
            USER_ROLES.OBJEKTLEITER
        ].includes(role);

    return `
        <section class="app-overview-page">

            ${renderPageTitle({
                eyebrow:
                    formatToday(),

                title:
                    `Hallo, ${getFirstName(
                        state
                    )}`,

                description:
                    role ===
                        USER_ROLES.MITARBEITER
                        ? (
                            state.currentObject
                                ? `Dein Einsatz: ${
                                    state.currentObject.name ??
                                    state.currentObject.id
                                }`
                                : "Bereit für deinen nächsten Einsatz."
                        )
                        : "Das Wichtigste für heute auf einen Blick.",

                color:
                    "overview",

                compact:
                    true
            })}

            ${renderDailyStatus({
                title:
                    role ===
                        USER_ROLES.MITARBEITER
                        ? "Mein Arbeitstag"
                        : "Tagesübersicht",

                subtitle:
                    formatToday(),

                items:
                    getDailyStatusItems(
                        state
                    )
            })}

            ${
                alerts.length > 0
                    ? `
                        <section class="app-overview-alerts">

                            ${renderSectionHeader({
                                title:
                                    "Wichtige Hinweise",

                                count:
                                    alerts.length,

                                compact:
                                    true
                            })}

                            ${renderAlertList(
                                alerts,
                                {
                                    maximum:
                                        3
                                }
                            )}

                        </section>
                    `
                    : ""
            }

            <section class="app-overview-modules">

                ${renderSectionHeader({
                    title:
                        "Bereiche",

                    description:
                        "Direkt zum gewünschten Modul",

                    compact:
                        true
                })}

                ${renderModuleGrid(
                    modules,
                    {
                        columns:
                            2,

                        className:
                            "app-overview-module-grid"
                    }
                )}

            </section>

            ${
                role ===
                USER_ROLES.MITARBEITER
                    ? renderEmployeeProgress(
                        state
                    )
                    : ""
            }

            ${
                managementRole
                    ? `
                        <section class="app-overview-management-status">

                            ${renderSectionPanel({
                                color:
                                    "overview",

                                content:
                                    renderManagementStatus(
                                        state
                                    )
                            })}

                        </section>
                    `
                    : ""
            }

            <section class="app-overview-quick-actions">

                ${renderSectionHeader({
                    title:
                        "Schnellzugriff",

                    compact:
                        true
                })}

                ${renderCompactModuleList(
                    getQuickActions(
                        state
                    )
                )}

            </section>

        </section>
    `;
}