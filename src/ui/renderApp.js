/************************************************
 * Facility OS
 * renderApp.js
 *
 * Stabiler Präsentationsmodus
 * - keine Abhängigkeit von einzelnen Seitenmodulen
 * - Login, Übersicht und Hauptnavigation
 * - Desktop-Sidebar und mobile Bottom-Navigation
 * - zentrale Event-Delegation
 ************************************************/

import { ROUTES } from "../router.js";

const runtime = {
    route: ROUTES.LOGIN,
    state: {},
    onNavigate: null,
    onLogin: null,
    onLogout: null,
    onCheckin: null,
    onCheckout: null,
    onSelectObject: null
};

let eventsBound = false;

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
        .split("&").join("&amp;")
        .split("<").join("&lt;")
        .split(">").join("&gt;")
        .split('"').join("&quot;")
        .split("'").join("&#039;");
}

function getAppRoot() {
    return document.getElementById("app");
}

function getUserName(user) {
    return normalizeText(
        user?.displayName ??
        user?.fullName ??
        user?.name ??
        user?.username ??
        user?.email
    ) || "Benutzer";
}

function getFirstName(user) {
    return getUserName(user).split(/\s+/)[0] || "Benutzer";
}

function getRoleLabel(role) {
    const labels = {
        SUPER_ADMIN: "Super-Admin",
        ADMIN: "Administrator",
        OBJEKTLEITER: "Objektleitung",
        MITARBEITER: "Mitarbeiter",
        BUCHHALTUNG: "Buchhaltung",
        KUNDE: "Kunde"
    };

    return labels[normalizeRole(role)] ?? "Benutzer";
}

function getObjectName(object) {
    return normalizeText(
        object?.name ??
        object?.objectName ??
        object?.Name ??
        object?.Objekt_Name
    ) || "Kein Objekt ausgewählt";
}

function getObjectId(object) {
    return normalizeText(
        object?.id ??
        object?.objectId ??
        object?.ID
    );
}

function getStatusCount(entries, open = true) {
    const closed = new Set([
        "DONE",
        "COMPLETED",
        "FINISHED",
        "CLOSED",
        "CANCELLED"
    ]);

    return asArray(entries).filter((entry) => {
        const isClosed = closed.has(
            normalizeRole(entry?.status)
        );
        return open ? !isClosed : isClosed;
    }).length;
}

function renderIcon(name) {
    const icons = {
        home: "⌂",
        objects: "▦",
        tasks: "☑",
        communication: "▤",
        more: "•••",
        maintenance: "⚙",
        request: "!",
        cleaning: "✦",
        control: "✓",
        documents: "▣",
        users: "●",
        reports: "▥",
        times: "◷",
        materials: "◆",
        settings: "⚙",
        help: "?"
    };

    return icons[name] ?? "•";
}

function renderLogin(state) {
    const users = asArray(state?.users)
        .filter((user) => user?.active !== false)
        .sort((a, b) =>
            getUserName(a).localeCompare(
                getUserName(b),
                "de"
            )
        );

    const options = users.map((user) => {
        const identifier = normalizeText(
            user?.username ??
            user?.email ??
            user?.employeeNumber ??
            user?.login ??
            user?.id
        );

        return `
            <option value="${escapeHtml(identifier)}">
                ${escapeHtml(getUserName(user))} ·
                ${escapeHtml(getRoleLabel(user?.role))}
            </option>
        `;
    }).join("");

    return `
        <main class="fo-login-page">
            <section class="fo-login-card">
                <div class="fo-login-brand">
                    <span class="fo-brand-icon">▦</span>
                    <div>
                        <strong>FACILITY OS</strong>
                        <span>Digitale Objektverwaltung</span>
                    </div>
                </div>

                <div class="fo-login-copy">
                    <span class="fo-eyebrow">Präsentationsmodus</span>
                    <h1>Anmelden</h1>
                    <p>Wähle einen Testbenutzer und öffne die passende Arbeitsansicht.</p>
                </div>

                ${
                    state?.error
                        ? `<div class="fo-alert">${escapeHtml(state.error)}</div>`
                        : ""
                }

                <form id="login-form" class="fo-login-form">
                    <label>
                        Benutzer
                        <select
                            id="login-identifier"
                            name="identifier"
                            required
                        >
                            <option value="">Benutzer auswählen</option>
                            ${options}
                        </select>
                    </label>

                    <label>
                        Passwort
                        <input
                            id="login-password"
                            name="password"
                            type="password"
                            placeholder="Im Testmodus leer lassen"
                        >
                    </label>

                    <div
                        id="login-message"
                        class="fo-form-message"
                        role="alert"
                    ></div>

                    <button
                        type="submit"
                        class="fo-primary-button"
                    >
                        Anmelden
                    </button>
                </form>

                <div class="fo-login-footer">
                    <button data-route="${ROUTES.PRIVACY}">
                        Datenschutz
                    </button>
                    <span>·</span>
                    <button data-route="${ROUTES.IMPRINT}">
                        Impressum
                    </button>
                </div>
            </section>
        </main>
    `;
}

function getNavItems(role) {
    const common = [
        { route: ROUTES.OVERVIEW, icon: "home", label: "Start" },
        { route: ROUTES.OBJECTS, icon: "objects", label: "Objekte" },
        { route: ROUTES.TASKS, icon: "tasks", label: "Aufgaben" },
        { route: ROUTES.COMMUNICATION, icon: "communication", label: "Meldungen" },
        { route: ROUTES.MORE, icon: "more", label: "Mehr" }
    ];

    if (
        ["SUPER_ADMIN", "ADMIN", "OBJEKTLEITER"]
            .includes(normalizeRole(role))
    ) {
        return [
            common[0],
            common[1],
            { route: ROUTES.PERSONNEL, icon: "users", label: "Benutzer" },
            common[3],
            common[4]
        ];
    }

    return common;
}

