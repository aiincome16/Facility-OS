import { ROUTES } from "../router.js";

const runtime = {
    route: ROUTES.LOGIN,
    state: {},
    onNavigate: null,
    onLogin: null,
    onLogout: null,
    onSelectObject: null
};

let eventsBound = false;

const asArray = (value) => Array.isArray(value) ? value : [];

const escapeHtml = (value) =>
    String(value ?? "")
        .split("&").join("&amp;")
        .split("<").join("&lt;")
        .split(">").join("&gt;")
        .split('"').join("&quot;")
        .split("'").join("&#039;");

function getRoot() {
    return document.getElementById("app");
}

function getUserName(user) {
    return String(
        user?.displayName ??
        user?.fullName ??
        user?.name ??
        user?.email ??
        "Benutzer"
    ).trim();
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

    return labels[String(role ?? "").toUpperCase()] ?? "Benutzer";
}

function getObjectName(object) {
    return String(
        object?.name ??
        object?.objectName ??
        object?.Name ??
        object?.Objekt_Name ??
        "Objekt"
    ).trim();
}

function getObjectId(object) {
    return String(object?.id ?? object?.objectId ?? object?.ID ?? "").trim();
}

function renderLogin(state) {
    const users = asArray(state?.users).filter((user) => user?.active !== false);

    return `
        <main class="login-page">
            <section class="login-card">
                <div class="brand">
                    <span class="brand-icon">â¦</span>
                    <div>
                        <strong>FACILITY OS</strong>
                        <small>Digitale Objektverwaltung</small>
                    </div>
                </div>

                <div class="login-copy">
                    <span>PRÃSENTATIONSMODUS</span>
                    <h1>Anmelden</h1>
                    <p>WÃ¤hle einen Testbenutzer.</p>
                </div>

                <form id="login-form">
                    <label>
                        Benutzer
                        <select name="identifier" required>
                            <option value="">Benutzer auswÃ¤hlen</option>
                            ${users.map((user) => `
                                <option value="${escapeHtml(user?.email ?? user?.id ?? "")}">
                                    ${escapeHtml(getUserName(user))} Â·
                                    ${escapeHtml(getRoleLabel(user?.role))}
                                </option>
                            `).join("")}
                        </select>
                    </label>

                    <label>
                        Passwort
                        <input
                            name="password"
                            type="password"
                            placeholder="Im Testmodus leer lassen"
                        >
                    </label>

                    <div id="login-message" class="message"></div>

                    <button type="submit" class="primary">
                        Anmelden
                    </button>
                </form>
            </section>
        </main>
    `;
}

function icon(symbol, tone) {
    return `<span class="icon ${tone}">${symbol}</span>`;
}

