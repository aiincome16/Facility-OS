/************************************************
 * Facility OS
 * personnelPage.js
 *
 * Visuelle Personalübersicht
 * - Mitarbeitende
 * - aktuelle Schichten
 * - Abwesenheiten
 * - Vertretungen
 * - Objektzuweisungen
 * - Smartphone-first
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
    renderSectionPanel,
    renderCollapsiblePanel,
    renderActionRows,
    renderInfoList,
    renderEmptyState
} from "../components/sectionPanel.js";

/************************************************
 * BASISHELFER
 ************************************************/

function asArray(value) {

    return Array.isArray(value)
        ? value
        : [];
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

function formatName(user) {

    return (
        user?.name ??
        user?.fullName ??
        user?.displayName ??
        user?.email ??
        "Unbekannter Mitarbeiter"
    );
}

/************************************************
 * ROLLENPRÜFUNG
 ************************************************/

function canViewPersonnel(state) {

    const role =
        normalizeStatus(
            state.currentUser?.role
        );

    return [
        USER_ROLES.SUPER_ADMIN,
        USER_ROLES.ADMIN,
        USER_ROLES.OBJEKTLEITER
    ].includes(role);
}

/************************************************
 * MITARBEITENDE
 ************************************************/

function getEmployees(state) {

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

function getEmployeeById(
    state,
    employeeId
) {

    return asArray(state.users)
        .find(
            (user) =>
                user.id ===
                employeeId
        ) ??
        null;
}

/************************************************
 * OBJEKTE
 ************************************************/

function getObjectById(
    state,
    objectId
) {

    return asArray(state.objects)
        .find(
            (object) =>
                object.id ===
                objectId
        ) ??
        null;
}

function getAssignedObjectIds(user) {

    return asArray(
        user?.assignedObjectIds ??
        user?.objectIds
    );
}

function getAssignedObjects(
    state,
    user
) {

    const assignedObjectIds =
        getAssignedObjectIds(
            user
        );

    if (
        assignedObjectIds.length > 0
    ) {

        return asArray(state.objects)
            .filter(
                (object) =>
                    assignedObjectIds.includes(
                        object.id
                    )
            );
    }

    return asArray(state.objects)
        .filter(
            (object) =>
                asArray(
                    object.assignedEmployeeIds ??
                    object.employeeIds ??
                    object.assignedUserIds
                ).includes(
                    user.id
                )
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

function getEmployeeRunningShift(
    state,
    employeeId
) {

    return getRunningShifts(state)
        .find(
            (shift) =>
                shift.employeeId ===
                    employeeId ||
                shift.userId ===
                    employeeId
        ) ??
        null;
}

/************************************************
 * ABWESENHEITEN
 ************************************************/

function isClosedRequest(request) {

    return [
        "APPROVED",
        "REJECTED",
        "CLOSED",
        "COMPLETED",
        "CANCELLED",
        "ARCHIVED"
    ].includes(
        normalizeStatus(
            request.status
        )
    );
}

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

function getOpenAbsenceRequests(state) {

    return asArray(state.customerRequests)
        .filter(
            (request) =>
                isAbsenceRequest(
                    request
                ) &&
                !isClosedRequest(
                    request
                )
        );
}

function getEmployeeAbsence(
    state,
    employeeId
) {

    return getOpenAbsenceRequests(state)
        .find(
            (request) =>
                request.userId ===
                    employeeId ||
                request.employeeId ===
                    employeeId ||
                request.createdByUserId ===
                    employeeId
        ) ??
        null;
}

/************************************************
 * VERTRETUNGEN
 ************************************************/

function getReplacementRequests(state) {

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
                        "REPLACEMENT",
                        "SUBSTITUTE",
                        "VERTRETUNG"
                    ].includes(type) &&
                    ![
                        "COMPLETED",
                        "CLOSED",
                        "CANCELLED",
                        "REJECTED"
                    ].includes(status)
                );
            }
        );
}

/************************************************
 * STATUS EINES MITARBEITERS
 ************************************************/

function getEmployeeStatus(
    state,
    employee
) {

    const absence =
        getEmployeeAbsence(
            state,
            employee.id
        );

    if (absence) {

        return {
            label:
                "Abwesend",

            status:
                "warning"
        };
    }

    const runningShift =
        getEmployeeRunningShift(
            state,
            employee.id
        );

    if (runningShift) {

        return {
            label:
                "Im Einsatz",

            status:
                "success"
        };
    }

    return {
        label:
            "Verfügbar",

        status:
            "neutral"
    };
}

/************************************************
 * MITARBEITERZEILE
 ************************************************/

