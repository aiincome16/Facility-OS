import { ROUTES } from "../router.js";
import { renderDashboardPage } from "./pages/dashboardPage.js";
import { renderObjectDetailPage } from "./pages/objectDetailPage.js";
import { renderObjectSectionPage } from "./pages/objectSectionPage.js";
import { renderTimesPage } from "./pages/timesPage.js";
import {
    createTimesheetFromShift,
    updateTimesheetStatus
} from "../services/timesheetWorkflowService.js";

const runtime = {
    route: ROUTES.LOGIN,
    state: {},
    objectSection: "",
    onNavigate: null,
    onLogin: null,
    onLogout: null,
    onCheckin: null,
    onCheckout: null,
    onSelectObject: null
};

let eventsBound = false;

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();
const esc = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const root = () => document.getElementById("app");

const userName = (user) => txt(
    user?.displayName ??
    user?.fullName ??
    user?.name ??
    user?.email
) || "Benutzer";

const roleLabel = (role) => ({
    SUPER_ADMIN: "Super-Admin",
    ADMIN: "Administrator",
    OBJEKTLEITER: "Objektleiter",
    MITARBEITER: "Mitarbeiter",
    BUCHHALTUNG: "Buchhaltung",
    KUNDE: "Kunde"
}[txt(role).toUpperCase()] ?? "Benutzer");

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

const icon = (name) => ({
    logo: '<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
    home: '<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
    tasks: '<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
    message: '<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
    more: '<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
    logout: '<svg viewBox="0 0 24 24"><path d="M10 5H5v14h5"/><path d="m15 8 4 4-4 4M19 12H9"/></svg>'
}[name] ?? "");

