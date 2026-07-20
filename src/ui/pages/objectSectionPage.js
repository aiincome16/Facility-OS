import { ROUTES } from "../../router.js";

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();
const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const objectId = (state) => txt(
    state?.currentObject?.id ??
    state?.currentObject?.objectId ??
    state?.currentObject?.ID
);

const objectName = (state) => txt(
    state?.currentObject?.name ??
    state?.currentObject?.objectName ??
    state?.currentObject?.Name ??
    state?.currentObject?.Objekt_Name
) || "Objekt";

function icon(name) {
    return ({
        back: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
        arrow: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
        rooms: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M12 4v16M4 12h16"/></svg>',
        tasks: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
        material: '<svg viewBox="0 0 24 24"><path d="M4 7 12 3l8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
        message: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
        guide: '<svg viewBox="0 0 24 24"><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M8 8h7M8 12h7"/></svg>',
        key: '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M17 12v3M20 12v2"/></svg>',
        shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z"/></svg>',
        document: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg>',
        plus: '<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>'
    }[name] ?? "");
}

function header(state, title, description) {
    return `
        <button class="object-back-button" data-object-section-back type="button">
            <span>${icon("back")}</span>
            Objekt&uuml;bersicht
        </button>

        <header class="dashboard-heading">
            <div>
                <span class="eyebrow">${esc(objectName(state).toUpperCase())}</span>
                <h1>${title}</h1>
                <p>${description}</p>
            </div>
        </header>
    `;
}

function empty(text) {
    return `<div class="empty-state">${text}</div>`;
}

function statusLabel(status) {
    const normalized = txt(status).toUpperCase();

    if (["DONE", "COMPLETED", "ERLEDIGT"].includes(normalized)) {
        return "Erledigt";
    }

    if (["RUNNING", "ACTIVE", "IN_PROGRESS"].includes(normalized)) {
        return "In Arbeit";
    }

    return "Offen";
}

function listCard(title, subtitle, meta = "", tone = "blue") {
    return `
        <article class="section-list-card">
            <span class="section-status-dot tone-${tone}"></span>
            <div>
                <strong>${esc(title)}</strong>
                <small>${esc(subtitle)}</small>
                ${meta ? `<em>${esc(meta)}</em>` : ""}
            </div>
        </article>
    `;
}

function renderRooms(state) {
    const id = objectId(state);
    const rooms = arr(state?.rooms).filter((room) =>
        txt(room?.objectId) === id
    );

    return `
        ${header(state, "R&auml;ume", "Raumliste, Reinigungsaufgaben und Intervalle.")}

        <section class="section-actions">
            <button class="primary" data-route="${ROUTES.TASKS}" type="button">
                Alle Aufgaben
            </button>
        </section>

        <section class="dashboard-panel">
            <div class="panel-heading">
                <div>
                    <h2>Raumliste</h2>
                    <p>${rooms.length} R&auml;ume sind diesem Objekt zugeordnet.</p>
                </div>
            </div>

            <div class="section-list">
                ${rooms.length
                    ? rooms.map((room) => listCard(
                        room?.name ?? room?.roomName ?? room?.Name ?? "Raum",
                        room?.description ?? room?.floor ?? room?.Etage ?? "Keine Zusatzangabe",
                        room?.interval ?? room?.cleaningInterval ?? "Intervall nicht hinterlegt",
                        "blue"
                    )).join("")
                    : empty("F&uuml;r dieses Objekt sind noch keine R&auml;ume hinterlegt.")
                }
            </div>
        </section>
    `;
}

function renderTasks(state) {
    const id = objectId(state);
    const tasks = arr(state?.tasks).filter((task) =>
        txt(task?.objectId) === id
    );

    const open = tasks.filter((task) =>
        !["DONE", "COMPLETED", "ERLEDIGT"].includes(
            txt(task?.status).toUpperCase()
        )
    );

    return `
        ${header(state, "Aufgaben", "Heutige, offene und erledigte Aufgaben.")}

        <section class="object-summary-grid">
            <article><small>Gesamt</small><strong>${tasks.length}</strong></article>
            <article><small>Offen</small><strong>${open.length}</strong></article>
            <article><small>Erledigt</small><strong>${tasks.length - open.length}</strong></article>
        </section>

        <section class="dashboard-panel">
            <div class="panel-heading">
                <div>
                    <h2>Aufgabenliste</h2>
                    <p>Aktueller Aufgabenstand des Objekts.</p>
                </div>
            </div>

            <div class="section-list">
                ${tasks.length
                    ? tasks.map((task) => listCard(
                        task?.name ?? task?.title ?? task?.taskName ?? "Aufgabe",
                        task?.description ?? task?.roomName ?? "Keine Beschreibung",
                        statusLabel(task?.status),
                        ["DONE", "COMPLETED", "ERLEDIGT"].includes(txt(task?.status).toUpperCase())
                            ? "green"
                            : "orange"
                    )).join("")
                    : empty("F&uuml;r dieses Objekt sind noch keine Aufgaben hinterlegt.")
                }
            </div>
        </section>
    `;
}

