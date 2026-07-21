import { renderEmployeeDashboard } from "./dashboards/employeeDashboard.js";
import { renderManagerDashboard } from "./dashboards/managerDashboard.js";
import { renderAccountingDashboard } from "./dashboards/accountingDashboard.js";
import { renderAdminDashboard } from "./dashboards/adminDashboard.js";
import { renderSuperAdminDashboard } from "./dashboards/superAdminDashboard.js";
import { renderCustomerDashboard } from "./dashboards/customerDashboard.js";

function normalizeRole(value) {
    return String(value ?? "").trim().toUpperCase();
}

export function renderDashboardPage(state = {}) {
    const role = normalizeRole(state?.currentUser?.role);

    if (role === "MITARBEITER") {
        return renderEmployeeDashboard(state);
    }

    if (role === "OBJEKTLEITER") {
        return renderManagerDashboard(state);
    }

    if (role === "BUCHHALTUNG") {
        return renderAccountingDashboard(state);
    }

    if (role === "ADMIN") {
        return renderAdminDashboard(state);
    }

    if (role === "SUPER_ADMIN") {
        return renderSuperAdminDashboard(state);
    }

    if (role === "KUNDE") {
        return renderCustomerDashboard(state);
    }

    return `
        <section class="role-dashboard">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">BENUTZER</span>
                    <h1>&Uuml;bersicht</h1>
                    <p>F&uuml;r diese Rolle wurde kein Dashboard gefunden.</p>
                </div>
            </header>
        </section>
    `;
}