function renderNavigation(state, desktop = false) {
    const items = getNavItems(state?.currentUser?.role);

    return `
        <nav class="${desktop ? "fo-sidebar-nav" : "fo-bottom-nav"}">
            ${items.map((item) => `
                <button
                    type="button"
                    class="${runtime.route === item.route ? "is-active" : ""}"
                    data-route="${escapeHtml(item.route)}"
                >
                    <span class="fo-nav-icon">${renderIcon(item.icon)}</span>
                    <span>${escapeHtml(item.label)}</span>
                </button>
            `).join("")}
        </nav>
    `;
}

function renderSidebar(state) {
    return `
        <aside class="fo-sidebar">
            <div class="fo-sidebar-brand">
                <span class="fo-brand-icon">▦</span>
                <strong>FACILITY OS</strong>
            </div>

            ${renderNavigation(state, true)}

            <div class="fo-sidebar-system">
                <span>SYSTEM</span>
                <button data-route="${ROUTES.SETTINGS}">
                    <span>${renderIcon("settings")}</span>
                    Einstellungen
                </button>
                <button data-action="logout">
                    <span>↪</span>
                    Abmelden
                </button>
            </div>

            <div class="fo-version">v1.0.0</div>
        </aside>
    `;
}

function renderTopbar(state) {
    const user = state?.currentUser;
    return `
        <header class="fo-topbar">
            <div class="fo-mobile-brand">
                <span class="fo-brand-icon">▦</span>
                <strong>FACILITY OS</strong>
            </div>

            <div class="fo-topbar-copy">
                <h1>${escapeHtml(getPageTitle(runtime.route))}</h1>
                <p>${escapeHtml(getPageSubtitle(runtime.route, state))}</p>
            </div>

            <div class="fo-topbar-actions">
                <button
                    type="button"
                    class="fo-notification-button"
                    data-route="${ROUTES.COMMUNICATION}"
                    aria-label="Meldungen"
                >
                    ♧
                    <span>${getStatusCount(state?.notifications)}</span>
                </button>

                <button
                    type="button"
                    class="fo-profile-button"
                    data-route="${ROUTES.MORE}"
                >
                    <span class="fo-avatar">
                        ${escapeHtml(
                            getFirstName(user)
                                .slice(0, 2)
                                .toUpperCase()
                        )}
                    </span>
                    <span class="fo-profile-copy">
                        <strong>${escapeHtml(getFirstName(user))}</strong>
                        <small>${escapeHtml(getRoleLabel(user?.role))}</small>
                    </span>
                </button>
            </div>
        </header>
    `;
}

function getPageTitle(route) {
    const titles = {
        [ROUTES.OVERVIEW]: "Übersicht",
        [ROUTES.OBJECTS]: "Objekte",
        [ROUTES.OBJECT_DETAIL]: "Objektdetails",
        [ROUTES.MATERIALS]: "Material",
        [ROUTES.TASKS]: "Aufgaben",
        [ROUTES.PERSONNEL]: "Benutzer",
        [ROUTES.COMMUNICATION]: "Meldungen",
        [ROUTES.TIMES]: "Zeiten",
        [ROUTES.ANALYSIS]: "Auswertung",
        [ROUTES.REPORTS]: "Berichte",
        [ROUTES.MORE]: "Mehr",
        [ROUTES.SETTINGS]: "Einstellungen",
        [ROUTES.HELP]: "Hilfe",
        [ROUTES.PRIVACY]: "Datenschutz",
        [ROUTES.IMPRINT]: "Impressum"
    };

    return titles[route] ?? "Facility OS";
}

function getPageSubtitle(route, state) {
    if (route === ROUTES.OVERVIEW) {
        return `Willkommen zurück, ${getFirstName(state?.currentUser)}!`;
    }

    if (route === ROUTES.OBJECTS) {
        return "Objekte auswählen und verwalten.";
    }

    return "Alle wichtigen Funktionen an einem Ort.";
}

function renderStatCard({
    icon,
    label,
    value,
    hint,
    tone
}) {
    return `
        <article class="fo-stat-card fo-tone-${tone}">
            <span class="fo-stat-icon">${renderIcon(icon)}</span>
            <div>
                <span>${escapeHtml(label)}</span>
                <strong>${escapeHtml(value)}</strong>
                <small>${escapeHtml(hint)}</small>
            </div>
        </article>
    `;
}

function renderModuleCard({
    icon,
    title,
    description,
    route,
    tone
}) {
    return `
        <button
            type="button"
            class="fo-module-card fo-tone-${tone}"
            data-route="${escapeHtml(route)}"
        >
            <span class="fo-module-icon">${renderIcon(icon)}</span>

            <span class="fo-module-copy">
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(description)}</small>
            </span>

            <span class="fo-module-arrow">›</span>
        </button>
    `;
}

