import { ROUTES } from "../../../router.js";

const arr=value=>Array.isArray(value)?value:[];
const txt=value=>String(value??"").trim();

function icon(name){
    return ({
        users:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M4 20v-2a5 5 0 0 1 10 0v2"/><circle cx="17" cy="9" r="2"/><path d="M15 20v-1a4 4 0 0 1 5-3.5"/></svg>',
        building:'<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
        roles:'<svg viewBox="0 0 24 24"><path d="M4 5h16v14H4z"/><path d="M8 9h8M8 13h5"/></svg>',
        settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 13.5v-3l-2-.8-.8-2 1-2.1-2.1-2.1-2.1 1-2-.8-.8-2h-3l-.8 2-2 .8-2.1-1-2.1 2.1 1 2.1-.8 2-2 .8v3l2 .8.8 2-1 2.1 2.1 2.1 2.1-1 2 .8.8 2h3l.8-2 2-.8 2.1 1 2.1-2.1-1-2.1.8-2z"/></svg>',
        audit:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18H6z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
        notification:'<svg viewBox="0 0 24 24"><path d="M6 9a6 6 0 0 1 12 0v5l2 2H4l2-2z"/><path d="M10 20h4"/></svg>',
        access:'<svg viewBox="0 0 24 24"><circle cx="8" cy="12" r="4"/><path d="M12 12h9M17 12v3M20 12v2"/></svg>',
        reports:'<svg viewBox="0 0 24 24"><path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/></svg>',
        arrow:'<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>'
    }[name]??"");
}

function countRole(state,role){
    return arr(state?.users).filter(user=>txt(user?.role).toUpperCase()===role).length;
}

export function renderAdminDashboard(state={}){
    const users=arr(state?.users);
    const objects=arr(state?.objects).filter(object=>object?.active!==false);
    const notifications=arr(state?.notifications).filter(entry=>
        !["DONE","READ","CLOSED","ERLEDIGT"].includes(txt(entry?.status).toUpperCase())
    ).length;

    const modules=[
        ["users","Benutzerverwaltung","Benutzer anlegen, bearbeiten und deaktivieren",ROUTES.PERSONNEL,`${users.length} Benutzer`],
        ["building","Objektverwaltung","Objekte, R&auml;ume und Zuordnungen verwalten",ROUTES.OVERVIEW,`${objects.length} Objekte`],
        ["roles","Rollen und Rechte","Rollen, Zugriffe und Berechtigungen steuern",ROUTES.SETTINGS,"6 Rollen"],
        ["access","Kundenzugriffe","Kundenportal und sichtbare Bereiche konfigurieren",ROUTES.SETTINGS,`${arr(state?.customerAccess).length} Eintr&auml;ge`],
        ["notification","Benachrichtigungen","Pflichtmeldungen und Systemhinweise verwalten",ROUTES.COMMUNICATION,`${notifications} offen`],
        ["audit","Audit-Log","Nachvollziehbare &Auml;nderungen und Benutzeraktionen",ROUTES.REPORTS,"Protokoll"],
        ["settings","Systemeinstellungen","Objekt-, Sicherheits- und App-Einstellungen",ROUTES.SETTINGS,"Konfiguration"],
        ["reports","Auswertungen","Nutzung, Leistung und Systemstatus auswerten",ROUTES.ANALYSIS,"Berichte"]
    ];

    return `
        <section class="role-dashboard admin-dashboard">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">ADMIN</span>
                    <h1>&Uuml;bersicht</h1>
                    <p>Benutzer, Objekte, Rechte und Systemeinstellungen zentral verwalten.</p>
                </div>
            </header>

            <section class="dashboard-metrics">
                <button class="metric-card" data-route="${ROUTES.PERSONNEL}" type="button">
                    <span class="card-icon tone-blue">${icon("users")}</span>
                    <span><small>Benutzer</small><strong>${users.length}</strong></span>
                </button>
                <button class="metric-card" data-route="${ROUTES.OVERVIEW}" type="button">
                    <span class="card-icon tone-green">${icon("building")}</span>
                    <span><small>Objekte</small><strong>${objects.length}</strong></span>
                </button>
                <button class="metric-card" data-route="${ROUTES.COMMUNICATION}" type="button">
                    <span class="card-icon tone-orange">${icon("notification")}</span>
                    <span><small>Offene Hinweise</small><strong>${notifications}</strong></span>
                </button>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading"><div><h2>Rollen&uuml;bersicht</h2><p>Aktuell hinterlegte Benutzer je Rolle.</p></div></div>
                <div class="object-summary-grid">
                    <article><small>Mitarbeiter</small><strong>${countRole(state,"MITARBEITER")}</strong></article>
                    <article><small>Objektleiter</small><strong>${countRole(state,"OBJEKTLEITER")}</strong></article>
                    <article><small>Kunden</small><strong>${countRole(state,"KUNDE")}</strong></article>
                </div>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading"><div><h2>Administration</h2><p>Zentrale Verwaltungsbereiche von Facility OS.</p></div></div>
                <div class="object-module-grid">
                    ${modules.map(([iconName,title,description,route,badge])=>`
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
                <div class="panel-heading"><div><h2>Letzte Aktivit&auml;ten</h2><p>Zuletzt ausgef&uuml;hrte administrative Aktionen.</p></div></div>
                <div class="activity-list">
                    <article><span class="activity-dot tone-blue"></span><div><strong>Admin-Dashboard ge&ouml;ffnet</strong><small>Gerade eben</small></div></article>
                    <article><span class="activity-dot tone-green"></span><div><strong>${objects.length} aktive Objekte</strong><small>Aktueller Systemstand</small></div></article>
                    <article><span class="activity-dot tone-orange"></span><div><strong>${notifications} offene Systemhinweise</strong><small>Pr&uuml;fung empfohlen</small></div></article>
                </div>
            </section>
        </section>
    `;
}