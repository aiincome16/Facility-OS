import { ROUTES } from "../../../router.js";

const arr = (value) => Array.isArray(value) ? value : [];
const txt = (value) => String(value ?? "").trim();

function icon(name) {
    return ({
        system: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/></svg>',
        users: '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M4 20v-2a5 5 0 0 1 10 0v2"/><circle cx="17" cy="9" r="2"/><path d="M15 20v-1a4 4 0 0 1 5-3.5"/></svg>',
        building: '<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
        shield: '<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z"/></svg>',
        audit: '<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
        config: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.8-.8-2 1-2.1-2.1-2.1-2.1 1-2-.8-.8-2h-3l-.8 2-2 .8-2.1-1-2.1 2.1 1 2.1-.8 2-2 .8v3l2 .8.8 2-1 2.1 2.1 2.1 2.1-1 2 .8.8 2h3l.8-2 2-.8 2.1 1 2.1-2.1-1-2.1.8-2z"/></svg>',
        data: '<svg viewBox="0 0 24 24"><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v7c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12v7c0 1.7 3.6 3 8 3s8-1.3 8-3v-7"/></svg>',
        analytics: '<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
        alert: '<svg viewBox="0 0 24 24"><path d="M12 3 2 21h20z"/><path d="M12 9v5M12 18h.01"/></svg>',
        arrow: '<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>'
    }[name] ?? "");
}

function countRole(state, role) {
    return arr(state?.users).filter(
        (user) => txt(user?.role).toUpperCase() === role
    ).length;
}

export function renderSuperAdminDashboard(state = {}) {
    const users = arr(state?.users);
    const objects = arr(state?.objects).filter((object) => object?.active !== false);
    const criticalNotifications = arr(state?.notifications).filter((entry) => {
        const priority = txt(entry?.priority ?? entry?.severity).toUpperCase();
        const status = txt(entry?.status).toUpperCase();

        return (
            ["CRITICAL", "HIGH", "DRINGEND"].includes(priority) &&
            !["DONE", "READ", "CLOSED", "ERLEDIGT"].includes(status)
        );
    }).length;

    const modules = [
        ["system", "System&uuml;bersicht", "Gesamtsystem, Module und aktueller Betriebsstatus", ROUTES.ANALYSIS, "System"],
        ["users", "Alle Benutzer", "Rollen&uuml;bergreifende Benutzer- und Kontoverwaltung", ROUTES.PERSONNEL, `${users.length} Benutzer`],
        ["building", "Alle Objekte", "Objekte, R&auml;ume, Zuordnungen und Organisationen", ROUTES.OVERVIEW, `${objects.length} Objekte`],
        ["shield", "Rollen und Sicherheit", "Globale Rollen, Rechte und Sicherheitsvorgaben", ROUTES.SETTINGS, "Vollzugriff"],
        ["audit", "Globales Audit-Log", "Systemweite &Auml;nderungen und Benutzeraktionen", ROUTES.REPORTS, "Protokoll"],
        ["config", "Globale Konfiguration", "App-Konfiguration, Pflichtregeln und Funktionsfreigaben", ROUTES.SETTINGS, "Konfiguration"],
        ["data", "Datenverwaltung", "Datenbest&auml;nde, Integrit&auml;t und Systemexporte", ROUTES.REPORTS, "Daten"],
        ["analytics", "Systemauswertungen", "Nutzung, Leistung, Objekte und Rollen analysieren", ROUTES.ANALYSIS, "Analyse"]
    ];

    return `
        <section class="role-dashboard super-admin-dashboard">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">SUPER-ADMIN</span>
                    <h1>System&uuml;bersicht</h1>
                    <p>Vollst&auml;ndige Kontrolle &uuml;ber Benutzer, Objekte, Rollen und Systemkonfiguration.</p>
                </div>
            </header>

            <section class="dashboard-metrics">
                <button class="metric-card" data-route="${ROUTES.PERSONNEL}" type="button">
                    <span class="card-icon tone-blue">${icon("users")}</span>
                    <span><small>Benutzer gesamt</small><strong>${users.length}</strong></span>
                </button>

                <button class="metric-card" data-route="${ROUTES.OVERVIEW}" type="button">
                    <span class="card-icon tone-green">${icon("building")}</span>
                    <span><small>Aktive Objekte</small><strong>${objects.length}</strong></span>
                </button>

                <button class="metric-card" data-route="${ROUTES.COMMUNICATION}" type="button">
                    <span class="card-icon tone-orange">${icon("alert")}</span>
                    <span><small>Kritische Hinweise</small><strong>${criticalNotifications}</strong></span>
                </button>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Rollen im System</h2>
                        <p>Aktueller Benutzerbestand nach Rolle.</p>
                    </div>
                </div>

                <div class="object-summary-grid">
                    <article><small>Administratoren</small><strong>${countRole(state, "ADMIN")}</strong></article>
                    <article><small>Objektleiter</small><strong>${countRole(state, "OBJEKTLEITER")}</strong></article>
                    <article><small>Mitarbeiter</small><strong>${countRole(state, "MITARBEITER")}</strong></article>
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Systemadministration</h2>
                        <p>Globale Verwaltungs- und Kontrollbereiche von Facility OS.</p>
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
                        <h2>Systemstatus</h2>
                        <p>Aktueller technischer und organisatorischer Zustand.</p>
                    </div>
                    <span class="card-icon tone-green">${icon("system")}</span>
                </div>

                <div class="notice-row">
                    <strong>System betriebsbereit</strong>
                    <small>${criticalNotifications
                        ? `${criticalNotifications} kritische Hinweise m&uuml;ssen gepr&uuml;ft werden.`
                        : "Keine kritischen Systemmeldungen vorhanden."
                    }</small>
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Letzte Aktivit&auml;ten</h2>
                        <p>Zuletzt ausgef&uuml;hrte systemweite Aktionen.</p>
                    </div>
                </div>

                <div class="activity-list">
                    <article>
                        <span class="activity-dot tone-blue"></span>
                        <div>
                            <strong>Super-Admin-Dashboard ge&ouml;ffnet</strong>
                            <small>Gerade eben</small>
                        </div>
                    </article>

                    <article>
                        <span class="activity-dot tone-green"></span>
                        <div>
                            <strong>${users.length} Benutzer im System</strong>
                            <small>Aktueller Systemstand</small>
                        </div>
                    </article>

                    <article>
                        <span class="activity-dot tone-orange"></span>
                        <div>
                            <strong>${criticalNotifications} kritische Hinweise</strong>
                            <small>Aktueller Pr&uuml;fstatus</small>
                        </div>
                    </article>
                </div>
            </section>
        </section>
    `;
}