/************************************************
 * Facility OS
 * timesPage.js
 *
 * Visuelle Zeit- und Schichtübersicht
 * - laufende Schichten
 * - Check-ins und Check-outs
 * - Zeitabweichungen
 * - fehlende Buchungen
 * - Monatsübersicht
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
    renderAlertList
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

/************************************************
 * ROLLE UND ZUGRIFF
 ************************************************/

function getRole(state) {

    return normalizeStatus(
        state.currentUser?.role
    );
}

function canViewAllTimes(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG
    ].includes(
        getRole(state)
    );
}

function canManageTimes(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG
    ].includes(
        getRole(state)
    );
}

function canViewTimes(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.MITARBEITER
    ].includes(
        getRole(state)
    );
}

/************************************************
 * BENUTZER
 ************************************************/

function getUserById(
    state,
    userId
) {

    if (!userId) {

        return null;
    }

    return asArray(state.users)
        .find(
            (user) =>
                user.id === userId
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
 * DATUM UND ZEIT
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

function formatDate(value) {

    const date =
        parseDate(value);

    if (!date) {

        return normalizeText(value);
    }

    try {

        return new Intl.DateTimeFormat(
            "de-DE",
            {
                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric"
            }
        ).format(date);
    }
    catch {

        return normalizeText(value);
    }
}

function formatTime(value) {

    const date =
        parseDate(value);

    if (!date) {

        const text =
            normalizeText(value);

        return text || "–";
    }

    try {

        return new Intl.DateTimeFormat(
            "de-DE",
            {
                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        ).format(date);
    }
    catch {

        return normalizeText(value);
    }
}

function formatDateTime(value) {

    const date =
        parseDate(value);

    if (!date) {

        return normalizeText(value);
    }

    try {

        return new Intl.DateTimeFormat(
            "de-DE",
            {
                day:
                    "2-digit",

                month:
                    "2-digit",

                year:
                    "numeric",

                hour:
                    "2-digit",

                minute:
                    "2-digit"
            }
        ).format(date);
    }
    catch {

        return normalizeText(value);
    }
}

function isToday(value) {

    const date =
        parseDate(value);

    if (!date) {

        return false;
    }

    const today =
        new Date();

    return (
        date.getFullYear() ===
            today.getFullYear() &&
        date.getMonth() ===
            today.getMonth() &&
        date.getDate() ===
            today.getDate()
    );
}

function isCurrentMonth(value) {

    const date =
        parseDate(value);

    if (!date) {

        return false;
    }

    const today =
        new Date();

    return (
        date.getFullYear() ===
            today.getFullYear() &&
        date.getMonth() ===
            today.getMonth()
    );
}

/************************************************
 * DAUER
 ************************************************/

function getDurationMinutes(
    startValue,
    endValue
) {

    const start =
        parseDate(startValue);

    const end =
        parseDate(endValue);

    if (
        !start ||
        !end
    ) {

        return 0;
    }

    return Math.max(
        Math.round(
            (
                end.getTime() -
                start.getTime()
            ) /
            60000
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
 * SCHICHTEN
 ************************************************/

function getShifts(state) {

    const shifts =
        asArray(state.shifts)
            .filter(isActive);

    if (
        canViewAllTimes(state)
    ) {

        return shifts;
    }

    const userId =
        state.currentUser?.id;

    return shifts.filter(
        (shift) =>
            shift.userId ===
                userId ||
            shift.employeeId ===
                userId
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

function isCompletedShift(shift) {

    const status =
        normalizeStatus(
            shift.status
        );

    return (
        [
            "FINISHED",
            "COMPLETED",
            "CLOSED"
        ].includes(status) ||
        Boolean(
            shift.endTime ??
            shift.checkoutTime
        )
    );
}

function getRunningShifts(state) {

    return getShifts(state)
        .filter(
            isRunningShift
        );
}

function getCompletedShifts(state) {

    return getShifts(state)
        .filter(
            isCompletedShift
        );
}

function getTodayShifts(state) {

    return getShifts(state)
        .filter(
            (shift) =>
                isToday(
                    shift.startTime ??
                    shift.checkinTime ??
                    shift.date
                )
        );
}

function getCurrentMonthShifts(state) {

    return getShifts(state)
        .filter(
            (shift) =>
                isCurrentMonth(
                    shift.startTime ??
                    shift.checkinTime ??
                    shift.date
                )
        );
}

/************************************************
 * CHECK-INS UND CHECK-OUTS
 ************************************************/

function getCheckins(state) {

    const entries =
        asArray(state.checkins)
            .filter(isActive);

    if (
        canViewAllTimes(state)
    ) {

        return entries;
    }

    const userId =
        state.currentUser?.id;

    return entries.filter(
        (entry) =>
            entry.userId ===
                userId ||
            entry.employeeId ===
                userId
    );
}

function getCheckouts(state) {

    const entries =
        asArray(state.checkouts)
            .filter(isActive);

    if (
        canViewAllTimes(state)
    ) {

        return entries;
    }

    const userId =
        state.currentUser?.id;

    return entries.filter(
        (entry) =>
            entry.userId ===
                userId ||
            entry.employeeId ===
                userId
    );
}

/************************************************
 * ZEITABWEICHUNGEN
 ************************************************/

function getTimeDeviations(state) {

    const deviations =
        asArray(state.timeDeviations)
            .filter(isActive);

    if (
        canViewAllTimes(state)
    ) {

        return deviations;
    }

    const userId =
        state.currentUser?.id;

    return deviations.filter(
        (deviation) =>
            deviation.userId ===
                userId ||
            deviation.employeeId ===
                userId
    );
}

function getOpenTimeDeviations(state) {

    return getTimeDeviations(state)
        .filter(
            (deviation) =>
                !isClosedStatus(
                    deviation.status
                )
        );
}

function getApprovedTimeDeviations(state) {

    return getTimeDeviations(state)
        .filter(
            (deviation) =>
                [
                    "APPROVED",
                    "RESOLVED",
                    "CLOSED",
                    "COMPLETED"
                ].includes(
                    normalizeStatus(
                        deviation.status
                    )
                )
        );
}

/************************************************
 * FEHLENDE BUCHUNGEN
 ************************************************/

function hasCheckinForShift(
    state,
    shift
) {

    return getCheckins(state)
        .some(
            (entry) =>
                (
                    entry.shiftId &&
                    entry.shiftId ===
                        shift.id
                ) ||
                (
                    !entry.shiftId &&
                    (
                        entry.userId ===
                            shift.userId ||
                        entry.employeeId ===
                            shift.employeeId
                    ) &&
                    entry.objectId ===
                        shift.objectId &&
                    isToday(
                        entry.timestamp ??
                        entry.createdAt ??
                        entry.time
                    )
                )
        );
}

function hasCheckoutForShift(
    state,
    shift
) {

    return getCheckouts(state)
        .some(
            (entry) =>
                (
                    entry.shiftId &&
                    entry.shiftId ===
                        shift.id
                ) ||
                (
                    !entry.shiftId &&
                    (
                        entry.userId ===
                            shift.userId ||
                        entry.employeeId ===
                            shift.employeeId
                    ) &&
                    entry.objectId ===
                        shift.objectId &&
                    isToday(
                        entry.timestamp ??
                        entry.createdAt ??
                        entry.time
                    )
                )
        );
}

function getMissingCheckins(state) {

    return getTodayShifts(state)
        .filter(
            (shift) =>
                !isRunningShift(shift) &&
                !isCompletedShift(shift) &&
                !hasCheckinForShift(
                    state,
                    shift
                )
        );
}

function getMissingCheckouts(state) {

    return getTodayShifts(state)
        .filter(
            (shift) =>
                (
                    isRunningShift(shift) ||
                    isCompletedShift(shift)
                ) &&
                !hasCheckoutForShift(
                    state,
                    shift
                ) &&
                Boolean(
                    shift.plannedEndTime ??
                    shift.endPlanned ??
                    shift.scheduledEnd
                )
        );
}

/************************************************
 * SCHICHTWERTE
 ************************************************/

function getShiftStart(shift) {

    return (
        shift.startTime ??
        shift.checkinTime ??
        shift.actualStart ??
        shift.plannedStartTime ??
        shift.scheduledStart ??
        null
    );
}

function getShiftEnd(shift) {

    return (
        shift.endTime ??
        shift.checkoutTime ??
        shift.actualEnd ??
        shift.plannedEndTime ??
        shift.scheduledEnd ??
        null
    );
}

function getShiftDuration(shift) {

    const storedDuration =
        asNumber(
            shift.durationMinutes ??
            shift.actualMinutes ??
            shift.totalMinutes
        );

    if (
        storedDuration > 0
    ) {

        return storedDuration;
    }

    const start =
        getShiftStart(shift);

    const end =
        getShiftEnd(shift);

    if (
        start &&
        end
    ) {

        return getDurationMinutes(
            start,
            end
        );
    }

    if (
        start &&
        isRunningShift(shift)
    ) {

        return getDurationMinutes(
            start,
            new Date()
        );
    }

    return 0;
}

function getPlannedShiftMinutes(shift) {

    const storedMinutes =
        asNumber(
            shift.plannedMinutes ??
            shift.targetMinutes ??
            shift.sollMinutes
        );

    if (
        storedMinutes > 0
    ) {

        return storedMinutes;
    }

    return getDurationMinutes(
        shift.plannedStartTime ??
        shift.scheduledStart,
        shift.plannedEndTime ??
        shift.scheduledEnd
    );
}

/************************************************
 * SCHICHTSTATUS
 ************************************************/

function getShiftStatus(shift) {

    if (
        isRunningShift(shift)
    ) {

        return {
            label:
                "Läuft",

            color:
                "success"
        };
    }

    if (
        isCompletedShift(shift)
    ) {

        return {
            label:
                "Beendet",

            color:
                "neutral"
        };
    }

    const status =
        normalizeStatus(
            shift.status
        );

    if (
        [
            "CANCELLED",
            "ABSENT",
            "MISSED"
        ].includes(status)
    ) {

        return {
            label:
                "Ausgefallen",

            color:
                "danger"
        };
    }

    return {
        label:
            "Geplant",

        color:
            "times"
    };
}

/************************************************
 * SCHICHTZEILE
 ************************************************/

function createShiftRow(
    state,
    shift
) {

    const employee =
        getUserById(
            state,
            shift.employeeId ??
            shift.userId
        );

    const status =
        getShiftStatus(
            shift
        );

    const start =
        getShiftStart(
            shift
        );

    const end =
        getShiftEnd(
            shift
        );

    const duration =
        getShiftDuration(
            shift
        );

    const descriptionParts = [];

    if (
        shift.objectId
    ) {

        descriptionParts.push(
            getObjectName(
                state,
                shift.objectId
            )
        );
    }

    if (start) {

        descriptionParts.push(
            `${formatDate(start)} · ${formatTime(start)}${
                end
                    ? `–${formatTime(end)}`
                    : ""
            }`
        );
    }

    const plannedMinutes =
        getPlannedShiftMinutes(
            shift
        );

    if (
        plannedMinutes > 0
    ) {

        descriptionParts.push(
            `Soll: ${formatMinutes(
                plannedMinutes
            )}`
        );
    }

    return {
        title:
            getUserName(
                employee
            ),

        description:
            descriptionParts.join(
                " · "
            ) ||
            "Keine Schichtdetails",

        icon:
            "times",

        color:
            status.color,

        value:
            duration > 0
                ? formatMinutes(
                    duration
                )
                : null,

        status:
            status.label,

        action:
            "open-shift",

        className:
            `time-shift-row time-shift-${status.color}`
    };
}

/************************************************
 * ZEITABWEICHUNGSZEILE
 ************************************************/

function getDeviationReason(deviation) {

    return (
        deviation.reason ??
        deviation.description ??
        deviation.comment ??
        deviation.note ??
        "Begründung noch offen"
    );
}

function getDeviationMinutes(deviation) {

    const directValue =
        asNumber(
            deviation.deviationMinutes ??
            deviation.differenceMinutes ??
            deviation.minutes
        );

    if (
        directValue !== 0
    ) {

        return directValue;
    }

    const actualMinutes =
        asNumber(
            deviation.actualMinutes
        );

    const plannedMinutes =
        asNumber(
            deviation.plannedMinutes ??
            deviation.targetMinutes
        );

    return (
        actualMinutes -
        plannedMinutes
    );
}

function createDeviationRow(
    state,
    deviation
) {

    const employee =
        getUserById(
            state,
            deviation.employeeId ??
            deviation.userId
        );

    const difference =
        getDeviationMinutes(
            deviation
        );

    const descriptionParts = [];

    if (
        deviation.objectId
    ) {

        descriptionParts.push(
            getObjectName(
                state,
                deviation.objectId
            )
        );
    }

    if (
        deviation.date ??
        deviation.createdAt
    ) {

        descriptionParts.push(
            formatDate(
                deviation.date ??
                deviation.createdAt
            )
        );
    }

    descriptionParts.push(
        getDeviationReason(
            deviation
        )
    );

    return {
        title:
            getUserName(
                employee
            ),

        description:
            descriptionParts.join(
                " · "
            ),

        icon:
            "warning",

        color:
            isClosedStatus(
                deviation.status
            )
                ? "success"
                : "warning",

        value:
            difference === 0
                ? null
                : `${
                    difference > 0
                        ? "+"
                        : ""
                }${difference} Min.`,

        status:
            isClosedStatus(
                deviation.status
            )
                ? "Geklärt"
                : "Offen",

        action:
            "open-time-deviation"
    };
}

/************************************************
 * FEHLENDE BUCHUNGSZEILE
 ************************************************/

function createMissingBookingRow(
    state,
    shift,
    type
) {

    const employee =
        getUserById(
            state,
            shift.employeeId ??
            shift.userId
        );

    const objectName =
        getObjectName(
            state,
            shift.objectId
        );

    const plannedTime =
        type === "checkin"
            ? (
                shift.plannedStartTime ??
                shift.scheduledStart
            )
            : (
                shift.plannedEndTime ??
                shift.scheduledEnd
            );

    return {
        title:
            getUserName(
                employee
            ),

        description:
            `${objectName}${
                plannedTime
                    ? ` · geplant ${formatTime(
                        plannedTime
                    )}`
                    : ""
            }`,

        icon:
            "warning",

        color:
            "danger",

        status:
            type === "checkin"
                ? "Check-in fehlt"
                : "Check-out fehlt",

        action:
            type === "checkin"
                ? "open-missing-checkin"
                : "open-missing-checkout"
    };
}

/************************************************
 * STATUSKARTEN
 ************************************************/

function renderTimeStatus(state) {

    const runningShifts =
        getRunningShifts(state);

    const todayShifts =
        getTodayShifts(state);

    const deviations =
        getOpenTimeDeviations(state);

    const missingBookings =
        getMissingCheckins(state).length +
        getMissingCheckouts(state).length;

    return renderStatusGrid(
        [
            {
                title:
                    "Aktiv",

                value:
                    runningShifts.length,

                description:
                    "laufende Schichten",

                status:
                    runningShifts.length > 0
                        ? "success"
                        : "neutral",

                icon:
                    "times"
            },
            {
                title:
                    "Heute",

                value:
                    todayShifts.length,

                description:
                    "geplante Einsätze",

                status:
                    "times",

                icon:
                    "times"
            },
            {
                title:
                    "Abweichungen",

                value:
                    deviations.length,

                description:
                    "offen",

                status:
                    deviations.length > 0
                        ? "warning"
                        : "success",

                icon:
                    "warning"
            },
            {
                title:
                    "Buchungen fehlen",

                value:
                    missingBookings,

                description:
                    "Check-in oder -out",

                status:
                    missingBookings > 0
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

function getTimeAlerts(state) {

    const alerts = [];

    const deviations =
        getOpenTimeDeviations(state);

    const missingCheckins =
        getMissingCheckins(state);

    const missingCheckouts =
        getMissingCheckouts(state);

    if (
        missingCheckins.length > 0
    ) {

        alerts.push({
            title:
                "Check-ins fehlen",

            message:
                `${missingCheckins.length} geplante Schichten wurden noch nicht gestartet.`,

            status:
                "danger",

            icon:
                "warning",

            action:
                "open-missing-checkins",

            buttonLabel:
                "Prüfen"
        });
    }

    if (
        missingCheckouts.length > 0
    ) {

        alerts.push({
            title:
                "Check-outs fehlen",

            message:
                `${missingCheckouts.length} Schichten wurden noch nicht ordnungsgemäß beendet.`,

            status:
                "warning",

            icon:
                "times",

            action:
                "open-missing-checkouts",

            buttonLabel:
                "Prüfen"
        });
    }

    if (
        deviations.length > 0
    ) {

        alerts.push({
            title:
                "Zeitabweichungen offen",

            message:
                `${deviations.length} Abweichungen benötigen eine Begründung oder Freigabe.`,

            status:
                "warning",

            icon:
                "warning",

            action:
                "open-time-deviations",

            buttonLabel:
                "Abweichungen öffnen"
        });
    }

    return alerts;
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

        const ownShift =
            getRunningShifts(state)[0] ??
            null;

        return [
            {
                title:
                    ownShift
                        ? "Schicht beenden"
                        : "Schicht starten",

                subtitle:
                    ownShift
                        ? "Checkout durchführen"
                        : "Am Objekt einchecken",

                icon:
                    "times",

                color:
                    ownShift
                        ? "warning"
                        : "success",

                action:
                    ownShift
                        ? "checkout"
                        : "checkin"
            },
            {
                title:
                    "Meine Abweichungen",

                subtitle:
                    "Zeitunterschiede begründen",

                icon:
                    "warning",

                color:
                    "warning",

                action:
                    "open-time-deviations"
            },
            {
                title:
                    "Meine Aufgaben",

                subtitle:
                    "Räume und Sollzeiten",

                icon:
                    "tasks",

                color:
                    "tasks",

                route:
                    ROUTES.TASKS
            }
        ];
    }

    return [
        {
            title:
                "Schicht anlegen",

            subtitle:
                "Neuen Einsatz planen",

            icon:
                "times",

            color:
                "times",

            action:
                "create-shift"
        },
        {
            title:
                "Zeit korrigieren",

            subtitle:
                "Buchung nachtragen oder ändern",

            icon:
                "warning",

            color:
                "warning",

            action:
                "create-time-correction"
        },
        {
            title:
                "Monatsauswertung",

            subtitle:
                "Arbeitszeiten zusammenfassen",

            icon:
                "analysis",

            color:
                "analysis",

            route:
                ROUTES.ANALYSIS
        },
        {
            title:
                "Bericht exportieren",

            subtitle:
                "Zeiten für Abrechnung vorbereiten",

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
 * LISTEN
 ************************************************/

function renderRunningShiftList(state) {

    const shifts =
        getRunningShifts(state);

    if (
        shifts.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine laufenden Schichten",

            description:
                "Aktuell ist kein Mitarbeiter eingecheckt.",

            icon:
                "times",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        shifts.map(
            (shift) =>
                createShiftRow(
                    state,
                    shift
                )
        )
    );
}

function renderTodayShiftList(state) {

    const shifts =
        getTodayShifts(state);

    if (
        shifts.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Schichten für heute",

            description:
                "Für den heutigen Tag wurden keine Einsätze hinterlegt.",

            icon:
                "times",

            color:
                "neutral",

            actionLabel:
                canManageTimes(state)
                    ? "Schicht anlegen"
                    : "",

            action:
                canManageTimes(state)
                    ? "create-shift"
                    : null,

            compact:
                true
        });
    }

    return renderActionRows(
        shifts.map(
            (shift) =>
                createShiftRow(
                    state,
                    shift
                )
        )
    );
}

function renderCompletedShiftList(state) {

    const shifts =
        getCompletedShifts(state)
            .slice()
            .sort(
                (firstShift, secondShift) => {

                    const firstDate =
                        parseDate(
                            getShiftEnd(
                                firstShift
                            )
                        );

                    const secondDate =
                        parseDate(
                            getShiftEnd(
                                secondShift
                            )
                        );

                    return (
                        (
                            secondDate?.getTime() ??
                            0
                        ) -
                        (
                            firstDate?.getTime() ??
                            0
                        )
                    );
                }
            );

    if (
        shifts.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine abgeschlossenen Schichten",

            description:
                "Beendete Einsätze erscheinen automatisch in diesem Bereich.",

            icon:
                "times",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        shifts
            .slice(
                0,
                30
            )
            .map(
                (shift) =>
                    createShiftRow(
                        state,
                        shift
                    )
            )
    );
}

function renderOpenDeviationList(state) {

    const deviations =
        getOpenTimeDeviations(state);

    if (
        deviations.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine offenen Zeitabweichungen",

            description:
                "Alle erfassten Abweichungen wurden geprüft oder abgeschlossen.",

            icon:
                "warning",

            color:
                "success",

            compact:
                true
        });
    }

    return renderActionRows(
        deviations.map(
            (deviation) =>
                createDeviationRow(
                    state,
                    deviation
                )
        )
    );
}

function renderApprovedDeviationList(state) {

    const deviations =
        getApprovedTimeDeviations(state);

    if (
        deviations.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine abgeschlossenen Abweichungen",

            description:
                "Freigegebene oder abgeschlossene Abweichungen erscheinen hier.",

            icon:
                "warning",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        deviations.map(
            (deviation) =>
                createDeviationRow(
                    state,
                    deviation
                )
        )
    );
}

function renderMissingBookingList(state) {

    const missingCheckins =
        getMissingCheckins(state);

    const missingCheckouts =
        getMissingCheckouts(state);

    const rows = [
        ...missingCheckins.map(
            (shift) =>
                createMissingBookingRow(
                    state,
                    shift,
                    "checkin"
                )
        ),
        ...missingCheckouts.map(
            (shift) =>
                createMissingBookingRow(
                    state,
                    shift,
                    "checkout"
                )
        )
    ];

    if (
        rows.length === 0
    ) {

        return renderEmptyState({
            title:
                "Alle Buchungen vollständig",

            description:
                "Für die heutigen Schichten fehlen keine Check-ins oder Check-outs.",

            icon:
                "times",

            color:
                "success",

            compact:
                true
        });
    }

    return renderActionRows(
        rows
    );
}

/************************************************
 * MONATSÜBERSICHT
 ************************************************/

function getMonthTotalMinutes(state) {

    return getCurrentMonthShifts(state)
        .reduce(
            (total, shift) =>
                total +
                getShiftDuration(
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
                getPlannedShiftMinutes(
                    shift
                ),
            0
        );
}

function renderMonthSummary(state) {

    const shifts =
        getCurrentMonthShifts(state);

    const actualMinutes =
        getMonthTotalMinutes(state);

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
                    shifts.length,

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
                    "success",

                icon:
                    "times"
            },
            {
                label:
                    "Geplante Arbeitszeit",

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
                    "Differenz",

                value:
                    `${
                        difference > 0
                            ? "+"
                            : ""
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
            }
        ],
        {
            columns:
                1
        }
    );
}

/************************************************
 * LETZTE BUCHUNGEN
 ************************************************/

function createBookingRow(
    state,
    entry,
    type
) {

    const employee =
        getUserById(
            state,
            entry.employeeId ??
            entry.userId
        );

    const timestamp =
        entry.timestamp ??
        entry.createdAt ??
        entry.time ??
        entry.date;

    return {
        title:
            getUserName(
                employee
            ),

        description:
            `${
                getObjectName(
                    state,
                    entry.objectId
                )
            } · ${formatDateTime(
                timestamp
            )}`,

        icon:
            "times",

        color:
            type === "checkin"
                ? "success"
                : "times",

        status:
            type === "checkin"
                ? "Check-in"
                : "Check-out",

        action:
            type === "checkin"
                ? "open-checkin"
                : "open-checkout"
    };
}

function renderRecentBookings(state) {

    const checkins =
        getCheckins(state)
            .map(
                (entry) => ({
                    entry,

                    type:
                        "checkin",

                    date:
                        parseDate(
                            entry.timestamp ??
                            entry.createdAt ??
                            entry.time
                        )
                })
            );

    const checkouts =
        getCheckouts(state)
            .map(
                (entry) => ({
                    entry,

                    type:
                        "checkout",

                    date:
                        parseDate(
                            entry.timestamp ??
                            entry.createdAt ??
                            entry.time
                        )
                })
            );

    const bookings = [
        ...checkins,
        ...checkouts
    ]
        .sort(
            (firstEntry, secondEntry) =>
                (
                    secondEntry.date?.getTime() ??
                    0
                ) -
                (
                    firstEntry.date?.getTime() ??
                    0
                )
        )
        .slice(
            0,
            30
        );

    if (
        bookings.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Zeitbuchungen",

            description:
                "Es wurden noch keine Check-ins oder Check-outs gespeichert.",

            icon:
                "times",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        bookings.map(
            (booking) =>
                createBookingRow(
                    state,
                    booking.entry,
                    booking.type
                )
        )
    );
}

/************************************************
 * ZUGRIFF VERWEIGERT
 ************************************************/

function renderAccessDenied() {

    return `
        <section class="app-times-page">

            ${renderPageTitle({
                eyebrow:
                    "Zeiten",

                title:
                    "Kein Zugriff",

                description:
                    "Dieser Zeitbereich ist für deine Benutzerrolle nicht freigegeben.",

                color:
                    "times",

                backRoute:
                    ROUTES.OVERVIEW
            })}

            ${renderEmptyState({
                title:
                    "Zeitübersicht nicht verfügbar",

                description:
                    "Bitte wende dich an die zuständige Objektleitung oder Administration.",

                icon:
                    "times",

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

export function renderTimesPage(state) {

    if (
        !canViewTimes(
            state
        )
    ) {

        return renderAccessDenied();
    }

    const role =
        getRole(state);

    const runningShifts =
        getRunningShifts(state);

    const todayShifts =
        getTodayShifts(state);

    const completedShifts =
        getCompletedShifts(state);

    const openDeviations =
        getOpenTimeDeviations(state);

    const approvedDeviations =
        getApprovedTimeDeviations(state);

    const missingBookings =
        getMissingCheckins(state).length +
        getMissingCheckouts(state).length;

    const alerts =
        getTimeAlerts(state);

    const employeeView =
        role ===
        USER_ROLES.MITARBEITER;

    return `
        <section class="app-times-page">

            ${renderPageTitle({
                eyebrow:
                    "Zeiten",

                title:
                    employeeView
                        ? "Meine Arbeitszeit"
                        : "Schichten und Zeiten",

                description:
                    employeeView
                        ? "Schichten, Buchungen und Zeitabweichungen."
                        : "Aktive Einsätze, Check-ins und Abrechnungsdaten.",

                color:
                    "times",

                actionLabel:
                    employeeView
                        ? (
                            runningShifts.length > 0
                                ? "Auschecken"
                                : "Einchecken"
                        )
                        : "Neue Schicht",

                action:
                    employeeView
                        ? (
                            runningShifts.length > 0
                                ? "checkout"
                                : "checkin"
                        )
                        : "create-shift",

                compact:
                    true
            })}

            <section class="app-times-status">

                ${renderTimeStatus(
                    state
                )}

            </section>

            ${
                alerts.length > 0
                    ? `
                        <section class="app-times-alerts">

                            ${renderSectionHeader({
                                title:
                                    "Handlungsbedarf",

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

            <section class="app-times-quick-actions">

                ${renderSectionHeader({
                    title:
                        "Schnellaktionen",

                    compact:
                        true
                })}

                ${renderCompactModuleList(
                    getQuickActions(
                        state
                    )
                )}

            </section>

            <section class="app-times-content">

                ${renderCollapsiblePanel({
                    title:
                        "Laufende Schichten",

                    description:
                        "Aktuell eingecheckte Mitarbeiter",

                    icon:
                        "times",

                    color:
                        runningShifts.length > 0
                            ? "success"
                            : "neutral",

                    count:
                        runningShifts.length,

                    open:
                        true,

                    content:
                        renderRunningShiftList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Heutige Schichten",

                    description:
                        "Geplante und ausgeführte Einsätze",

                    icon:
                        "times",

                    color:
                        "times",

                    count:
                        todayShifts.length,

                    content:
                        renderTodayShiftList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Fehlende Buchungen",

                    description:
                        "Nicht vorhandene Check-ins oder Check-outs",

                    icon:
                        "warning",

                    color:
                        missingBookings > 0
                            ? "danger"
                            : "success",

                    count:
                        missingBookings,

                    content:
                        renderMissingBookingList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Offene Zeitabweichungen",

                    description:
                        "Begründung, Nachweis oder Freigabe erforderlich",

                    icon:
                        "warning",

                    color:
                        openDeviations.length > 0
                            ? "warning"
                            : "success",

                    count:
                        openDeviations.length,

                    content:
                        renderOpenDeviationList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Monatsübersicht",

                    description:
                        "Geplante und erfasste Arbeitszeit",

                    icon:
                        "analysis",

                    color:
                        "analysis",

                    count:
                        getCurrentMonthShifts(
                            state
                        ).length,

                    content:
                        renderMonthSummary(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Letzte Zeitbuchungen",

                    description:
                        "Check-ins und Check-outs in zeitlicher Reihenfolge",

                    icon:
                        "times",

                    color:
                        "times",

                    count:
                        (
                            getCheckins(state).length +
                            getCheckouts(state).length
                        ),

                    content:
                        renderRecentBookings(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Abgeschlossene Schichten",

                    description:
                        "Beendete und gespeicherte Einsätze",

                    icon:
                        "times",

                    color:
                        "more",

                    count:
                        completedShifts.length,

                    content:
                        renderCompletedShiftList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Geklärte Abweichungen",

                    description:
                        "Freigegebene oder abgeschlossene Zeitfälle",

                    icon:
                        "warning",

                    color:
                        "success",

                    count:
                        approvedDeviations.length,

                    content:
                        renderApprovedDeviationList(
                            state
                        )
                })}

            </section>

            ${renderTextBlock({
                title:
                    "Nachvollziehbare Arbeitszeiten",

                text:
                    "Check-in, Check-out, geplante Schichten und Zeitabweichungen werden gemeinsam ausgewertet. Ungewöhnliche Abweichungen können mit Foto, Audio oder Text begründet und anschließend von der zuständigen Stelle geprüft werden.",

                color:
                    "times",

                icon:
                    "times"
            })}

        </section>
    `;
}