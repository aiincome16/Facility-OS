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

