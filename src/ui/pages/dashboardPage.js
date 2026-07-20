import { renderEmployeeDashboard } from "./dashboards/employeeDashboard.js";

const roleOf=value=>String(value??"").trim().toUpperCase();

export function renderDashboardPage(state={}){
  const role=roleOf(state?.currentUser?.role);

  if(role==="MITARBEITER"){
    return renderEmployeeDashboard(state);
  }

  const label={
    SUPER_ADMIN:"Super-Admin",
    ADMIN:"Administrator",
    OBJEKTLEITER:"Objektleiter",
    BUCHHALTUNG:"Buchhaltung",
    KUNDE:"Kunde"
  }[role]??"Benutzer";

  return `<section class="role-dashboard">
    <header class="dashboard-heading">
      <div>
        <span class="eyebrow">${label.toUpperCase()}</span>
        <h1>&Uuml;bersicht</h1>
        <p>Das rollenspezifische Dashboard wird als n&auml;chster Schritt umgesetzt.</p>
      </div>
    </header>

    <section class="dashboard-panel">
      <div class="panel-heading">
        <div>
          <h2>Letzte Aktivit&auml;ten</h2>
          <p>Dieser Bereich bleibt auf jedem Dashboard erhalten.</p>
        </div>
      </div>
      <div class="activity-list">
        <article><span class="activity-dot tone-blue"></span><div><strong>Dashboard ge&ouml;ffnet</strong><small>Gerade eben</small></div></article>
      </div>
    </section>
  </section>`;
}
