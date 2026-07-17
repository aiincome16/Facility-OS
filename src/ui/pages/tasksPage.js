/************************************************
 * Facility OS
 * tasksPage.js
 *
 * Visuelle Aufgabenansicht
 * - Räume und Aufgaben
 * - Sollzeiten
 * - Tagesfortschritt
 * - Reihenfolge
 * - Dokumentationspflichten
 * - rollenabhängige Darstellung
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

/************************************************
 * BENUTZER UND ROLLE
 ************************************************/

function getRole(state) {

    return normalizeStatus(
        state.currentUser?.role
    );
}

function canManageTasks(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER
    ].includes(
        getRole(state)
    );
}

function canViewTasks(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.MITARBEITER
    ].includes(
        getRole(state)
    );
}

/************************************************
 * OBJEKTE
 ************************************************/

function getObjectById(
    state,
    objectId
) {

    if (!objectId) {

        return null;
    }

    return asArray(state.objects)
        .find(
            (object) =>
                object.id === objectId
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
 * SICHTBARE OBJEKTE
 ************************************************/

function getVisibleObjects(state) {

    const user =
        state.currentUser;

    const objects =
        asArray(state.objects)
            .filter(isActive);

    if (!user) {

        return [];
    }

    const role =
        getRole(state);

    if (
        [
            USER_ROLES.SUPER_ADMIN,
            USER_ROLES.ADMIN
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

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        const assignedObjectIds =
            asArray(
                user.assignedObjectIds ??
                user.objectIds
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
                        user.id
                    )
            );

        return assignedObjects.length > 0
            ? assignedObjects
            : objects;
    }

    return [];
}

/************************************************
 * RÄUME
 ************************************************/

function getRooms(state) {

    return asArray(state.rooms)
        .filter(isActive);
}

function getRoomById(
    state,
    roomId
) {

    if (!roomId) {

        return null;
    }

    return getRooms(state)
        .find(
            (room) =>
                room.id === roomId
        ) ??
        null;
}

function getRoomName(
    state,
    task
) {

    const room =
        getRoomById(
            state,
            task.roomId
        );

    return (
        task.roomName ??
        room?.name ??
        room?.title ??
        task.roomId ??
        "Allgemeiner Bereich"
    );
}

function getObjectRooms(
    state,
    objectId
) {

    return getRooms(state)
        .filter(
            (room) =>
                room.objectId === objectId
        )
        .sort(
            (firstRoom, secondRoom) =>
                asNumber(
                    firstRoom.sequence ??
                    firstRoom.order
                ) -
                asNumber(
                    secondRoom.sequence ??
                    secondRoom.order
                )
        );
}

/************************************************
 * AUFGABEN
 ************************************************/

function getTasks(state) {

    return asArray(state.tasks)
        .filter(isActive);
}

function getVisibleTasks(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return getTasks(state)
        .filter(
            (task) =>
                !task.objectId ||
                visibleObjectIds.includes(
                    task.objectId
                )
        );
}

function getCurrentObjectTasks(state) {

    const objectId =
        state.currentObject?.id;

    if (!objectId) {

        return getVisibleTasks(state);
    }

    return getVisibleTasks(state)
        .filter(
            (task) =>
                task.objectId === objectId
        );
}

function sortTasks(tasks) {

    return [
        ...tasks
    ].sort(
        (firstTask, secondTask) => {

            const firstSequence =
                asNumber(
                    firstTask.sequence ??
                    firstTask.order ??
                    firstTask.position,
                    9999
                );

            const secondSequence =
                asNumber(
                    secondTask.sequence ??
                    secondTask.order ??
                    secondTask.position,
                    9999
                );

            return (
                firstSequence -
                secondSequence
            );
        }
    );
}

/************************************************
 * AUFGABENPROTOKOLLE
 ************************************************/

function getTaskLogs(state) {

    return asArray(state.taskLogs);
}

function isCompletedLog(log) {

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

function getTaskLog(
    state,
    task
) {

    const userId =
        state.currentUser?.id;

    return getTaskLogs(state)
        .find(
            (log) =>
                log.taskId === task.id &&
                (
                    !userId ||
                    !log.userId ||
                    log.userId === userId ||
                    log.employeeId === userId
                )
        ) ??
        null;
}

function isTaskCompleted(
    state,
    task
) {

    const log =
        getTaskLog(
            state,
            task
        );

    return (
        Boolean(log) &&
        isCompletedLog(log)
    );
}

/************************************************
 * ZEITEN
 ************************************************/

function getTaskTargetMinutes(task) {

    return asNumber(
        task.targetMinutes ??
        task.durationMinutes ??
        task.plannedMinutes ??
        task.sollMinutes
    );
}

function getTaskActualMinutes(
    state,
    task
) {

    const log =
        getTaskLog(
            state,
            task
        );

    return asNumber(
        log?.actualMinutes ??
        log?.durationMinutes ??
        log?.minutes
    );
}

function formatMinutes(minutes) {

    const value =
        asNumber(minutes);

    if (
        value <= 0
    ) {

        return "Keine Sollzeit";
    }

    if (
        value < 60
    ) {

        return `${value} Min.`;
    }

    const hours =
        Math.floor(
            value / 60
        );

    const remainingMinutes =
        value % 60;

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

function getTimeDeviations(state) {

    return asArray(state.timeDeviations);
}

function getTaskDeviation(
    state,
    task
) {

    return getTimeDeviations(state)
        .find(
            (deviation) =>
                deviation.taskId ===
                    task.id &&
                ![
                    "CLOSED",
                    "RESOLVED",
                    "APPROVED",
                    "ARCHIVED"
                ].includes(
                    normalizeStatus(
                        deviation.status
                    )
                )
        ) ??
        null;
}

function requiresDocumentation(
    state,
    task
) {

    if (
        task.documentationRequired === true ||
        task.photoRequired === true ||
        task.proofRequired === true
    ) {

        return true;
    }

    return Boolean(
        getTaskDeviation(
            state,
            task
        )
    );
}

/************************************************
 * SCHICHT
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

function getOwnRunningShift(state) {

    const userId =
        state.currentUser?.id;

    return asArray(state.shifts)
        .find(
            (shift) =>
                isRunningShift(
                    shift
                ) &&
                (
                    shift.userId ===
                        userId ||
                    shift.employeeId ===
                        userId
                )
        ) ??
        null;
}

/************************************************
 * AUFGABENSTATUS
 ************************************************/

function getTaskStatus(
    state,
    task
) {

    if (
        isTaskCompleted(
            state,
            task
        )
    ) {

        return {
            label:
                "Erledigt",

            color:
                "success"
        };
    }

    if (
        getTaskDeviation(
            state,
            task
        )
    ) {

        return {
            label:
                "Abweichung",

            color:
                "warning"
        };
    }

    const status =
        normalizeStatus(
            task.status
        );

    if (
        [
            "BLOCKED",
            "NOT_POSSIBLE",
            "CANCELLED"
        ].includes(status)
    ) {

        return {
            label:
                "Nicht möglich",

            color:
                "danger"
        };
    }

    if (
        [
            "IN_PROGRESS",
            "RUNNING",
            "STARTED"
        ].includes(status)
    ) {

        return {
            label:
                "In Arbeit",

            color:
                "info"
        };
    }

    return {
        label:
            "Offen",

        color:
            "tasks"
    };
}

/************************************************
 * AUFGABENZEILE
 ************************************************/

function createTaskRow(
    state,
    task
) {

    const status =
        getTaskStatus(
            state,
            task
        );

    const targetMinutes =
        getTaskTargetMinutes(
            task
        );

    const actualMinutes =
        getTaskActualMinutes(
            state,
            task
        );

    const descriptionParts = [
        getRoomName(
            state,
            task
        )
    ];

    if (
        targetMinutes > 0
    ) {

        descriptionParts.push(
            `Soll: ${formatMinutes(
                targetMinutes
            )}`
        );
    }

    if (
        actualMinutes > 0
    ) {

        descriptionParts.push(
            `Ist: ${formatMinutes(
                actualMinutes
            )}`
        );
    }

    if (
        requiresDocumentation(
            state,
            task
        )
    ) {

        descriptionParts.push(
            "Nachweis erforderlich"
        );
    }

    return {
        title:
            task.name ??
            task.title ??
            task.description ??
            task.id ??
            "Aufgabe",

        description:
            descriptionParts.join(
                " · "
            ),

        icon:
            "tasks",

        color:
            status.color,

        status:
            status.label,

        value:
            targetMinutes > 0
                ? formatMinutes(
                    targetMinutes
                )
                : null,

        action:
            "open-task",

        className:
            `task-row task-row-${status.color}`
    };
}

/************************************************
 * RAUMZEILE
 ************************************************/

function createRoomRow(
    state,
    room
) {

    const tasks =
        sortTasks(
            getCurrentObjectTasks(
                state
            ).filter(
                (task) =>
                    task.roomId === room.id
            )
        );

    const completedTasks =
        tasks.filter(
            (task) =>
                isTaskCompleted(
                    state,
                    task
                )
        );

    const targetMinutes =
        tasks.reduce(
            (total, task) =>
                total +
                getTaskTargetMinutes(
                    task
                ),
            0
        );

    return {
        title:
            room.name ??
            room.title ??
            room.id ??
            "Raum",

        description:
            `${tasks.length} Aufgaben · ${formatMinutes(
                targetMinutes
            )}`,

        icon:
            "objects",

        color:
            completedTasks.length ===
            tasks.length &&
            tasks.length > 0
                ? "success"
                : "objects",

        value:
            `${completedTasks.length}/${tasks.length}`,

        status:
            completedTasks.length ===
            tasks.length &&
            tasks.length > 0
                ? "Erledigt"
                : "Offen",

        action:
            "open-room-tasks"
    };
}

/************************************************
 * STATUSKARTEN
 ************************************************/

function renderTaskStatus(state) {

    const tasks =
        getCurrentObjectTasks(state);

    const completedTasks =
        tasks.filter(
            (task) =>
                isTaskCompleted(
                    state,
                    task
                )
        );

    const openTasks =
        tasks.filter(
            (task) =>
                !isTaskCompleted(
                    state,
                    task
                )
        );

    const deviations =
        tasks.filter(
            (task) =>
                Boolean(
                    getTaskDeviation(
                        state,
                        task
                    )
                )
        );

    return renderStatusGrid(
        [
            {
                title:
                    "Aufgaben",

                value:
                    tasks.length,

                description:
                    "gesamt",

                status:
                    "tasks",

                icon:
                    "tasks"
            },
            {
                title:
                    "Erledigt",

                value:
                    completedTasks.length,

                description:
                    "abgeschlossen",

                status:
                    "success",

                icon:
                    "success"
            },
            {
                title:
                    "Offen",

                value:
                    openTasks.length,

                description:
                    "noch zu erledigen",

                status:
                    openTasks.length > 0
                        ? "warning"
                        : "success",

                icon:
                    "tasks"
            },
            {
                title:
                    "Abweichungen",

                value:
                    deviations.length,

                description:
                    "Dokumentation nötig",

                status:
                    deviations.length > 0
                        ? "danger"
                        : "success",

                icon:
                    "warning"
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

function getTaskAlerts(state) {

    const alerts = [];

    const role =
        getRole(state);

    if (
        !state.currentObject
    ) {

        alerts.push({
            title:
                "Kein Objekt ausgewählt",

            message:
                "Wähle ein Objekt, damit die passenden Räume und Aufgaben angezeigt werden.",

            status:
                "warning",

            icon:
                "objects",

            route:
                ROUTES.OBJECTS,

            buttonLabel:
                "Objekt auswählen"
        });

        return alerts;
    }

    if (
        role ===
        USER_ROLES.MITARBEITER &&
        !getOwnRunningShift(state)
    ) {

        alerts.push({
            title:
                "Schicht nicht gestartet",

            message:
                "Die Aufgaben können vorbereitet werden. Für die Bearbeitung sollte zuerst eingecheckt werden.",

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

    const deviations =
        getCurrentObjectTasks(state)
            .filter(
                (task) =>
                    Boolean(
                        getTaskDeviation(
                            state,
                            task
                        )
                    )
            );

    if (
        deviations.length > 0
    ) {

        alerts.push({
            title:
                "Dokumentation erforderlich",

            message:
                `${deviations.length} Aufgaben weisen eine Zeitabweichung auf und benötigen einen Nachweis.`,

            status:
                "warning",

            icon:
                "warning",

            action:
                "open-task-deviations",

            buttonLabel:
                "Abweichungen prüfen"
        });
    }

    const tasks =
        getCurrentObjectTasks(state);

    if (
        tasks.length === 0
    ) {

        alerts.push({
            title:
                "Keine Aufgaben hinterlegt",

            message:
                "Für das ausgewählte Objekt wurden noch keine aktiven Aufgaben eingerichtet.",

            status:
                "info",

            icon:
                "tasks",

            route:
                ROUTES.OBJECT_DETAIL,

            buttonLabel:
                "Objekt öffnen"
        });
    }

    return alerts;
}

/************************************************
 * SCHNELLZUGRIFFE
 ************************************************/

function getTaskQuickActions(state) {

    const actions = [];

    if (
        getRole(state) ===
        USER_ROLES.MITARBEITER
    ) {

        const runningShift =
            getOwnRunningShift(state);

        actions.push({
            title:
                runningShift
                    ? "Schicht beenden"
                    : "Schicht starten",

            subtitle:
                runningShift
                    ? "Checkout mit Abschlusskontrolle"
                    : "Am aktuellen Objekt einchecken",

            icon:
                "times",

            color:
                runningShift
                    ? "warning"
                    : "success",

            action:
                runningShift
                    ? "checkout"
                    : "checkin"
        });
    }

    actions.push(
        {
            title:
                "Problem melden",

            subtitle:
                "Aufgabe nicht möglich oder Schaden",

            icon:
                "warning",

            color:
                "communication",

            action:
                "create-problem-ticket"
        },
        {
            title:
                "Materialmangel",

            subtitle:
                "Fehlendes Reinigungsmaterial",

            icon:
                "materials",

            color:
                "materials",

            action:
                "create-material-ticket"
        },
        {
            title:
                "Objektanleitung",

            subtitle:
                "Ablauf, Dosierung und Sicherheit",

            icon:
                "objects",

            color:
                "objects",

            route:
                state.currentObject
                    ? ROUTES.OBJECT_DETAIL
                    : ROUTES.OBJECTS
        }
    );

    if (
        canManageTasks(state)
    ) {

        actions.push({
            title:
                "Aufgabe anlegen",

            subtitle:
                "Neue Leistung hinzufügen",

            icon:
                "tasks",

            color:
                "tasks",

            action:
                "create-task"
        });
    }

    return actions;
}

/************************************************
 * AUFGABENLISTEN
 ************************************************/

function renderOpenTasks(state) {

    const tasks =
        sortTasks(
            getCurrentObjectTasks(state)
                .filter(
                    (task) =>
                        !isTaskCompleted(
                            state,
                            task
                        )
                )
        );

    if (
        tasks.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine offenen Aufgaben",

            description:
                "Alle Aufgaben im ausgewählten Objekt sind erledigt oder es wurden noch keine Aufgaben hinterlegt.",

            icon:
                "tasks",

            color:
                "success",

            compact:
                true
        });
    }

    return renderActionRows(
        tasks.map(
            (task) =>
                createTaskRow(
                    state,
                    task
                )
        )
    );
}

function renderCompletedTasks(state) {

    const tasks =
        sortTasks(
            getCurrentObjectTasks(state)
                .filter(
                    (task) =>
                        isTaskCompleted(
                            state,
                            task
                        )
                )
        );

    if (
        tasks.length === 0
    ) {

        return renderEmptyState({
            title:
                "Noch keine Aufgaben erledigt",

            description:
                "Abgeschlossene Aufgaben erscheinen automatisch in diesem Bereich.",

            icon:
                "tasks",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        tasks.map(
            (task) =>
                createTaskRow(
                    state,
                    task
                )
        )
    );
}

function renderDeviationTasks(state) {

    const tasks =
        sortTasks(
            getCurrentObjectTasks(state)
                .filter(
                    (task) =>
                        Boolean(
                            getTaskDeviation(
                                state,
                                task
                            )
                        )
                )
        );

    if (
        tasks.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine offenen Abweichungen",

            description:
                "Für die aktuellen Aufgaben ist keine zusätzliche Dokumentation erforderlich.",

            icon:
                "warning",

            color:
                "success",

            compact:
                true
        });
    }

    return renderActionRows(
        tasks.map(
            (task) =>
                createTaskRow(
                    state,
                    task
                )
        )
    );
}

/************************************************
 * RÄUME UND REIHENFOLGE
 ************************************************/

function renderRoomSequence(state) {

    const objectId =
        state.currentObject?.id;

    if (!objectId) {

        return renderEmptyState({
            title:
                "Kein Objekt ausgewählt",

            description:
                "Nach der Objektauswahl wird hier die vorgesehene Raumreihenfolge angezeigt.",

            icon:
                "objects",

            color:
                "warning",

            actionLabel:
                "Objekt auswählen",

            actionRoute:
                ROUTES.OBJECTS,

            compact:
                true
        });
    }

    const rooms =
        getObjectRooms(
            state,
            objectId
        );

    if (
        rooms.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Räume hinterlegt",

            description:
                "Für dieses Objekt wurde noch keine Raumstruktur eingerichtet.",

            icon:
                "objects",

            color:
                "objects",

            actionLabel:
                canManageTasks(state)
                    ? "Raum anlegen"
                    : "",

            action:
                canManageTasks(state)
                    ? "create-room"
                    : null,

            compact:
                true
        });
    }

    return renderActionRows(
        rooms.map(
            (room) =>
                createRoomRow(
                    state,
                    room
                )
        )
    );
}

/************************************************
 * ZEITÜBERSICHT
 ************************************************/

function renderTaskTimeSummary(state) {

    const tasks =
        getCurrentObjectTasks(state);

    const targetMinutes =
        tasks.reduce(
            (total, task) =>
                total +
                getTaskTargetMinutes(
                    task
                ),
            0
        );

    const actualMinutes =
        tasks.reduce(
            (total, task) =>
                total +
                getTaskActualMinutes(
                    state,
                    task
                ),
            0
        );

    const tasksWithDocumentation =
        tasks.filter(
            (task) =>
                requiresDocumentation(
                    state,
                    task
                )
        );

    return renderInfoList(
        [
            {
                label:
                    "Geplante Gesamtzeit",

                value:
                    formatMinutes(
                        targetMinutes
                    ),

                status:
                    "times",

                icon:
                    "times"
            },
            {
                label:
                    "Erfasste Arbeitszeit",

                value:
                    formatMinutes(
                        actualMinutes
                    ),

                status:
                    actualMinutes >
                    targetMinutes &&
                    targetMinutes > 0
                        ? "warning"
                        : "success",

                icon:
                    "times"
            },
            {
                label:
                    "Dokumentationspflicht",

                value:
                    tasksWithDocumentation.length,

                status:
                    tasksWithDocumentation.length > 0
                        ? "warning"
                        : "success",

                icon:
                    "warning",

                emphasize:
                    tasksWithDocumentation.length > 0
            }
        ],
        {
            columns:
                1
        }
    );
}

/************************************************
 * FORTSCHRITT
 ************************************************/

function renderTaskProgress(state) {

    const tasks =
        getCurrentObjectTasks(state);

    const completedTasks =
        tasks.filter(
            (task) =>
                isTaskCompleted(
                    state,
                    task
                )
        );

    return renderProgressCard({
        title:
            "Tagesfortschritt",

        current:
            completedTasks.length,

        total:
            tasks.length,

        description:
            state.currentObject
                ? (
                    state.currentObject.name ??
                    state.currentObject.id
                )
                : "Alle sichtbaren Aufgaben",

        status:
            "tasks",

        route:
            null
    });
}

/************************************************
 * ZUGRIFF VERWEIGERT
 ************************************************/

function renderAccessDenied() {

    return `
        <section class="app-tasks-page">

            ${renderPageTitle({
                eyebrow:
                    "Aufgaben",

                title:
                    "Kein Zugriff",

                description:
                    "Dieser Aufgabenbereich ist für deine Benutzerrolle nicht freigegeben.",

                color:
                    "tasks",

                backRoute:
                    ROUTES.OVERVIEW
            })}

            ${renderEmptyState({
                title:
                    "Aufgaben nicht verfügbar",

                description:
                    "Bitte wende dich an die zuständige Objektleitung oder Administration.",

                icon:
                    "tasks",

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

export function renderTasksPage(state) {

    if (
        !canViewTasks(
            state
        )
    ) {

        return renderAccessDenied();
    }

    const tasks =
        getCurrentObjectTasks(state);

    const completedTasks =
        tasks.filter(
            (task) =>
                isTaskCompleted(
                    state,
                    task
                )
        );

    const openTasks =
        tasks.filter(
            (task) =>
                !isTaskCompleted(
                    state,
                    task
                )
        );

    const deviationTasks =
        tasks.filter(
            (task) =>
                Boolean(
                    getTaskDeviation(
                        state,
                        task
                    )
                )
        );

    const rooms =
        state.currentObject
            ? getObjectRooms(
                state,
                state.currentObject.id
            )
            : [];

    const alerts =
        getTaskAlerts(state);

    return `
        <section class="app-tasks-page">

            ${renderPageTitle({
                eyebrow:
                    "Aufgaben",

                title:
                    state.currentObject
                        ? (
                            state.currentObject.name ??
                            "Arbeitsplan"
                        )
                        : "Arbeitsplan",

                description:
                    state.currentObject
                        ? "Räume, Aufgaben, Reihenfolge und Dokumentation."
                        : "Wähle ein Objekt, um den vollständigen Arbeitsplan zu öffnen.",

                color:
                    "tasks",

                actionLabel:
                    canManageTasks(state)
                        ? "Neu"
                        : "Melden",

                action:
                    canManageTasks(state)
                        ? "create-task"
                        : "create-problem-ticket",

                compact:
                    true
            })}

            <section class="app-tasks-status">

                ${renderTaskStatus(
                    state
                )}

            </section>

            <section class="app-tasks-progress">

                ${renderTaskProgress(
                    state
                )}

            </section>

            ${
                alerts.length > 0
                    ? `
                        <section class="app-tasks-alerts">

                            ${renderSectionHeader({
                                title:
                                    "Hinweise",

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

            <section class="app-tasks-quick-actions">

                ${renderSectionHeader({
                    title:
                        "Schnellaktionen",

                    compact:
                        true
                })}

                ${renderCompactModuleList(
                    getTaskQuickActions(
                        state
                    )
                )}

            </section>

            <section class="app-tasks-content">

                ${renderCollapsiblePanel({
                    title:
                        "Offene Aufgaben",

                    description:
                        "Noch auszuführende Arbeiten",

                    icon:
                        "tasks",

                    color:
                        openTasks.length > 0
                            ? "tasks"
                            : "success",

                    count:
                        openTasks.length,

                    open:
                        true,

                    content:
                        renderOpenTasks(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Räume und Reihenfolge",

                    description:
                        "Vorgesehener Ablauf im Objekt",

                    icon:
                        "objects",

                    color:
                        "objects",

                    count:
                        rooms.length,

                    content:
                        renderRoomSequence(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Zeitübersicht",

                    description:
                        "Sollzeiten und erfasste Dauer",

                    icon:
                        "times",

                    color:
                        "times",

                    count:
                        tasks.length,

                    content:
                        renderTaskTimeSummary(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Dokumentationspflicht",

                    description:
                        "Zeitabweichungen und erforderliche Nachweise",

                    icon:
                        "warning",

                    color:
                        deviationTasks.length > 0
                            ? "warning"
                            : "success",

                    count:
                        deviationTasks.length,

                    content:
                        renderDeviationTasks(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Erledigte Aufgaben",

                    description:
                        "Abgeschlossene Arbeiten",

                    icon:
                        "tasks",

                    color:
                        "success",

                    count:
                        completedTasks.length,

                    content:
                        renderCompletedTasks(
                            state
                        )
                })}

            </section>

            ${renderTextBlock({
                title:
                    "Dokumentation nur bei Bedarf",

                text:
                    "Fotos, Audio oder Text werden nur verlangt, wenn eine Aufgabe deutlich länger oder kürzer dauert, nicht durchgeführt werden kann oder für Vertretungen eine besondere Nachweispflicht aktiviert wurde.",

                color:
                    "tasks",

                icon:
                    "tasks"
            })}

        </section>
    `;
}