function renderOverview(state) {
    const role = normalizeRole(state?.currentUser?.role);
    const objectCount = asArray(state?.objects).length;
    const openTasks = getStatusCount(state?.tasks);
    const openRequests =
        getStatusCount(state?.tickets) +
        getStatusCount(state?.customerRequests);

    const moduleItems = [
        {
            icon: "objects",
            title: "Objekte",
            description: "Verwalte alle Gebäude und Liegenschaften.",
            route: ROUTES.OBJECTS,
            tone: "blue"
        },
        {
            icon: "maintenance",
            title: role === "MITARBEITER" ? "Aufgaben" : "Wartung",
            description: role === "MITARBEITER"
                ? "Offene Reinigungsaufgaben bearbeiten."
                : "Plane und verwalte Wartungsarbeiten.",
            route: ROUTES.TASKS,
            tone: "green"
        },
        {
            icon: "request",
            title: "Anfragen",
            description: "Verwalte Anfragen und Nachrichten.",
            route: ROUTES.COMMUNICATION,
            tone: "orange"
        },
        {
            icon: "cleaning",
            title: "Reinigung",
            description: "Plane und dokumentiere Reinigungsarbeiten.",
            route: ROUTES.TASKS,
            tone: "purple"
        },
        {
            icon: "control",
            title: "Kontrollen",
            description: "Führe Kontrollen durch und dokumentiere.",
            route: ROUTES.REPORTS,
            tone: "purple"
        },
        {
            icon: "documents",
            title: "Dokumente",
            description: "Verwalte Berichte und Dateien.",
            route: ROUTES.REPORTS,
            tone: "blue"
        },
        {
            icon: "communication",
            title: "Meldungen",
            description: "Erstelle und verwalte Meldungen.",
            route: ROUTES.COMMUNICATION,
            tone: "yellow"
        },
        {
            icon: "users",
            title: role === "MITARBEITER" ? "Material" : "Benutzer",
            description: role === "MITARBEITER"
                ? "Bestände prüfen und Bedarf melden."
                : "Verwalte Benutzer und Berechtigungen.",
            route: role === "MITARBEITER"
                ? ROUTES.MATERIALS
                : ROUTES.PERSONNEL,
            tone: "cyan"
        }
    ];

    return `
        <section class="fo-dashboard">
            <div class="fo-mobile-welcome">
                <h1>Übersicht</h1>
                <p>Willkommen zurück, ${escapeHtml(getFirstName(state?.currentUser))}!</p>
            </div>

            <section class="fo-stats-grid">
                ${renderStatCard({
                    icon: "objects",
                    label: "Objekte",
                    value: objectCount,
                    hint: "Alle Objekte",
                    tone: "blue"
                })}

                ${renderStatCard({
                    icon: "maintenance",
                    label: role === "MITARBEITER" ? "Aufgaben" : "Wartungen",
                    value: openTasks,
                    hint: "Diese Woche",
                    tone: "green"
                })}

                ${renderStatCard({
                    icon: "request",
                    label: "Anfragen",
                    value: openRequests,
                    hint: "Offen",
                    tone: "orange"
                })}
            </section>

            <section class="fo-panel">
                <div class="fo-panel-heading">
                    <h2>Module</h2>
                </div>

                <div class="fo-module-grid">
                    ${moduleItems.map(renderModuleCard).join("")}
                </div>
            </section>

            <section class="fo-dashboard-bottom">
                <article class="fo-panel">
                    <div class="fo-panel-heading">
                        <h2>Letzte Aktivitäten</h2>
                    </div>

                    <div class="fo-activity-list">
                        <div>
                            <span class="fo-activity-icon fo-tone-green">
                                ${renderIcon("maintenance")}
                            </span>
                            <p>
                                <strong>Wartung abgeschlossen</strong>
                                <small>Heizungswartung im ausgewählten Objekt</small>
                            </p>
                            <time>Heute, 09:15</time>
                        </div>

                        <div>
                            <span class="fo-activity-icon fo-tone-orange">
                                ${renderIcon("request")}
                            </span>
                            <p>
                                <strong>Neue Anfrage</strong>
                                <small>Neue Kundenmeldung eingegangen</small>
                            </p>
                            <time>Heute, 08:42</time>
                        </div>

                        <div>
                            <span class="fo-activity-icon fo-tone-purple">
                                ${renderIcon("control")}
                            </span>
                            <p>
                                <strong>Kontrolle durchgeführt</strong>
                                <small>Sicherheitskontrolle dokumentiert</small>
                            </p>
                            <time>Gestern, 16:30</time>
                        </div>
                    </div>
                </article>

                <article class="fo-panel fo-system-panel">
                    <div class="fo-panel-heading">
                        <h2>Systemstatus</h2>
                    </div>

                    <div class="fo-system-list">
                        <div>
                            <span></span>
                            <p>
                                <strong>Alle Systeme aktiv</strong>
                                <small>Keine Störungen</small>
                            </p>
                        </div>
                        <div>
                            <span></span>
                            <p>
                                <strong>Datenbestand</strong>
                                <small>Lokale Testdaten geladen</small>
                            </p>
                        </div>
                        <div>
                            <span></span>
                            <p>
                                <strong>Präsentationsmodus</strong>
                                <small>Bereit für die Vorführung</small>
                            </p>
                        </div>
                    </div>
                </article>
            </section>
        </section>
    `;
}

function getVisibleObjects(state) {
    const role = normalizeRole(state?.currentUser?.role);
    const allObjects = asArray(state?.objects)
        .filter((object) => object?.active !== false);

    if (
        ["SUPER_ADMIN", "ADMIN", "BUCHHALTUNG"]
            .includes(role)
    ) {
        return allObjects;
    }

    const assignedIds = asArray(
        state?.currentUser?.assignedObjectIds ??
        state?.currentUser?.objectIds
    );

    const assigned = allObjects.filter((object) =>
        assignedIds.includes(getObjectId(object))
    );

    return assigned.length > 0
        ? assigned
        : allObjects;
}

function renderObjects(state) {
    const objects = getVisibleObjects(state);

    return `
        <section class="fo-content-page">
            <div class="fo-page-heading">
                <div>
                    <span class="fo-eyebrow">Objektverwaltung</span>
                    <h2>Objekte</h2>
                    <p>Wähle ein Objekt für die heutige Arbeit aus.</p>
                </div>
            </div>

            <div class="fo-object-grid">
                ${objects.map((object) => {
                    const id = getObjectId(object);
                    const selected =
                        id &&
                        id === getObjectId(state?.currentObject);

                    return `
                        <button
                            type="button"
                            class="fo-object-card ${selected ? "is-selected" : ""}"
                            data-object-id="${escapeHtml(id)}"
                        >
                            <span class="fo-object-icon">${renderIcon("objects")}</span>
                            <span>
                                <strong>${escapeHtml(getObjectName(object))}</strong>
                                <small>
                                    ${selected ? "Aktuell ausgewählt" : "Objekt öffnen"}
                                </small>
                            </span>
                            <span>›</span>
                        </button>
                    `;
                }).join("")}
            </div>
        </section>
    `;
}

