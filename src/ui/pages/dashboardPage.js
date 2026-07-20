import { renderEmployeeDashboard } from "./dashboards/employeeDashboard.js";
import { renderManagerDashboard } from "./dashboards/managerDashboard.js";

function normalizeRole(value) {
    return String(value ?? "").trim().toUpperCase();
}

function renderPlannedDashboard(state, role) {
    const labels = {
        SUPER_ADMIN: "Super-Admin",
        ADMIN: "Administrator",
        BUCHHALTUNG: "Buchhaltung",
        KUNDE: "Kunde"
    };

    const label = labels[role] ?? "Benutzer";

    return `
        <section class="role-dashboard">
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
                    <article>
                        <span class="activity-dot tone-blue"></span>
                        <div>
                            <strong>Dashboard ge&ouml;ffnet</strong>
                            <small>Gerade eben</small>
                        </div>
                    </article>
                </div>
            </section>
        </section>
    `;
}

export function renderDashboardPage(state = {}) {
    const role = normalizeRole(state?.currentUser?.role);

    if (role === "MITARBEITER") {
        return renderEmployeeDashboard(state);
    }

    if (role === "OBJEKTLEITER") {
        return renderManagerDashboard(state);
    }

    return renderPlannedDashboard(state, role);
}