function renderOverview(state) {
    const user = state?.currentUser;
    const firstName = getUserName(user).split(/\s+/)[0];
    const objects = asArray(state?.objects);
    const tasks = asArray(state?.tasks);
    const tickets = asArray(state?.tickets);

    const modules = [
        ["â¦", "Objekte", "Verwalte alle GebÃ¤ude und Liegenschaften.", ROUTES.OBJECTS, "blue"],
        ["â", "Wartung", "Plane und verwalte Wartungsarbeiten.", ROUTES.TASKS, "green"],
        ["!", "Anfragen", "Verwalte Anfragen und Nachrichten.", ROUTES.COMMUNICATION, "orange"],
        ["â¦", "Reinigung", "Plane und dokumentiere Reinigungsarbeiten.", ROUTES.TASKS, "purple"],
        ["â", "Kontrollen", "FÃ¼hre Kontrollen durch und dokumentiere.", ROUTES.REPORTS, "purple"],
        ["â£", "Dokumente", "Verwalte Berichte und Dateien.", ROUTES.REPORTS, "blue"],
        ["â¤", "Meldungen", "Erstelle und verwalte Meldungen.", ROUTES.COMMUNICATION, "yellow"],
        ["â", "Benutzer", "Verwalte Benutzer und Berechtigungen.", ROUTES.PERSONNEL, "cyan"]
    ];

    return `
        <section class="dashboard">
            <header class="mobile-title">
                <h1>Ãbersicht</h1>
                <p>Willkommen zurÃ¼ck, ${escapeHtml(firstName)}!</p>
            </header>

            <section class="stats">
                <article>${icon("â¦", "blue")}<div><span>Objekte</span><strong>${objects.length}</strong><small>Alle Objekte</small></div></article>
                <article>${icon("â", "green")}<div><span>Wartungen</span><strong>${tasks.length}</strong><small>Diese Woche</small></div></article>
                <article>${icon("!", "orange")}<div><span>Anfragen</span><strong>${tickets.length}</strong><small>Offen</small></div></article>
            </section>

            <section class="panel">
                <h2>Module</h2>

                <div class="module-grid">
                    ${modules.map(([symbol, title, text, route, tone]) => `
                        <button class="module-card" data-route="${escapeHtml(route)}">
                            ${icon(symbol, tone)}
                            <span>
                                <strong>${escapeHtml(title)}</strong>
                                <small>${escapeHtml(text)}</small>
                            </span>
                            <b>âº</b>
                        </button>
                    `).join("")}
                </div>
            </section>

            <section class="panel activities">
                <h2>Letzte AktivitÃ¤ten</h2>
                <div><span class="dot green"></span><p><strong>Wartung abgeschlossen</strong><small>Heute, 09:15</small></p></div>
                <div><span class="dot orange"></span><p><strong>Neue Anfrage</strong><small>Heute, 08:42</small></p></div>
                <div><span class="dot purple"></span><p><strong>Kontrolle durchgefÃ¼hrt</strong><small>Gestern, 16:30</small></p></div>
            </section>
        </section>
    `;
}

function renderObjects(state) {
    const objects = asArray(state?.objects);

    return `
        <section class="content-page">
            <h1>Objekte</h1>
            <p>WÃ¤hle ein Objekt aus.</p>

            <div class="object-list">
                ${objects.map((object) => `
                    <button data-object-id="${escapeHtml(getObjectId(object))}">
                        ${icon("â¦", "blue")}
                        <span>
                            <strong>${escapeHtml(getObjectName(object))}</strong>
                            <small>Objekt Ã¶ffnen</small>
                        </span>
                        <b>âº</b>
                    </button>
                `).join("")}
            </div>
        </section>
    `;
}

function renderGeneric(route) {
    const titles = {
        [ROUTES.TASKS]: "Aufgaben",
        [ROUTES.COMMUNICATION]: "Meldungen",
        [ROUTES.PERSONNEL]: "Benutzer",
        [ROUTES.REPORTS]: "Berichte",
        [ROUTES.MORE]: "Mehr",
        [ROUTES.MATERIALS]: "Material",
        [ROUTES.TIMES]: "Zeiten",
        [ROUTES.SETTINGS]: "Einstellungen",
        [ROUTES.HELP]: "Hilfe"
    };

    const title = titles[route] ?? "Facility OS";

    return `
        <section class="content-page">
            <h1>${escapeHtml(title)}</h1>
            <p>Dieser Bereich ist fÃ¼r die PrÃ¤sentation erreichbar.</p>

            <article class="generic-card">
                ${icon("â", "green")}
                <div>
                    <strong>Bereit</strong>
                    <small>Die Detailfunktionen werden schrittweise ergÃ¤nzt.</small>
                </div>
            </article>

            ${
                route === ROUTES.MORE
                    ? `<button class="secondary" data-action="logout">Abmelden</button>`
                    : ""
            }
        </section>
    `;
}

