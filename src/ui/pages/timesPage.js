import {
    getTimesheets
} from "../../services/timesheetWorkflowService.js";

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();
const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "â";
    }

    return new Intl.DateTimeFormat("de-DE", {
        dateStyle: "short",
        timeStyle: "short"
    }).format(date);
}

function formatDuration(minutes) {
    const total = Number(minutes ?? 0);
    const hours = Math.floor(total / 60);
    const rest = total % 60;
    return `${hours} Std. ${rest} Min.`;
}

function statusText(status) {
    return ({
        PENDING_MANAGER: "Wartet auf Objektleiter",
        APPROVED_MANAGER: "Vom Objektleiter freigegeben",
        REJECTED_MANAGER: "Vom Objektleiter abgelehnt",
        RECEIVED_ACCOUNTING: "Bei Buchhaltung eingegangen"
    }[txt(status).toUpperCase()] ?? "Offen");
}

function visibleTimesheets(state, role) {
    const all = getTimesheets(state);
    const userId = txt(
        state?.currentUser?.id ??
        state?.currentUser?.userId
    );

    if (role === "MITARBEITER") {
        return all.filter((entry) =>
            txt(entry?.employeeId ?? entry?.userId) === userId
        );
    }

    if (role === "OBJEKTLEITER") {
        const ids = arr(
            state?.currentUser?.assignedObjectIds ??
            state?.currentUser?.objectIds ??
            state?.currentUser?.managedObjectIds
        ).map(String);

        return ids.length
            ? all.filter((entry) =>
                ids.includes(txt(entry?.objectId))
            )
            : all;
    }

    if (role === "BUCHHALTUNG") {
        return all.filter((entry) =>
            [
                "APPROVED_MANAGER",
                "RECEIVED_ACCOUNTING"
            ].includes(txt(entry?.status).toUpperCase())
        );
    }

    return all;
}

function actionButtons(entry, role) {
    const status = txt(entry?.status).toUpperCase();

    if (
        role === "OBJEKTLEITER" &&
        status === "PENDING_MANAGER"
    ) {
        return `
            <div class="timesheet-actions">
                <button
                    class="primary"
                    data-timesheet-action="APPROVE_MANAGER"
                    data-timesheet-id="${esc(entry.id)}"
                    type="button"
                >
                    Freigeben
                </button>

                <button
                    class="secondary"
                    data-timesheet-action="REJECT_MANAGER"
                    data-timesheet-id="${esc(entry.id)}"
                    type="button"
                >
                    Ablehnen
                </button>
            </div>
        `;
    }

    if (
        role === "BUCHHALTUNG" &&
        status === "APPROVED_MANAGER"
    ) {
        return `
            <div class="timesheet-actions">
                <button
                    class="primary"
                    data-timesheet-action="RECEIVE_ACCOUNTING"
                    data-timesheet-id="${esc(entry.id)}"
                    type="button"
                >
                    Eingang best&auml;tigen
                </button>
            </div>
        `;
    }

    return "";
}

export function renderTimesPage(state = {}) {
    const role = txt(state?.currentUser?.role).toUpperCase();
    const entries = visibleTimesheets(state, role);

    const pending = entries.filter((entry) =>
        txt(entry?.status).toUpperCase() === "PENDING_MANAGER"
    ).length;

    const approved = entries.filter((entry) =>
        txt(entry?.status).toUpperCase() === "APPROVED_MANAGER"
    ).length;

    return `
        <section class="content-page times-page">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">ARBEITSZEIT-WORKFLOW</span>
                    <h1>Stundenzettel</h1>
                    <p>
                        Schichtabschluss, Freigabe durch den Objektleiter
                        und Weiterleitung an die Buchhaltung.
                    </p>
                </div>
            </header>

            <section class="object-summary-grid">
                <article>
                    <small>Gesamt</small>
                    <strong>${entries.length}</strong>
                </article>
                <article>
                    <small>Objektleiter offen</small>
                    <strong>${pending}</strong>
                </article>
                <article>
                    <small>Buchhaltung bereit</small>
                    <strong>${approved}</strong>
                </article>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Stundenzettel</h2>
                        <p>
                            Jeder abgeschlossene Check-out erzeugt automatisch
                            einen Stundenzettel.
                        </p>
                    </div>
                </div>

                <div class="timesheet-list">
                    ${entries.length
                        ? entries.map((entry) => `
                            <article class="timesheet-card">
                                <div class="timesheet-card-head">
                                    <div>
                                        <strong>${esc(entry?.employeeName ?? "Mitarbeiter")}</strong>
                                        <small>${esc(entry?.objectName ?? "Objekt")}</small>
                                    </div>

                                    <span class="timesheet-status">
                                        ${statusText(entry?.status)}
                                    </span>
                                </div>

                                <dl class="timesheet-data">
                                    <div>
                                        <dt>Beginn</dt>
                                        <dd>${formatDate(entry?.startTime)}</dd>
                                    </div>
                                    <div>
                                        <dt>Ende</dt>
                                        <dd>${formatDate(entry?.endTime)}</dd>
                                    </div>
                                    <div>
                                        <dt>Dauer</dt>
                                        <dd>${formatDuration(entry?.durationMinutes)}</dd>
                                    </div>
                                </dl>

                                ${actionButtons(entry, role)}
                            </article>
                        `).join("")
                        : `
                            <div class="empty-state">
                                Noch keine Stundenzettel vorhanden.
                                Beende als Mitarbeiter eine Schicht, damit
                                automatisch der erste Stundenzettel entsteht.
                            </div>
                        `
                    }
                </div>
            </section>
        </section>
    `;
}