function renderGenericPage(state, route) {
    const title = getPageTitle(route);

    const cards = [
        {
            icon: route === ROUTES.MATERIALS ? "materials" : "tasks",
            title: `${title} öffnen`,
            text: "Die Grundfunktion ist für die Präsentation erreichbar."
        },
        {
            icon: "reports",
            title: "Übersicht",
            text: "Daten werden aus den vorhandenen Testdateien geladen."
        },
        {
            icon: "help",
            title: "Status",
            text: "Weitere Detailfunktionen werden im nächsten Entwicklungsschritt ergänzt."
        }
    ];

    return `
        <section class="fo-content-page">
            <div class="fo-page-heading">
                <div>
                    <span class="fo-eyebrow">Facility OS</span>
                    <h2>${escapeHtml(title)}</h2>
                    <p>${escapeHtml(getPageSubtitle(route, state))}</p>
                </div>

                ${
                    route === ROUTES.MORE
                        ? `
                            <button
                                type="button"
                                class="fo-secondary-button"
                                data-action="logout"
                            >
                                Abmelden
                            </button>
                        `
                        : ""
                }
            </div>

            <div class="fo-generic-grid">
                ${cards.map((card) => `
                    <article class="fo-generic-card">
                        <span>${renderIcon(card.icon)}</span>
                        <div>
                            <strong>${escapeHtml(card.title)}</strong>
                            <p>${escapeHtml(card.text)}</p>
                        </div>
                    </article>
                `).join("")}
            </div>

            ${
                route === ROUTES.TIMES
                    ? renderShiftPanel(state)
                    : ""
            }
        </section>
    `;
}

function renderShiftPanel(state) {
    const running =
        state?.shiftStarted === true &&
        Boolean(state?.currentShift);

    return `
        <section class="fo-shift-panel">
            <div>
                <span class="fo-eyebrow">Arbeitszeit</span>
                <h3>${running ? "Schicht läuft" : "Keine laufende Schicht"}</h3>
                <p>${escapeHtml(getObjectName(state?.currentObject))}</p>
            </div>

            <button
                type="button"
                class="${running ? "fo-danger-button" : "fo-primary-button"}"
                data-action="${running ? "checkout" : "checkin"}"
            >
                ${running ? "Schicht beenden" : "Schicht starten"}
            </button>
        </section>
    `;
}

function renderPage(state) {
    if (runtime.route === ROUTES.OVERVIEW) {
        return renderOverview(state);
    }

    if (runtime.route === ROUTES.OBJECTS) {
        return renderObjects(state);
    }

    return renderGenericPage(state, runtime.route);
}

function renderAppShell(state) {
    return `
        <div class="fo-app-shell">
            ${renderSidebar(state)}

            <div class="fo-app-area">
                ${renderTopbar(state)}

                <main class="fo-main-content">
                    ${renderPage(state)}
                </main>

                ${renderNavigation(state, false)}
            </div>
        </div>
    `;
}

function setLoginMessage(message) {
    const element =
        document.getElementById("login-message");

    if (element) {
        element.textContent = normalizeText(message);
    }
}

async function handleLoginSubmit(event) {
    event.preventDefault();

    const form = event.target;
    const formData = new FormData(form);

    try {
        setLoginMessage("");

        await runtime.onLogin?.({
            identifier: formData.get("identifier"),
            password: formData.get("password")
        });
    }
    catch (error) {
        console.error("Login fehlgeschlagen:", error);
        setLoginMessage(
            error instanceof Error
                ? error.message
                : String(error)
        );
    }
}

async function handleClick(event) {
    const routeButton =
        event.target.closest("[data-route]");

    if (routeButton) {
        event.preventDefault();
        const route =
            routeButton.getAttribute("data-route");

        if (
            runtime.route === ROUTES.LOGIN &&
            [ROUTES.PRIVACY, ROUTES.IMPRINT]
                .includes(route)
        ) {
            return;
        }

        runtime.onNavigate?.(route);
        return;
    }

    const objectButton =
        event.target.closest("[data-object-id]");

    if (objectButton) {
        event.preventDefault();

        try {
            await runtime.onSelectObject?.(
                objectButton.getAttribute("data-object-id")
            );

            runtime.onNavigate?.(ROUTES.OVERVIEW);
        }
        catch (error) {
            console.error("Objektauswahl fehlgeschlagen:", error);
            window.alert(
                error instanceof Error
                    ? error.message
                    : String(error)
            );
        }
        return;
    }

    const actionButton =
        event.target.closest("[data-action]");

    if (!actionButton) {
        return;
    }

    event.preventDefault();

    const action =
        actionButton.getAttribute("data-action");

    try {
        if (action === "logout") {
            await runtime.onLogout?.();
        }

        if (action === "checkin") {
            await runtime.onCheckin?.();
        }

        if (action === "checkout") {
            await runtime.onCheckout?.();
        }
    }
    catch (error) {
        console.error(`Aktion "${action}" fehlgeschlagen:`, error);
        window.alert(
            error instanceof Error
                ? error.message
                : String(error)
        );
    }
}

function bindEvents() {
    const root = getAppRoot();

    if (!root || eventsBound) {
        return;
    }

    root.addEventListener("click", handleClick);
    root.addEventListener("submit", (event) => {
        if (event.target?.id === "login-form") {
            handleLoginSubmit(event);
        }
    });

    eventsBound = true;
}

