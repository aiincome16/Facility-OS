/************************************************
 * Facility OS
 * overviewPage.js
 *
 * Rollenabhängige Startseite
 * Schwerpunkt:
 * - Mitarbeiter-Dashboard
 * - kompakte Schichtkarte
 * - farbiges Funktionsraster
 * - genau ein Icon pro Kachel
 ************************************************/

import {
    ROUTES
} from "../../router.js";

import {
    renderModuleCard
} from "../components/moduleCard.js";

/************************************************
 * BASISHELFER
 ************************************************/

function asArray(value) {
    return Array.isArray(value) ? value : [];
}

function normalizeText(value) {
    return String(value ?? "").trim();
}

function normalizeRole(value) {
    return normalizeText(value).toUpperCase();
}

function escapeHtml(value) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getUserName(user) {
    return normalizeText(
        user?.firstName ??
        user?.displayName ??
        user?.fullName ??
        user?.name
    ) || "Benutzer";
}

function getFirstName(user) {
    const name =
        getUserName(user);

    return (
        name.split(/\s+/)[0] ||
        name
    );
}

function getObjectName(object) {
    return normalizeText(
        object?.name ??
        object?.objectName ??
        object?.Name ??
        object?.Objekt_Name
    ) || "Kein Objekt ausgewählt";
}

function formatTime(value) {
    if (!value) {
        return "--:--";
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "--:--";
    }

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

function formatDate(value = new Date()) {
    const date =
        value instanceof Date
            ? value
            : new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return "";
    }

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
    ).format(date);
}

/************************************************
 * DATEN AUSWERTEN
 ************************************************/

function getOpenTasks(state) {
    const currentObjectId =
        state?.currentObject?.id;

    return asArray(
        state?.tasks
    ).filter(
        (task) => {
            const status =
                normalizeRole(
                    task?.status
                );

            const matchesObject =
                !currentObjectId ||
                task?.objectId ===
                    currentObjectId;

            const isOpen =
                ![
                    "DONE",
                    "COMPLETED",
                    "FINISHED",
                    "CANCELLED"
                ].includes(status);

            return (
                matchesObject &&
                isOpen
            );
        }
    );
}

function getOpenMessages(state) {
    const currentObjectId =
        state?.currentObject?.id;

    return asArray(
        state?.tickets
    ).filter(
        (ticket) => {
            const status =
                normalizeRole(
                    ticket?.status
                );

            const matchesObject =
                !currentObjectId ||
                ticket?.objectId ===
                    currentObjectId;

            const isOpen =
                ![
                    "DONE",
                    "COMPLETED",
                    "CLOSED",
                    "CANCELLED"
                ].includes(status);

            return (
                matchesObject &&
                isOpen
            );
        }
    );
}

function getCompletedTasks(state) {
    const currentObjectId =
        state?.currentObject?.id;

    return asArray(
        state?.tasks
    ).filter(
        (task) => {
            const status =
                normalizeRole(
                    task?.status
                );

            const matchesObject =
                !currentObjectId ||
                task?.objectId ===
                    currentObjectId;

            return (
                matchesObject &&
                [
                    "DONE",
                    "COMPLETED",
                    "FINISHED"
                ].includes(status)
            );
        }
    );
}

/************************************************
 * SCHICHTKARTE
 ************************************************/