function renderMaterial(state) {
    const id = objectId(state);
    const stock = arr(state?.materialStock).filter((entry) =>
        txt(entry?.objectId) === id
    );

    const materials = arr(state?.materials).filter((material) =>
        txt(material?.objectId) === id ||
        arr(material?.objectIds ?? material?.assignedObjectIds)
            .map(String)
            .includes(id) ||
        (
            !material?.objectId &&
            arr(material?.objectIds ?? material?.assignedObjectIds).length === 0
        )
    );

    return `
        ${header(state, "Material", "Bestand, Verbrauch und Nachbestellung.")}

        <section class="section-actions">
            <button class="primary" data-route="${ROUTES.MATERIALS}" type="button">
                Material bestellen
            </button>
        </section>

        <section class="dashboard-panel">
            <div class="panel-heading">
                <div>
                    <h2>Materialbestand</h2>
                    <p>Aktuell hinterlegte Materialien f&uuml;r dieses Objekt.</p>
                </div>
            </div>

            <div class="section-list">
                ${(stock.length ? stock : materials).length
                    ? (stock.length ? stock : materials).map((entry) => listCard(
                        entry?.materialName ?? entry?.name ?? entry?.Name ?? "Material",
                        `Bestand: ${entry?.quantity ?? entry?.stock ?? entry?.currentStock ?? "nicht erfasst"}`,
                        `Mindestbestand: ${entry?.minimumStock ?? entry?.minStock ?? "nicht erfasst"}`,
                        Number(entry?.quantity ?? entry?.stock ?? 0) <= Number(entry?.minimumStock ?? entry?.minStock ?? -1)
                            ? "orange"
                            : "green"
                    )).join("")
                    : empty("F&uuml;r dieses Objekt sind noch keine Materialien hinterlegt.")
                }
            </div>
        </section>
    `;
}

function renderMessages(state) {
    const id = objectId(state);
    const messages = [
        ...arr(state?.tickets),
        ...arr(state?.messages),
        ...arr(state?.notifications),
        ...arr(state?.customerRequests)
    ].filter((entry) => txt(entry?.objectId) === id);

    return `
        ${header(state, "Meldungen", "Pflichtmeldungen, Kundenw&uuml;nsche und Sch&auml;den.")}

        <section class="section-actions">
            <button class="primary" data-route="${ROUTES.COMMUNICATION}" type="button">
                Meldungsbereich &ouml;ffnen
            </button>
        </section>

        <section class="dashboard-panel">
            <div class="panel-heading">
                <div>
                    <h2>Aktuelle Meldungen</h2>
                    <p>${messages.length} Meldungen sind dem Objekt zugeordnet.</p>
                </div>
            </div>

            <div class="section-list">
                ${messages.length
                    ? messages.map((entry) => listCard(
                        entry?.title ?? entry?.subject ?? entry?.type ?? "Meldung",
                        entry?.message ?? entry?.description ?? entry?.text ?? "Keine Beschreibung",
                        statusLabel(entry?.status),
                        ["DONE", "CLOSED", "COMPLETED", "ERLEDIGT"].includes(txt(entry?.status).toUpperCase())
                            ? "green"
                            : "orange"
                    )).join("")
                    : empty("F&uuml;r dieses Objekt liegen aktuell keine Meldungen vor.")
                }
            </div>
        </section>
    `;
}

function renderGuide(state) {
    const id = objectId(state);
    const entries = arr(state?.objectGuide).filter((entry) =>
        txt(entry?.objectId) === id
    );

    return `
        ${header(state, "Objekt-Guide", "Arbeitsabl&auml;ufe, Dosierungen und Hinweise.")}

        <section class="dashboard-panel">
            <div class="panel-heading">
                <div>
                    <h2>Arbeitsanweisungen</h2>
                    <p>Verbindliche Informationen f&uuml;r die Arbeit im Objekt.</p>
                </div>
            </div>

            <div class="section-list">
                ${entries.length
                    ? entries.map((entry) => listCard(
                        entry?.title ?? entry?.name ?? entry?.category ?? "Anweisung",
                        entry?.description ?? entry?.text ?? entry?.instruction ?? "Keine Beschreibung",
                        entry?.mandatory === true ? "Pflichtinformation" : "Information",
                        entry?.mandatory === true ? "orange" : "blue"
                    )).join("")
                    : empty("F&uuml;r dieses Objekt wurde noch kein Objekt-Guide hinterlegt.")
                }
            </div>
        </section>
    `;
}