export function renderApp(options = {}) {
    const root = getAppRoot();

    if (!root) {
        throw new Error(
            'Das App-Element mit der ID "app" wurde nicht gefunden.'
        );
    }

    runtime.route =
        normalizeText(options.route) ||
        ROUTES.LOGIN;

    runtime.state =
        options.state &&
        typeof options.state === "object"
            ? options.state
            : {};

    runtime.onNavigate =
        typeof options.onNavigate === "function"
            ? options.onNavigate
            : null;

    runtime.onLogin =
        typeof options.onLogin === "function"
            ? options.onLogin
            : null;

    runtime.onLogout =
        typeof options.onLogout === "function"
            ? options.onLogout
            : null;

    runtime.onCheckin =
        typeof options.onCheckin === "function"
            ? options.onCheckin
            : null;

    runtime.onCheckout =
        typeof options.onCheckout === "function"
            ? options.onCheckout
            : null;

    runtime.onSelectObject =
        typeof options.onSelectObject === "function"
            ? options.onSelectObject
            : null;

    root.innerHTML =
        runtime.route === ROUTES.LOGIN ||
        !runtime.state?.currentUser
            ? renderLogin(runtime.state)
            : renderAppShell(runtime.state);

    bindEvents();

    return true;
}


============================================================
DATEI 2
PFAD: src/styles/base.css
VOLLSTÄNDIG ERSETZEN
============================================================

/************************************************
 * Facility OS
 * base.css
 *
 * Dunkles responsives Präsentationsdesign
 ************************************************/

:root {
    --fo-bg: #061224;
    --fo-bg-deep: #030b18;
    --fo-sidebar: #071426;
    --fo-surface: #0d1d33;
    --fo-surface-2: #12243c;
    --fo-border: rgba(151, 174, 211, 0.16);
    --fo-text: #f7f9ff;
    --fo-text-soft: #b4c1d6;
    --fo-muted: #7f8da4;
    --fo-blue: #5278ff;
    --fo-blue-soft: rgba(82, 120, 255, 0.2);
    --fo-green: #31d27c;
    --fo-green-soft: rgba(49, 210, 124, 0.18);
    --fo-orange: #ffae43;
    --fo-orange-soft: rgba(255, 174, 67, 0.18);
    --fo-purple: #9c73ff;
    --fo-purple-soft: rgba(156, 115, 255, 0.2);
    --fo-yellow: #ffd34f;
    --fo-yellow-soft: rgba(255, 211, 79, 0.18);
    --fo-cyan: #2edbd7;
    --fo-cyan-soft: rgba(46, 219, 215, 0.18);
    --fo-red: #f05f71;
    --fo-shadow: 0 20px 55px rgba(0, 0, 0, 0.36);
    --fo-radius: 14px;
    --fo-sidebar-width: 270px;
    --fo-bottom-nav-height: 78px;
}

* {
    box-sizing: border-box;
}

html {
    min-height: 100%;
    background: var(--fo-bg-deep);
}

body {
    margin: 0;
    min-width: 320px;
    min-height: 100vh;
    min-height: 100dvh;
    overflow-x: hidden;
    background:
        radial-gradient(
            circle at top right,
            rgba(61, 102, 210, 0.13),
            transparent 32%
        ),
        linear-gradient(
            180deg,
            #09162a 0%,
            var(--fo-bg) 56%,
            var(--fo-bg-deep) 100%
        );
    color: var(--fo-text);
    font-family:
        Inter,
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        sans-serif;
    font-size: 16px;
    -webkit-font-smoothing: antialiased;
}

button,
input,
select {
    font: inherit;
}

button {
    color: inherit;
    cursor: pointer;
}

button:focus-visible,
input:focus-visible,
select:focus-visible {
    outline: 3px solid rgba(82, 120, 255, 0.45);
    outline-offset: 2px;
}

#app {
    min-height: 100vh;
    min-height: 100dvh;
}

.loading-screen {
    display: grid;
    min-height: 100vh;
    min-height: 100dvh;
    place-items: center;
    color: var(--fo-text-soft);
}

/* LOGIN */

.fo-login-page {
    display: grid;
    min-height: 100vh;
    min-height: 100dvh;
    place-items: center;
    padding: 24px;
}

.fo-login-card {
    width: min(100%, 440px);
    padding: 28px;
    border: 1px solid var(--fo-border);
    border-radius: 22px;
    background: rgba(13, 29, 51, 0.95);
    box-shadow: var(--fo-shadow);
    backdrop-filter: blur(18px);
}

.fo-login-brand,
.fo-sidebar-brand,
.fo-mobile-brand {
    display: flex;
    align-items: center;
    gap: 13px;
}

.fo-brand-icon {
    display: grid;
    width: 46px;
    height: 46px;
    place-items: center;
    border-radius: 13px;
    background: var(--fo-blue-soft);
    color: #708fff;
    font-size: 27px;
    font-weight: 900;
}

.fo-login-brand strong,
.fo-sidebar-brand strong,
.fo-mobile-brand strong {
    display: block;
    letter-spacing: 0.02em;
}

.fo-login-brand span:not(.fo-brand-icon) {
    display: block;
    margin-top: 3px;
    color: var(--fo-muted);
    font-size: 13px;
}

.fo-login-copy {
    margin: 28px 0 22px;
}