function renderShiftCard(state) {
    const running =
        state?.shiftStarted === true &&
        Boolean(
            state?.currentShift
        );

    const objectSelected =
        Boolean(
            state?.currentObject
        );

    if (running) {
        return `
            <section class="fo-shift-card fo-shift-card-running">

                <div class="fo-shift-card-header">

                    <span class="fo-shift-status">
                        <span class="fo-shift-status-dot"></span>
                        Schicht läuft
                    </span>

                    <span class="fo-shift-time">
                        Seit ${escapeHtml(
                            formatTime(
                                state.currentShift
                                    ?.startTime
                            )
                        )}
                    </span>

                </div>

                <div class="fo-shift-card-body">

                    <div class="fo-shift-icon">
                        <svg
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                        >
                            <circle
                                cx="12"
                                cy="12"
                                r="8.5"
                            ></circle>

                            <path
                                d="M12 7.5V12l3.2 2"
                            ></path>
                        </svg>
                    </div>

                    <div class="fo-shift-copy">

                        <strong>
                            ${escapeHtml(
                                getObjectName(
                                    state.currentObject
                                )
                            )}
                        </strong>

                        <span>
                            Arbeitszeit wird erfasst
                        </span>

                    </div>

                </div>

                <button
                    type="button"
                    class="fo-shift-button fo-shift-button-stop"
                    data-action="checkout"
                >
                    Schicht beenden
                </button>

            </section>
        `;
    }

    return `
        <section class="fo-shift-card fo-shift-card-ready">

            <div class="fo-shift-card-header">

                <span class="fo-shift-status">
                    Bereit zum Start
                </span>

                <span class="fo-shift-time">
                    ${escapeHtml(
                        formatDate()
                    )}
                </span>

            </div>

            <div class="fo-shift-card-body">

                <div class="fo-shift-icon">
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                    >
                        <circle
                            cx="12"
                            cy="12"
                            r="8.5"
                        ></circle>

                        <path
                            d="M12 7.5V12l3.2 2"
                        ></path>
                    </svg>
                </div>

                <div class="fo-shift-copy">

                    <strong>
                        ${
                            objectSelected
                                ? escapeHtml(
                                    getObjectName(
                                        state.currentObject
                                    )
                                )
                                : "Zuerst Objekt auswählen"
                        }
                    </strong>

                    <span>
                        ${
                            objectSelected
                                ? "Schicht starten und Arbeitszeit erfassen"
                                : "Für den Check-in wird ein Objekt benötigt"
                        }
                    </span>

                </div>

            </div>

            ${
                objectSelected
                    ? `
                        <button
                            type="button"
                            class="fo-shift-button"
                            data-action="checkin"
                        >
                            Jetzt einchecken
                        </button>
                    `
                    : `
                        <button
                            type="button"
                            class="fo-shift-button"
                            data-route="${escapeHtml(
                                ROUTES.OBJECTS
                            )}"
                        >
                            Objekt auswählen
                        </button>
                    `
            }

        </section>
    `;
}

/************************************************
 * MITARBEITER-DASHBOARD
 ************************************************/

function renderEmployeeOverview(state) {
    const user =
        state?.currentUser;

    const openTasks =
        getOpenTasks(state);

    const completedTasks =
        getCompletedTasks(state);

    const openMessages =
        getOpenMessages(state);

    return `
        <section class="fo-overview">

            <header class="fo-overview-welcome">

                <div>
                    <span class="fo-overview-eyebrow">
                        Mein Arbeitstag
                    </span>

                    <h1>
                        Hallo, ${escapeHtml(
                            getFirstName(user)
                        )}
                    </h1>

                    <p>
                        ${
                            state?.currentObject
                                ? `
                                    Einsatz:
                                    <strong>
                                        ${escapeHtml(
                                            getObjectName(
                                                state.currentObject
                                            )
                                        )}
                                    </strong>
                                `
                                : "Wähle dein heutiges Objekt aus."
                        }
                    </p>
                </div>

                <div
                    class="fo-user-avatar"
                    aria-hidden="true"
                >
                    ${escapeHtml(
                        getFirstName(user)
                            .slice(0, 1)
                            .toUpperCase()
                    )}
                </div>

            </header>

            ${renderShiftCard(state)}

            <section class="fo-dashboard-section">

                <div class="fo-section-heading">

                    <div>
                        <span>
                            Heute
                        </span>

                        <h2>
                            Deine Bereiche
                        </h2>
                    </div>

                    <span class="fo-section-date">
                        ${escapeHtml(
                            formatDate()
                        )}
                    </span>

                </div>

                <div class="fo-module-grid">

                    ${renderModuleCard({
                        title:
                            "Mein Objekt",

                        description:
                            state?.currentObject
                                ? getObjectName(
                                    state.currentObject
                                )
                                : "Objekt auswählen",

                        icon:
                            "building",

                        tone:
                            "blue",

                        route:
                            ROUTES.OBJECTS
                    })}

                    ${renderModuleCard({
                        title:
                            "Aufgaben",

                        description:
                            `${openTasks.length} offen · ${completedTasks.length} erledigt`,

                        icon:
                            "tasks",

                        tone:
                            "green",

                        route:
                            ROUTES.TASKS,

                        badge:
                            String(
                                openTasks.length
                            )
                    })}

                    ${renderModuleCard({
                        title:
                            "Meldungen",

                        description:
                            openMessages.length > 0
                                ? `${openMessages.length} offen`
                                : "Keine offenen Meldungen",

                        icon:
                            "message",

                        tone:
                            "orange",

                        route:
                            ROUTES.COMMUNICATION,

                        badge:
                            String(
                                openMessages.length
                            )
                    })}

                    ${renderModuleCard({
                        title:
                            "Objekt-Guide",

                        description:
                            "Anleitung und Sicherheit",

                        icon:
                            "guide",

                        tone:
                            "purple",

                        route:
                            ROUTES.OBJECT_DETAIL
                    })}

                </div>

            </section>

            <section class="fo-dashboard-section">

                <div class="fo-section-heading">

                    <div>
                        <span>
                            Direkt öffnen
                        </span>

                        <h2>
                            Schnellzugriff
                        </h2>
                    </div>

                </div>

                <div class="fo-module-grid fo-module-grid-secondary">

                    ${renderModuleCard({
                        title:
                            "Material",

                        description:
                            "Bestand und Bedarf",

                        icon:
                            "material",

                        tone:
                            "yellow",

                        route:
                            ROUTES.MATERIALS
                    })}

                    ${renderModuleCard({
                        title:
                            "Zeiten",

                        description:
                            "Arbeitszeiten ansehen",

                        icon:
                            "calendar",

                        tone:
                            "blue",

                        route:
                            ROUTES.TIMES
                    })}

                    ${renderModuleCard({
                        title:
                            "Hilfe",

                        description:
                            "Anleitung und Kontakt",

                        icon:
                            "help",

                        tone:
                            "green",

                        route:
                            ROUTES.HELP
                    })}

                    ${renderModuleCard({
                        title:
                            "Mehr",

                        description:
                            "Urlaub, Profil und Einstellungen",

                        icon:
                            "more",

                        tone:
                            "purple",

                        route:
                            ROUTES.MORE
                    })}

                </div>

            </section>

        </section>
    `;
}

