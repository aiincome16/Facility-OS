/************************************************
 * Facility OS
 * analysisPage.js
 *
 * Visuelle Auswertungsseite
 * - Objektleistung
 * - Aufgabenquote
 * - Zeitabweichungen
 * - Personalstatus
 * - Materialwarnungen
 * - Qualitäts- und Leistungskennzahlen
 ************************************************/

import {
    USER_ROLES
} from "../../config/appConfig.js";

import {
    ROUTES
} from "../../router.js";

import {
    renderStatusGrid,
    renderAlertList,
    renderProgressCard
} from "../components/statusCard.js";

import {
    renderCompactModuleList
} from "../components/moduleCard.js";

import {
    renderPageTitle,
    renderSectionHeader,
    renderCollapsiblePanel,
    renderActionRows,
    renderInfoList,
    renderEmptyState,
    renderTextBlock
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

function isClosedStatus(status) {

    return [
        "CLOSED",
        "COMPLETED",
        "RESOLVED",
        "APPROVED",
        "ARCHIVED",
        "CANCELLED",
        "REJECTED"
    ].includes(
        normalizeStatus(status)
    );
}

function clamp(
    value,
    minimum,
    maximum
) {

    return Math.min(
        Math.max(
            value,
            minimum
        ),
        maximum
    );
}

function calculatePercentage(
    current,
    total
) {

    const normalizedCurrent =
        asNumber(current);

    const normalizedTotal =
        asNumber(total);

    if (
        normalizedTotal <= 0
    ) {

        return 0;
    }

    return clamp(
        Math.round(
            (
                normalizedCurrent /
                normalizedTotal
            ) *
            100
        ),
        0,
        100
    );
}

/************************************************
 * ROLLE UND ZUGRIFF
 ************************************************/

function getRole(state) {

    return normalizeStatus(
        state.currentUser?.role
    );
}

function canViewAnalysis(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG
    ].includes(
        getRole(state)
    );
}

/************************************************
 * DATUM
 ************************************************/

function parseDate(value) {

    if (!value) {

        return null;
    }

    const date =
        new Date(value);

    return Number.isNaN(
        date.getTime()
    )
        ? null
        : date;
}

function isCurrentMonth(value) {

    const date =
        parseDate(value);

    if (!date) {

        return false;
    }

    const now =
        new Date();

    return (
        date.getFullYear() ===
            now.getFullYear() &&
        date.getMonth() ===
            now.getMonth()
    );
}

function getCurrentMonthLabel() {

    try {

        return new Intl.DateTimeFormat(
            "de-DE",
            {
                month:
                    "long",

                year:
                    "numeric"
            }
        ).format(
            new Date()
        );
    }
    catch {

        return "Aktueller Monat";
    }
}

/************************************************
 * BENUTZER
 ************************************************/

function getUsers(state) {

    return asArray(state.users)
        .filter(isActive);
}

function getEmployees(state) {

    return getUsers(state)
        .filter(
            (user) =>
                normalizeStatus(
                    user.role
                ) ===
                USER_ROLES.MITARBEITER
        );
}

function getUserById(
    state,
    userId
) {

    if (!userId) {

        return null;
    }

    return getUsers(state)
        .find(
            (user) =>
                user.id ===
                userId
        ) ??
        null;
}

function getUserName(user) {

    return (
        user?.name ??
        user?.fullName ??
        user?.displayName ??
        user?.email ??
        "Unbekannter Mitarbeiter"
    );
}

/************************************************
 * OBJEKTE
 ************************************************/

function getObjects(state) {

    return asArray(state.objects)
        .filter(isActive);
}

