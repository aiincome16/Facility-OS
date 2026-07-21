import { ROUTES } from "../../../router.js";

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();
const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

function icon(name) {
    return ({
        building: '<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
        message: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
        quality: '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/><circle cx="12" cy="12" r="9"/></svg>',
        calendar: '<svg viewBox="0 0 24 24"><path d="M4 6h16v14H4z"/><path d="M8 3v6M16 3v6M4 10h16"/></svg>',
        document: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg>',
        contact: '<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="3"/><path d="M5 20a7 7 0 0 1 14 0"/></svg>',
        request: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
        status: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/></svg>',
        arrow: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>'
    }[name] ?? "");
}

function objectIdsForCustomer(state) {
    const user = state?.currentUser ?? {};

    return arr(
        user?.assignedObjectIds ??
        user?.objectIds ??
        user?.customerObjectIds
    ).map(String);
}

function customerObjects(state) {
    const ids = objectIdsForCustomer(state);
    const userId = txt(state?.currentUser?.id ?? state?.currentUser?.userId);

    return arr(state?.objects).filter((object) =>
        object?.active !== false &&
        (
            ids.includes(txt(object?.id ?? object?.objectId ?? object?.ID)) ||
            txt(object?.customerId) === userId ||
            arr(object?.customerIds).map(String).includes(userId)
        )
    );
}

function openRequests(state, objectIds) {
    return arr(state?.customerRequests).filter((entry) =>
        objectIds.includes(txt(entry?.objectId)) &&
        !["DONE", "CLOSED", "COMPLETED", "ERLEDIGT"].includes(
            txt(entry?.status).toUpperCase()
        )
    );
}

function recentMessages(state, objectIds) {
    return [
        ...arr(state?.messages),
        ...arr(state?.notifications),
        ...arr(state?.tickets)
    ].filter((entry) =>
        objectIds.includes(txt(entry?.objectId))
    );
}

function objectName(object) {
    return txt(
        object?.name ??
        object?.objectName ??
        object?.Name ??
        object?.Objekt_Name
    ) || "Objekt";
}

export function renderCustomerDashboard(state = {}) {
    const objects = customerObjects(state);
    const objectIds = objects.map((object) =>
        txt(object?.id ?? object?.objectId ?? object?.ID)
    );
    const requests = openRequests(state, objectIds);
    const messages = recentMessages(state, objectIds);
    const completedRequests = arr(state?.customerRequests).filter((entry) =>
        objectIds.includes(txt(entry?.objectId)) &&
        ["DONE", "CLOSED", "COMPLETED", "ERLEDIGT"].includes(
            txt(entry?.status).toUpperCase()
        )
    ).length;

    const modules = [
        ["building", "Meine Objekte", "Zugeordnete Objekte und aktuelle Informationen", ROUTES.OVERVIEW, `${objects.length} Objekte`],
        ["request", "Neuen Wunsch melden", "Reinigungswunsch, Zusatzleistung oder Hinweis erfassen", ROUTES.COMMUNICATION, "Neue Anfrage"],
        ["message", "Meine Anfragen", "Offene und abgeschlossene Kundenanfragen verfolgen", ROUTES.COMMUNICATION, `${requests.length} offen`],
        ["quality", "Qualit&auml;t und Kontrollen", "Freigegebene Qualit&auml;tsinformationen und Kontrollergebnisse", ROUTES.REPORTS, "Qualit&auml;t"],
        ["calendar", "Leistungs&uuml;bersicht", "Geplante und ausgef&uuml;hrte Leistungen einsehen", ROUTES.REPORTS, "Zeitraum"],
        ["document", "Dokumente", "Freigegebene Berichte, Nachweise und Objektinformationen", ROUTES.REPORTS, "Dokumente"],
        ["contact", "Ansprechpartner", "Objektleitung und zust&auml;ndige Kontakte erreichen", ROUTES.COMMUNICATION, "Kontakt"]
    ];

    return `
        <section class="role-dashboard customer-dashboard">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">KUNDENPORTAL</span>
                    <h1>&Uuml;bersicht</h1>
                    <p>Objekte, Anfragen und freigegebene Leistungsinformationen einsehen.</p>
                </div>
            </header>

            <section class="dashboard-metrics">
                <button class="metric-card" data-route="${ROUTES.OVERVIEW}" type="button">
                    <span class="card-icon tone-blue">${icon("building")}</span>
                    <span><small>Meine Objekte</small><strong>${objects.length}</strong></span>
                </button>

                <button class="metric-card" data-route="${ROUTES.COMMUNICATION}" type="button">
                    <span class="card-icon tone-orange">${icon("message")}</span>
                    <span><small>Offene Anfragen</small><strong>${requests.length}</strong></span>
                </button>

                <button class="metric-card" data-route="${ROUTES.REPORTS}" type="button">
                    <span class="card-icon tone-green">${icon("quality")}</span>
                    <span><small>Erledigte Anfragen</small><strong>${completedRequests}</strong></span>
                </button>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Meine Objekte</h2>
                        <p>Objekt antippen, um freigegebene Informationen zu &ouml;ffnen.</p>
                    </div>
                </div>

                <div class="today-object-list">
                    ${objects.length
                        ? objects.map((object) => `
                            <button
                                class="today-object-card"
                                data-object-id="${esc(
                                    object?.id ??
                                    object?.objectId ??
                                    object?.ID ??
                                    ""
                                )}"
                                type="button"
                            >
                                <span class="card-icon tone-blue">${icon("building")}</span>
                                <span>
                                    <strong>${esc(objectName(object))}</strong>
                                    <small>${esc(
                                        object?.address ??
                                        object?.Adresse ??
                                        object?.location ??
                                        "Objektinformationen &ouml;ffnen"
                                    )}</small>
                                </span>
                                <span class="arrow-icon">${icon("arrow")}</span>
                            </button>
                        `).join("")
                        : '<div class="empty-state">Es sind noch keine Objekte f&uuml;r dieses Kundenkonto freigegeben.</div>'
                    }
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Kundenbereiche</h2>
                        <p>Nur vom Objektleiter freigegebene Bereiche werden angezeigt.</p>
                    </div>
                </div>

                <div class="object-module-grid">
                    ${modules.map(([iconName, title, description, route, badge]) => `
                        <button class="object-module-card" data-route="${route}" type="button">
                            <span class="card-icon tone-blue">${icon(iconName)}</span>
                            <span class="object-module-copy">
                                <strong>${title}</strong>
                                <small>${description}</small>
                                <em>${badge}</em>
                            </span>
                            <span class="arrow-icon">${icon("arrow")}</span>
                        </button>
                    `).join("")}
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Letzte Aktivit&auml;ten</h2>
                        <p>Aktuelle Anfragen und freigegebene Informationen.</p>
                    </div>
                </div>

                <div class="activity-list">
                    <article>
                        <span class="activity-dot tone-blue"></span>
                        <div>
                            <strong>Kundenportal ge&ouml;ffnet</strong>
                            <small>Gerade eben</small>
                        </div>
                    </article>

                    <article>
                        <span class="activity-dot tone-orange"></span>
                        <div>
                            <strong>${requests.length} offene Kundenanfragen</strong>
                            <small>Aktueller Bearbeitungsstand</small>
                        </div>
                    </article>

                    <article>
                        <span class="activity-dot tone-green"></span>
                        <div>
                            <strong>${messages.length} Meldungen und Hinweise</strong>
                            <small>Aktueller Datenstand</small>
                        </div>
                    </article>
                </div>
            </section>
        </section>
    `;
}