function renderEmployeeRow(
    state,
    employee
) {

    const status =
        getEmployeeStatus(
            state,
            employee
        );

    const assignedObjects =
        getAssignedObjects(
            state,
            employee
        );

    const runningShift =
        getEmployeeRunningShift(
            state,
            employee.id
        );

    const currentObject =
        runningShift
            ? getObjectById(
                state,
                runningShift.objectId
            )
            : null;

    const subtitleParts = [];

    if (currentObject) {

        subtitleParts.push(
            currentObject.name ??
            currentObject.id
        );
    }
    else if (
        assignedObjects.length > 0
    ) {

        subtitleParts.push(
            `${assignedObjects.length} Objekt${
                assignedObjects.length === 1
                    ? ""
                    : "e"
            }`
        );
    }
    else {

        subtitleParts.push(
            "Kein Objekt zugewiesen"
        );
    }

    if (employee.phone) {

        subtitleParts.push(
            employee.phone
        );
    }

    return {
        title:
            formatName(
                employee
            ),

        description:
            subtitleParts.join(" · "),

        icon:
            "personnel",

        color:
            status.status,

        status:
            status.label,

        action:
            "open-employee",

        value:
            assignedObjects.length > 0
                ? assignedObjects.length
                : null,

        className:
            "personnel-employee-row"
    };
}

/************************************************
 * ABWESENHEITSZEILE
 ************************************************/

function renderAbsenceRow(
    state,
    request
) {

    const employeeId =
        request.employeeId ??
        request.userId ??
        request.createdByUserId;

    const employee =
        getEmployeeById(
            state,
            employeeId
        );

    const type =
        normalizeStatus(
            request.type ??
            request.requestType
        );

    const typeLabel =
        [
            "VACATION",
            "URLAUB"
        ].includes(type)
            ? "Urlaub"
            : (
                [
                    "SICK",
                    "SICKNESS",
                    "KRANK"
                ].includes(type)
                    ? "Krankmeldung"
                    : "Abwesenheit"
            );

    const dateText =
        request.startDate &&
        request.endDate
            ? `${request.startDate} – ${request.endDate}`
            : (
                request.startDate ??
                request.date ??
                "Zeitraum offen"
            );

    return {
        title:
            formatName(
                employee
            ),

        description:
            `${typeLabel} · ${dateText}`,

        icon:
            "warning",

        color:
            "warning",

        status:
            normalizeStatus(
                request.status
            ) || "OFFEN",

        action:
            "open-absence-request"
    };
}

/************************************************
 * VERTRETUNGSZEILE
 ************************************************/

function renderReplacementRow(
    state,
    request
) {

    const object =
        getObjectById(
            state,
            request.objectId
        );

    const absentEmployee =
        getEmployeeById(
            state,
            request.employeeId ??
            request.absentEmployeeId
        );

    const replacementEmployee =
        getEmployeeById(
            state,
            request.replacementEmployeeId ??
            request.substituteEmployeeId
        );

    const title =
        object?.name ??
        "Vertretung erforderlich";

    const description =
        replacementEmployee
            ? `${formatName(
                replacementEmployee
            )} übernimmt für ${formatName(
                absentEmployee
            )}`
            : `Noch keine Vertretung für ${formatName(
                absentEmployee
            )}`;

    return {
        title,

        description,

        icon:
            "personnel",

        color:
            replacementEmployee
                ? "success"
                : "warning",

        status:
            replacementEmployee
                ? "Zugewiesen"
                : "Offen",

        action:
            "open-replacement"
    };
}

/************************************************
 * WARNUNGEN
 ************************************************/

function getPersonnelAlerts(state) {

    const alerts = [];

    const absences =
        getOpenAbsenceRequests(
            state
        );

    const replacements =
        getReplacementRequests(
            state
        );

    const unassignedEmployees =
        getEmployees(state)
            .filter(
                (employee) =>
                    getAssignedObjects(
                        state,
                        employee
                    ).length === 0
            );

    if (
        absences.length > 0
    ) {

        alerts.push({
            title:
                "Offene Abwesenheiten",

            message:
                `${absences.length} Krankheits- oder Urlaubsanträge müssen geprüft werden.`,

            status:
                "warning",

            icon:
                "warning",

            action:
                "open-absence-overview",

            buttonLabel:
                "Prüfen"
        });
    }

    const openReplacements =
        replacements.filter(
            (request) =>
                !(
                    request.replacementEmployeeId ||
                    request.substituteEmployeeId
                )
        );

    if (
        openReplacements.length > 0
    ) {

        alerts.push({
            title:
                "Vertretung fehlt",

            message:
                `${openReplacements.length} Einsätze haben noch keine Vertretung.`,

            status:
                "danger",

            icon:
                "personnel",

            action:
                "open-replacement-overview",

            buttonLabel:
                "Vertretung suchen"
        });
    }

    if (
        unassignedEmployees.length > 0
    ) {

        alerts.push({
            title:
                "Objektzuweisung fehlt",

            message:
                `${unassignedEmployees.length} Mitarbeiter sind keinem Objekt zugewiesen.`,

            status:
                "info",

            icon:
                "objects",

            action:
                "open-assignment-overview",

            buttonLabel:
                "Zuweisen"
        });
    }

    return alerts;
}