function getVisibleObjects(state) {

    const user =
        state.currentUser;

    const objects =
        getObjects(state);

    if (!user) {

        return [];
    }

    const role =
        getRole(state);

    if (
        [
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN,
            USER_ROLES.BUCHHALTUNG
        ].includes(role)
    ) {

        return objects;
    }

    if (
        role ===
        USER_ROLES.OBJEKTLEITER
    ) {

        const assignedObjects =
            objects.filter(
                (object) =>
                    object.objectLeaderId ===
                        user.id ||
                    object.managerId ===
                        user.id ||
                    object.leaderId ===
                        user.id
            );

        return assignedObjects.length > 0
            ? assignedObjects
            : objects;
    }

    return [];
}

function getObjectById(
    state,
    objectId
) {

    if (!objectId) {

        return null;
    }

    return getObjects(state)
        .find(
            (object) =>
                object.id ===
                objectId
        ) ??
        null;
}

function getObjectName(
    state,
    objectId
) {

    const object =
        getObjectById(
            state,
            objectId
        );

    return (
        object?.name ??
        object?.id ??
        "Ohne Objekt"
    );
}

/************************************************
 * AUFGABEN
 ************************************************/

function getVisibleTasks(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return asArray(state.tasks)
        .filter(
            (task) =>
                isActive(task) &&
                (
                    !task.objectId ||
                    visibleObjectIds.includes(
                        task.objectId
                    )
                )
        );
}

function isCompletedTaskLog(log) {

    const status =
        normalizeStatus(
            log.status
        );

    return (
        log.completed === true ||
        [
            "DONE",
            "COMPLETED",
            "FINISHED"
        ].includes(status)
    );
}

function getCompletedTaskLogs(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return asArray(state.taskLogs)
        .filter(
            (log) =>
                isCompletedTaskLog(log) &&
                (
                    !log.objectId ||
                    visibleObjectIds.includes(
                        log.objectId
                    )
                )
        );
}

function getTaskCompletionRate(state) {

    return calculatePercentage(
        getCompletedTaskLogs(state).length,
        getVisibleTasks(state).length
    );
}

/************************************************
 * SCHICHTEN UND ZEITEN
 ************************************************/

function getVisibleShifts(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return asArray(state.shifts)
        .filter(
            (shift) =>
                isActive(shift) &&
                (
                    !shift.objectId ||
                    visibleObjectIds.includes(
                        shift.objectId
                    )
                )
        );
}

function getCurrentMonthShifts(state) {

    return getVisibleShifts(state)
        .filter(
            (shift) =>
                isCurrentMonth(
                    shift.startTime ??
                    shift.checkinTime ??
                    shift.date ??
                    shift.createdAt
                )
        );
}

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
                shift.startTime ??
                shift.checkinTime
            ) &&
            !(
                shift.endTime ??
                shift.checkoutTime
            ) &&
            ![
                "FINISHED",
                "COMPLETED",
                "CANCELLED"
            ].includes(status)
        )
    );
}

function getRunningShifts(state) {

    return getVisibleShifts(state)
        .filter(
            isRunningShift
        );
}

function getShiftActualMinutes(shift) {

    return asNumber(
        shift.durationMinutes ??
        shift.actualMinutes ??
        shift.totalMinutes
    );
}

function getShiftPlannedMinutes(shift) {

    return asNumber(
        shift.plannedMinutes ??
        shift.targetMinutes ??
        shift.sollMinutes
    );
}

function getMonthActualMinutes(state) {

    return getCurrentMonthShifts(state)
        .reduce(
            (total, shift) =>
                total +
                getShiftActualMinutes(
                    shift
                ),
            0
        );
}

function getMonthPlannedMinutes(state) {

    return getCurrentMonthShifts(state)
        .reduce(
            (total, shift) =>
                total +
                getShiftPlannedMinutes(
                    shift
                ),
            0
        );
}

function formatMinutes(minutes) {

    const value =
        Math.max(
            asNumber(minutes),
            0
        );

    const hours =
        Math.floor(
            value / 60
        );

    const remainingMinutes =
        value % 60;

    if (
        hours === 0
    ) {

        return `${remainingMinutes} Min.`;
    }

    if (
        remainingMinutes === 0
    ) {

        return `${hours} Std.`;
    }

    return `${hours} Std. ${remainingMinutes} Min.`;
}

