/************************************************
 * Facility OS
 * renderApp.js
 *
 * Reduzierte Benutzeroberfläche
 * - maximal fünf Hauptbereiche
 * - höchstens vier Kennzahlen
 * - klare Farbbereiche
 * - kompakte Unterseiten
 * - Abmeldung im Bereich „Mehr“
 ************************************************/

import {
    APP_CONFIG,
    USER_ROLES
} from "../config/appConfig.js";

import {
    ROUTES,
    getMainNavigationForRole,
    getActiveMainRoute
} from "../router.js";

import {
    renderObjectsPage
} from "./pages/objectsPage.js";

import {
    renderObjectDetailPage
} from "./pages/objectDetailPage.js";

/************************************************
 * HTML-SICHERHEIT
 ************************************************/

function escapeHtml(value) {

    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/************************************************
 * BASISHELFER
 ************************************************/

function asArray(value) {

    return Array.isArray(value)
        ? value
        : [];
}

function asNumber(value) {

    const number =
        Number(value);

    return Number.isFinite(number)
        ? number
        : 0;
}

function normalizeStatus(value) {

    return String(value ?? "")
        .trim()
        .toUpperCase();
}

function getRoleLabel(role) {

    const labels = {

        [USER_ROLES.SUPER_ADMIN]:
            "Super-Administration",

        [USER_ROLES.ADMIN]:
            "Administration",

        [USER_ROLES.OBJEKTLEITER]:
            "Objektleitung",

        [USER_ROLES.MITARBEITER]:
            "Mitarbeiter",

        [USER_ROLES.BUCHHALTUNG]:
            "Buchhaltung",

        [USER_ROLES.KUNDE]:
            "Kundenportal"
    };

    return (
        labels[role] ??
        "Facility OS"
    );
}

function getUserName(state) {

    return (
        state.currentUser?.name ??
        state.currentUser?.fullName ??
        "Benutzer"
    );
}

/************************************************
 * DATENFILTER
 ************************************************/

function getOpenTickets(state) {

    const closedStatuses = [
        "RESOLVED",
        "CLOSED",
        "COMPLETED"
    ];

    return asArray(state.tickets)
        .filter(
            (ticket) =>
                !closedStatuses.includes(
                    normalizeStatus(
                        ticket.status
                    )
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
                        "CRITICAL"
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

function getRunningShifts(state) {

    return asArray(state.shifts)
        .filter(
            (shift) => {

                const status =
                    normalizeStatus(
                        shift.status
                    );

                return (
                    status === "RUNNING" ||
                    (
                        shift.startTime &&
                        !shift.endTime &&
                        ![
                            "FINISHED",
                            "COMPLETED",
                            "CANCELLED"
                        ].includes(status)
                    )
                );
            }
        );
}

function getOpenTimeDeviations(state) {

    return asArray(state.timeDeviations)
        .filter(
            (deviation) =>
                ![
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

function getActiveUsers(state) {

    return asArray(state.users)
        .filter(
            (user) =>
                user.active !== false
        );
}

function getVisibleObjects(state) {

    const currentUser =
        state.currentUser;

    const objects =
        asArray(state.objects);

    if (!currentUser) {
        return [];
    }

    switch (currentUser.role) {

        case USER_ROLES.SUPER_ADMIN:
        case USER_ROLES.ADMIN:
        case USER_ROLES.BUCHHALTUNG:

            return objects;

        case USER_ROLES.OBJEKTLEITER: {

            const managedObjects =
                objects.filter(
                    (object) =>
                        object.objectLeaderId ===
                            currentUser.id ||
                        object.managerId ===
                            currentUser.id
                );

            return managedObjects.length > 0
                ? managedObjects
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
                            object.assignedEmployeeIds
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
                            access.customerUserId ===
                                currentUser.id
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
 * KOPFBEREICH
 ************************************************/

function renderHeader(state) {

    if (!state.currentUser) {
        return "";
    }

    return `
        <header class="app-header">

            <div class="app-header-brand">

                <strong>
                    ${escapeHtml(
                        APP_CONFIG.APP_NAME ??
                        "Facility OS"
                    )}
                </strong>

                <span>
                    ${escapeHtml(
                        getRoleLabel(
                            state.currentUser.role
                        )
                    )}
                </span>

            </div>

            <div class="app-header-actions">

                ${
                    state.currentObject
                        ? `
                            <button
                                type="button"
                                class="header-object-button"
                                data-route="${ROUTES.OBJECT_DETAIL}"
                            >
                                <span>
                                    Objekt
                                </span>

                                <strong>
                                    ${escapeHtml(
                                        state.currentObject.name ??
                                        state.currentObject.id
                                    )}
                                </strong>
                            </button>
                        `
                        : ""
                }

                <button
                    type="button"
                    class="header-profile-button"
                    data-route="${ROUTES.MORE}"
                    aria-label="Profil und weitere Funktionen"
                >
                    ${escapeHtml(
                        getUserName(state)
                            .charAt(0)
                            .toUpperCase()
                    )}
                </button>

            </div>

        </header>
    `;
}

/************************************************
 * UNTERE NAVIGATION
 ************************************************/

function getNavigationIcon(itemId) {

    const icons = {

        overview:
            "⌂",

        objects:
            "▦",

        object:
            "▦",

        personnel:
            "♙",

        communication:
            "✉",

        tasks:
            "✓",

        times:
            "◷",

        analysis:
            "▥",

        reports:
            "▥",

        more:
            "•••"
    };

    return (
        icons[itemId] ??
        "•"
    );
}

function renderNavigation(
    state,
    route
) {

    const role =
        state.currentUser?.role;

    if (!role) {
        return "";
    }

    const navigationItems =
        getMainNavigationForRole(
            role
        );

    const activeMainRoute =
        getActiveMainRoute(
            route,
            role
        );

    return `
        <nav class="bottom-navigation">

            ${navigationItems
                .map(
                    (item) => {

                        const active =
                            activeMainRoute ===
                            item.route;

                        return `
                            <button
                                type="button"
                                class="navigation-item navigation-${escapeHtml(
                                    item.color
                                )} ${
                                    active
                                        ? "active"
                                        : ""
                                }"
                                data-route="${escapeHtml(
                                    item.route
                                )}"
                            >
                                <span class="navigation-icon">
                                    ${escapeHtml(
                                        getNavigationIcon(
                                            item.id
                                        )
                                    )}
                                </span>

                                <span class="navigation-label">
                                    ${escapeHtml(
                                        item.label
                                    )}
                                </span>
                            </button>
                        `;
                    }
                )
                .join("")}

        </nav>
    `;
}

/************************************************
 * LOGIN
 ************************************************/

function renderLogin() {

    return `
        <main class="login-page">

            <section class="login-card">

                <div class="brand-block">

                    <div class="brand-mark">
                        FO
                    </div>

                    <h1>
                        Facility OS
                    </h1>

                    <p>
                        Digitale Objekt- und
                        Reinigungsverwaltung
                    </p>

                </div>

                <form id="test-login-form">

                    <div class="form-group">

                        <label for="login-name">
                            Name
                        </label>

                        <input
                            id="login-name"
                            name="name"
                            type="text"
                            value="Test Benutzer"
                            autocomplete="name"
                            required
                        >

                    </div>

                    <div class="form-group">

                        <label for="login-role">
                            Rolle
                        </label>

                        <select
                            id="login-role"
                            name="role"
                            required
                        >

                            <option value="OBJEKTLEITER">
                                Objektleiter
                            </option>

                            <option value="MITARBEITER">
                                Mitarbeiter
                            </option>

                            <option value="ADMIN">
                                Administration
                            </option>

                            <option value="BUCHHALTUNG">
                                Buchhaltung
                            </option>

                            <option value="KUNDE">
                                Kunde
                            </option>

                            <option value="SUPER_ADMIN">
                                Super-Admin
                            </option>

                        </select>

                    </div>

                    <button
                        type="submit"
                        class="button button-primary button-full"
                    >
                        Anmelden
                    </button>

                </form>

                <p class="login-note">
                    Testmodus mit lokalen Daten
                </p>

            </section>

        </main>
    `;
}

/************************************************
 * SEITENKOPF
 ************************************************/

function renderPageHeader({
    area,
    title,
    description = "",
    color = "overview"
}) {

    return `
        <header class="page-intro page-intro-${escapeHtml(
            color
        )}">

            <span class="page-area-label">
                ${escapeHtml(area)}
            </span>

            <h1>
                ${escapeHtml(title)}
            </h1>

            ${
                description
                    ? `
                        <p>
                            ${escapeHtml(
                                description
                            )}
                        </p>
                    `
                    : ""
            }

        </header>
    `;
}

/************************************************
 * KENNZAHLEN
 ************************************************/

function renderMetric({
    label,
    value,
    status = "neutral",
    route = null
}) {

    const routeAttribute =
        route
            ? `data-route="${escapeHtml(
                route
            )}"`
            : "";

    const tag =
        route
            ? "button"
            : "article";

    return `
        <${tag}
            class="summary-metric summary-metric-${escapeHtml(
                status
            )}"
            ${routeAttribute}
            ${route ? 'type="button"' : ""}
        >

            <span>
                ${escapeHtml(label)}
            </span>

            <strong>
                ${escapeHtml(value)}
            </strong>

        </${tag}>
    `;
}

function renderMetrics(metrics) {

    return `
        <section class="summary-grid">

            ${metrics
                .slice(0, 4)
                .map(
                    renderMetric
                )
                .join("")}

        </section>
    `;
}

/************************************************
 * HAUPTAKTIONEN
 ************************************************/

function renderPrimaryAction({
    title,
    description,
    route = null,
    action = null,
    color = "overview"
}) {

    const routeAttribute =
        route
            ? `data-route="${escapeHtml(
                route
            )}"`
            : "";

    const actionAttribute =
        action
            ? `data-action="${escapeHtml(
                action
            )}"`
            : "";

    return `
        <button
            type="button"
            class="primary-action primary-action-${escapeHtml(
                color
            )}"
            ${routeAttribute}
            ${actionAttribute}
        >

            <strong>
                ${escapeHtml(title)}
            </strong>

            <span>
                ${escapeHtml(description)}
            </span>

            <span class="primary-action-arrow">
                ›
            </span>

        </button>
    `;
}

function renderActionList(actions) {

    return `
        <section class="primary-action-list">

            ${actions
                .map(
                    renderPrimaryAction
                )
                .join("")}

        </section>
    `;
}

/************************************************
 * WARNUNGEN
 ************************************************/

function renderNotice({
    title,
    text,
    level = "info",
    route = null
}) {

    const tag =
        route
            ? "button"
            : "article";

    const routeAttribute =
        route
            ? `data-route="${escapeHtml(
                route
            )}"`
            : "";

    return `
        <${tag}
            class="notice-card notice-${escapeHtml(
                level
            )}"
            ${routeAttribute}
            ${route ? 'type="button"' : ""}
        >

            <strong>
                ${escapeHtml(title)}
            </strong>

            <span>
                ${escapeHtml(text)}
            </span>

        </${tag}>
    `;
}

function renderNoticeList(notices) {

    if (
        notices.length === 0
    ) {

        return "";
    }

    return `
        <section class="notice-list">

            ${notices
                .slice(0, 3)
                .map(
                    renderNotice
                )
                .join("")}

        </section>
    `;
}

/************************************************
 * OBJEKTLEITER-ÜBERSICHT
 ************************************************/

function renderManagerOverview(state) {

    const visibleObjects =
        getVisibleObjects(state);

    const runningShifts =
        getRunningShifts(state);

    const criticalTickets =
        getCriticalTickets(state);

    const openTickets =
        getOpenTickets(state);

    const materialWarnings =
        getMaterialWarnings(state);

    const deviations =
        getOpenTimeDeviations(state);

    const notices = [];

    if (
        criticalTickets.length > 0
    ) {

        notices.push({
            title:
                "Kritische Meldungen",

            text:
                `${criticalTickets.length} Vorgänge benötigen eine schnelle Prüfung.`,

            level:
                "critical",

            route:
                ROUTES.COMMUNICATION
        });
    }

    if (
        materialWarnings.length > 0
    ) {

        notices.push({
            title:
                "Material prüfen",

            text:
                `${materialWarnings.length} Bestände sind niedrig oder kritisch.`,

            level:
                "warning",

            route:
                ROUTES.OBJECTS
        });
    }

    if (
        deviations.length > 0
    ) {

        notices.push({
            title:
                "Zeitabweichungen",

            text:
                `${deviations.length} Abweichungen sind noch ungeklärt.`,

            level:
                "warning",

            route:
                ROUTES.MORE
        });
    }

    return `
        <section class="page-section">

            ${renderPageHeader({
                area:
                    "Übersicht",

                title:
                    `Guten Tag, ${getUserName(
                        state
                    )}`,

                description:
                    "Das Wichtigste für den heutigen Betrieb.",

                color:
                    "overview"
            })}

            ${renderMetrics([
                {
                    label:
                        "Aktive Schichten",

                    value:
                        runningShifts.length,

                    status:
                        runningShifts.length > 0
                            ? "success"
                            : "neutral"
                },
                {
                    label:
                        "Offene Tickets",

                    value:
                        openTickets.length,

                    status:
                        openTickets.length > 0
                            ? "warning"
                            : "success",

                    route:
                        ROUTES.COMMUNICATION
                },
                {
                    label:
                        "Materialwarnungen",

                    value:
                        materialWarnings.length,

                    status:
                        materialWarnings.length > 0
                            ? "warning"
                            : "success",

                    route:
                        ROUTES.OBJECTS
                },
                {
                    label:
                        "Objekte",

                    value:
                        visibleObjects.length,

                    status:
                        "info",

                    route:
                        ROUTES.OBJECTS
                }
            ])}

            ${renderNoticeList(
                notices
            )}

            ${renderActionList([
                {
                    title:
                        "Objekte öffnen",

                    description:
                        "Räume, Aufgaben und Objektstatus",

                    route:
                        ROUTES.OBJECTS,

                    color:
                        "objects"
                },
                {
                    title:
                        "Personal steuern",

                    description:
                        "Mitarbeiter, Abwesenheit und Vertretung",

                    route:
                        ROUTES.PERSONNEL,

                    color:
                        "personnel"
                },
                {
                    title:
                        "Meldungen bearbeiten",

                    description:
                        "Tickets, Nachrichten und Kundenanfragen",

                    route:
                        ROUTES.COMMUNICATION,

                    color:
                        "communication"
                }
            ])}

        </section>
    `;
}

/************************************************
 * MITARBEITER-ÜBERSICHT
 ************************************************/

function renderEmployeeOverview(state) {

    const currentObject =
        state.currentObject;

    const objectTasks =
        currentObject
            ? asArray(state.tasks)
                .filter(
                    (task) =>
                        task.objectId ===
                            currentObject.id &&
                        task.active !== false
                )
            : [];

    const ownOpenTickets =
        getOpenTickets(state)
            .filter(
                (ticket) =>
                    ticket.createdByUserId ===
                        state.currentUser?.id ||
                    ticket.userId ===
                        state.currentUser?.id
            );

    const shiftStarted =
        state.shiftStarted === true;

    const notices = [];

    if (!currentObject) {

        notices.push({
            title:
                "Kein Objekt ausgewählt",

            text:
                "Wähle dein Objekt, bevor du mit der Arbeit beginnst.",

            level:
                "warning",

            route:
                ROUTES.OBJECTS
        });
    }

    return `
        <section class="page-section">

            ${renderPageHeader({
                area:
                    "Übersicht",

                title:
                    `Hallo, ${getUserName(
                        state
                    )}`,

                description:
                    currentObject
                        ? `Heute im Objekt: ${
                            currentObject.name ??
                            currentObject.id
                        }`
                        : "Bereit für deinen nächsten Einsatz.",

                color:
                    "overview"
            })}

            ${renderMetrics([
                {
                    label:
                        "Schicht",

                    value:
                        shiftStarted
                            ? "Läuft"
                            : "Offen",

                    status:
                        shiftStarted
                            ? "success"
                            : "warning"
                },
                {
                    label:
                        "Aufgaben",

                    value:
                        objectTasks.length,

                    status:
                        "info",

                    route:
                        ROUTES.TASKS
                },
                {
                    label:
                        "Eigene Meldungen",

                    value:
                        ownOpenTickets.length,

                    status:
                        ownOpenTickets.length > 0
                            ? "warning"
                            : "success",

                    route:
                        ROUTES.COMMUNICATION
                },
                {
                    label:
                        "Objekt",

                    value:
                        currentObject
                            ? "Gewählt"
                            : "Fehlt",

                    status:
                        currentObject
                            ? "success"
                            : "warning",

                    route:
                        ROUTES.OBJECTS
                }
            ])}

            ${renderNoticeList(
                notices
            )}

            ${renderActionList([
                shiftStarted
                    ? {
                        title:
                            "Schicht beenden",

                        description:
                            "Abschlussprüfung durchführen",

                        action:
                            "checkout",

                        color:
                            "overview"
                    }
                    : {
                        title:
                            "Einchecken",

                        description:
                            currentObject
                                ? "Schicht im aktuellen Objekt starten"
                                : "Zuerst ein Objekt auswählen",

                        action:
                            currentObject
                                ? "checkin"
                                : null,

                        route:
                            currentObject
                                ? null
                                : ROUTES.OBJECTS,

                        color:
                            "overview"
                    },
                {
                    title:
                        "Aufgaben öffnen",

                    description:
                        "Räume und Arbeitsschritte anzeigen",

                    route:
                        ROUTES.TASKS,

                    color:
                        "tasks"
                },
                {
                    title:
                        "Problem melden",

                    description:
                        "Schaden, Materialmangel oder Hinweis",

                    route:
                        ROUTES.COMMUNICATION,

                    color:
                        "communication"
                },
                {
                    title:
                        "Objektinformationen",

                    description:
                        "Anleitung, Sicherheit und Materialstandorte",

                    route:
                        currentObject
                            ? ROUTES.OBJECT_DETAIL
                            : ROUTES.OBJECTS,

                    color:
                        "objects"
                }
            ])}

        </section>
    `;
}

/************************************************
 * ADMIN-ÜBERSICHT
 ************************************************/

function renderAdminOverview(state) {

    const activeUsers =
        getActiveUsers(state);

    const openTickets =
        getOpenTickets(state);

    const materialWarnings =
        getMaterialWarnings(state);

    return `
        <section class="page-section">

            ${renderPageHeader({
                area:
                    "Übersicht",

                title:
                    "Unternehmensübersicht",

                description:
                    "Benutzer, Objekte und offene Vorgänge.",

                color:
                    "overview"
            })}

            ${renderMetrics([
                {
                    label:
                        "Benutzer",

                    value:
                        activeUsers.length,

                    status:
                        "info",

                    route:
                        ROUTES.PERSONNEL
                },
                {
                    label:
                        "Objekte",

                    value:
                        asArray(
                            state.objects
                        ).length,

                    status:
                        "info",

                    route:
                        ROUTES.OBJECTS
                },
                {
                    label:
                        "Offene Tickets",

                    value:
                        openTickets.length,

                    status:
                        openTickets.length > 0
                            ? "warning"
                            : "success",

                    route:
                        ROUTES.COMMUNICATION
                },
                {
                    label:
                        "Bestandswarnungen",

                    value:
                        materialWarnings.length,

                    status:
                        materialWarnings.length > 0
                            ? "warning"
                            : "success",

                    route:
                        ROUTES.OBJECTS
                }
            ])}

            ${renderActionList([
                {
                    title:
                        "Objekte verwalten",

                    description:
                        "Objekte, Räume und Leistungen",

                    route:
                        ROUTES.OBJECTS,

                    color:
                        "objects"
                },
                {
                    title:
                        "Personal verwalten",

                    description:
                        "Benutzer, Rollen und Zuweisungen",

                    route:
                        ROUTES.PERSONNEL,

                    color:
                        "personnel"
                },
                {
                    title:
                        "Kommunikation",

                    description:
                        "Tickets, Nachrichten und Kundenanfragen",

                    route:
                        ROUTES.COMMUNICATION,

                    color:
                        "communication"
                },
                {
                    title:
                        "System und Berichte",

                    description:
                        "Einstellungen, Auswertung und Verwaltung",

                    route:
                        ROUTES.MORE,

                    color:
                        "more"
                }
            ])}

        </section>
    `;
}

/************************************************
 * BUCHHALTUNGS-ÜBERSICHT
 ************************************************/

function renderAccountingOverview(state) {

    const shifts =
        asArray(state.shifts);

    const deviations =
        getOpenTimeDeviations(state);

    const incompleteShifts =
        shifts.filter(
            (shift) =>
                shift.startTime &&
                !shift.endTime &&
                ![
                    "RUNNING",
                    "PLANNED"
                ].includes(
                    normalizeStatus(
                        shift.status
                    )
                )
        );

    return `
        <section class="page-section">

            ${renderPageHeader({
                area:
                    "Übersicht",

                title:
                    "Abrechnung und Zeiten",

                description:
                    "Aktueller Stand der Zeiterfassung.",

                color:
                    "overview"
            })}

            ${renderMetrics([
                {
                    label:
                        "Schichten",

                    value:
                        shifts.length,

                    status:
                        "info",

                    route:
                        ROUTES.TIMES
                },
                {
                    label:
                        "Abweichungen",

                    value:
                        deviations.length,

                    status:
                        deviations.length > 0
                            ? "warning"
                            : "success",

                    route:
                        ROUTES.TIMES
                },
                {
                    label:
                        "Unvollständig",

                    value:
                        incompleteShifts.length,

                    status:
                        incompleteShifts.length > 0
                            ? "critical"
                            : "success",

                    route:
                        ROUTES.TIMES
                },
                {
                    label:
                        "Objekte",

                    value:
                        asArray(
                            state.objects
                        ).length,

                    status:
                        "info",

                    route:
                        ROUTES.OBJECTS
                }
            ])}

            ${renderActionList([
                {
                    title:
                        "Zeiten prüfen",

                    description:
                        "Schichten, Check-ins und Abweichungen",

                    route:
                        ROUTES.TIMES,

                    color:
                        "times"
                },
                {
                    title:
                        "Objektstunden",

                    description:
                        "Zeiten nach Objekt und Kostenstelle",

                    route:
                        ROUTES.OBJECTS,

                    color:
                        "objects"
                },
                {
                    title:
                        "Auswertung öffnen",

                    description:
                        "Monatsabrechnung und Export",

                    route:
                        ROUTES.ANALYSIS,

                    color:
                        "analysis"
                }
            ])}

        </section>
    `;
}

/************************************************
 * KUNDEN-ÜBERSICHT
 ************************************************/

function renderCustomerOverview(state) {

    const visibleObjects =
        getVisibleObjects(state);

    const ownTickets =
        getOpenTickets(state)
            .filter(
                (ticket) =>
                    ticket.customerUserId ===
                        state.currentUser?.id ||
                    ticket.createdByUserId ===
                        state.currentUser?.id
            );

    return `
        <section class="page-section">

            ${renderPageHeader({
                area:
                    "Übersicht",

                title:
                    "Kundenportal",

                description:
                    "Objektstatus und aktuelle Meldungen.",

                color:
                    "overview"
            })}

            ${renderMetrics([
                {
                    label:
                        "Objekte",

                    value:
                        visibleObjects.length,

                    status:
                        "info",

                    route:
                        ROUTES.OBJECTS
                },
                {
                    label:
                        "Offene Meldungen",

                    value:
                        ownTickets.length,

                    status:
                        ownTickets.length > 0
                            ? "warning"
                            : "success",

                    route:
                        ROUTES.COMMUNICATION
                },
                {
                    label:
                        "Berichte",

                    value:
                        asArray(
                            state.taskLogs
                        ).length,

                    status:
                        "info",

                    route:
                        ROUTES.REPORTS
                },
                {
                    label:
                        "Status",

                    value:
                        "Aktiv",

                    status:
                        "success"
                }
            ])}

            ${renderActionList([
                {
                    title:
                        "Objekte ansehen",

                    description:
                        "Status und freigegebene Leistungen",

                    route:
                        ROUTES.OBJECTS,

                    color:
                        "objects"
                },
                {
                    title:
                        "Meldung erstellen",

                    description:
                        "Anfrage, Wunsch oder Reklamation",

                    route:
                        ROUTES.COMMUNICATION,

                    color:
                        "communication"
                },
                {
                    title:
                        "Berichte öffnen",

                    description:
                        "Freigegebene Leistungsnachweise",

                    route:
                        ROUTES.REPORTS,

                    color:
                        "reports"
                }
            ])}

        </section>
    `;
}

/************************************************
 * ÜBERSICHT AUSWÄHLEN
 ************************************************/

function renderOverview(state) {

    switch (
        state.currentUser?.role
    ) {

        case USER_ROLES.SUPER_ADMIN:
        case USER_ROLES.ADMIN:

            return renderAdminOverview(
                state
            );

        case USER_ROLES.OBJEKTLEITER:

            return renderManagerOverview(
                state
            );

        case USER_ROLES.MITARBEITER:

            return renderEmployeeOverview(
                state
            );

        case USER_ROLES.BUCHHALTUNG:

            return renderAccountingOverview(
                state
            );

        case USER_ROLES.KUNDE:

            return renderCustomerOverview(
                state
            );

        default:

            return renderAdminOverview(
                state
            );
    }
}

/************************************************
 * KOMPAKTE BEREICHSSEITEN
 ************************************************/

function renderCompactSectionPage({
    area,
    title,
    description,
    color,
    metrics = [],
    groups = []
}) {

    return `
        <section class="page-section">

            ${renderPageHeader({
                area,
                title,
                description,
                color
            })}

            ${
                metrics.length > 0
                    ? renderMetrics(
                        metrics
                    )
                    : ""
            }

            <section class="section-group-list">

                ${groups
                    .map(
                        (group) => `
                            <details
                                class="compact-section-group compact-section-${escapeHtml(
                                    group.color ??
                                    color
                                )}"
                                ${group.open ? "open" : ""}
                            >

                                <summary>

                                    <div>

                                        <strong>
                                            ${escapeHtml(
                                                group.title
                                            )}
                                        </strong>

                                        ${
                                            group.description
                                                ? `
                                                    <span>
                                                        ${escapeHtml(
                                                            group.description
                                                        )}
                                                    </span>
                                                `
                                                : ""
                                        }

                                    </div>

                                    <span class="section-count">
                                        ${group.items.length}
                                    </span>

                                </summary>

                                <div class="compact-section-content">

                                    ${group.items
                                        .map(
                                            (item) =>
                                                renderPrimaryAction({
                                                    ...item,

                                                    color:
                                                        item.color ??
                                                        group.color ??
                                                        color
                                                })
                                        )
                                        .join("")}

                                </div>

                            </details>
                        `
                    )
                    .join("")}

            </section>

        </section>
    `;
}

/************************************************
 * PERSONAL
 ************************************************/

function renderPersonnelPage(state) {

    const activeUsers =
        getActiveUsers(state);

    return renderCompactSectionPage({
        area:
            "Personal",

        title:
            "Mitarbeiter und Einsatzplanung",

        description:
            "Zuständigkeiten, Abwesenheiten und Vertretungen.",

        color:
            "personnel",

        metrics: [
            {
                label:
                    "Aktive Mitarbeiter",

                value:
                    activeUsers.length,

                status:
                    "info"
            },
            {
                label:
                    "Laufende Schichten",

                value:
                    getRunningShifts(
                        state
                    ).length,

                status:
                    "success"
            },
            {
                label:
                    "Abwesenheiten",

                value:
                    asArray(
                        state.customerRequests
                    ).filter(
                        (request) =>
                            [
                                "SICK",
                                "ABSENCE",
                                "VACATION"
                            ].includes(
                                normalizeStatus(
                                    request.type
                                )
                            )
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
                    "info"
            }
        ],

        groups: [
            {
                title:
                    "Mitarbeiter",

                description:
                    "Personen und Objektzuweisungen",

                color:
                    "personnel",

                open:
                    true,

                items: [
                    {
                        title:
                            "Mitarbeiterübersicht",

                        description:
                            "Aktive Personen und Zuständigkeiten"
                    },
                    {
                        title:
                            "Objektzuweisungen",

                        description:
                            "Mitarbeiter auf Objekte verteilen"
                    }
                ]
            },
            {
                title:
                    "Abwesenheit und Vertretung",

                description:
                    "Krankheit, Urlaub und Ausfälle",

                color:
                    "personnel",

                items: [
                    {
                        title:
                            "Abwesenheiten",

                        description:
                            "Krankmeldungen und Urlaub prüfen"
                    },
                    {
                        title:
                            "Vertretungen",

                        description:
                            "Passende Vertretung suchen und zuweisen"
                    },
                    {
                        title:
                            "Schichtplanung",

                        description:
                            "Einsätze und Arbeitszeiten planen",

                        route:
                            ROUTES.TIMES
                    }
                ]
            }
        ]
    });
}

/************************************************
 * KOMMUNIKATION
 ************************************************/

function renderCommunicationPage(state) {

    const openTickets =
        getOpenTickets(state);

    const criticalTickets =
        getCriticalTickets(state);

    return renderCompactSectionPage({
        area:
            "Kommunikation",

        title:
            state.currentUser?.role ===
            USER_ROLES.MITARBEITER
                ? "Meldungen"
                : "Tickets und Nachrichten",

        description:
            "Alle Probleme, Anfragen und Nachrichten an einem Ort.",

        color:
            "communication",

        metrics: [
            {
                label:
                    "Offen",

                value:
                    openTickets.length,

                status:
                    openTickets.length > 0
                        ? "warning"
                        : "success"
            },
            {
                label:
                    "Kritisch",

                value:
                    criticalTickets.length,

                status:
                    criticalTickets.length > 0
                        ? "critical"
                        : "success"
            },
            {
                label:
                    "Nachrichten",

                value:
                    asArray(
                        state.messages
                    ).length,

                status:
                    "info"
            },
            {
                label:
                    "Kundenanfragen",

                value:
                    asArray(
                        state.customerRequests
                    ).length,

                status:
                    "info"
            }
        ],

        groups: [
            {
                title:
                    "Neue Meldung",

                description:
                    "Problem oder Hinweis erfassen",

                color:
                    "communication",

                open:
                    true,

                items: [
                    {
                        title:
                            "Problem melden",

                        description:
                            "Schaden, Hindernis oder Reklamation"
                    },
                    {
                        title:
                            "Materialmangel melden",

                        description:
                            "Fehlendes oder knappes Material"
                    },
                    {
                        title:
                            "Sofort-Notiz",

                        description:
                            "Kurzer Hinweis mit Text, Foto oder Audio"
                    }
                ]
            },
            {
                title:
                    "Bearbeitung",

                description:
                    "Offene Vorgänge und Nachrichten",

                color:
                    "communication",

                items: [
                    {
                        title:
                            "Offene Tickets",

                        description:
                            "Aktuelle Meldungen bearbeiten"
                    },
                    {
                        title:
                            "Nachrichten",

                        description:
                            "Interne und externe Kommunikation"
                    },
                    {
                        title:
                            "Archiv",

                        description:
                            "Abgeschlossene Vorgänge"
                    }
                ]
            }
        ]
    });
}

/************************************************
 * AUFGABEN
 ************************************************/

function renderTasksPage(state) {

    const currentObject =
        state.currentObject;

    const tasks =
        currentObject
            ? asArray(state.tasks)
                .filter(
                    (task) =>
                        task.objectId ===
                            currentObject.id &&
                        task.active !== false
                )
            : [];

    const totalMinutes =
        tasks.reduce(
            (total, task) =>
                total +
                asNumber(
                    task.estimatedMinutes
                ),
            0
        );

    return renderCompactSectionPage({
        area:
            "Aufgaben",

        title:
            currentObject
                ? currentObject.name
                : "Kein Objekt ausgewählt",

        description:
            currentObject
                ? "Räume, Reihenfolge und Arbeitsschritte."
                : "Wähle zuerst ein Objekt aus.",

        color:
            "tasks",

        metrics: [
            {
                label:
                    "Aufgaben",

                value:
                    tasks.length,

                status:
                    "info"
            },
            {
                label:
                    "Sollzeit",

                value:
                    `${totalMinutes} Min.`,

                status:
                    "neutral"
            },
            {
                label:
                    "Nachweispflicht",

                value:
                    tasks.filter(
                        (task) =>
                            task.documentationRequired ===
                            true
                    ).length,

                status:
                    "warning"
            },
            {
                label:
                    "Räume",

                value:
                    currentObject
                        ? asArray(state.rooms)
                            .filter(
                                (room) =>
                                    room.objectId ===
                                    currentObject.id
                            ).length
                        : 0,

                status:
                    "info"
            }
        ],

        groups: [
            {
                title:
                    "Heutige Arbeit",

                description:
                    "Aufgaben nach Raum und Reihenfolge",

                color:
                    "tasks",

                open:
                    true,

                items: [
                    {
                        title:
                            currentObject
                                ? "Objektdetails öffnen"
                                : "Objekt auswählen",

                        description:
                            currentObject
                                ? "Räume und Aufgaben vollständig anzeigen"
                                : "Zuerst ein Arbeitsobjekt wählen",

                        route:
                            currentObject
                                ? ROUTES.OBJECT_DETAIL
                                : ROUTES.OBJECTS
                    }
                ]
            },
            {
                title:
                    "Dokumentation",

                description:
                    "Nachweise und Abweichungen",

                color:
                    "tasks",

                items: [
                    {
                        title:
                            "Aufgabenstatus",

                        description:
                            "Offen, begonnen und erledigt"
                    },
                    {
                        title:
                            "Zeitabweichung",

                        description:
                            "Begründung mit Text, Foto oder Audio"
                    }
                ]
            }
        ]
    });
}

/************************************************
 * ZEITEN
 ************************************************/

function renderTimesPage(state) {

    return renderCompactSectionPage({
        area:
            "Zeiten",

        title:
            "Arbeitszeit und Schichten",

        description:
            "Check-ins, Check-outs und Abweichungen.",

        color:
            "times",

        metrics: [
            {
                label:
                    "Schichten",

                value:
                    asArray(
                        state.shifts
                    ).length,

                status:
                    "info"
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
                    "Check-outs",

                value:
                    asArray(
                        state.checkouts
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
            }
        ],

        groups: [
            {
                title:
                    "Zeiterfassung",

                description:
                    "Schichten und Buchungen",

                color:
                    "times",

                open:
                    true,

                items: [
                    {
                        title:
                            "Schichten",

                        description:
                            "Geplante und geleistete Einsätze"
                    },
                    {
                        title:
                            "Check-ins und Check-outs",

                        description:
                            "Zeitbuchungen prüfen"
                    }
                ]
            },
            {
                title:
                    "Prüfung",

                description:
                    "Fehler und Korrekturen",

                color:
                    "times",

                items: [
                    {
                        title:
                            "Zeitabweichungen",

                        description:
                            "Auffällige Einsatzzeiten"
                    },
                    {
                        title:
                            "Unvollständige Buchungen",

                        description:
                            "Fehlende oder offene Abschlüsse"
                    }
                ]
            }
        ]
    });
}

/************************************************
 * AUSWERTUNG UND BERICHTE
 ************************************************/

function renderAnalysisPage() {

    return renderCompactSectionPage({
        area:
            "Auswertung",

        title:
            "Abrechnung und Berichte",

        description:
            "Arbeitszeiten nach Mitarbeiter, Objekt und Monat.",

        color:
            "analysis",

        groups: [
            {
                title:
                    "Abrechnung",

                description:
                    "Monatliche Auswertungen",

                color:
                    "analysis",

                open:
                    true,

                items: [
                    {
                        title:
                            "Monatsabrechnung",

                        description:
                            "Stunden nach Mitarbeiter und Monat"
                    },
                    {
                        title:
                            "Objektabrechnung",

                        description:
                            "Stunden nach Objekt und Kostenstelle"
                    },
                    {
                        title:
                            "Fahrten und Kilometer",

                        description:
                            "Vergütungsrelevante Wege"
                    }
                ]
            },
            {
                title:
                    "Export",

                description:
                    "Daten ausgeben und übergeben",

                color:
                    "analysis",

                items: [
                    {
                        title:
                            "Lohnexport",

                        description:
                            "Daten für die Abrechnung vorbereiten"
                    },
                    {
                        title:
                            "Berichtsexport",

                        description:
                            "Monats- und Objektberichte"
                    }
                ]
            }
        ]
    });
}

function renderReportsPage() {

    return renderCompactSectionPage({
        area:
            "Berichte",

        title:
            "Leistungsnachweise",

        description:
            "Freigegebene Berichte und Dokumente.",

        color:
            "reports",

        groups: [
            {
                title:
                    "Objektberichte",

                description:
                    "Leistung und Reinigungsstatus",

                color:
                    "reports",

                open:
                    true,

                items: [
                    {
                        title:
                            "Leistungsnachweise",

                        description:
                            "Freigegebene Reinigungsnachweise"
                    },
                    {
                        title:
                            "Objektstatus",

                        description:
                            "Aktuelle und vergangene Leistungen"
                    }
                ]
            },
            {
                title:
                    "Dokumente",

                description:
                    "Freigegebene Unterlagen",

                color:
                    "reports",

                items: [
                    {
                        title:
                            "Dokumentenübersicht",

                        description:
                            "Verträge und Nachweise"
                    }
                ]
            }
        ]
    });
}

/************************************************
 * MEHR
 ************************************************/

function createLogoutGroup() {

    return {
        title:
            "Sitzung",

        description:
            "Anmeldung und Benutzerkonto",

        color:
            "more",

        open:
            true,

        items: [
            {
                title:
                    "Abmelden",

                description:
                    "Facility OS verlassen und zur Anmeldung zurückkehren",

                action:
                    "logout",

                color:
                    "more"
            }
        ]
    };
}

function getMoreGroups(state) {

    const role =
        state.currentUser?.role;

    if (
        role ===
        USER_ROLES.MITARBEITER
    ) {

        return [
            {
                title:
                    "Persönlich",

                description:
                    "Zeiten, Urlaub und Profil",

                color:
                    "more",

                open:
                    true,

                items: [
                    {
                        title:
                            "Meine Arbeitszeiten",

                        description:
                            "Persönliche Schichten und Stunden",

                        route:
                            ROUTES.TIMES
                    },
                    {
                        title:
                            "Krankheit und Urlaub",

                        description:
                            "Abwesenheit melden oder Urlaub beantragen",

                        route:
                            ROUTES.COMMUNICATION
                    },
                    {
                        title:
                            "Profil",

                        description:
                            "Persönliche Angaben"
                    }
                ]
            },
            {
                title:
                    "Hilfe und App",

                description:
                    "Unterstützung und rechtliche Hinweise",

                color:
                    "more",

                items: [
                    {
                        title:
                            "Hilfe",

                        description:
                            "Anleitungen und häufige Fragen",

                        route:
                            ROUTES.HELP
                    },
                    {
                        title:
                            "Datenschutz",

                        description:
                            "Datenschutzinformationen",

                        route:
                            ROUTES.PRIVACY
                    },
                    {
                        title:
                            "Impressum",

                        description:
                            "Anbieterinformationen",

                        route:
                            ROUTES.IMPRINT
                    }
                ]
            },
            createLogoutGroup()
        ];
    }

    if (
        role ===
        USER_ROLES.KUNDE
    ) {

        return [
            {
                title:
                    "Kontakt und Profil",

                description:
                    "Ansprechpartner und persönliche Angaben",

                color:
                    "more",

                open:
                    true,

                items: [
                    {
                        title:
                            "Ansprechpartner",

                        description:
                            "Zuständige Objektleitung"
                    },
                    {
                        title:
                            "Profil",

                        description:
                            "Kundendaten und Kontakt"
                    },
                    {
                        title:
                            "Hilfe",

                        description:
                            "Unterstützung und häufige Fragen",

                        route:
                            ROUTES.HELP
                    }
                ]
            },
            {
                title:
                    "Rechtliches",

                description:
                    "Datenschutz und Impressum",

                color:
                    "more",

                items: [
                    {
                        title:
                            "Datenschutz",

                        description:
                            "Hinweise zur Datenverarbeitung",

                        route:
                            ROUTES.PRIVACY
                    },
                    {
                        title:
                            "Impressum",

                        description:
                            "Anbieterinformationen",

                        route:
                            ROUTES.IMPRINT
                    }
                ]
            },
            createLogoutGroup()
        ];
    }

    if (
        role ===
        USER_ROLES.BUCHHALTUNG
    ) {

        return [
            {
                title:
                    "Berichte und Archiv",

                description:
                    "Auswertungen und abgeschlossene Zeiträume",

                color:
                    "more",

                open:
                    true,

                items: [
                    {
                        title:
                            "Berichte",

                        description:
                            "Zeit- und Objektberichte",

                        route:
                            ROUTES.REPORTS
                    },
                    {
                        title:
                            "Archiv",

                        description:
                            "Abgeschlossene Abrechnungszeiträume"
                    }
                ]
            },
            {
                title:
                    "Hilfe und Rechtliches",

                description:
                    "Support und Pflichtinformationen",

                color:
                    "more",

                items: [
                    {
                        title:
                            "Hilfe",

                        description:
                            "Anleitungen und häufige Fragen",

                        route:
                            ROUTES.HELP
                    },
                    {
                        title:
                            "Datenschutz",

                        description:
                            "Datenschutzinformationen",

                        route:
                            ROUTES.PRIVACY
                    },
                    {
                        title:
                            "Impressum",

                        description:
                            "Anbieterinformationen",

                        route:
                            ROUTES.IMPRINT
                    }
                ]
            },
            createLogoutGroup()
        ];
    }

    return [
        {
            title:
                "Auswertung",

            description:
                "Berichte und Zeiterfassung",

            color:
                "more",

            open:
                true,

            items: [
                {
                    title:
                        "Berichte",

                    description:
                        "Zeiten, Leistung und Abweichungen",

                    route:
                        ROUTES.REPORTS
                },
                {
                    title:
                        "Zeiterfassung",

                    description:
                        "Schichten und Zeitbuchungen",

                    route:
                        ROUTES.TIMES
                }
            ]
        },
        {
            title:
                "Administration",

            description:
                "System, Rollen und Einstellungen",

            color:
                "more",

            items: [
                {
                    title:
                        "Einstellungen",

                    description:
                        "Unternehmen, Objekte und Prozesse",

                    route:
                        ROUTES.SETTINGS
                },
                {
                    title:
                        "Rollen und Rechte",

                    description:
                        "Zugriffssteuerung"
                },
                {
                    title:
                        "Tarife und Module",

                    description:
                        "Free, Pro und Pro Plus"
                }
            ]
        },
        {
            title:
                "Hilfe und Rechtliches",

            description:
                "Support und Pflichtinformationen",

            color:
                "more",

            items: [
                {
                    title:
                        "Hilfe",

                    description:
                        "Anleitungen und häufige Fragen",

                    route:
                        ROUTES.HELP
                },
                {
                    title:
                        "Datenschutz",

                    description:
                        "Datenschutzinformationen",

                    route:
                        ROUTES.PRIVACY
                },
                {
                    title:
                        "Impressum",

                    description:
                        "Anbieterinformationen",

                    route:
                        ROUTES.IMPRINT
                }
            ]
        },
        createLogoutGroup()
    ];
}

function renderMorePage(state) {

    return renderCompactSectionPage({
        area:
            "Mehr",

        title:
            "Weitere Funktionen",

        description:
            `${getUserName(state)} · ${getRoleLabel(
                state.currentUser?.role
            )}`,

        color:
            "more",

        groups:
            getMoreGroups(
                state
            )
    });
}

/************************************************
 * EINFACHE INFORMATIONEN
 ************************************************/

function renderInformationPage({
    title,
    description
}) {

    return `
        <section class="page-section">

            ${renderPageHeader({
                area:
                    "Facility OS",

                title,

                description,

                color:
                    "more"
            })}

            <section class="information-card">

                <p>
                    ${escapeHtml(
                        description
                    )}
                </p>

            </section>

        </section>
    `;
}

/************************************************
 * ROUTEN
 ************************************************/

function renderRoute(
    route,
    state
) {

    if (!state.currentUser) {

        return renderLogin();
    }

    switch (route) {

        case ROUTES.OVERVIEW:

            return renderOverview(
                state
            );

        case ROUTES.OBJECTS:

            return renderObjectsPage(
                state
            );

        case ROUTES.OBJECT_DETAIL:

            return renderObjectDetailPage(
                state
            );

        case ROUTES.TASKS:

            return renderTasksPage(
                state
            );

        case ROUTES.PERSONNEL:

            return renderPersonnelPage(
                state
            );

        case ROUTES.COMMUNICATION:

            return renderCommunicationPage(
                state
            );

        case ROUTES.TIMES:

            return renderTimesPage(
                state
            );

        case ROUTES.ANALYSIS:

            return renderAnalysisPage();

        case ROUTES.REPORTS:

            return renderReportsPage();

        case ROUTES.MORE:

            return renderMorePage(
                state
            );

        case ROUTES.SETTINGS:

            return renderCompactSectionPage({
                area:
                    "Einstellungen",

                title:
                    "System und Prozesse",

                description:
                    "Unternehmen, Objekte, Rollen und Darstellung.",

                color:
                    "more",

                groups: [
                    {
                        title:
                            "Unternehmen",

                        description:
                            "Stammdaten und Design",

                        color:
                            "more",

                        open:
                            true,

                        items: [
                            {
                                title:
                                    "Unternehmensdaten",

                                description:
                                    "Name, Kontakt und Anbieterinformationen"
                            },
                            {
                                title:
                                    "Design",

                                description:
                                    "Farben und Darstellung"
                            }
                        ]
                    },
                    {
                        title:
                            "Prozesse",

                        description:
                            "Check-in, Check-out und Benachrichtigungen",

                        color:
                            "more",

                        items: [
                            {
                                title:
                                    "Objekteinstellungen",

                                description:
                                    "Pflichtprüfungen und Sicherheitsvorgaben"
                            },
                            {
                                title:
                                    "Benachrichtigungen",

                                description:
                                    "Hinweise, Warnungen und Erinnerungen"
                            }
                        ]
                    }
                ]
            });

        case ROUTES.HELP:

            return renderInformationPage({
                title:
                    "Hilfe",

                description:
                    "Hier werden Anleitungen, häufige Fragen und Kontaktmöglichkeiten bereitgestellt."
            });

        case ROUTES.PRIVACY:

            return renderInformationPage({
                title:
                    "Datenschutz",

                description:
                    "Hier werden die Datenschutzinformationen von Facility OS angezeigt."
            });

        case ROUTES.IMPRINT:

            return renderInformationPage({
                title:
                    "Impressum",

                description:
                    "Hier werden Anbieter-, Unternehmens- und Kontaktinformationen angezeigt."
            });

        default:

            return renderOverview(
                state
            );
    }
}

/************************************************
 * EVENTS
 ************************************************/

function bindRouteEvents(
    appElement,
    onNavigate
) {

    if (
        typeof onNavigate !==
        "function"
    ) {

        return;
    }

    appElement
        .querySelectorAll(
            "[data-route]"
        )
        .forEach(
            (element) => {

                element.addEventListener(
                    "click",
                    () => {

                        const route =
                            element.dataset.route;

                        if (route) {

                            onNavigate(
                                route
                            );
                        }
                    }
                );
            }
        );
}

function bindActionEvents(
    appElement,
    action,
    handler
) {

    if (
        typeof handler !==
        "function"
    ) {

        return;
    }

    appElement
        .querySelectorAll(
            `[data-action="${action}"]`
        )
        .forEach(
            (element) => {

                element.addEventListener(
                    "click",
                    handler
                );
            }
        );
}

function bindObjectSelection(
    appElement,
    onSelectObject
) {

    if (
        typeof onSelectObject !==
        "function"
    ) {

        return;
    }

    appElement
        .querySelectorAll(
            '[data-action="select-object"]'
        )
        .forEach(
            (button) => {

                button.addEventListener(
                    "click",
                    () => {

                        const objectId =
                            button.dataset.objectId;

                        if (objectId) {

                            onSelectObject(
                                objectId
                            );
                        }
                    }
                );
            }
        );
}

function bindLoginForm(onLogin) {

    if (
        typeof onLogin !==
        "function"
    ) {

        return;
    }

    const form =
        document.getElementById(
            "test-login-form"
        );

    if (!form) {
        return;
    }

    form.addEventListener(
        "submit",
        (event) => {

            event.preventDefault();

            const formData =
                new FormData(form);

            onLogin({
                name:
                    String(
                        formData.get(
                            "name"
                        ) ?? ""
                    ).trim(),

                role:
                    String(
                        formData.get(
                            "role"
                        ) ?? ""
                    ).trim()
            });
        }
    );
}

/************************************************
 * HAUPTFUNKTION
 ************************************************/

export function renderApp({
    route,
    state,
    onNavigate,
    onLogin,
    onLogout,
    onCheckin,
    onCheckout,
    onSelectObject
}) {

    const appElement =
        document.getElementById(
            "app"
        );

    if (!appElement) {

        throw new Error(
            "Das HTML-Element #app wurde nicht gefunden."
        );
    }

    const loggedIn =
        Boolean(
            state.currentUser
        );

    appElement.innerHTML =
        loggedIn
            ? `
                <div class="app-shell">

                    ${renderHeader(
                        state
                    )}

                    <main class="app-content">

                        ${renderRoute(
                            route,
                            state
                        )}

                    </main>

                    ${renderNavigation(
                        state,
                        route
                    )}

                </div>
            `
            : renderLogin();

    bindRouteEvents(
        appElement,
        onNavigate
    );

    bindObjectSelection(
        appElement,
        onSelectObject
    );

    bindLoginForm(
        onLogin
    );

    bindActionEvents(
        appElement,
        "logout",
        onLogout
    );

    bindActionEvents(
        appElement,
        "checkin",
        onCheckin
    );

    bindActionEvents(
        appElement,
        "checkout",
        onCheckout
    );
}