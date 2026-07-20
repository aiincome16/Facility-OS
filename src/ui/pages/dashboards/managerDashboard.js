import { ROUTES } from "../../../router.js";

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();
const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const oid = (object) => txt(object?.id ?? object?.objectId ?? object?.ID);
const oname = (object) => txt(
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
        user?.objectIds ??
        user?.managedObjectIds
    ).map(String);

    const all = arr(state?.objects).filter((object) => object?.active !== false);

    const managed = all.filter((object) =>
        object?.objectLeaderId === userId ||
        object?.managerId === userId ||
        object?.leaderId === userId ||
        ids.includes(oid(object))
    );

    return managed.length ? managed : all;
}

function icon(name) {
    return ({
        building: '<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
        users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M4 20v-2a5 5 0 0 1 10 0v2"/><circle cx="17" cy="9" r="2"/><path d="M15 20v-1a4 4 0 0 1 5-3.5"/></svg>',
        clock: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
        message: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
        material: '<svg viewBox="0 0 24 24"><path d="M4 7 12 3l8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
        customer: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
        replace: '<svg viewBox="0 0 24 24"><path d="M7 7h10l-2-2M17 17H7l2 2"/><path d="M17 7v4M7 17v-4"/></svg>',
        alert: '<svg viewBox="0 0 24 24"><path d="M12 3 2 21h20z"/><path d="M12 9v5M12 18h.01"/></svg>',
        arrow: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>'
    }[name] ?? "");
}

function countData(state, objectIds) {
    const shifts = arr(state?.shifts).filter((shift) =>
        objectIds.includes(txt(shift?.objectId))
    );

    const running = shifts.filter((shift) =>
        ["RUNNING", "ACTIVE"].includes(txt(shift?.status).toUpperCase()) ||
        (
            Boolean(shift?.startTime ?? shift?.checkinTime) &&
            !Boolean(shift?.endTime ?? shift?.checkoutTime)
        )
    ).length;

    const messages = [
        ...arr(state?.tickets),
        ...arr(state?.messages),
        ...arr(state?.notifications)
    ].filter((entry) =>
        (!entry?.objectId || objectIds.includes(txt(entry?.objectId))) &&
        !["DONE", "CLOSED", "COMPLETED", "ERLEDIGT"].includes(
            txt(entry?.status).toUpperCase()
        )
    ).length;

    const orders = arr(state?.materialOrders ?? state?.workOrders).filter((entry) =>
        objectIds.includes(txt(entry?.objectId)) &&
        !["DONE", "APPROVED", "COMPLETED", "ERLEDIGT"].includes(
            txt(entry?.status).toUpperCase()
        )
    ).length;

    const customers = arr(state?.customerRequests).filter((entry) =>
        objectIds.includes(txt(entry?.objectId)) &&
        !["DONE", "CLOSED", "COMPLETED", "ERLEDIGT"].includes(
            txt(entry?.status).toUpperCase()
        )
    ).length;

    return { running, messages, orders, customers };
}

