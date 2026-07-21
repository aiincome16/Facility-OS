import { ROUTES } from "../../../router.js";

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();
const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const objectId = (object) => txt(
    object?.id ??
    object?.objectId ??
    object?.ID
);

const objectName = (object) => txt(
    object?.name ??
    object?.objectName ??
    object?.Name ??
    object?.Objekt_Name
) || "Objekt";

function assignedObjects(state) {
    const user = state?.currentUser ?? {};
    const userId = txt(user?.id ?? user?.userId);
    const ids = arr(
        user?.assignedObjectIds ??
        user?.objectIds
    ).map(String);

    const allObjects = arr(state?.objects)
        .filter((object) => object?.active !== false);

    const assigned = allObjects.filter((object) =>
        ids.includes(objectId(object)) ||
        arr(
            object?.assignedEmployeeIds ??
            object?.employeeIds ??
            object?.assignedUserIds
        ).map(String).includes(userId)
    );

    return assigned.length ? assigned : allObjects;
}

function runningShift(state) {
    const userId = txt(
        state?.currentUser?.id ??
        state?.currentUser?.userId
    );

    if (
        state?.currentShift &&
        [
            state.currentShift.userId,
            state.currentShift.employeeId
        ].map(String).includes(userId)
    ) {
        return state.currentShift;
    }

    return arr(state?.shifts).find((shift) => {
        const status = txt(shift?.status).toUpperCase();
        const belongsToUser = [
            shift?.userId,
            shift?.employeeId
        ].map(String).includes(userId);

        const active =
            ["RUNNING", "ACTIVE"].includes(status) ||
            (
                Boolean(
                    shift?.startTime ??
                    shift?.checkinTime
                ) &&
                !Boolean(
                    shift?.endTime ??
                    shift?.checkoutTime
                ) &&
                ![
                    "FINISHED",
                    "COMPLETED",
                    "CANCELLED"
                ].includes(status)
            );

        return belongsToUser && active;
    }) ?? null;
}

function isToday(value) {
    const date = new Date(value);
    const today = new Date();

    return (
        !Number.isNaN(date.getTime()) &&
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}

function durationMs(shift) {
    const start = new Date(
        shift?.startTime ??
        shift?.checkinTime ??
        ""
    );

    const end = new Date(
        shift?.endTime ??
        shift?.checkoutTime ??
        Date.now()
    );

    if (
        Number.isNaN(start.getTime()) ||
        Number.isNaN(end.getTime())
    ) {
        return 0;
    }

    return Math.max(
        0,
        end.getTime() - start.getTime()
    );
}

function formatDuration(milliseconds) {
    const totalMinutes = Math.floor(milliseconds / 60000);
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return hours
        ? `${hours} Std. ${minutes} Min.`
        : `${minutes} Min.`;
}

function formatTime(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "--:--";
    }

    return new Intl.DateTimeFormat("de-DE", {
        hour: "2-digit",
        minute: "2-digit"
    }).format(date);
}

function icon(name) {
    return ({
        clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
        building: '<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
        tasks: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
        message: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
        box: '<svg viewBox="0 0 24 24"><path d="M4 7 12 3l8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
        arrow: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
        play: '<svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z"/></svg>',
        stop: '<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>'
    }[name] ?? "");
}