.fo-eyebrow {
    display: block;
    margin-bottom: 7px;
    color: #7792ff;
    font-size: 12px;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.fo-login-copy h1,
.fo-mobile-welcome h1,
.fo-page-heading h2 {
    margin: 0 0 8px;
    font-size: clamp(28px, 7vw, 36px);
    line-height: 1.1;
}

.fo-login-copy p,
.fo-mobile-welcome p,
.fo-page-heading p {
    margin: 0;
    color: var(--fo-text-soft);
    line-height: 1.5;
}

.fo-login-form {
    display: grid;
    gap: 16px;
}

.fo-login-form label {
    display: grid;
    gap: 8px;
    color: var(--fo-text-soft);
    font-size: 14px;
    font-weight: 700;
}

.fo-login-form input,
.fo-login-form select {
    width: 100%;
    min-height: 50px;
    padding: 0 14px;
    border: 1px solid var(--fo-border);
    border-radius: 12px;
    background: #08172b;
    color: var(--fo-text);
}

.fo-primary-button,
.fo-secondary-button,
.fo-danger-button {
    min-height: 48px;
    padding: 0 18px;
    border: 0;
    border-radius: 12px;
    font-weight: 800;
}

.fo-primary-button {
    background: linear-gradient(135deg, #4c6fff, #6754df);
    color: white;
    box-shadow: 0 10px 26px rgba(78, 105, 255, 0.28);
}

.fo-secondary-button {
    border: 1px solid var(--fo-border);
    background: var(--fo-surface-2);
}

.fo-danger-button {
    background: var(--fo-red);
    color: white;
}

.fo-form-message,
.fo-alert {
    color: #ff8996;
    font-size: 14px;
}

.fo-login-footer {
    display: flex;
    justify-content: center;
    gap: 9px;
    margin-top: 22px;
    color: var(--fo-muted);
}

.fo-login-footer button {
    padding: 4px;
    border: 0;
    background: transparent;
    color: var(--fo-text-soft);
}

/* APP SHELL */

.fo-app-shell {
    min-height: 100vh;
    min-height: 100dvh;
}

.fo-sidebar {
    display: none;
}

.fo-app-area {
    min-width: 0;
}

.fo-topbar {
    position: sticky;
    top: 0;
    z-index: 40;
    display: flex;
    min-height: 82px;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding:
        calc(12px + env(safe-area-inset-top))
        18px
        12px;
    border-bottom: 1px solid var(--fo-border);
    background: rgba(5, 16, 32, 0.94);
    backdrop-filter: blur(18px);
}

.fo-mobile-brand {
    min-width: 0;
}

.fo-mobile-brand .fo-brand-icon {
    width: 40px;
    height: 40px;
    font-size: 23px;
}

.fo-mobile-brand strong {
    font-size: 17px;
    white-space: nowrap;
}

.fo-topbar-copy {
    display: none;
}

.fo-topbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;
}

.fo-notification-button,
.fo-profile-button {
    border: 0;
    background: transparent;
}

.fo-notification-button {
    position: relative;
    width: 42px;
    height: 42px;
    color: var(--fo-text-soft);
    font-size: 23px;
}

.fo-notification-button span {
    position: absolute;
    top: 1px;
    right: 0;
    display: grid;
    min-width: 19px;
    height: 19px;
    place-items: center;
    padding: 0 5px;
    border-radius: 99px;
    background: #4e65df;
    color: white;
    font-size: 11px;
    font-weight: 800;
}

.fo-profile-button {
    display: flex;
    align-items: center;
    gap: 9px;
}

.fo-avatar {
    display: grid;
    width: 42px;
    height: 42px;
    place-items: center;
    border-radius: 50%;
    background: #243550;
    color: white;
    font-weight: 800;
}

.fo-profile-copy {
    display: none;
}

.fo-main-content {
    width: min(100%, 1260px);
    margin: 0 auto;
    padding:
        24px
        16px
        calc(var(--fo-bottom-nav-height) + env(safe-area-inset-bottom) + 24px);
}

.fo-dashboard {
    display: grid;
    gap: 20px;
}

.fo-mobile-welcome {
    display: block;
}

.fo-stats-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 12px;
}

.fo-stat-card {
    display: flex;
    min-width: 0;
    min-height: 126px;
    align-items: center;
    gap: 14px;
    padding: 16px;
    border: 1px solid var(--fo-border);
    border-radius: var(--fo-radius);
    background: linear-gradient(
        145deg,
        rgba(18, 36, 60, 0.98),
        rgba(10, 26, 47, 0.98)
    );
}

.fo-stat-icon,
.fo-module-icon,
.fo-activity-icon {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    border-radius: 12px;
    font-weight: 900;
}

.fo-stat-icon {
    width: 54px;
    height: 54px;
    font-size: 28px;
}

.fo-stat-card div {
    min-width: 0;
}

.fo-stat-card div > span,
.fo-stat-card small {
    display: block;
    color: var(--fo-text-soft);
    font-size: 13px;
}

.fo-stat-card strong {
    display: block;
    margin: 4px 0;
    font-size: 27px;
}

.fo-panel {
    padding: 18px;
    border: 1px solid var(--fo-border);
    border-radius: var(--fo-radius);
    background: linear-gradient(
        145deg,
        rgba(16, 33, 56, 0.97),
        rgba(9, 24, 43, 0.97)
    );
}

.fo-panel-heading {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.fo-panel-heading h2 {
    margin: 0;
    font-size: 20px;
}

.fo-module-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
}

.fo-module-card {
    position: relative;
    display: grid;
    min-width: 0;
    min-height: 132px;
    grid-template-columns: 54px minmax(0, 1fr) 16px;
    align-items: center;
    gap: 13px;
    padding: 16px;
    border: 1px solid var(--fo-border);
    border-radius: 13px;
    background: rgba(20, 39, 65, 0.82);
    text-align: left;
    transition:
        transform 160ms ease,
        border-color 160ms ease,
        background 160ms ease;
}

.fo-module-card:active {
    transform: scale(0.985);
}

.fo-module-icon {
    width: 54px;
    height: 54px;
    font-size: 26px;
}

.fo-module-copy {
    min-width: 0;
}