export function renderManagerDashboard(state = {}) {
    const user = state?.currentUser ?? {};
    const firstName = txt(
        user?.firstName ??
        user?.name ??
        user?.displayName ??
        user?.email
    ).split(/\s+/)[0] || "Objektleiter";

    const objects = assignedObjects(state);
    const objectIds = objects.map(oid);
    const counts = countData(state, objectIds);
    const employeeCount = arr(state?.users).filter(
        (entry) => txt(entry?.role).toUpperCase() === "MITARBEITER"
    ).length;

    return `
        <section class="role-dashboard manager-dashboard">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">OBJEKTLEITER</span>
                    <h1>&Uuml;bersicht</h1>
                    <p>Willkommen zur&uuml;ck, ${esc(firstName)}.</p>
                </div>
            </header>

            <section class="dashboard-metrics">
                <button class="metric-card" data-route="${ROUTES.PERSONNEL}" type="button">
                    <span class="card-icon tone-blue">${icon("users")}</span>
                    <span><small>Mitarbeiter</small><strong>${employeeCount}</strong></span>
                </button>

                <button class="metric-card" data-route="${ROUTES.TIMES}" type="button">
                    <span class="card-icon tone-green">${icon("clock")}</span>
                    <span><small>Schichten</small><strong>${counts.running}</strong></span>
                </button>

                <button class="metric-card" data-route="${ROUTES.COMMUNICATION}" type="button">
                    <span class="card-icon tone-orange">${icon("message")}</span>
                    <span><small>Meldungen</small><strong>${counts.messages}</strong></span>
                </button>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Heutige Objekte</h2>
                        <p>Objekt antippen und alle zugeh&ouml;rigen Bereiche &ouml;ffnen.</p>
                    </div>
                </div>

                <div class="today-object-list">
                    ${objects.map((object) => `
                        <button
                            class="today-object-card"
                            data-object-id="${esc(oid(object))}"
                            type="button"
                        >
                            <span class="card-icon tone-blue">${icon("building")}</span>
                            <span>
                                <strong>${esc(oname(object))}</strong>
                                <small>Objektdetails &ouml;ffnen</small>
                            </span>
                            <span class="arrow-icon">${icon("arrow")}</span>
                        </button>
                    `).join("") || '<div class="empty-state">Keine Objekte zugewiesen.</div>'}
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Steuerung</h2>
                        <p>Zentrale Bereiche ohne doppelte Hauptpunkte.</p>
                    </div>
                </div>

                <div class="object-function-grid">
                    <button class="object-function-card" data-route="${ROUTES.PERSONNEL}" type="button">
                        <span class="card-icon tone-blue">${icon("users")}</span>
                        <span>
                            <strong>Mitarbeiter</strong>
                            <small>Anwesenheit, Zuordnung, Vertretung und Qualit&auml;tskontrollen</small>
                        </span>
                        <span class="arrow-icon">${icon("arrow")}</span>
                    </button>

                    <button class="object-function-card" data-route="${ROUTES.TIMES}" type="button">
                        <span class="card-icon tone-green">${icon("clock")}</span>
                        <span>
                            <strong>Schichten</strong>
                            <small>Laufende Schichten, Check-ins und Zeitabweichungen</small>
                        </span>
                        <span class="arrow-icon">${icon("arrow")}</span>
                    </button>

                    <button class="object-function-card" data-route="${ROUTES.COMMUNICATION}" type="button">
                        <span class="card-icon tone-orange">${icon("message")}</span>
                        <span>
                            <strong>Meldungen</strong>
                            <small>Offene Meldungen, Pflichtmeldungen und dringende Hinweise</small>
                        </span>
                        <span class="arrow-icon">${icon("arrow")}</span>
                    </button>

                    <button class="object-function-card" data-route="${ROUTES.MATERIALS}" type="button">
                        <span class="card-icon tone-purple">${icon("material")}</span>
                        <span>
                            <strong>Materialbestellungen</strong>
                            <small>${counts.orders} offene Bestellungen pr&uuml;fen</small>
                        </span>
                        <span class="arrow-icon">${icon("arrow")}</span>
                    </button>

                    <button class="object-function-card" data-route="${ROUTES.COMMUNICATION}" type="button">
                        <span class="card-icon tone-blue">${icon("customer")}</span>
                        <span>
                            <strong>Kundenw&uuml;nsche</strong>
                            <small>${counts.customers} offene Kundenanfragen bearbeiten</small>
                        </span>
                        <span class="arrow-icon">${icon("arrow")}</span>
                    </button>

                    <button class="object-function-card" data-route="${ROUTES.PERSONNEL}" type="button">
                        <span class="card-icon tone-orange">${icon("replace")}</span>
                        <span>
                            <strong>Vertretungsbedarf</strong>
                            <small>Fehlzeiten pr&uuml;fen und Vertretung organisieren</small>
                        </span>
                        <span class="arrow-icon">${icon("arrow")}</span>
                    </button>
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Dringende Probleme</h2>
                        <p>Aktuelle Probleme mit Priorit&auml;t.</p>
                    </div>
                    <span class="card-icon tone-orange">${icon("alert")}</span>
                </div>

                <div class="notice-row">
                    <strong>Keine kritischen Probleme</strong>
                    <small>Aktuell liegt keine dringende Eskalation vor.</small>
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Letzte Aktivit&auml;ten</h2>
                        <p>Zuletzt ausgef&uuml;hrte Aktionen im Zust&auml;ndigkeitsbereich.</p>
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
                            <strong>${objects.length} Objekte im Zust&auml;ndigkeitsbereich</strong>
                            <small>Aktueller Stand</small>
                        </div>
                    </article>
                    <article>
                        <span class="activity-dot tone-orange"></span>
                        <div>
                            <strong>${counts.messages} offene Meldungen</strong>
                            <small>Aktueller Stand</small>
                        </div>
                    </article>
                </div>
            </section>
        </section>
    `;
}