export function renderEmployeeDashboard(state = {}) {
    const user = state?.currentUser ?? {};
    const firstName = txt(
        user?.firstName ??
        user?.name ??
        user?.displayName ??
        user?.email
    ).split(/\s+/)[0] || "Mitarbeiter";

    const objects = assignedObjects(state);
    const shift = runningShift(state);
    const objectIds = objects.map(objectId);

    const todayShifts = arr(state?.shifts)
        .filter((entry) =>
            [
                entry?.userId,
                entry?.employeeId
            ].map(String).includes(
                txt(user?.id ?? user?.userId)
            )
        )
        .filter((entry) =>
            isToday(
                entry?.startTime ??
                entry?.checkinTime
            )
        )
        .sort((a, b) =>
            String(
                b?.startTime ??
                b?.checkinTime ??
                ""
            ).localeCompare(
                String(
                    a?.startTime ??
                    a?.checkinTime ??
                    ""
                )
            )
        );

    const completedTodayMs = todayShifts
        .filter((entry) =>
            Boolean(
                entry?.endTime ??
                entry?.checkoutTime
            )
        )
        .reduce(
            (total, entry) =>
                total + durationMs(entry),
            0
        );

    const openTasks = arr(state?.tasks).filter((task) =>
        objectIds.includes(txt(task?.objectId)) &&
        ![
            "DONE",
            "COMPLETED",
            "ERLEDIGT"
        ].includes(txt(task?.status).toUpperCase())
    ).length;

    const openMessages = [
        ...arr(state?.tickets),
        ...arr(state?.notifications),
        ...arr(state?.messages)
    ].filter((entry) =>
        (
            !entry?.objectId ||
            objectIds.includes(txt(entry?.objectId))
        ) &&
        ![
            "DONE",
            "CLOSED",
            "COMPLETED",
            "ERLEDIGT"
        ].includes(txt(entry?.status).toUpperCase())
    ).length;

    return `
        <section class="role-dashboard">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">MITARBEITER</span>
                    <h1>&Uuml;bersicht</h1>
                    <p>Willkommen zur&uuml;ck, ${esc(firstName)}.</p>
                </div>
            </header>

            <section class="employee-time-card">
                <div class="employee-time-copy">
                    <span class="card-icon tone-blue">
                        ${icon("clock")}
                    </span>

                    <div>
                        <small>
                            ${shift
                                ? "Laufende Arbeitszeit"
                                : "Heute gearbeitet"
                            }
                        </small>

                        ${shift
                            ? `
                                <strong
                                    id="employee-live-timer"
                                    data-start-time="${esc(
                                        shift?.startTime ??
                                        shift?.checkinTime ??
                                        ""
                                    )}"
                                >
                                    00:00:00
                                </strong>

                                <span>
                                    Beginn:
                                    ${formatTime(
                                        shift?.startTime ??
                                        shift?.checkinTime
                                    )} Uhr
                                    &middot;
                                    ${esc(
                                        shift?.objectName ??
                                        objectName(
                                            state?.currentObject
                                        )
                                    )}
                                </span>
                            `
                            : `
                                <strong>
                                    ${formatDuration(completedTodayMs)}
                                </strong>
                                <span>
                                    ${todayShifts.length
                                        ? "Arbeitszeit f&uuml;r heute erfasst"
                                        : "Noch keine Schicht gestartet"
                                    }
                                </span>
                            `
                        }
                    </div>
                </div>

                <button
                    class="shift-button ${shift ? "danger" : "success"}"
                    data-action="${shift ? "checkout" : "checkin"}"
                    type="button"
                >
                    <span>
                        ${icon(shift ? "stop" : "play")}
                    </span>

                    ${shift
                        ? "Schicht beenden"
                        : "Schicht starten"
                    }
                </button>
            </section>

            <section class="dashboard-metrics">
                <button
                    class="metric-card"
                    data-route="${ROUTES.TASKS}"
                    type="button"
                >
                    <span class="card-icon tone-purple">
                        ${icon("tasks")}
                    </span>
                    <span>
                        <small>Offene Aufgaben</small>
                        <strong>${openTasks}</strong>
                    </span>
                </button>

                <button
                    class="metric-card"
                    data-route="${ROUTES.COMMUNICATION}"
                    type="button"
                >
                    <span class="card-icon tone-orange">
                        ${icon("message")}
                    </span>
                    <span>
                        <small>Offene Meldungen</small>
                        <strong>${openMessages}</strong>
                    </span>
                </button>

                <button
                    class="metric-card"
                    data-route="${ROUTES.MATERIALS}"
                    type="button"
                >
                    <span class="card-icon tone-green">
                        ${icon("box")}
                    </span>
                    <span>
                        <small>Materialmeldung</small>
                        <strong>Neu</strong>
                    </span>
                </button>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Heutige Arbeitszeiten</h2>
                        <p>Alle heute erfassten Schichten.</p>
                    </div>
                </div>

                <div class="activity-list">
                    ${todayShifts.length
                        ? todayShifts.map((entry) => {
                            const isRunning = !Boolean(
                                entry?.endTime ??
                                entry?.checkoutTime
                            );

                            return `
                                <article>
                                    <span class="activity-dot ${isRunning
                                        ? "tone-orange"
                                        : "tone-green"
                                    }"></span>

                                    <div>
                                        <strong>
                                            ${esc(
                                                entry?.objectName ??
                                                objectName(
                                                    arr(state?.objects)
                                                        .find((object) =>
                                                            objectId(object) ===
                                                            txt(entry?.objectId)
                                                        )
                                                )
                                            )}
                                        </strong>

                                        <small>
                                            ${formatTime(
                                                entry?.startTime ??
                                                entry?.checkinTime
                                            )}
                                            bis
                                            ${isRunning
                                                ? "l&auml;uft"
                                                : formatTime(
                                                    entry?.endTime ??
                                                    entry?.checkoutTime
                                                )
                                            }
                                            &middot;
                                            ${isRunning
                                                ? "laufend"
                                                : formatDuration(
                                                    durationMs(entry)
                                                )
                                            }
                                        </small>
                                    </div>
                                </article>
                            `;
                        }).join("")
                        : `
                            <div class="empty-state">
                                Heute wurde noch keine Arbeitszeit erfasst.
                            </div>
                        `
                    }
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Heutige Objekte</h2>
                        <p>Objekt antippen und Unterpunkte &ouml;ffnen.</p>
                    </div>
                </div>

                <div class="today-object-list">
                    ${objects.map((object) => `
                        <button
                            class="today-object-card"
                            data-object-id="${esc(objectId(object))}"
                            type="button"
                        >
                            <span class="card-icon tone-blue">
                                ${icon("building")}
                            </span>

                            <span>
                                <strong>${esc(objectName(object))}</strong>
                                <small>Objektdetails &ouml;ffnen</small>
                            </span>

                            <span class="arrow-icon">
                                ${icon("arrow")}
                            </span>
                        </button>
                    `).join("") || `
                        <div class="empty-state">
                            Keine Objekte zugewiesen.
                        </div>
                    `}
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Letzte Aktivit&auml;ten</h2>
                        <p>Deine zuletzt ausgef&uuml;hrten Aktionen.</p>
                    </div>
                </div>

                <div class="activity-list">
                    <article>
                        <span class="activity-dot tone-green"></span>
                        <div>
                            <strong>Dashboard ge&ouml;ffnet</strong>
                            <small>Gerade eben</small>
                        </div>
                    </article>
                </div>
            </section>
        </section>
    `;
}
