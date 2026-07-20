import { ROUTES } from "../../../router.js";

const arr=v=>Array.isArray(v)?v:[];
const txt=v=>String(v??"").trim();
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const oid=o=>txt(o?.id??o?.objectId??o?.ID);
const oname=o=>txt(o?.name??o?.objectName??o?.Name??o?.Objekt_Name)||"Objekt";

function assignedObjects(state){
  const user=state?.currentUser??{};
  const uid=txt(user?.id??user?.userId);
  const ids=arr(user?.assignedObjectIds??user?.objectIds).map(String);
  const all=arr(state?.objects).filter(o=>o?.active!==false);
  const own=all.filter(o=>ids.includes(oid(o))||arr(o?.assignedEmployeeIds??o?.employeeIds??o?.assignedUserIds).map(String).includes(uid));
  return own.length?own:all;
}

function currentShift(state){
  const uid=txt(state?.currentUser?.id??state?.currentUser?.userId);
  if(state?.currentShift&&[state.currentShift.userId,state.currentShift.employeeId].map(String).includes(uid)) return state.currentShift;
  return arr(state?.shifts).find(s=>{
    const status=txt(s?.status).toUpperCase();
    const mine=[s?.userId,s?.employeeId].map(String).includes(uid);
    const running=["RUNNING","ACTIVE"].includes(status)||(Boolean(s?.startTime??s?.checkinTime)&&!Boolean(s?.endTime??s?.checkoutTime)&&!["FINISHED","COMPLETED","CANCELLED"].includes(status));
    return mine&&running;
  })??null;
}

const svg=n=>({
clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 7v5l3 2"/></svg>',
building:'<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
tasks:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
message:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
box:'<svg viewBox="0 0 24 24"><path d="M4 7 12 3l8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
arrow:'<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
play:'<svg viewBox="0 0 24 24"><path d="m8 5 11 7-11 7z"/></svg>',
stop:'<svg viewBox="0 0 24 24"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>'
}[n]??"");

export function renderEmployeeDashboard(state={}){
  const user=state?.currentUser??{};
  const first=txt(user?.firstName??user?.name??user?.displayName??user?.email).split(/\s+/)[0]||"Mitarbeiter";
  const objects=assignedObjects(state);
  const shift=currentShift(state);
  const ids=objects.map(oid);
  const tasks=arr(state?.tasks).filter(t=>ids.includes(txt(t?.objectId))&&!["DONE","COMPLETED","ERLEDIGT"].includes(txt(t?.status).toUpperCase())).length;
  const messages=[...arr(state?.tickets),...arr(state?.notifications),...arr(state?.messages)].filter(m=>(!m?.objectId||ids.includes(txt(m?.objectId)))&&!["DONE","CLOSED","COMPLETED","ERLEDIGT"].includes(txt(m?.status).toUpperCase())).length;

  return `<section class="role-dashboard">
    <header class="dashboard-heading"><div><span class="eyebrow">MITARBEITER</span><h1>&Uuml;bersicht</h1><p>Willkommen zur&uuml;ck, ${esc(first)}.</p></div></header>

    <section class="employee-time-card">
      <div class="employee-time-copy"><span class="card-icon tone-blue">${svg("clock")}</span><div><small>Heutige Arbeitszeit</small><strong>${esc(shift?.plannedStart??"--:--")} bis ${esc(shift?.plannedEnd??"--:--")}</strong><span>${shift?"Schicht l&auml;uft":"Noch keine Schicht gestartet"}</span></div></div>
      <button class="shift-button ${shift?"danger":"success"}" data-action="${shift?"checkout":"checkin"}" type="button"><span>${svg(shift?"stop":"play")}</span>${shift?"Schicht beenden":"Schicht starten"}</button>
    </section>

    <section class="dashboard-metrics">
      <button class="metric-card" data-route="${ROUTES.TASKS}" type="button"><span class="card-icon tone-purple">${svg("tasks")}</span><span><small>Offene Aufgaben</small><strong>${tasks}</strong></span></button>
      <button class="metric-card" data-route="${ROUTES.COMMUNICATION}" type="button"><span class="card-icon tone-orange">${svg("message")}</span><span><small>Offene Meldungen</small><strong>${messages}</strong></span></button>
      <button class="metric-card" data-route="${ROUTES.MATERIALS}" type="button"><span class="card-icon tone-green">${svg("box")}</span><span><small>Materialmeldung</small><strong>Neu</strong></span></button>
    </section>

    <section class="dashboard-panel"><div class="panel-heading"><div><h2>Heutige Objekte</h2><p>Objekt antippen und Unterpunkte &ouml;ffnen.</p></div></div>
      <div class="today-object-list">${objects.map(o=>`<button class="today-object-card" data-object-id="${esc(oid(o))}" type="button"><span class="card-icon tone-blue">${svg("building")}</span><span><strong>${esc(oname(o))}</strong><small>Objektdetails &ouml;ffnen</small></span><span class="arrow-icon">${svg("arrow")}</span></button>`).join("")||'<div class="empty-state">Keine Objekte zugewiesen.</div>'}</div>
    </section>

    <section class="dashboard-panel"><div class="panel-heading"><div><h2>Letzte Aktivit&auml;ten</h2><p>Deine zuletzt ausgef&uuml;hrten Aktionen.</p></div></div><div class="activity-list"><article><span class="activity-dot tone-green"></span><div><strong>Dashboard ge&ouml;ffnet</strong><small>Gerade eben</small></div></article><article><span class="activity-dot tone-blue"></span><div><strong>${objects.length} Objekte zugewiesen</strong><small>Heute</small></div></article></div></section>
  </section>`;
}