function renderNavigation(desktop = false) {
    const items = [
        [ROUTES.OVERVIEW, "â", "Start"],
        [ROUTES.OBJECTS, "â¦", "Objekte"],
        [ROUTES.TASKS, "â", "Aufgaben"],
        [ROUTES.COMMUNICATION, "â¤", "Meldungen"],
        [ROUTES.MORE, "â¢â¢â¢", "Mehr"]
    ];

    return `
        <nav class="${desktop ? "sidebar-nav" : "bottom-nav"}">
            ${items.map(([route, symbol, label]) => `
                <button
                    data-route="${route}"
                    class="${runtime.route === route ? "active" : ""}"
                >
                    <span>${symbol}</span>
                    <small>${label}</small>
                </button>
            `).join("")}
        </nav>
    `;
}

function renderShell(state) {
    const user = state?.currentUser;
    let page = renderGeneric(runtime.route);

    if (runtime.route === ROUTES.OVERVIEW) {
        page = renderOverview(state);
    }

    if (runtime.route === ROUTES.OBJECTS) {
        page = renderObjects(state);
    }

    return `
        <div class="app-shell">
            <aside class="sidebar">
                <div class="brand">
                    <span class="brand-icon">â¦</span>
                    <strong>FACILITY OS</strong>
                </div>

                ${renderNavigation(true)}

                <button class="logout" data-action="logout">
                    âª Abmelden
                </button>
            </aside>

            <div class="app-area">
                <header class="topbar">
                    <div class="brand mobile-brand">
                        <span class="brand-icon">â¦</span>
                        <strong>FACILITY OS</strong>
                    </div>

                    <div class="desktop-title">
                        <h1>Ãbersicht</h1>
                        <p>Willkommen zurÃ¼ck!</p>
                    </div>

                    <div class="profile">
                        <span>${escapeHtml(getUserName(user).slice(0, 2).toUpperCase())}</span>
                        <div>
                            <strong>${escapeHtml(getUserName(user).split(/\s+/)[0])}</strong>
                            <small>${escapeHtml(getRoleLabel(user?.role))}</small>
                        </div>
                    </div>
                </header>

                <main>${page}</main>

                ${renderNavigation()}
            </div>
        </div>
    `;
}

async function handleSubmit(event) {
    if (event.target?.id !== "login-form") {
        return;
    }

    event.preventDefault();
    const data = new FormData(event.target);

    try {
        await runtime.onLogin?.({
            identifier: data.get("identifier"),
            password: data.get("password")
        });
    }
    catch (error) {
        const message = document.getElementById("login-message");

        if (message) {
            message.textContent =
                error instanceof Error
                    ? error.message
                    : String(error);
        }
    }
}

async function handleClick(event) {
    const routeButton = event.target.closest("[data-route]");

    if (routeButton) {
        runtime.onNavigate?.(
            routeButton.getAttribute("data-route")
        );
        return;
    }

    const objectButton = event.target.closest("[data-object-id]");

    if (objectButton) {
        await runtime.onSelectObject?.(
            objectButton.getAttribute("data-object-id")
        );

        runtime.onNavigate?.(ROUTES.OVERVIEW);
        return;
    }

    const actionButton = event.target.closest("[data-action]");

    if (actionButton?.getAttribute("data-action") === "logout") {
        await runtime.onLogout?.();
    }
}

function bindEvents() {
    const app = getRoot();

    if (!app || eventsBound) {
        return;
    }

    app.addEventListener("submit", handleSubmit);
    app.addEventListener("click", handleClick);
    eventsBound = true;
}

export function renderApp(options = {}) {
    const app = getRoot();

    if (!app) {
        throw new Error('Das Element "#app" wurde nicht gefunden.');
    }

    runtime.route = String(options.route ?? ROUTES.LOGIN);
    runtime.state =
        options.state && typeof options.state === "object"
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

    runtime.onSelectObject =
        typeof options.onSelectObject === "function"
            ? options.onSelectObject
            : null;

    app.innerHTML =
        runtime.route === ROUTES.LOGIN ||
        !runtime.state?.currentUser
            ? renderLogin(runtime.state)
            : renderShell(runtime.state);

    bindEvents();
}