/************************************************
 * KENNZAHLEN
 ************************************************/

function renderPersonnelStatus(state) {

    const employees =
        getEmployees(state);

    const runningShifts =
        getRunningShifts(state);

    const absences =
        getOpenAbsenceRequests(state);

    const replacements =
        getReplacementRequests(state);

    return renderStatusGrid(
        [
            {
                title:
                    "Mitarbeiter",

                value:
                    employees.length,

                description:
                    "aktiv",

                status:
                    "personnel",

                icon:
                    "personnel"
            },
            {
                title:
                    "Im Einsatz",

                value:
                    runningShifts.length,

                description:
                    "laufende Schichten",

                status:
                    "success",

                icon:
                    "personnel"
            },
            {
                title:
                    "Abwesend",

                value:
                    absences.length,

                description:
                    "offene Meldungen",

                status:
                    absences.length > 0
                        ? "warning"
                        : "success",

                icon:
                    "warning"
            },
            {
                title:
                    "Vertretungen",

                value:
                    replacements.length,

                description:
                    "offen oder geplant",

                status:
                    replacements.length > 0
                        ? "warning"
                        : "neutral",

                icon:
                    "personnel"
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
 * MITARBEITERLISTE
 ************************************************/

function renderEmployeeList(state) {

    const employees =
        getEmployees(state);

    if (
        employees.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Mitarbeiter vorhanden",

            description:
                "Es sind derzeit keine aktiven Mitarbeiter hinterlegt.",

            icon:
                "personnel",

            color:
                "personnel",

            actionLabel:
                "Mitarbeiter anlegen",

            action:
                "create-employee"
        });
    }

    return renderActionRows(
        employees.map(
            (employee) =>
                renderEmployeeRow(
                    state,
                    employee
                )
        )
    );
}

/************************************************
 * ABWESENHEITEN
 ************************************************/

function renderAbsenceList(state) {

    const absences =
        getOpenAbsenceRequests(
            state
        );

    if (
        absences.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine offenen Abwesenheiten",

            description:
                "Aktuell liegen keine offenen Krankheits- oder Urlaubsanträge vor.",

            icon:
                "personnel",

            color:
                "success",

            compact:
                true
        });
    }

    return renderActionRows(
        absences.map(
            (request) =>
                renderAbsenceRow(
                    state,
                    request
                )
        )
    );
}

/************************************************
 * VERTRETUNGEN
 ************************************************/

function renderReplacementList(state) {

    const replacements =
        getReplacementRequests(
            state
        );

    if (
        replacements.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Vertretungen erforderlich",

            description:
                "Aktuell gibt es keine offenen Vertretungsfälle.",

            icon:
                "personnel",

            color:
                "success",

            compact:
                true
        });
    }

    return renderActionRows(
        replacements.map(
            (request) =>
                renderReplacementRow(
                    state,
                    request
                )
        )
    );
}

/************************************************
 * OBJEKTZUWEISUNGEN
 ************************************************/

function renderAssignments(state) {

    const employees =
        getEmployees(state);

    if (
        employees.length === 0
    ) {

        return renderEmptyState({
            title:
                "Keine Zuweisungen vorhanden",

            description:
                "Es können noch keine Objektzuweisungen angezeigt werden.",

            icon:
                "objects",

            color:
                "objects",

            compact:
                true
        });
    }

    const assignmentRows =
        employees.map(
            (employee) => {

                const objects =
                    getAssignedObjects(
                        state,
                        employee
                    );

                return {
                    label:
                        formatName(
                            employee
                        ),

                    value:
                        objects.length > 0
                            ? objects
                                .map(
                                    (object) =>
                                        object.name ??
                                        object.id
                                )
                                .join(", ")
                            : "Nicht zugewiesen",

                    status:
                        objects.length > 0
                            ? "objects"
                            : "warning",

                    icon:
                        "objects",

                    emphasize:
                        objects.length === 0
                };
            }
        );

    return renderInfoList(
        assignmentRows,
        {
            columns:
                1
        }
    );
}

