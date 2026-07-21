import { ROUTES } from "../../../router.js";

const arr=value=>Array.isArray(value)?value:[];
const txt=value=>String(value??"").trim();

function icon(name){
    return ({
        clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
        invoice:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
        warning:'<svg viewBox="0 0 24 24"><path d="M12 3 2 21h20z"/><path d="M12 9v5M12 18h.01"/></svg>',
        proof:'<svg viewBox="0 0 24 24"><path d="M6 3h8l4 4v14H6z"/><path d="M14 3v5h5"/><path d="m9 15 2 2 4-4"/></svg>',
        cost:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M15 8.5A4 4 0 1 0 15 15.5M8 11h6M8 14h5"/></svg>',
        calendar:'<svg viewBox="0 0 24 24"><path d="M4 6h16v14H4z"/><path d="M8 3v6M16 3v6M4 10h16"/></svg>',
        export:'<svg viewBox="0 0 24 24"><path d="M12 3v12"/><path d="m8 7 4-4 4 4"/><path d="M5 13v7h14v-7"/></svg>',
        arrow:'<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>'
    }[name]??"");
}

function completedHours(state){
    return arr(state?.shifts).reduce((sum,shift)=>{
        const start=new Date(shift?.startTime??shift?.checkinTime??"");
        const end=new Date(shift?.endTime??shift?.checkoutTime??"");
        if(Number.isNaN(start.getTime())||Number.isNaN(end.getTime())) return sum;
        return sum+Math.max(0,(end-start)/3600000);
    },0);
}

function openDeviations(state){
    return arr(state?.timeDeviations).filter(entry=>
        !["DONE","APPROVED","COMPLETED","ERLEDIGT"].includes(
            txt(entry?.status).toUpperCase()
        )
    ).length;
}

export function renderAccountingDashboard(state={}){
    const hours=completedHours(state);
    const deviations=openDeviations(state);
    const proofs=arr(state?.taskLogs).filter(entry=>
        Boolean(entry?.photo??entry?.audio??entry?.text??entry?.proof)
    ).length;
    const objects=arr(state?.objects).filter(entry=>entry?.active!==false).length;

    const modules=[
        ["clock","Arbeitszeiten","Schichten, Check-ins und geleistete Stunden",ROUTES.TIMES,`${hours.toFixed(1)} Std.`],
        ["invoice","Abrechnung","Abrechnungsdaten und freizugebende Zeitr&auml;ume",ROUTES.REPORTS,"Vorbereiten"],
        ["warning","Zeitabweichungen","Zu kurze, zu lange oder unvollst&auml;ndige Schichten",ROUTES.TIMES,`${deviations} offen`],
        ["proof","Nachweise","Fotos, Audio, Texte und Aufgabenbelege",ROUTES.REPORTS,`${proofs} Nachweise`],
        ["cost","Objektkosten","Zeit-, Material- und Zusatzkosten je Objekt",ROUTES.ANALYSIS,`${objects} Objekte`],
        ["calendar","Monats&uuml;bersicht","Monatliche Stunden, Abweichungen und Summen",ROUTES.ANALYSIS,"Aktueller Monat"],
        ["export","Exporte","Abrechnungs- und Zeitdaten exportieren",ROUTES.REPORTS,"CSV / PDF"]
    ];

    return `
        <section class="role-dashboard accounting-dashboard">
            <header class="dashboard-heading">
                <div>
                    <span class="eyebrow">BUCHHALTUNG</span>
                    <h1>&Uuml;bersicht</h1>
                    <p>Arbeitszeiten, Nachweise und Abrechnungsdaten zentral pr&uuml;fen.</p>
                </div>
            </header>

            <section class="dashboard-metrics">
                <button class="metric-card" data-route="${ROUTES.TIMES}" type="button">
                    <span class="card-icon tone-blue">${icon("clock")}</span>
                    <span><small>Erfasste Stunden</small><strong>${hours.toFixed(1)}</strong></span>
                </button>
                <button class="metric-card" data-route="${ROUTES.TIMES}" type="button">
                    <span class="card-icon tone-orange">${icon("warning")}</span>
                    <span><small>Zeitabweichungen</small><strong>${deviations}</strong></span>
                </button>
                <button class="metric-card" data-route="${ROUTES.REPORTS}" type="button">
                    <span class="card-icon tone-green">${icon("proof")}</span>
                    <span><small>Nachweise</small><strong>${proofs}</strong></span>
                </button>
            </section>

            <section class="dashboard-panel">
                <div class="panel-heading">
                    <div>
                        <h2>Buchhaltungsbereiche</h2>
                        <p>Alle abrechnungsrelevanten Daten in einer strukturierten Ansicht.</p>
                    </div>
                </div>

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
                <div class="panel-heading">
                    <div>
                        <h2>Letzte Aktivit&auml;ten</h2>
                        <p>Zuletzt gepr&uuml;fte oder vorbereitete Buchhaltungsdaten.</p>
                    </div>
                </div>

                <div class="activity-list">
                    <article><span class="activity-dot tone-blue"></span><div><strong>Dashboard ge&ouml;ffnet</strong><small>Gerade eben</small></div></article>
                    <article><span class="activity-dot tone-green"></span><div><strong>${hours.toFixed(1)} Stunden erfasst</strong><small>Aktueller Datenstand</small></div></article>
                    <article><span class="activity-dot tone-orange"></span><div><strong>${deviations} offene Zeitabweichungen</strong><small>Pr&uuml;fung erforderlich</small></div></article>
                </div>
            </section>
        </section>
    `;
}