/************************************************
 * ANDERE ROLLEN
 ************************************************/

function renderManagementOverview(state) {
    const role =
        normalizeRole(
            state?.currentUser?.role
        );

    return `
        <section class="fo-overview">

            <header class="fo-overview-welcome">

                <div>
                    <span class="fo-overview-eyebrow">
                        Facility OS
                    </span>

                    <h1>
                        Hallo, ${escapeHtml(
                            getFirstName(
                                state?.currentUser
                            )
                        )}
                    </h1>

                    <p>
                        ${
                            role === "KUNDE"
                                ? "Übersicht über deine freigegebenen Objekte."
                                : "Zentrale Übersicht für deinen Arbeitsbereich."
                        }
                    </p>
                </div>

                <div
                    class="fo-user-avatar"
                    aria-hidden="true"
                >
                    ${escapeHtml(
                        getFirstName(
                            state?.currentUser
                        )
                            .slice(0, 1)
                            .toUpperCase()
                    )}
                </div>

            </header>

            <section class="fo-dashboard-section">

                <div class="fo-section-heading">

                    <div>
                        <span>
                            Übersicht
                        </span>

                        <h2>
                            Hauptbereiche
                        </h2>
                    </div>

                </div>

                <div class="fo-module-grid">

                    ${renderModuleCard({
                        title:
                            "Objekte",

                        description:
                            `${asArray(
                                state?.objects
                            ).length} vorhanden`,

                        icon:
                            "building",

                        tone:
                            "blue",

                        route:
                            ROUTES.OBJECTS
                    })}

                    ${renderModuleCard({
                        title:
                            "Meldungen",

                        description:
                            "Tickets und Kommunikation",

                        icon:
                            "message",

                        tone:
                            "orange",

                        route:
                            ROUTES.COMMUNICATION
                    })}

                    ${renderModuleCard({
                        title:
                            "Berichte",

                        description:
                            "Auswertungen öffnen",

                        icon:
                            "tasks",

                        tone:
                            "green",

                        route:
                            ROUTES.REPORTS
                    })}

                    ${renderModuleCard({
                        title:
                            "Mehr",

                        description:
                            "Weitere Funktionen",

                        icon:
                            "more",

                        tone:
                            "purple",

                        route:
                            ROUTES.MORE
                    })}

                </div>

            </section>

        </section>
    `;
}

/************************************************
 * HAUPTFUNKTION
 ************************************************/

export function renderOverviewPage({
    state
}) {
    const role =
        normalizeRole(
            state?.currentUser?.role
        );

    if (
        role ===
        "MITARBEITER"
    ) {
        return renderEmployeeOverview(
            state
        );
    }

    return renderManagementOverview(
        state
    );
}

export function renderOverview(payload) {
    return renderOverviewPage(
        payload
    );
}

export function renderEmployeeDashboard(payload) {
    return renderOverviewPage(
        payload
    );
}