function renderLogin(state) {
    const users = arr(state?.users).filter((user) => user?.active !== false);

    return `
        <main class="login-page">
            <section class="login-card">
                <div class="brand">
                    <span class="brand-logo">${icon("logo")}</span>
                    <div>
                        <strong>FACILITY OS</strong>
                        <small>Digitale Objektverwaltung</small>
                    </div>
                </div>

                <div class="login-copy">
                    <span>TESTMODUS</span>
                    <h1>Anmelden</h1>
                    <p>W&auml;hle einen Testbenutzer.</p>
                </div>

                <form id="login-form">
                    <label>
                        Benutzer
                        <select name="identifier" required>
                            <option value="">Benutzer ausw&auml;hlen</option>
                            ${users.map((user) => `
                                <option value="${esc(user?.email ?? user?.id ?? "")}">
                                    ${esc(userName(user))}
                                    &middot;
                                    ${esc(roleLabel(user?.role))}
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

function assignedObjects(state) {
    const user = state?.currentUser ?? {};
    const userId = txt(user?.id ?? user?.userId);
    const ids = arr(user?.assignedObjectIds ?? user?.objectIds).map(String);

    const all = arr(state?.objects).filter((object) => object?.active !== false);

    const assigned = all.filter((object) =>
        ids.includes(objectId(object)) ||
        arr(
            object?.assignedEmployeeIds ??
            object?.employeeIds ??
            object?.assignedUserIds
        ).map(String).includes(userId)
    );

    return assigned.length ? assigned : all;
}

function renderMaterials(state) {
    const objects = assignedObjects(state);
    const selected = txt(state?.currentObject?.id);
    const materials = selected
        ? arr(state?.materials).filter((material) =>
            !material?.objectId ||
            txt(material?.objectId) === selected ||
            arr(
                material?.objectIds ??
                material?.assignedObjectIds
            ).map(String).includes(selected)
        )
        : [];

    return `
        <section class="content-page">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">MATERIALMELDUNG</span>
                    <h1>Material bestellen</h1>
                    <p>W&auml;hle Objekt, Material, Einheit und Anzahl.</p>
                </div>
            </header>

            <form id="material-order-form" class="material-order-form">
                <label>
                    Objekt
                    <select id="material-object" name="objectId" required>
                        <option value="">Objekt ausw&auml;hlen</option>
                        ${objects.map((object) => `
                            <option
                                value="${esc(objectId(object))}"
                                ${objectId(object) === selected ? "selected" : ""}
                            >
                                ${esc(objectName(object))}
                            </option>
                        `).join("")}
                    </select>
                </label>

                <label>
                    Material
                    <select name="materialId" required ${selected ? "" : "disabled"}>
                        <option value="">Material ausw&auml;hlen</option>
                        ${materials.map((material) => `
                            <option value="${esc(material?.id ?? material?.materialId ?? "")}">
                                ${esc(material?.name ?? material?.Name ?? "Material")}
                            </option>
                        `).join("")}
                    </select>
                </label>

                <label>
                    Einheit
                    <select name="unit" required ${selected ? "" : "disabled"}>
                        <option value="">Einheit ausw&auml;hlen</option>
                        <option>St&uuml;ck</option>
                        <option>Flasche</option>
                        <option>Liter</option>
                        <option>Packung</option>
                        <option>Rolle</option>
                    </select>
                </label>

                <label>
                    Anzahl
                    <input
                        name="quantity"
                        type="number"
                        min="1"
                        required
                        ${selected ? "" : "disabled"}
                    >
                </label>

                <button
                    type="submit"
                    class="primary"
                    ${selected ? "" : "disabled"}
                >
                    Bestellung absenden
                </button>

                <div id="material-order-message" class="message"></div>
            </form>
        </section>
    `;
}

function renderMorePage(state) {
    const user = state?.currentUser ?? {};

    return `
        <section class="content-page more-page">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">BENUTZERKONTO</span>
                    <h1>Mehr</h1>
                    <p>Profil, Hilfe und Abmeldung.</p>
                </div>
            </header>

            <section class="dashboard-panel">
                <div class="account-summary">
                    <span class="profile-avatar">
                        ${esc(userName(user).slice(0, 2).toUpperCase())}
                    </span>

                    <div>
                        <strong>${esc(userName(user))}</strong>
                        <small>${esc(roleLabel(user?.role))}</small>
                    </div>
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="section-list">
                    <button class="settings-row" data-route="${ROUTES.TIMES}" type="button">
                        <span>Stundenzettel</span>
                        <small>Arbeitszeit-Workflow und Freigaben</small>
                    </button>

                    <button class="settings-row" data-route="${ROUTES.HELP}" type="button">
                        <span>Hilfe und Support</span>
                        <small>Objekt-Guide und Hilfebereich</small>
                    </button>

                    <button class="settings-row" data-route="${ROUTES.SETTINGS}" type="button">
                        <span>Einstellungen</span>
                        <small>Benutzer- und App-Einstellungen</small>
                    </button>
                </div>
            </section>

            <button class="mobile-logout-button" data-action="logout" type="button">
                <span>${icon("logout")}</span>
                Abmelden
            </button>
        </section>
    `;
}

function renderGeneric(route) {
    const title = ({
        [ROUTES.TASKS]: "Aufgaben",
        [ROUTES.COMMUNICATION]: "Meldungen",
        [ROUTES.HELP]: "Hilfe",
        [ROUTES.PERSONNEL]: "Mitarbeiter",
        [ROUTES.REPORTS]: "Berichte",
        [ROUTES.ANALYSIS]: "Auswertungen",
        [ROUTES.SETTINGS]: "Einstellungen"
    }[route] ?? "Facility OS");

    return `
        <section class="content-page">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">FACILITY OS</span>
                    <h1>${title}</h1>
                    <p>Der Inhalt wird im n&auml;chsten Schritt erg&auml;nzt.</p>
                </div>
            </header>
        </section>
    `;
}

function renderNavigation(className) {
    const items = [
        [ROUTES.OVERVIEW, "home", "Start"],
        [ROUTES.TASKS, "tasks", "Aufgaben"],
        [ROUTES.COMMUNICATION, "message", "Meldungen"],
        [ROUTES.MORE, "more", "Mehr"]
    ];

    return `
        <nav class="${className}">
            ${items.map(([route, iconName, label]) => `
                <button
                    data-route="${route}"
                    class="${runtime.route === route ? "active" : ""}"
                    type="button"
                >
                    <span>${icon(iconName)}</span>
                    <small>${label}</small>
                </button>
            `).join("")}
        </nav>
    `;
}

function renderShell(state) {
    let page = renderGeneric(runtime.route);

    if (runtime.route === ROUTES.OVERVIEW) {
        runtime.objectSection = "";
        page = renderDashboardPage(state);
    }

    if (runtime.route === ROUTES.OBJECT_DETAIL) {
        page = runtime.objectSection
            ? renderObjectSectionPage(state, runtime.objectSection)
            : renderObjectDetailPage(state);
    }

    if (runtime.route === ROUTES.MATERIALS) {
        page = renderMaterials(state);
    }

    if (runtime.route === ROUTES.TIMES) {
        page = renderTimesPage(state);
    }

    if (runtime.route === ROUTES.MORE) {
        page = renderMorePage(state);
    }

    const user = state?.currentUser;

    return `
        <div class="app-shell">
            <aside class="sidebar">
                <div class="brand">
                    <span class="brand-logo">${icon("logo")}</span>
                    <strong>FACILITY OS</strong>
                </div>

                ${renderNavigation("sidebar-nav")}

                <button class="logout" data-action="logout" type="button">
                    <span>${icon("logout")}</span>
                    Abmelden
                </button>
            </aside>

            <div class="app-area">
                <header class="topbar">
                    <div class="brand mobile-brand">
                        <span class="brand-logo">${icon("logo")}</span>
                        <strong>FACILITY OS</strong>
                    </div>

                    <div class="profile">
                        <span class="profile-avatar">
                            ${esc(userName(user).slice(0, 2).toUpperCase())}
                        </span>
                        <div>
                            <strong>${esc(userName(user).split(/\s+/)[0])}</strong>
                            <small>${esc(roleLabel(user?.role))}</small>
                        </div>
                    </div>
                </header>

                <main>${page}</main>

                ${renderNavigation("bottom-nav")}
            </div>
        </div>
    `;
}

async function handleSubmit(event) {
    if (event.target?.id === "login-form") {
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

        return;
    }

    if (event.target?.id === "material-order-form") {
        event.preventDefault();

        const message = document.getElementById("material-order-message");

        if (message) {
            message.innerHTML =
                "Materialmeldung vollst&auml;ndig erfasst. Dauerhafte Speicherung folgt.";
        }
    }
}

async function handleClick(event) {
    const timesheetButton = event.target.closest("[data-timesheet-action]");

    if (timesheetButton) {
        try {
            updateTimesheetStatus(
                runtime.state,
                timesheetButton.getAttribute("data-timesheet-id"),
                timesheetButton.getAttribute("data-timesheet-action"),
                runtime.state?.currentUser
            );

            renderApp(runtime);
        }
        catch (error) {
            window.alert(
                error instanceof Error
                    ? error.message
                    : String(error)
            );
        }

        return;
    }

    const sectionButton = event.target.closest("[data-object-section]");

    if (sectionButton) {
        runtime.objectSection = txt(
            sectionButton.getAttribute("data-object-section")
        );

        renderApp(runtime);
        return;
    }

    const sectionBackButton = event.target.closest("[data-object-section-back]");

    if (sectionBackButton) {
        runtime.objectSection = "";
        renderApp(runtime);
        return;
    }

    const routeButton = event.target.closest("[data-route]");

    if (routeButton) {
        runtime.objectSection = "";
        runtime.onNavigate?.(
            routeButton.getAttribute("data-route")
        );
        return;
    }

    const objectButton = event.target.closest("[data-object-id]");

    if (objectButton) {
        try {
            await runtime.onSelectObject?.(
                objectButton.getAttribute("data-object-id")
            );

            runtime.objectSection = "";
            runtime.onNavigate?.(
                ROUTES.OBJECT_DETAIL
            );
        }
        catch (error) {
            window.alert(
                error instanceof Error
                    ? error.message
                    : String(error)
            );
        }

        return;
    }

    const action = event.target
        .closest("[data-action]")
        ?.getAttribute("data-action");

    try {
        if (action === "logout") {
            runtime.objectSection = "";
            await runtime.onLogout?.();
        }

        if (action === "checkin") {
            await runtime.onCheckin?.();
        }

        if (action === "checkout") {
            const completedShift = await runtime.onCheckout?.();

            if (completedShift) {
                createTimesheetFromShift(
                    runtime.state,
                    completedShift
                );

                runtime.onNavigate?.(
                    ROUTES.TIMES
                );
            }
        }
    }
    catch (error) {
        window.alert(
            error instanceof Error
                ? error.message
                : String(error)
        );
    }
}

async function handleChange(event) {
    if (
        event.target?.id !== "material-object" ||
        !event.target.value
    ) {
        return;
    }

    try {
        await runtime.onSelectObject?.(
            event.target.value
        );

        runtime.objectSection = "";
        runtime.onNavigate?.(
            ROUTES.MATERIALS
        );
    }
    catch (error) {
        window.alert(
            error instanceof Error
                ? error.message
                : String(error)
        );
    }
}

function bindEvents() {
    const app = root();

    if (!app || eventsBound) {
        return;
    }

    app.addEventListener("submit", handleSubmit);
    app.addEventListener("click", handleClick);
    app.addEventListener("change", handleChange);

    eventsBound = true;
}

export function renderApp(options = {}) {
    const app = root();

    if (!app) {
        throw new Error('Das Element "#app" wurde nicht gefunden.');
    }

    runtime.route = txt(options.route) || runtime.route || ROUTES.LOGIN;
    runtime.state =
        options.state && typeof options.state === "object"
            ? options.state
            : runtime.state;

    if (typeof options.objectSection === "string") {
        runtime.objectSection = options.objectSection;
    }

    for (const key of [
        "onNavigate",
        "onLogin",
        "onLogout",
        "onCheckin",
        "onCheckout",
        "onSelectObject"
    ]) {
        if (typeof options[key] === "function") {
            runtime[key] = options[key];
        }
    }

    app.innerHTML =
        runtime.route === ROUTES.LOGIN ||
        !runtime.state?.currentUser
            ? renderLogin(runtime.state)
            : renderShell(runtime.state);

    bindEvents();
}
