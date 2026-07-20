import { ROUTES } from "../../router.js";

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();
const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const getObjectId = (object) =>
    txt(object?.id ?? object?.objectId ?? object?.ID);

const getObjectName = (object) =>
    txt(
        object?.name ??
        object?.objectName ??
        object?.Name ??
        object?.Objekt_Name
    ) || "Objekt";

const getObjectAddress = (object) =>
    txt(
        object?.address ??
        object?.Adresse ??
        object?.street ??
        object?.location
    );

function icon(name) {
    return ({
        rooms: '<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M12 4v16M4 12h16"/></svg>',
        tasks: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
        material: '<svg viewBox="0 0 24 24"><path d="M4 7 12 3l8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
        message: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
        guide: '<svg viewBox="0 0 24 24"><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M8 8h7M8 12h7"/></svg>',
        key: '<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M17 12v3M20 12v2"/></svg>',
        shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z"/></svg>',
        document: '<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5M9 12h6M9 16h6"/></svg>',
        back: '<svg viewBox="0 0 24 24"><path d="m15 5-7 7 7 7"/></svg>',
        arrow: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>'
    }[name] ?? "");
}

function countRooms(state, objectId) {
    return arr(state?.rooms).filter(
        (room) => txt(room?.objectId) === objectId
    ).length;
}

function countOpenTasks(state, objectId) {
    return arr(state?.tasks).filter((task) =>
        txt(task?.objectId) === objectId &&
        !["DONE", "COMPLETED", "ERLEDIGT"].includes(
            txt(task?.status).toUpperCase()
        )
    ).length;
}

function countOpenMessages(state, objectId) {
    return [
        ...arr(state?.tickets),
        ...arr(state?.messages),
        ...arr(state?.notifications),
        ...arr(state?.customerRequests)
    ].filter((entry) =>
        txt(entry?.objectId) === objectId &&
        !["DONE", "CLOSED", "COMPLETED", "ERLEDIGT"].includes(
            txt(entry?.status).toUpperCase()
        )
    ).length;
}

export function renderObjectDetailPage(state = {}) {
    const object = state?.currentObject;

    if (!object) {
        return `
            <section class="content-page">
                <header class="dashboard-heading">
                    <div>
                        <span class="eyebrow">OBJEKT</span>
                        <h1>Kein Objekt ausgew&auml;hlt</h1>
                        <p>W&auml;hle zuerst ein Objekt im Dashboard aus.</p>
                    </div>
                </header>

                <button class="secondary" data-route="${ROUTES.OVERVIEW}" type="button">
                    Zur&uuml;ck zur &Uuml;bersicht
                </button>
            </section>
        `;
    }

    const objectId = getObjectId(object);
    const roomCount = countRooms(state, objectId);
    const openTasks = countOpenTasks(state, objectId);
    const openMessages = countOpenMessages(state, objectId);

    const modules = [
        ["rooms", "R&auml;ume", "Raumliste, Aufgaben, Intervalle und Fotos", ROUTES.TASKS, `${roomCount} R&auml;ume`],
        ["tasks", "Aufgaben", "Heute, offen, erledigt und Zeitabweichungen", ROUTES.TASKS, `${openTasks} offen`],
        ["material", "Material", "Bestand, Bestellung, Verbrauch und Mindestbestand", ROUTES.MATERIALS, "Bestand"],
        ["message", "Meldungen", "Pflichtmeldungen, Kundenw&uuml;nsche und Sch&auml;den", ROUTES.COMMUNICATION, `${openMessages} offen`],
        ["guide", "Objekt-Guide", "Arbeitsabl&auml;ufe, Dosierungen, Fotos und Videos", ROUTES.HELP, "Anleitung"],
        ["key", "Schl&uuml;ssel", "Ausgabe, R&uuml;ckgabe und Historie", ROUTES.MORE, "Schl&uuml;sselbuch"],
        ["shield", "Objekt sichern", "T&uuml;ren, Fenster, Alarm und Abschlusskontrolle", ROUTES.MORE, "Kontrolle"],
        ["document", "Dokumente", "Objektinformationen, Ansprechpartner und Notfallplan", ROUTES.REPORTS, "Dokumente"]
    ];

    return `
        <section class="content-page object-detail-page">
            <button class="object-back-button" data-route="${ROUTES.OVERVIEW}" type="button">
                <span>${icon("back")}</span>
                Zur&uuml;ck
            </button>

            <header class="dashboard-heading object-detail-heading">
                <div>
                    <span class="eyebrow">AKTUELLES OBJEKT</span>
                    <h1>${esc(getObjectName(object))}</h1>
                    <p>${esc(getObjectAddress(object) || "Objektspezifische Arbeitsbereiche")}</p>
                </div>
            </header>

            <section class="object-summary-grid">
                <article><small>R&auml;ume</small><strong>${roomCount}</strong></article>
                <article><small>Offene Aufgaben</small><strong>${openTasks}</strong></article>
                <article><small>Offene Meldungen</small><strong>${openMessages}</strong></article>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Objektbereiche</h2>
                        <p>Alle Funktionen sind dem aktuell gew&auml;hlten Objekt zugeordnet.</p>
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
        </section>
    `;
}
