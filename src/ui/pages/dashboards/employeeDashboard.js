import { ROUTES } from "../../../router.js";

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();

let liveTimerInterval = null;

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

    const assignedIds = arr(
        user?.assignedObjectIds ??
        user?.objectIds
    ).map(String);

    return arr(state?.objects)
        .filter((object) => object?.active !== false)
        .filter((object) =>
            assignedIds.includes(objectId(object)) ||
            arr(
                object?.assignedEmployeeIds ??
                object?.employeeIds ??
                object?.assignedUserIds
            ).map(String).includes(userId)
        );
}

function currentShift(state) {
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

        const running =
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

        return belongsToUser && running;
    }) ?? null;
}

function isToday(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const today = new Date();

    return (
        date.getFullYear() === today.getFullYear() &&
        date.getMonth() === today.getMonth() &&
        date.getDate() === today.getDate()
    );
}

function employeeShiftsToday(state) {
    const userId = txt(
        state?.currentUser?.id ??
        state?.currentUser?.userId
    );

    return arr(state?.shifts)
        .filter((shift) =>
            [
                shift?.userId,
                shift?.employeeId
            ].map(String).includes(userId)
        )
        .filter((shift) =>
            isToday(
                shift?.startTime ??
                shift?.checkinTime
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
}

function durationMilliseconds(shift, endValue = Date.now()) {
    const start = new Date(
        shift?.startTime ??
        shift?.checkinTime ??
        ""
    );

    const end = shift?.endTime || shift?.checkoutTime
        ? new Date(
            shift?.endTime ??
            shift?.checkoutTime
        )
        : new Date(endValue);

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

function formatClock(milliseconds) {
    const totalSeconds = Math.floor(
        Math.max(0, milliseconds) / 1000
    );

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(
        (totalSeconds % 3600) / 60
    );
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
        .map((value) => String(value).padStart(2, "0"))
        .join(":");
}

function formatDuration(milliseconds) {
    const totalMinutes = Math.floor(
        Math.max(0, milliseconds) / 60000
    );

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes} Min.`;
    }

    return `${hours} Std. ${minutes} Min.`;
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

function totalCompletedToday(shifts) {
    return shifts
        .filter((shift) =>
            Boolean(
                shift?.endTime ??
                shift?.checkoutTime
            )
        )
        .reduce(
            (total, shift) =>
                total + durationMilliseconds(shift),
            0
        );
}

function startLiveTimer(shift) {
    if (liveTimerInterval) {
        window.clearInterval(liveTimerInterval);
        liveTimerInterval = null;
    }

    if (!shift) {
        return;
    }

    const update = () => {
        const timer = document.getElementById(
            "employee-live-timer"
        );

        if (!timer) {
            return;
        }

        timer.textContent = formatClock(
            durationMilliseconds(shift)
        );
    };

    update();

    liveTimerInterval = window.setInterval(
        update,
        1000
    );
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
    const runningShift = currentShift(state);
    const todayShifts = employeeShiftsToday(state);
    const completedToday = totalCompletedToday(todayShifts);
    const assignedIds = objects.map(objectId);

    const openTasks = arr(state?.tasks).filter((task) =>
        assignedIds.includes(txt(task?.objectId)) &&
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
    ].filter((message) =>
        (
            !message?.objectId ||
            assignedIds.includes(txt(message?.objectId))
        ) &&
        ![
            "DONE",
            "CLOSED",
            "COMPLETED",
            "ERLEDIGT"
        ].includes(txt(message?.status).toUpperCase())
    ).length;

    window.setTimeout(
        () => startLiveTimer(runningShift),
        0
    );

    return `
        <style>
            .employee-live-time {
                margin-top: 5px;
                font-size: clamp(28px, 8vw, 42px);
                font-weight: 900;
                letter-spacing: .04em;
                line-height: 1;
            }

            .employee-shift-meta {
                display: grid;
                gap: 3px;
                margin-top: 8px;
            }

            .employee-time-history {
                display: grid;
                gap: 10px;
            }

            .employee-time-entry {
                display: grid;
                grid-template-columns: minmax(0, 1fr) auto;
                gap: 12px;
                align-items: center;
                padding: 12px;
                border: 1px solid var(--border);
                border-radius: 12px;
                background: rgba(20, 39, 65, .66);
            }

            .employee-time-entry strong,
            .employee-time-entry small {
                display: block;
            }

            .employee-time-entry small {
                margin-top: 4px;
                color: var(--soft);
            }

            .employee-time-entry-duration {
                font-weight: 900;
                white-space: nowrap;
            }
        </style>

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
                            ${runningShift
                                ? "Laufende Arbeitszeit"
                                : "Heute gearbeitet"
                            }
                        </small>

                        ${runningShift
                            ? `
                                <div
                                    id="employee-live-timer"
                                    class="employee-live-time"
                                >
                                    ${formatClock(
                                        durationMilliseconds(
                                            runningShift
                                        )
                                    )}
                                </div>

                                <span class="employee-shift-meta">
                                    <span>
                                        Beginn:
                                        ${formatTime(
                                            runningShift?.startTime ??
                                            runningShift?.checkinTime
                                        )} Uhr
                                    </span>
                                    <span>
                                        ${esc(
                                            runningShift?.objectName ??
                                            objectName(
                                                state?.currentObject
                                            )
                                        )}
                                    </span>
                                </span>
                            `
                            : `
                                <strong>
                                    ${formatDuration(completedToday)}
                                </strong>
                                <span>
                                    Noch keine Schicht gestartet
                                </span>
                            `
                        }
                    </div>
                </div>

                <button
                    class="shift-button ${runningShift ? "danger" : "success"}"
                    data-action="${runningShift ? "checkout" : "checkin"}"
                    type="button"
                >
                    <span>
                        ${icon(
                            runningShift
                                ? "stop"
                                : "play"
                        )}
                    </span>

                    ${runningShift
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
                        <p>
                            Abgeschlossene und laufende Schichten des heutigen Tages.
                        </p>
                    </div>
                </div>

                <div class="employee-time-history">
                    ${todayShifts.length
                        ? todayShifts.map((shift) => {
                            const isRunning =
                                !Boolean(
                                    shift?.endTime ??
                                    shift?.checkoutTime
                                );

                            return `
                                <article class="employee-time-entry">
                                    <div>
                                        <strong>
                                            ${esc(
                                                shift?.objectName ??
                                                objectName(
                                                    arr(state?.objects)
                                                        .find((object) =>
                                                            objectId(object) ===
                                                            txt(shift?.objectId)
                                                        )
                                                )
                                            )}
                                        </strong>

                                        <small>
                                            ${formatTime(
                                                shift?.startTime ??
                                                shift?.checkinTime
                                            )}
                                            bis
                                            ${isRunning
                                                ? "l&auml;uft"
                                                : formatTime(
                                                    shift?.endTime ??
                                                    shift?.checkoutTime
                                                )
                                            }
                                        </small>
                                    </div>

                                    <span class="employee-time-entry-duration">
                                        ${isRunning
                                            ? "L&auml;uft"
                                            : formatDuration(
                                                durationMilliseconds(
                                                    shift
                                                )
                                            )
                                        }
                                    </span>
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
                        <p>
                            Objekt antippen und Unterpunkte &ouml;ffnen.
                        </p>
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
                        <p>
                            Deine zuletzt ausgef&uuml;hrten Aktionen.
                        </p>
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

                    <article>
                        <span class="activity-dot tone-blue"></span>
                        <div>
                            <strong>
                                ${objects.length} Objekte zugewiesen
                            </strong>
                            <small>Heute</small>
                        </div>
                    </article>
                </div>
            </section>
        </section>
    `;
}
