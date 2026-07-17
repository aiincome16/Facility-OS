/************************************************
 * Facility OS
 * reportsPage.js
 *
 * Visuelle Berichtsübersicht
 * - Leistungsnachweise
 * - Zeitberichte
 * - Objektberichte
 * - Kundenfreigaben
 * - Exportvorbereitung
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

function canViewReports(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG,
        USER_ROLES.KUNDE
    ].includes(
        getRole(state)
    );
}

function canCreateReports(state) {

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER,
        USER_ROLES.BUCHHALTUNG
    ].includes(
        getRole(state)
    );
}

function isCustomerView(state) {

    return (
        getRole(state) ===
        USER_ROLES.KUNDE
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
        "Unbekannter Benutzer"
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

    if (
        role ===
        USER_ROLES.KUNDE
    ) {

        const allowedObjectIds =
            asArray(state.customerAccess)
                .filter(
                    (access) =>
                        access.active !== false &&
                        (
                            access.customerUserId ===
                                user.id ||
                            access.userId ===
                                user.id
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
                    user.id
        );
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
 * AUFGABEN UND LEISTUNGSNACHWEISE
 ************************************************/

function getVisibleTaskLogs(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return asArray(state.taskLogs)
        .filter(
            (log) =>
                (
                    !log.objectId ||
                    visibleObjectIds.includes(
                        log.objectId
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

    return getVisibleTaskLogs(state)
        .filter(
            isCompletedTaskLog
        );
}

function getCurrentMonthTaskLogs(state) {

    return getCompletedTaskLogs(state)
        .filter(
            (log) =>
                isCurrentMonth(
                    log.completedAt ??
                    log.createdAt ??
                    log.date ??
                    log.timestamp
                )
        );
}

/************************************************
 * SCHICHTEN
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

function getShiftMinutes(shift) {

    return asNumber(
        shift.durationMinutes ??
        shift.actualMinutes ??
        shift.totalMinutes
    );
}

function getTotalShiftMinutes(state) {

    return getCurrentMonthShifts(state)
        .reduce(
            (total, shift) =>
                total +
                getShiftMinutes(
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

/************************************************
 * MATERIALWARNUNGEN
 ************************************************/

function getMaterialWarnings(state) {

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    return asArray(state.materialStock)
        .filter(
            (stock) => {

                if (
                    stock.objectId &&
                    !visibleObjectIds.includes(
                        stock.objectId
                    )
                ) {

                    return false;
                }

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
        );
}

/************************************************
 * BERICHTSDATEN
 ************************************************/

function getExistingReports(state) {

    const explicitReports =
        asArray(state.reports);

    if (
        explicitReports.length > 0
    ) {

        return explicitReports
            .filter(isActive);
    }

    return asArray(state.workOrders)
        .filter(
            (entry) => {

                const type =
                    normalizeStatus(
                        entry.type ??
                        entry.orderType ??
                        entry.category
                    );

                return [
                    "REPORT",
                    "SERVICE_REPORT",
                    "PERFORMANCE_REPORT",
                    "TIME_REPORT",
                    "CUSTOMER_REPORT",
                    "BERICHT",
                    "LEISTUNGSNACHWEIS"
                ].includes(type);
            }
        );
}

function isReportReleased(report) {

    return (
        report.released === true ||
        report.customerVisible === true ||
        report.published === true ||
        [
            "RELEASED",
            "PUBLISHED",
            "APPROVED",
            "SENT"
        ].includes(
            normalizeStatus(
                report.status
            )
        )
    );
}

function getVisibleReports(state) {

    const reports =
        getExistingReports(state);

    const visibleObjectIds =
        getVisibleObjects(state)
            .map(
                (object) =>
                    object.id
            );

    const filteredReports =
        reports.filter(
            (report) =>
                !report.objectId ||
                visibleObjectIds.includes(
                    report.objectId
                )
        );

    if (
        isCustomerView(state)
    ) {

        return filteredReports.filter(
            isReportReleased
        );
    }

    return filteredReports;
}

function getReleasedReports(state) {

    return getVisibleReports(state)
        .filter(
            isReportReleased
        );
}

function getDraftReports(state) {

    return getVisibleReports(state)
        .filter(
            (report) =>
                !isReportReleased(
                    report
                )
        );
}

/************************************************
 * AUTOMATISCH ERZEUGTE BERICHTE
 ************************************************/

function createGeneratedReportDefinitions(state) {

    const objects =
        getVisibleObjects(state);

    const reports = [
        {
            id:
                "monthly-performance",

            title:
                "Monatlicher Leistungsbericht",

            description:
                `${getCurrentMonthTaskLogs(
                    state
                ).length} erledigte Aufgaben · ${getClosedTickets(
                    state
                ).length} abgeschlossene Meldungen`,

            icon:
                "reports",

            color:
                "reports",

            status:
                "Bereit",

            action:
                "generate-performance-report"
        },
        {
            id:
                "monthly-time",

            title:
                "Monatlicher Zeitbericht",

            description:
                `${getCurrentMonthShifts(
                    state
                ).length} Schichten · ${formatMinutes(
                    getTotalShiftMinutes(
                        state
                    )
                )}`,

            icon:
                "times",

            color:
                "times",

            status:
                getOpenTimeDeviations(
                    state
                ).length > 0
                    ? "Prüfen"
                    : "Bereit",

            action:
                "generate-time-report"
        },
        {
            id:
                "ticket-report",

            title:
                "Meldungsbericht",

            description:
                `${getOpenTickets(
                    state
                ).length} offen · ${getClosedTickets(
                    state
                ).length} abgeschlossen`,

            icon:
                "communication",

            color:
                "communication",

            status:
                getOpenTickets(
                    state
                ).length > 0
                    ? "Aktuell"
                    : "Bereit",

            action:
                "generate-ticket-report"
        },
        {
            id:
                "material-report",

            title:
                "Materialbericht",

            description:
                `${getMaterialWarnings(
                    state
                ).length} aktuelle Warnungen`,

            icon:
                "materials",

            color:
                "materials",

            status:
                getMaterialWarnings(
                    state
                ).length > 0
                    ? "Prüfen"
                    : "Bereit",

            action:
                "generate-material-report"
        }
    ];

    if (
        objects.length > 1
    ) {

        reports.push({
            id:
                "object-comparison",

            title:
                "Objektvergleich",

            description:
                `${objects.length} Objekte gegenüberstellen`,

            icon:
                "objects",

            color:
                "objects",

            status:
                "Bereit",

            action:
                "generate-object-comparison"
        });
    }

    return reports;
}

/************************************************
 * BERICHTSZEILE
 ************************************************/

function getReportTitle(report) {

    return (
        report.title ??
        report.name ??
        report.subject ??
        report.id ??
        "Bericht"
    );
}

function getReportDescription(
    state,
    report
) {

    const parts = [];

    if (
        report.objectId
    ) {

        parts.push(
            getObjectName(
                state,
                report.objectId
            )
        );
    }

    const createdBy =
        getUserById(
            state,
            report.createdByUserId ??
            report.userId
        );

    if (createdBy) {

        parts.push(
            getUserName(
                createdBy
            )
        );
    }

    const date =
        report.createdAt ??
        report.generatedAt ??
        report.date ??
        report.timestamp;

    if (date) {

        parts.push(
            formatDateTime(date)
        );
    }

    const period =
        report.period ??
        report.month ??
        report.dateRange;

    if (period) {

        parts.push(
            normalizeText(period)
        );
    }

    return (
        parts.join(" · ") ||
        "Keine weiteren Angaben"
    );
}

function createExistingReportRow(
    state,
    report
) {

    const released =
        isReportReleased(
            report
        );

    return {
        title:
            getReportTitle(
                report
            ),

        description:
            getReportDescription(
                state,
                report
            ),

        icon:
            "reports",

        color:
            released
                ? "success"
                : "warning",

        status:
            released
                ? "Freigegeben"
                : "Entwurf",

        action:
            "open-report",

        className:
            released
                ? "report-row-released"
                : "report-row-draft"
    };
}

/************************************************
 * OBJEKTBERICHTE
 ************************************************/

function getObjectReportData(
    state,
    object
) {

    const taskLogs =
        getCurrentMonthTaskLogs(state)
            .filter(
                (log) =>
                    log.objectId ===
                        object.id
            );

    const shifts =
        getCurrentMonthShifts(state)
            .filter(
                (shift) =>
                    shift.objectId ===
                        object.id
            );

    const openTickets =
        getOpenTickets(state)
            .filter(
                (ticket) =>
                    ticket.objectId ===
                        object.id
            );

    const materialWarnings =
        getMaterialWarnings(state)
            .filter(
                (stock) =>
                    stock.objectId ===
                        object.id
            );

    return {
        taskLogs,
        shifts,
        openTickets,
        materialWarnings
    };
}

function createObjectReportRow(
    state,
    object
) {

    const data =
        getObjectReportData(
            state,
            object
        );

    const warningCount =
        data.openTickets.length +
        data.materialWarnings.length;

    return {
        title:
            object.name ??
            object.id ??
            "Objekt",

        description:
            `${data.taskLogs.length} Leistungen · ${data.shifts.length} Schichten · ${warningCount} Hinweise`,

        icon:
            "objects",

        color:
            warningCount > 0
                ? "warning"
                : "objects",

        status:
            warningCount > 0
                ? "Prüfen"
                : "Bereit",

        action:
            "generate-object-report"
    };
}

/************************************************
 * STATUSKARTEN
 ************************************************/

function renderReportStatus(state) {

    const visibleReports =
        getVisibleReports(state);

    const releasedReports =
        getReleasedReports(state);

    const draftReports =
        getDraftReports(state);

    const availableObjects =
        getVisibleObjects(state);

    return renderStatusGrid(
        [
            {
                title:
                    "Berichte",

                value:
                    visibleReports.length,

                description:
                    "gespeichert",

                status:
                    "reports",

                icon:
                    "reports"
            },
            {
                title:
                    "Freigegeben",

                value:
                    releasedReports.length,

                description:
                    "sichtbar",

                status:
                    releasedReports.length > 0
                        ? "success"
                        : "neutral",

                icon:
                    "reports"
            },
            {
                title:
                    "Entwürfe",

                value:
                    draftReports.length,

                description:
                    "noch nicht versendet",

                status:
                    draftReports.length > 0
                        ? "warning"
                        : "success",

                icon:
                    "reports"
            },
            {
                title:
                    "Objekte",

                value:
                    availableObjects.length,

                description:
                    "auswertbar",

                status:
                    "objects",

                icon:
                    "objects"
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

function getReportAlerts(state) {

    const alerts = [];

    const openDeviations =
        getOpenTimeDeviations(state);

    const openTickets =
        getOpenTickets(state);

    const materialWarnings =
        getMaterialWarnings(state);

    const drafts =
        getDraftReports(state);

    if (
        openDeviations.length > 0
    ) {

        alerts.push({
            title:
                "Zeitbericht noch unvollständig",

            message:
                `${openDeviations.length} Zeitabweichungen sollten vor dem Export geprüft werden.`,

            status:
                "warning",

            icon:
                "times",

            route:
                ROUTES.TIMES,

            buttonLabel:
                "Zeiten prüfen"
        });
    }

    if (
        openTickets.length > 0
    ) {

        alerts.push({
            title:
                "Offene Meldungen vorhanden",

            message:
                `${openTickets.length} Vorgänge sind noch nicht abgeschlossen und erscheinen im Bericht.`,

            status:
                "info",

            icon:
                "communication",

            route:
                ROUTES.COMMUNICATION,

            buttonLabel:
                "Meldungen öffnen"
        });
    }

    if (
        materialWarnings.length > 0
    ) {

        alerts.push({
            title:
                "Materialwarnungen vorhanden",

            message:
                `${materialWarnings.length} Bestände werden als kritisch oder niedrig gemeldet.`,

            status:
                "warning",

            icon:
                "materials",

            action:
                "open-material-report-data",

            buttonLabel:
                "Material prüfen"
        });
    }

    if (
        drafts.length > 0 &&
        !isCustomerView(state)
    ) {

        alerts.push({
            title:
                "Berichte warten auf Freigabe",

            message:
                `${drafts.length} Entwürfe wurden noch nicht freigegeben oder versendet.`,

            status:
                "info",

            icon:
                "reports",

            action:
                "open-draft-reports",

            buttonLabel:
                "Entwürfe öffnen"
        });
    }

    return alerts;
}

/************************************************
 * SCHNELLZUGRIFFE
 ************************************************/

function getQuickActions(state) {

    if (
        isCustomerView(state)
    ) {

        return [
            {
                title:
                    "Leistungsnachweise",

                subtitle:
                    "Freigegebene Arbeiten ansehen",

                icon:
                    "reports",

                color:
                    "reports",

                action:
                    "open-released-performance-reports"
            },
            {
                title:
                    "Objektberichte",

                subtitle:
                    "Berichte nach Standort",

                icon:
                    "objects",

                color:
                    "objects",

                action:
                    "open-customer-object-reports"
            },
            {
                title:
                    "Rückfrage senden",

                subtitle:
                    "Objektleitung kontaktieren",

                icon:
                    "communication",

                color:
                    "communication",

                route:
                    ROUTES.COMMUNICATION
            }
        ];
    }

    return [
        {
            title:
                "Leistungsbericht",

            subtitle:
                "Aufgaben und Nachweise",

            icon:
                "reports",

            color:
                "reports",

            action:
                "generate-performance-report"
        },
        {
            title:
                "Zeitbericht",

            subtitle:
                "Schichten und Arbeitszeit",

            icon:
                "times",

            color:
                "times",

            action:
                "generate-time-report"
        },
        {
            title:
                "Objektbericht",

            subtitle:
                "Status eines Standortes",

            icon:
                "objects",

            color:
                "objects",

            action:
                "generate-object-report"
        },
        {
            title:
                "Export vorbereiten",

            subtitle:
                "PDF, Tabelle oder Kundenansicht",

            icon:
                "analysis",

            color:
                "analysis",

            action:
                "prepare-report-export"
        }
    ];
}

/************************************************
 * LISTEN
 ************************************************/

function renderGeneratedReportList(state) {

    const definitions =
        createGeneratedReportDefinitions(
            state
        );

    if (
        definitions.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Berichte verfügbar",

            description:
                "Es liegen noch nicht genügend Daten zur Berichtserstellung vor.",

            icon:
                "reports",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        definitions
    );
}

function renderObjectReportList(state) {

    const objects =
        getVisibleObjects(state);

    if (
        objects.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Objekte verfügbar",

            description:
                "Es können derzeit keine objektbezogenen Berichte erstellt werden.",

            icon:
                "objects",

            color:
                "objects",

            actionLabel:
                isCustomerView(state)
                    ? ""
                    : "Objekte öffnen",

            actionRoute:
                isCustomerView(state)
                    ? null
                    : ROUTES.OBJECTS,

            compact:
                true
        });
    }

    return renderActionRows(
        objects.map(
            (object) =>
                createObjectReportRow(
                    state,
                    object
                )
        )
    );
}

function renderReleasedReportList(state) {

    const reports =
        getReleasedReports(state);

    if (
        reports.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine freigegebenen Berichte",

            description:
                isCustomerView(state)
                    ? "Für dein Kundenkonto wurden noch keine Berichte freigegeben."
                    : "Es wurden noch keine Berichte veröffentlicht oder versendet.",

            icon:
                "reports",

            color:
                "neutral",

            compact:
                true
        });
    }

    return renderActionRows(
        reports.map(
            (report) =>
                createExistingReportRow(
                    state,
                    report
                )
        )
    );
}

function renderDraftReportList(state) {

    const reports =
        getDraftReports(state);

    if (
        reports.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Berichtsentwürfe",

            description:
                "Aktuell warten keine Berichte auf Bearbeitung oder Freigabe.",

            icon:
                "reports",

            color:
                "success",

            compact:
                true
        });
    }

    return renderActionRows(
        reports.map(
            (report) =>
                createExistingReportRow(
                    state,
                    report
                )
        )
    );
}

/************************************************
 * MONATLICHE ZUSAMMENFASSUNG
 ************************************************/

function renderMonthlySummary(state) {

    const taskLogs =
        getCurrentMonthTaskLogs(state);

    const shifts =
        getCurrentMonthShifts(state);

    const totalMinutes =
        getTotalShiftMinutes(state);

    const openTickets =
        getOpenTickets(state);

    const closedTickets =
        getClosedTickets(state);

    return renderInfoList(
        [
            {
                label:
                    "Leistungsnachweise",

                value:
                    taskLogs.length,

                status:
                    "reports",

                icon:
                    "reports"
            },
            {
                label:
                    "Schichten",

                value:
                    shifts.length,

                status:
                    "times",

                icon:
                    "times"
            },
            {
                label:
                    "Arbeitszeit",

                value:
                    formatMinutes(
                        totalMinutes
                    ),

                status:
                    "times",

                icon:
                    "times"
            },
            {
                label:
                    "Meldungen offen",

                value:
                    openTickets.length,

                status:
                    openTickets.length > 0
                        ? "warning"
                        : "success",

                icon:
                    "communication"
            },
            {
                label:
                    "Meldungen erledigt",

                value:
                    closedTickets.length,

                status:
                    "success",

                icon:
                    "communication"
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
 * EXPORTÜBERSICHT
 ************************************************/

function renderExportOptions(state) {

    const customerView =
        isCustomerView(state);

    const rows = [
        {
            title:
                "PDF-Bericht",

            description:
                customerView
                    ? "Freigegebenen Bericht ansehen"
                    : "Druckfertigen Bericht vorbereiten",

            icon:
                "reports",

            color:
                "reports",

            action:
                customerView
                    ? "open-report-pdf"
                    : "export-report-pdf"
        },
        {
            title:
                "Tabellenexport",

            description:
                customerView
                    ? "Für Kundenkonto nicht freigegeben"
                    : "Zeit- und Leistungsdaten exportieren",

            icon:
                "analysis",

            color:
                "analysis",

            action:
                customerView
                    ? null
                    : "export-report-table",

            disabled:
                customerView
        },
        {
            title:
                "Kundenfreigabe",

            description:
                customerView
                    ? "Bereits freigegebene Berichte"
                    : "Bericht im Kundenportal sichtbar machen",

            icon:
                "personnel",

            color:
                "personnel",

            action:
                customerView
                    ? "open-released-reports"
                    : "release-report-to-customer"
        },
        {
            title:
                "Versand vorbereiten",

            description:
                customerView
                    ? "Rückfrage zur Objektleitung"
                    : "E-Mail oder Download vorbereiten",

            icon:
                "communication",

            color:
                "communication",

            action:
                customerView
                    ? "create-report-question"
                    : "prepare-report-delivery"
        }
    ];

    return renderActionRows(
        rows
    );
}

/************************************************
 * ZUGRIFF VERWEIGERT
 ************************************************/

function renderAccessDenied() {

    return `
        <section class="app-reports-page">

            ${renderPageTitle({
                eyebrow:
                    "Berichte",

                title:
                    "Kein Zugriff",

                description:
                    "Dieser Berichtsbereich ist für deine Benutzerrolle nicht freigegeben.",

                color:
                    "reports",

                backRoute:
                    ROUTES.OVERVIEW
            })}

            ${renderEmptyState({
                title:
                    "Berichte nicht verfügbar",

                description:
                    "Bitte wende dich an die zuständige Objektleitung oder Administration.",

                icon:
                    "reports",

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

export function renderReportsPage(state) {

    if (
        !canViewReports(
            state
        )
    ) {

        return renderAccessDenied();
    }

    const customerView =
        isCustomerView(state);

    const reports =
        getVisibleReports(state);

    const releasedReports =
        getReleasedReports(state);

    const draftReports =
        getDraftReports(state);

    const objects =
        getVisibleObjects(state);

    const alerts =
        getReportAlerts(state);

    return `
        <section class="app-reports-page">

            ${renderPageTitle({
                eyebrow:
                    getCurrentMonthLabel(),

                title:
                    customerView
                        ? "Meine Berichte"
                        : "Berichte",

                description:
                    customerView
                        ? "Freigegebene Leistungsnachweise und Objektberichte."
                        : "Leistungs-, Zeit- und Objektberichte vorbereiten.",

                color:
                    "reports",

                actionLabel:
                    canCreateReports(state)
                        ? "Erstellen"
                        : "",

                action:
                    canCreateReports(state)
                        ? "create-report"
                        : null,

                compact:
                    true
            })}

            <section class="app-reports-status">

                ${renderReportStatus(
                    state
                )}

            </section>

            ${
                alerts.length > 0
                    ? `
                        <section class="app-reports-alerts">

                            ${renderSectionHeader({
                                title:
                                    "Vor dem Bericht prüfen",

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

            <section class="app-reports-quick-actions">

                ${renderSectionHeader({
                    title:
                        customerView
                            ? "Berichtsbereiche"
                            : "Bericht erstellen",

                    compact:
                        true
                })}

                ${renderCompactModuleList(
                    getQuickActions(
                        state
                    )
                )}

            </section>

            <section class="app-reports-content">

                ${renderCollapsiblePanel({
                    title:
                        "Monatsübersicht",

                    description:
                        "Zentrale Werte des aktuellen Berichtszeitraums",

                    icon:
                        "analysis",

                    color:
                        "analysis",

                    open:
                        true,

                    content:
                        renderMonthlySummary(
                            state
                        )
                })}

                ${
                    canCreateReports(state)
                        ? renderCollapsiblePanel({
                            title:
                                "Berichtsvorlagen",

                            description:
                                "Automatisch aus aktuellen Daten erstellen",

                            icon:
                                "reports",

                            color:
                                "reports",

                            count:
                                createGeneratedReportDefinitions(
                                    state
                                ).length,

                            content:
                                renderGeneratedReportList(
                                    state
                                )
                        })
                        : ""
                }

                ${renderCollapsiblePanel({
                    title:
                        "Objektberichte",

                    description:
                        customerView
                            ? "Freigegebene Berichte nach Standort"
                            : "Leistung und Status je Objekt",

                    icon:
                        "objects",

                    color:
                        "objects",

                    count:
                        objects.length,

                    content:
                        renderObjectReportList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Freigegebene Berichte",

                    description:
                        customerView
                            ? "Für dein Kundenkonto sichtbar"
                            : "Veröffentlichte oder versendete Berichte",

                    icon:
                        "reports",

                    color:
                        "success",

                    count:
                        releasedReports.length,

                    content:
                        renderReleasedReportList(
                            state
                        )
                })}

                ${
                    !customerView
                        ? renderCollapsiblePanel({
                            title:
                                "Entwürfe",

                            description:
                                "Noch nicht freigegebene Berichte",

                            icon:
                                "reports",

                            color:
                                draftReports.length > 0
                                    ? "warning"
                                    : "success",

                            count:
                                draftReports.length,

                            content:
                                renderDraftReportList(
                                    state
                                )
                        })
                        : ""
                }

                ${renderCollapsiblePanel({
                    title:
                        "Export und Freigabe",

                    description:
                        customerView
                            ? "Berichte öffnen und Rückfragen senden"
                            : "PDF, Tabelle, Kundenportal und Versand",

                    icon:
                        "reports",

                    color:
                        "more",

                    count:
                        reports.length,

                    content:
                        renderExportOptions(
                            state
                        )
                })}

            </section>

            ${renderTextBlock({
                title:
                    "Berichte aus echten Betriebsdaten",

                text:
                    customerView
                        ? "Im Kundenportal werden ausschließlich Berichte angezeigt, die von der zuständigen Objektleitung oder Administration ausdrücklich freigegeben wurden."
                        : "Facility OS führt Aufgaben, Schichten, Meldungen, Materialstatus und Zeitabweichungen zu nachvollziehbaren Leistungs- und Objektberichten zusammen.",

                color:
                    "reports",

                icon:
                    "reports"
            })}

        </section>
    `;
}