/************************************************
 * SCHNELLZUGRIFFE
 ************************************************/

function renderPersonnelQuickActions() {

    return renderCompactModuleList(
        [
            {
                title:
                    "Mitarbeiter anlegen",

                subtitle:
                    "Neues Benutzerkonto erstellen",

                icon:
                    "personnel",

                color:
                    "personnel",

                action:
                    "create-employee"
            },
            {
                title:
                    "Abwesenheit erfassen",

                subtitle:
                    "Krankheit oder Urlaub eintragen",

                icon:
                    "warning",

                color:
                    "warning",

                action:
                    "create-absence"
            },
            {
                title:
                    "Vertretung planen",

                subtitle:
                    "Passenden Mitarbeiter zuweisen",

                icon:
                    "personnel",

                color:
                    "success",

                action:
                    "create-replacement"
            },
            {
                title:
                    "Schichten öffnen",

                subtitle:
                    "Einsätze und Arbeitszeiten",

                icon:
                    "times",

                color:
                    "times",

                route:
                    ROUTES.TIMES
            }
        ]
    );
}

/************************************************
 * ZUGRIFF VERWEIGERT
 ************************************************/

function renderAccessDenied() {

    return `
        <section class="app-personnel-page">

            ${renderPageTitle({
                eyebrow:
                    "Personal",

                title:
                    "Kein Zugriff",

                description:
                    "Dieser Bereich ist nur für Objektleitung und Administration freigegeben.",

                color:
                    "personnel",

                backRoute:
                    ROUTES.OVERVIEW
            })}

            ${renderEmptyState({
                title:
                    "Personalbereich nicht freigegeben",

                description:
                    "Deine Benutzerrolle besitzt keine Berechtigung für diese Ansicht.",

                icon:
                    "personnel",

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

export function renderPersonnelPage(state) {

    if (
        !canViewPersonnel(
            state
        )
    ) {

        return renderAccessDenied();
    }

    const employees =
        getEmployees(state);

    const absences =
        getOpenAbsenceRequests(
            state
        );

    const replacements =
        getReplacementRequests(
            state
        );

    const alerts =
        getPersonnelAlerts(
            state
        );

    return `
        <section class="app-personnel-page">

            ${renderPageTitle({
                eyebrow:
                    "Personal",

                title:
                    "Mitarbeiter",

                description:
                    "Einsatz, Abwesenheit und Vertretung auf einen Blick.",

                color:
                    "personnel",

                actionLabel:
                    "Neu",

                action:
                    "create-employee",

                compact:
                    true
            })}

            <section class="app-personnel-status">

                ${renderPersonnelStatus(
                    state
                )}

            </section>

            ${
                alerts.length > 0
                    ? `
                        <section class="app-personnel-alerts">

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

            <section class="app-personnel-quick-actions">

                ${renderSectionHeader({
                    title:
                        "Schnellaktionen",

                    compact:
                        true
                })}

                ${renderPersonnelQuickActions()}

            </section>

            <section class="app-personnel-content">

                ${renderCollapsiblePanel({
                    title:
                        "Mitarbeiterübersicht",

                    description:
                        "Verfügbarkeit und aktueller Einsatz",

                    icon:
                        "personnel",

                    color:
                        "personnel",

                    count:
                        employees.length,

                    open:
                        true,

                    content:
                        renderEmployeeList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Abwesenheiten",

                    description:
                        "Krankheit, Urlaub und sonstige Ausfälle",

                    icon:
                        "warning",

                    color:
                        "warning",

                    count:
                        absences.length,

                    content:
                        renderAbsenceList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Vertretungen",

                    description:
                        "Offene und geplante Ersatzbesetzungen",

                    icon:
                        "personnel",

                    color:
                        "success",

                    count:
                        replacements.length,

                    content:
                        renderReplacementList(
                            state
                        )
                })}

                ${renderCollapsiblePanel({
                    title:
                        "Objektzuweisungen",

                    description:
                        "Mitarbeiter und zugeordnete Einsatzorte",

                    icon:
                        "objects",

                    color:
                        "objects",

                    count:
                        employees.length,

                    content:
                        renderAssignments(
                            state
                        )
                })}

                ${renderSectionPanel({
                    title:
                        "Schichtplanung",

                    description:
                        "Einsätze, Arbeitszeiten und offene Buchungen",

                    icon:
                        "times",

                    color:
                        "times",

                    route:
                        ROUTES.TIMES,

                    highlighted:
                        true
                })}

            </section>

        </section>
    `;
}