.fo-module-copy strong,
.fo-module-copy small {
    display: block;
}

.fo-module-copy strong {
    margin-bottom: 7px;
    font-size: 17px;
}

.fo-module-copy small {
    color: var(--fo-text-soft);
    font-size: 13px;
    line-height: 1.45;
}

.fo-module-arrow {
    color: var(--fo-text-soft);
    font-size: 30px;
}

.fo-dashboard-bottom {
    display: grid;
    gap: 18px;
}

.fo-activity-list > div,
.fo-system-list > div {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 0;
    border-bottom: 1px solid var(--fo-border);
}

.fo-activity-list > div:last-child,
.fo-system-list > div:last-child {
    border-bottom: 0;
}

.fo-activity-icon {
    width: 46px;
    height: 46px;
}

.fo-activity-list p,
.fo-system-list p {
    min-width: 0;
    flex: 1;
    margin: 0;
}

.fo-activity-list strong,
.fo-activity-list small,
.fo-system-list strong,
.fo-system-list small {
    display: block;
}

.fo-activity-list small,
.fo-system-list small {
    margin-top: 4px;
    color: var(--fo-text-soft);
}

.fo-activity-list time {
    color: var(--fo-text-soft);
    font-size: 12px;
    white-space: nowrap;
}

.fo-system-list > div > span {
    width: 11px;
    height: 11px;
    flex: 0 0 11px;
    border-radius: 50%;
    background: var(--fo-green);
    box-shadow: 0 0 12px rgba(49, 210, 124, 0.7);
}

/* TONES */

.fo-tone-blue .fo-stat-icon,
.fo-tone-blue.fo-stat-icon,
.fo-tone-blue .fo-module-icon,
.fo-tone-blue.fo-activity-icon {
    background: var(--fo-blue-soft);
    color: #6283ff;
}

.fo-tone-green .fo-stat-icon,
.fo-tone-green.fo-stat-icon,
.fo-tone-green .fo-module-icon,
.fo-tone-green.fo-activity-icon {
    background: var(--fo-green-soft);
    color: var(--fo-green);
}

.fo-tone-orange .fo-stat-icon,
.fo-tone-orange.fo-stat-icon,
.fo-tone-orange .fo-module-icon,
.fo-tone-orange.fo-activity-icon {
    background: var(--fo-orange-soft);
    color: var(--fo-orange);
}

.fo-tone-purple .fo-stat-icon,
.fo-tone-purple.fo-stat-icon,
.fo-tone-purple .fo-module-icon,
.fo-tone-purple.fo-activity-icon {
    background: var(--fo-purple-soft);
    color: var(--fo-purple);
}

.fo-tone-yellow .fo-module-icon {
    background: var(--fo-yellow-soft);
    color: var(--fo-yellow);
}

.fo-tone-cyan .fo-module-icon {
    background: var(--fo-cyan-soft);
    color: var(--fo-cyan);
}

/* CONTENT PAGES */

.fo-content-page {
    display: grid;
    gap: 18px;
}

.fo-page-heading {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
}

.fo-object-grid,
.fo-generic-grid {
    display: grid;
    gap: 13px;
}

.fo-object-card {
    display: grid;
    min-height: 92px;
    grid-template-columns: 52px minmax(0, 1fr) 20px;
    align-items: center;
    gap: 13px;
    padding: 15px;
    border: 1px solid var(--fo-border);
    border-radius: 14px;
    background: var(--fo-surface);
    text-align: left;
}

.fo-object-card.is-selected {
    border-color: #5d7dff;
    background: rgba(82, 120, 255, 0.16);
}

.fo-object-icon {
    display: grid;
    width: 52px;
    height: 52px;
    place-items: center;
    border-radius: 12px;
    background: var(--fo-blue-soft);
    color: #6d89ff;
    font-size: 26px;
}

.fo-object-card strong,
.fo-object-card small {
    display: block;
}

.fo-object-card small {
    margin-top: 5px;
    color: var(--fo-text-soft);
}

.fo-generic-grid {
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
}

.fo-generic-card {
    display: flex;
    min-height: 130px;
    gap: 15px;
    padding: 18px;
    border: 1px solid var(--fo-border);
    border-radius: 14px;
    background: var(--fo-surface);
}

.fo-generic-card > span {
    font-size: 30px;
}

.fo-generic-card strong {
    display: block;
    margin-bottom: 8px;
}

.fo-generic-card p {
    margin: 0;
    color: var(--fo-text-soft);
    line-height: 1.5;
}

.fo-shift-panel {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    padding: 18px;
    border: 1px solid var(--fo-border);
    border-radius: 14px;
    background: var(--fo-surface);
}

.fo-shift-panel h3,
.fo-shift-panel p {
    margin: 0;
}

.fo-shift-panel p {
    margin-top: 5px;
    color: var(--fo-text-soft);
}

/* MOBILE NAV */

.fo-bottom-nav {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    z-index: 50;
    display: grid;
    min-height: var(--fo-bottom-nav-height);
    grid-template-columns: repeat(5, 1fr);
    padding:
        8px
        8px
        calc(8px + env(safe-area-inset-bottom));
    border-top: 1px solid var(--fo-border);
    background: rgba(5, 16, 32, 0.97);
    backdrop-filter: blur(18px);
}

.fo-bottom-nav button {
    position: relative;
    display: grid;
    min-width: 0;
    min-height: 58px;
    place-items: center;
    gap: 4px;
    padding: 5px 2px;
    border: 0;
    background: transparent;
    color: #8c99ae;
    font-size: 12px;
}

.fo-bottom-nav button.is-active {
    color: #6581ff;
}

.fo-bottom-nav button.is-active::after {
    position: absolute;
    bottom: -1px;
    width: 32px;
    height: 3px;
    border-radius: 99px;
    background: #5b73ff;
    content: "";
}