/************************************************
 * ZEITABWEICHUNGEN
 ************************************************/

function getVisibleTimeDeviations(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return asArray(state.timeDeviations)
        .filter(
            (deviation) =>
                isActive(deviation) &&
                (
                    !deviation.objectId ||
                    visibleObjectIds.includes(
                        deviation.objectId
                    )
                )
        );
}

function getOpenTimeDeviations(state) {

    return getVisibleTimeDeviations(state)
        .filter(
            (deviation) =>
                !isClosedStatus(
                    deviation.status
                )
        );
}

function getTimeDeviationRate(state) {

    return calculatePercentage(
        getOpenTimeDeviations(state).length,
        getCurrentMonthShifts(state).length
    );
}

/************************************************
 * MELDUNGEN
 ************************************************/

function getVisibleTickets(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return asArray(state.tickets)
        .filter(
            (ticket) =>
                isActive(ticket) &&
                (
                    !ticket.objectId ||
                    visibleObjectIds.includes(
                        ticket.objectId
                    )
                )
        );
}

function getOpenTickets(state) {

    return getVisibleTickets(state)
        .filter(
            (ticket) =>
                !isClosedStatus(
                    ticket.status
                )
        );
}

function getClosedTickets(state) {

    return getVisibleTickets(state)
        .filter(
            (ticket) =>
                isClosedStatus(
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

function getTicketResolutionRate(state) {

    const allTickets =
        getVisibleTickets(state);

    return calculatePercentage(
        getClosedTickets(state).length,
        allTickets.length
    );
}

/************************************************
 * MATERIAL
 ************************************************/

function getVisibleMaterialStock(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return asArray(state.materialStock)
        .filter(
            (stock) =>
                isActive(stock) &&
                (
                    !stock.objectId ||
                    visibleObjectIds.includes(
                        stock.objectId
                    )
                )
        );
}

function isMaterialWarning(stock) {

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

    const current =
        asNumber(
            stock.currentAmount ??
            stock.quantity ??
            stock.stock
        );

    const minimum =
        asNumber(
            stock.minimumAmount ??
            stock.minimumStock ??
            stock.minStock
        );

    return (
        minimum > 0 &&
        current <= minimum
    );
}

function getMaterialWarnings(state) {

    return getVisibleMaterialStock(state)
        .filter(
            isMaterialWarning
        );
}

/************************************************
 * ABWESENHEITEN
 ************************************************/

function isAbsenceRequest(request) {

    return [
        "SICK",
        "SICKNESS",
        "VACATION",
        "ABSENCE",
        "URLAUB",
        "KRANK"
    ].includes(
        normalizeStatus(
            request.type ??
            request.requestType
        )
    );
}

function getOpenAbsences(state) {

    return asArray(state.customerRequests)
        .filter(
            (request) =>
                isActive(request) &&
                isAbsenceRequest(request) &&
                !isClosedStatus(
                    request.status
                )
        );
}

/************************************************
 * OBJEKTAUSWERTUNG
 ************************************************/

function getObjectTasks(
    state,
    objectId
) {

    return getVisibleTasks(state)
        .filter(
            (task) =>
                task.objectId === objectId
        );
}

function getObjectTaskLogs(
    state,
    objectId
) {

    return getCompletedTaskLogs(state)
        .filter(
            (log) =>
                log.objectId === objectId
        );
}

function getObjectShifts(
    state,
    objectId
) {

    return getCurrentMonthShifts(state)
        .filter(
            (shift) =>
                shift.objectId === objectId
        );
}

function getObjectTickets(
    state,
    objectId
) {

    return getOpenTickets(state)
        .filter(
            (ticket) =>
                ticket.objectId === objectId
        );
}

function getObjectMaterialWarnings(
    state,
    objectId
) {

    return getMaterialWarnings(state)
        .filter(
            (stock) =>
                stock.objectId === objectId
        );
}

function calculateObjectScore(
    state,
    object
) {

    const tasks =
        getObjectTasks(
            state,
            object.id
        );

    const completed =
        getObjectTaskLogs(
            state,
            object.id
        );

    const openTickets =
        getObjectTickets(
            state,
            object.id
        );

    const materialWarnings =
        getObjectMaterialWarnings(
            state,
            object.id
        );

    const taskScore =
        tasks.length > 0
            ? calculatePercentage(
                completed.length,
                tasks.length
            )
            : 100;

    const ticketPenalty =
        Math.min(
            openTickets.length * 8,
            30
        );

    const materialPenalty =
        Math.min(
            materialWarnings.length * 6,
            20
        );

    return clamp(
        taskScore -
        ticketPenalty -
        materialPenalty,
        0,
        100
    );
}

function getObjectScoreStatus(score) {

    if (
        score >= 85
    ) {

        return {
            label:
                "Sehr gut",

            color:
                "success"
        };
    }

    if (
        score >= 65
    ) {

        return {
            label:
                "Stabil",

            color:
                "objects"
        };
    }

    if (
        score >= 45
    ) {

        return {
            label:
                "Prüfen",

            color:
                "warning"
        };
    }

    return {
        label:
            "Kritisch",

        color:
            "danger"
    };
}

function createObjectAnalysisRow(
    state,
    object
) {

    const tasks =
        getObjectTasks(
            state,
            object.id
        );

    const completed =
        getObjectTaskLogs(
            state,
            object.id
        );

    const shifts =
        getObjectShifts(
            state,
            object.id
        );

    const score =
        calculateObjectScore(
            state,
            object
        );

    const status =
        getObjectScoreStatus(
            score
        );

    return {
        title:
            object.name ??
            object.id ??
            "Objekt",

        description:
            `${completed.length}/${tasks.length} Aufgaben · ${shifts.length} Schichten · ${getObjectTickets(
                state,
                object.id
            ).length} Meldungen`,

        icon:
            "objects",

        color:
            status.color,

        value:
            `${score} %`,

        status:
            status.label,

        action:
            "open-object-analysis"
    };
}

/************************************************
 * MITARBEITERAUSWERTUNG
 ************************************************/

function getEmployeeShifts(
    state,
    employeeId
) {

    return getCurrentMonthShifts(state)
        .filter(
            (shift) =>
                shift.employeeId ===
                    employeeId ||
                shift.userId ===
                    employeeId
        );
}

function getEmployeeTaskLogs(
    state,
    employeeId
) {

    return getCompletedTaskLogs(state)
        .filter(
            (log) =>
                log.employeeId ===
                    employeeId ||
                log.userId ===
                    employeeId
        );
}

function getEmployeeDeviations(
    state,
    employeeId
) {

    return getOpenTimeDeviations(state)
        .filter(
            (deviation) =>
                deviation.employeeId ===
                    employeeId ||
                deviation.userId ===
                    employeeId
        );
}

function calculateEmployeeScore(
    state,
    employee
) {

    const shifts =
        getEmployeeShifts(
            state,
            employee.id
        );

    const taskLogs =
        getEmployeeTaskLogs(
            state,
            employee.id
        );

    const deviations =
        getEmployeeDeviations(
            state,
            employee.id
        );

    if (
        shifts.length === 0 &&
        taskLogs.length === 0
    ) {

        return 0;
    }

    const baseScore =
        75;

    const taskBonus =
        Math.min(
            taskLogs.length * 2,
            20
        );

    const deviationPenalty =
        Math.min(
            deviations.length * 7,
            35
        );

    return clamp(
        baseScore +
        taskBonus -
        deviationPenalty,
        0,
        100
    );
}

function createEmployeeAnalysisRow(
    state,
    employee
) {

    const shifts =
        getEmployeeShifts(
            state,
            employee.id
        );

    const completedTasks =
        getEmployeeTaskLogs(
            state,
            employee.id
        );

    const deviations =
        getEmployeeDeviations(
            state,
            employee.id
        );

    const score =
        calculateEmployeeScore(
            state,
            employee
        );

    const status =
        getObjectScoreStatus(
            score
        );

    return {
        title:
            getUserName(
                employee
            ),

        description:
            `${shifts.length} Schichten · ${completedTasks.length} Aufgaben · ${deviations.length} Abweichungen`,

        icon:
            "personnel",

        color:
            status.color,

        value:
            `${score} %`,

        status:
            status.label,

        action:
            "open-employee-analysis"
    };
}

/************************************************
 * STATUSKARTEN
 ************************************************/

function renderAnalysisStatus(state) {

    const completionRate =
        getTaskCompletionRate(state);

    const resolutionRate =
        getTicketResolutionRate(state);

    const timeDeviationRate =
        getTimeDeviationRate(state);

    const materialWarnings =
        getMaterialWarnings(state);

    return renderStatusGrid(
        [
            {
                title:
                    "Aufgabenquote",

                value:
                    `${completionRate} %`,

                description:
                    "erledigt",

                status:
                    completionRate >= 80
                        ? "success"
                        : (
                            completionRate >= 60
                                ? "warning"
                                : "danger"
                        ),

                icon:
                    "tasks"
            },
            {
                title:
                    "Meldungsquote",

                value:
                    `${resolutionRate} %`,

                description:
                    "abgeschlossen",

                status:
                    resolutionRate >= 75
                        ? "success"
                        : "warning",

                icon:
                    "communication"
            },
            {
                title:
                    "Zeitabweichung",

                value:
                    `${timeDeviationRate} %`,

                description:
                    "offene Fälle",

                status:
                    timeDeviationRate <= 10
                        ? "success"
                        : (
                            timeDeviationRate <= 25
                                ? "warning"
                                : "danger"
                        ),

                icon:
                    "times"
            },
            {
                title:
                    "Material",

                value:
                    materialWarnings.length,

                description:
                    "Warnungen",

                status:
                    materialWarnings.length === 0
                        ? "success"
                        : "warning",

                icon:
                    "materials"
            }
        ],
        {
            columns:
                2,

            compact:
                true
        }
    );
}

/************************************************
 * WARNUNGEN
 ************************************************/

function getAnalysisAlerts(state) {

    const alerts = [];

    const criticalTickets =
        getCriticalTickets(state);

    const deviations =
        getOpenTimeDeviations(state);

    const materialWarnings =
        getMaterialWarnings(state);

    const completionRate =
        getTaskCompletionRate(state);

    if (
        criticalTickets.length > 0
    ) {

        alerts.push({
            title:
                "Kritische Meldungen",

            message:
                `${criticalTickets.length} dringende Vorgänge beeinflussen die aktuelle Bewertung.`,

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

    if (
        deviations.length > 0
    ) {

        alerts.push({
            title:
                "Zeitabweichungen prüfen",

            message:
                `${deviations.length} offene Fälle sind noch nicht geklärt.`,

            status:
                "warning",

            icon:
                "times",

            route:
                ROUTES.TIMES,

            buttonLabel:
                "Zeiten öffnen"
        });
    }

    if (
        materialWarnings.length > 0
    ) {

        alerts.push({
            title:
                "Material beeinflusst Leistung",

            message:
                `${materialWarnings.length} Bestände liegen am oder unter dem Mindestbestand.`,

            status:
                "warning",

            icon:
                "materials",

            action:
                "open-material-analysis",

            buttonLabel:
                "Material prüfen"
        });
    }

    if (
        completionRate < 60 &&
        getVisibleTasks(state).length > 0
    ) {

        alerts.push({
            title:
                "Niedrige Aufgabenquote",

            message:
                `Aktuell wurden nur ${completionRate} % der hinterlegten Aufgaben abgeschlossen.`,

            status:
                "danger",

            icon:
                "tasks",

            route:
                ROUTES.TASKS,

            buttonLabel:
                "Aufgaben prüfen"
        });
    }

    return alerts;
}

/************************************************
 * SCHNELLZUGRIFFE
 ************************************************/

function getQuickActions() {

    return [
        {
            title:
                "Objektauswertung",

            subtitle:
                "Leistung je Standort",

            icon:
                "objects",

            color:
                "objects",

            action:
                "open-object-analysis"
        },
        {
            title:
                "Personalauswertung",

            subtitle:
                "Schichten und Abweichungen",

            icon:
                "personnel",

            color:
                "personnel",

            action:
                "open-personnel-analysis"
        },
        {
            title:
                "Zeitauswertung",

            subtitle:
                "Soll, Ist und Differenzen",

            icon:
                "times",

            color:
                "times",

            route:
                ROUTES.TIMES
        },
        {
            title:
                "Bericht erstellen",

            subtitle:
                "Auswertung exportieren",

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
 * FORTSCHRITTSKARTEN
 ************************************************/

function renderPerformanceProgress(state) {

    const completionRate =
        getTaskCompletionRate(state);

    const completed =
        getCompletedTaskLogs(state).length;

    const total =
        getVisibleTasks(state).length;

    return renderProgressCard({
        title:
            "Aufgabenerfüllung",

        current:
            completed,

        total,

        description:
            `${completionRate} % der sichtbaren Aufgaben wurden abgeschlossen.`,

        status:
            completionRate >= 80
                ? "success"
                : (
                    completionRate >= 60
                        ? "warning"
                        : "danger"
                )
    });
}

function renderTicketProgress(state) {

    const completed =
        getClosedTickets(state).length;

    const total =
        getVisibleTickets(state).length;

    return renderProgressCard({
        title:
            "Bearbeitete Meldungen",

        current:
            completed,

        total,

        description:
            `${getTicketResolutionRate(
                state
            )} % der Vorgänge wurden abgeschlossen.`,

        status:
            "communication"
    });
}

/************************************************
 * LISTEN
 ************************************************/

function renderObjectAnalysisList(state) {

    const objects =
        getVisibleObjects(state)
            .slice()
            .sort(
                (firstObject, secondObject) =>
                    calculateObjectScore(
                        state,
                        secondObject
                    ) -
                    calculateObjectScore(
                        state,
                        firstObject
                    )
            );

    if (
        objects.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Objekte verfügbar",

            description:
                "Für die aktuelle Benutzerrolle können keine Objektauswertungen erstellt werden.",

            icon:
                "objects",

            color:
                "objects",

            actionLabel:
                "Objekte öffnen",

            actionRoute:
                ROUTES.OBJECTS,

            compact:
                true
        });
    }

    return renderActionRows(
        objects.map(
            (object) =>
                createObjectAnalysisRow(
                    state,
                    object
                )
        )
    );
}

function renderEmployeeAnalysisList(state) {

    const employees =
        getEmployees(state)
            .slice()
            .sort(
                (firstEmployee, secondEmployee) =>
                    calculateEmployeeScore(
                        state,
                        secondEmployee
                    ) -
                    calculateEmployeeScore(
                        state,
                        firstEmployee
                    )
            );

    if (
        employees.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Mitarbeiter verfügbar",

            description:
                "Es können derzeit keine Personalkennzahlen berechnet werden.",

            icon:
                "personnel",

            color:
                "personnel",

            compact:
                true
        });
    }

    return renderActionRows(
        employees.map(
            (employee) =>
                createEmployeeAnalysisRow(
                    state,
                    employee
                )
        )
    );
}

/************************************************
 * ZEITAUSWERTUNG
 ************************************************/

function renderTimeAnalysis(state) {

    const actualMinutes =
        getMonthActualMinutes(state);

    const plannedMinutes =
        getMonthPlannedMinutes(state);

    const difference =
        actualMinutes -
        plannedMinutes;

    return renderInfoList(
        [
            {
                label:
                    "Schichten im Monat",

                value:
                    getCurrentMonthShifts(
                        state
                    ).length,

                status:
                    "times",

                icon:
                    "times"
            },
            {
                label:
                    "Geplante Zeit",

                value:
                    formatMinutes(
                        plannedMinutes
                    ),

                status:
                    "times",

                icon:
                    "times"
            },
            {
                label:
                    "Erfasste Zeit",

                value:
                    formatMinutes(
                        actualMinutes
                    ),

                status:
                    "success",

                icon:
                    "times"
            },
            {
                label:
                    "Abweichung",

                value:
                    difference === 0
                        ? "Keine"
                        : `${
                            difference > 0
                                ? "+"
                                : "-"
                        }${formatMinutes(
                            Math.abs(
                                difference
                            )
                        )}`,

                status:
                    difference === 0
                        ? "success"
                        : "warning",

                icon:
                    "warning",

                emphasize:
                    difference !== 0
            },
            {
                label:
                    "Offene Fälle",

                value:
                    getOpenTimeDeviations(
                        state
                    ).length,

                status:
                    getOpenTimeDeviations(
                        state
                    ).length > 0
                        ? "warning"
                        : "success",

                icon:
                    "warning"
            }
        ],
        {
            columns:
                1
        }
    );
}

/************************************************
 * BETRIEBSKENNZAHLEN
 ************************************************/

function renderOperationalSummary(state) {

    return renderInfoList(
        [
            {
                label:
                    "Aktive Objekte",

                value:
                    getVisibleObjects(
                        state
                    ).length,

                status:
                    "objects",

                icon:
                    "objects"
            },
            {
                label:
                    "Aktive Mitarbeiter",

                value:
                    getEmployees(
                        state
                    ).length,

                status:
                    "personnel",

                icon:
                    "personnel"
            },
            {
                label:
                    "Laufende Schichten",

                value:
                    getRunningShifts(
                        state
                    ).length,

                status:
                    "success",

                icon:
                    "times"
            },
            {
                label:
                    "Offene Meldungen",

                value:
                    getOpenTickets(
                        state
                    ).length,

                status:
                    getOpenTickets(
                        state
                    ).length > 0
                        ? "communication"
                        : "success",

                icon:
                    "communication"
            },
            {
                label:
                    "Abwesenheiten",

                value:
                    getOpenAbsences(
                        state
                    ).length,

                status:
                    getOpenAbsences(
                        state
                    ).length > 0
                        ? "warning"
                        : "success",

                icon:
                    "personnel"
            },
            {
                label:
                    "Materialwarnungen",

                value:
                    getMaterialWarnings(
                        state
                    ).length,

                status:
                    getMaterialWarnings(
                        state
                    ).length > 0
                        ? "warning"
                        : "success",

                icon:
                    "materials"
            }
        ],
        {
            columns:
                2
        }
    );
}

/************************************************
 * ZUGRIFF VERWEIGERT
 ************************************************/

function renderAccessDenied() {

    return `
        <section class="app-analysis-page">

            ${renderPageTitle({
                eyebrow:
                    "Auswertung",

                title:
                    "Kein Zugriff",

                description:
                    "Dieser Auswertungsbereich ist für deine Benutzerrolle nicht freigegeben.",

                color:
                    "analysis",

                backRoute:
                    ROUTES.OVERVIEW
            })}

            ${renderEmptyState({
                title:
                    "Auswertungen nicht verfügbar",

                description:
                    "Bitte wende dich an die zuständige Objektleitung oder Administration.",

                icon:
                    "analysis",

                color:
                    "warning",

                actionLabel:
                    "Zur Übersicht",

                actionRoute:
                    ROUTES.OVERVIEW
            })}

        </section>
    `;
}

/************************************************
 * HAUPTSEITE
 ************************************************/

export function renderAnalysisPage(state) {

    if (
        !canViewAnalysis(
            state
        )
    ) {

        return renderAccessDenied();
    }

    const alerts =
        getAnalysisAlerts(state);

    const objects =
        getVisibleObjects(state);

    const employees =
        getEmployees(state);

    const role =
        getRole(state);

    return `
        <section class="app-analysis-page">

            ${renderPageTitle({
                eyebrow:
                    getCurrentMonthLabel(),

                title:
                    "Auswertung",

                description:
                    role ===
                    USER_ROLES.BUCHHALTUNG
                        ? "Arbeitszeiten, Abweichungen und Monatswerte."
                        : "Leistung, Qualität und Handlungsbedarf auf einen Blick.",

                color:
                    "analysis",

                actionLabel:
                    "Bericht",

                actionRoute:
                    ROUTES.REPORTS,

                compact:
                    true
            })}

            <section class="app-analysis-status">

                ${renderAnalysisStatus(
                    state
                )}

            </section>

            ${
                alerts.length > 0
                    ? `
                        <section class="app-analysis-alerts">

                            ${renderSectionHeader({
                                title:
                                    "Auffälligkeiten",

                                count:
                                    alerts.length,

                                compact:
                                    true
                            })}

                            ${renderAlertList(
                                alerts,
                                {
                                    maximum:
                                        4
                                }
                            )}

                        </section>
                    `
                    : ""
            }

            <section class="app-analysis-quick-actions">

                ${renderSectionHeader({
                    title:
                        "Auswertungsbereiche",

                    compact:
                        true
                })}

                ${renderCompactModuleList(
                    getQuickActions()
                )}

            </section>

            <section class="app-analysis-progress">

                ${renderSectionHeader({
                    title:
                        "Leistungsfortschritt",

                    description:
                        "Aufgaben und Meldungen",

                    compact:
                        true
                })}

                ${renderPerformanceProgress(
                    state
                )}

                ${renderTicketProgress(
                    state
                )}

            </section>

            <section class="app-analysis-content">

                ${renderCollapsiblePanel({
                    title:
                        "Betriebsübersicht",

                    description:
                        "Zentrale Kennzahlen des aktuellen Bereichs",

                    icon:
                        "analysis",

                    color:
                        "analysis",

                    open:
                        true,

                    content:
                        renderOperationalSummary(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Objektleistung",

                    description:
                        "Aufgaben, Meldungen und Materialstatus je Objekt",

                    icon:
                        "objects",

                    color:
                        "objects",

                    count:
                        objects.length,

                    content:
                        renderObjectAnalysisList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Personalleistung",

                    description:
                        "Schichten, Aufgaben und Zeitabweichungen",

                    icon:
                        "personnel",

                    color:
                        "personnel",

                    count:
                        employees.length,

                    content:
                        renderEmployeeAnalysisList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Zeitauswertung",

                    description:
                        "Soll, Ist und offene Abweichungen",

                    icon:
                        "times",

                    color:
                        "times",

                    count:
                        getCurrentMonthShifts(
                            state
                        ).length,

                    content:
                        renderTimeAnalysis(
                            state
                        )
                })}

            </section>

            ${renderTextBlock({
                title:
                    "Bewertung der Kennzahlen",

                text:
                    "Die dargestellten Bewertungen werden aus vorhandenen Aufgaben, Schichten, Meldungen, Materialbeständen und Zeitabweichungen berechnet. Sie dienen als operative Orientierung und können später um vertragliche Qualitätsprüfungen und individuelle Gewichtungen erweitert werden.",

                color:
                    "analysis",

                icon:
                    "analysis"
            })}

        </section>
    `;
}