function renderKeys(state) {
    const id = objectId(state);
    const keys = arr(state?.keybook).filter((entry) =>
        txt(entry?.objectId) === id
    );

    return `
        ${header(state, "Schl&uuml;ssel", "Ausgabe, R&uuml;ckgabe und Schl&uuml;sselhistorie.")}

        <section class="dashboard-panel">
            <div class="panel-heading">
                <div>
                    <h2>Schl&uuml;sselbuch</h2>
                    <p>Dokumentierte Schl&uuml;sselvorg&auml;nge des Objekts.</p>
                </div>
            </div>

            <div class="section-list">
                ${keys.length
                    ? keys.map((entry) => listCard(
                        entry?.keyName ?? entry?.name ?? entry?.keyId ?? "Schl&uuml;ssel",
                        entry?.holderName ?? entry?.employeeName ?? "Kein Inhaber hinterlegt",
                        entry?.returnedAt
                            ? "Zur&uuml;ckgegeben"
                            : entry?.issuedAt
                                ? "Ausgegeben"
                                : "Status offen",
                        entry?.returnedAt ? "green" : "orange"
                    )).join("")
                    : empty("F&uuml;r dieses Objekt sind noch keine Schl&uuml;sselvorg&auml;nge hinterlegt.")
                }
            </div>
        </section>
    `;
}

function renderSecurity(state) {
    const id = objectId(state);
    const security = arr(state?.objectSecurity).filter((entry) =>
        txt(entry?.objectId) === id
    );

    const waste = arr(state?.objectWaste).filter((entry) =>
        txt(entry?.objectId) === id
    );

    const checks = [
        ["T&uuml;ren und Zug&auml;nge", security.find((entry) => entry?.type === "DOORS")],
        ["Fenster", security.find((entry) => entry?.type === "WINDOWS")],
        ["Alarmanlage", security.find((entry) => entry?.type === "ALARM")],
        ["M&uuml;ll und Entsorgung", waste[0]]
    ];

    return `
        ${header(state, "Objekt sichern", "Abschlusskontrolle, Schlie&szlig;ung und Entsorgung.")}

        <section class="dashboard-panel">
            <div class="panel-heading">
                <div>
                    <h2>Abschlusskontrolle</h2>
                    <p>Die Punkte werden beim Check-out verbindlich best&auml;tigt.</p>
                </div>
            </div>

            <div class="security-check-list">
                ${checks.map(([title, entry]) => `
                    <label class="security-check">
                        <input type="checkbox">
                        <span>
                            <strong>${title}</strong>
                            <small>${esc(
                                entry?.description ??
                                entry?.instruction ??
                                "Nach Objektvorgabe pr&uuml;fen"
                            )}</small>
                        </span>
                    </label>
                `).join("")}
            </div>
        </section>
    `;
}

function renderDocuments(state) {
    const object = state?.currentObject ?? {};
    const contacts = [
        object?.contactName,
        object?.contactPerson,
        object?.customerContact
    ].filter(Boolean);

    return `
        ${header(state, "Dokumente", "Objektinformationen, Ansprechpartner und Notfallangaben.")}

        <section class="dashboard-panel">
            <div class="panel-heading">
                <div>
                    <h2>Objektinformationen</h2>
                    <p>Zentrale Stammdaten des ausgew&auml;hlten Objekts.</p>
                </div>
            </div>

            <div class="document-info-grid">
                <article>
                    <small>Adresse</small>
                    <strong>${esc(
                        object?.address ??
                        object?.Adresse ??
                        object?.location ??
                        "Nicht hinterlegt"
                    )}</strong>
                </article>

                <article>
                    <small>Ansprechpartner</small>
                    <strong>${esc(contacts[0] ?? "Nicht hinterlegt")}</strong>
                </article>

                <article>
                    <small>Telefon</small>
                    <strong>${esc(
                        object?.phone ??
                        object?.contactPhone ??
                        "Nicht hinterlegt"
                    )}</strong>
                </article>

                <article>
                    <small>Notfallhinweis</small>
                    <strong>${esc(
                        object?.emergencyInfo ??
                        object?.emergencyPlan ??
                        "Nicht hinterlegt"
                    )}</strong>
                </article>
            </div>
        </section>
    `;
}

export function renderObjectSectionPage(state = {}, section = "") {
    const normalized = txt(section).toLowerCase();

    const renderers = {
        rooms: renderRooms,
        tasks: renderTasks,
        material: renderMaterial,
        messages: renderMessages,
        guide: renderGuide,
        keys: renderKeys,
        security: renderSecurity,
        documents: renderDocuments
    };

    return (renderers[normalized] ?? renderRooms)(state);
}