.fo-nav-icon {
    font-size: 24px;
    line-height: 1;
}

/* TABLET */

@media (max-width: 700px) {
    .fo-stats-grid {
        gap: 8px;
    }

    .fo-stat-card {
        min-height: 120px;
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
        padding: 13px;
    }

    .fo-stat-icon {
        width: 48px;
        height: 48px;
        font-size: 24px;
    }

    .fo-stat-card strong {
        font-size: 24px;
    }

    .fo-stat-card div > span,
    .fo-stat-card small {
        font-size: 12px;
    }

    .fo-module-card {
        min-height: 142px;
        grid-template-columns: 48px minmax(0, 1fr) 14px;
        gap: 10px;
        padding: 13px;
    }

    .fo-module-icon {
        width: 48px;
        height: 48px;
        font-size: 23px;
    }

    .fo-module-copy strong {
        font-size: 16px;
    }

    .fo-module-copy small {
        font-size: 12px;
    }

    .fo-activity-list > div {
        display: grid;
        grid-template-columns: 46px minmax(0, 1fr);
    }

    .fo-activity-list time {
        grid-column: 2;
    }

    .fo-shift-panel {
        align-items: stretch;
        flex-direction: column;
    }
}

@media (max-width: 380px) {
    .fo-main-content {
        padding-right: 12px;
        padding-left: 12px;
    }

    .fo-module-grid {
        grid-template-columns: 1fr;
    }

    .fo-stats-grid {
        grid-template-columns: 1fr;
    }

    .fo-stat-card {
        min-height: 100px;
        flex-direction: row;
    }

    .fo-mobile-brand strong {
        font-size: 15px;
    }
}

/* DESKTOP */

@media (min-width: 900px) {
    body {
        background: #e9edf4;
        padding: 24px;
    }

    #app {
        min-height: calc(100vh - 48px);
    }

    .fo-app-shell {
        display: grid;
        min-height: calc(100vh - 48px);
        grid-template-columns: var(--fo-sidebar-width) minmax(0, 1fr);
        overflow: hidden;
        border-radius: 12px;
        background: var(--fo-bg);
        box-shadow: 0 20px 45px rgba(10, 20, 37, 0.28);
    }

    .fo-sidebar {
        position: relative;
        display: flex;
        min-height: 100%;
        flex-direction: column;
        padding: 28px 20px 20px;
        border-right: 1px solid var(--fo-border);
        background:
            linear-gradient(
                180deg,
                #071326 0%,
                #061121 100%
            );
    }

    .fo-sidebar-brand {
        padding: 0 10px 25px;
        border-bottom: 1px solid var(--fo-border);
    }

    .fo-sidebar-nav {
        display: grid;
        gap: 7px;
        margin-top: 18px;
    }

    .fo-sidebar-nav button,
    .fo-sidebar-system button {
        display: flex;
        min-height: 47px;
        align-items: center;
        gap: 13px;
        padding: 0 14px;
        border: 0;
        border-radius: 9px;
        background: transparent;
        color: var(--fo-text-soft);
        text-align: left;
    }

    .fo-sidebar-nav button.is-active {
        background: linear-gradient(
            90deg,
            rgba(79, 72, 196, 0.95),
            rgba(66, 83, 180, 0.95)
        );
        color: white;
    }

    .fo-sidebar-system {
        display: grid;
        gap: 5px;
        margin-top: auto;
        padding-top: 28px;
        border-top: 1px solid var(--fo-border);
    }

    .fo-sidebar-system > span {
        padding: 0 14px 8px;
        color: var(--fo-muted);
        font-size: 11px;
        letter-spacing: 0.08em;
    }

    .fo-version {
        width: max-content;
        margin: 18px auto 0;
        padding: 5px 9px;
        border: 1px solid var(--fo-border);
        border-radius: 7px;
        color: var(--fo-text-soft);
        font-size: 12px;
    }

    .fo-app-area {
        min-width: 0;
    }

    .fo-topbar {
        min-height: 96px;
        padding: 18px 28px;
    }

    .fo-mobile-brand {
        display: none;
    }

    .fo-topbar-copy {
        display: block;
    }

    .fo-topbar-copy h1,
    .fo-topbar-copy p {
        margin: 0;
    }

    .fo-topbar-copy h1 {
        margin-bottom: 5px;
        font-size: 25px;
    }

    .fo-topbar-copy p {
        color: var(--fo-text-soft);
    }

    .fo-profile-copy {
        display: block;
        text-align: left;
    }

    .fo-profile-copy strong,
    .fo-profile-copy small {
        display: block;
    }

    .fo-profile-copy small {
        margin-top: 3px;
        color: var(--fo-text-soft);
    }

    .fo-main-content {
        max-width: none;
        padding: 24px 28px 32px;
    }

    .fo-mobile-welcome {
        display: none;
    }

    .fo-stats-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
    }

    .fo-stats-grid::after {
        display: flex;
        min-height: 126px;
        align-items: center;
        padding: 16px;
        border: 1px solid var(--fo-border);
        border-radius: var(--fo-radius);
        background:
            linear-gradient(
                145deg,
                rgba(18, 36, 60, 0.98),
                rgba(10, 26, 47, 0.98)
            );
        color: var(--fo-text-soft);
        content: "Kontrollen  •  Bereit";
        font-weight: 700;
    }

    .fo-module-grid {
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 18px;
    }

    .fo-module-card {
        min-height: 140px;
    }

    .fo-dashboard-bottom {
        grid-template-columns: 1.35fr 1fr;
    }

    .fo-bottom-nav {
        display: none;
    }

    .fo-object-grid {
        grid-template-columns:
            repeat(auto-fit, minmax(270px, 1fr));
    }
}

