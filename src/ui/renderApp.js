import { ROUTES } from "../router.js";
import { renderDashboardPage } from "./pages/dashboardPage.js";

const runtime={route:ROUTES.LOGIN,state:{},onNavigate:null,onLogin:null,onLogout:null,onCheckin:null,onCheckout:null,onSelectObject:null};
let eventsBound=false;

const arr=v=>Array.isArray(v)?v:[];
const txt=v=>String(v??"").trim();
const esc=v=>String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
const root=()=>document.getElementById("app");
const userName=u=>txt(u?.displayName??u?.fullName??u?.name??u?.email)||"Benutzer";
const roleLabel=r=>({SUPER_ADMIN:"Super-Admin",ADMIN:"Administrator",OBJEKTLEITER:"Objektleiter",MITARBEITER:"Mitarbeiter",BUCHHALTUNG:"Buchhaltung",KUNDE:"Kunde"}[txt(r).toUpperCase()]??"Benutzer");
const oid=o=>txt(o?.id??o?.objectId??o?.ID);
const oname=o=>txt(o?.name??o?.objectName??o?.Name??o?.Objekt_Name)||"Objekt";

const svg=n=>({
logo:'<svg viewBox="0 0 24 24"><path d="M4 21V5l8-3 8 3v16"/><path d="M8 8h2M14 8h2M8 12h2M14 12h2M8 16h2M14 16h2"/></svg>',
home:'<svg viewBox="0 0 24 24"><path d="m3 11 9-8 9 8"/><path d="M5 10v10h14V10"/></svg>',
tasks:'<svg viewBox="0 0 24 24"><path d="M9 6h11M9 12h11M9 18h11"/><path d="m4 6 1 1 2-2M4 12l1 1 2-2M4 18l1 1 2-2"/></svg>',
message:'<svg viewBox="0 0 24 24"><path d="M4 5h16v11H8l-4 4z"/></svg>',
more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/></svg>',
arrow:'<svg viewBox="0 0 24 24"><path d="m9 5 7 7-7 7"/></svg>',
rooms:'<svg viewBox="0 0 24 24"><path d="M4 4h16v16H4z"/><path d="M12 4v16M4 12h16"/></svg>',
box:'<svg viewBox="0 0 24 24"><path d="M4 7 12 3l8 4-8 4z"/><path d="M4 7v10l8 4 8-4V7"/><path d="M12 11v10"/></svg>',
guide:'<svg viewBox="0 0 24 24"><path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M8 8h7M8 12h7"/></svg>',
shield:'<svg viewBox="0 0 24 24"><path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6z"/></svg>'
}[n]??"");

function renderLogin(state){
  const users=arr(state?.users).filter(u=>u?.active!==false);
  return `<main class="login-page"><section class="login-card">
    <div class="brand"><span class="brand-logo">${svg("logo")}</span><div><strong>FACILITY OS</strong><small>Digitale Objektverwaltung</small></div></div>
    <div class="login-copy"><span>TESTMODUS</span><h1>Anmelden</h1><p>W&auml;hle einen Testbenutzer.</p></div>
    <form id="login-form"><label>Benutzer<select name="identifier" required><option value="">Benutzer ausw&auml;hlen</option>${users.map(u=>`<option value="${esc(u?.email??u?.id??"")}">${esc(userName(u))} &middot; ${esc(roleLabel(u?.role))}</option>`).join("")}</select></label><label>Passwort<input name="password" type="password" placeholder="Im Testmodus leer lassen"></label><div id="login-message" class="message"></div><button type="submit" class="primary">Anmelden</button></form>
  </section></main>`;
}

function renderObjectDetail(state){
  const o=state?.currentObject;
  if(!o) return `<section class="content-page"><h1>Objekt</h1><div class="empty-state">Es wurde kein Objekt ausgew&auml;hlt.</div></section>`;

  const items=[
    ["rooms","R&auml;ume","R&auml;ume und zugeh&ouml;rige Aufgaben",ROUTES.TASKS],
    ["tasks","Aufgaben","Heutige Aufgaben und Arbeitsstatus",ROUTES.TASKS],
    ["guide","Objekt-Guide","Abl&auml;ufe, Dosierungen und Arbeitsanweisungen",ROUTES.HELP],
    ["box","Materialbestand","Bestand pr&uuml;fen und Material melden",ROUTES.MATERIALS],
    ["message","Meldungen","Sch&auml;den, Hinweise und Kundenw&uuml;nsche",ROUTES.COMMUNICATION],
    ["shield","Sicherung","Schl&uuml;ssel, M&uuml;ll und Schlie&szlig;zeiten",ROUTES.MORE]
  ];

  return `<section class="content-page"><header class="dashboard-heading"><div><span class="eyebrow">AKTUELLES OBJEKT</span><h1>${esc(oname(o))}</h1><p>Objektspezifische Arbeitsbereiche</p></div></header><div class="object-function-grid">${items.map(([i,t,d,r])=>`<button class="object-function-card" data-route="${r}" type="button"><span class="card-icon tone-blue">${svg(i)}</span><span><strong>${t}</strong><small>${d}</small></span><span class="arrow-icon">${svg("arrow")}</span></button>`).join("")}</div></section>`;
}

function assignedObjects(state){
  const u=state?.currentUser??{},uid=txt(u?.id??u?.userId),ids=arr(u?.assignedObjectIds??u?.objectIds).map(String);
  const all=arr(state?.objects).filter(o=>o?.active!==false);
  const own=all.filter(o=>ids.includes(oid(o))||arr(o?.assignedEmployeeIds??o?.employeeIds??o?.assignedUserIds).map(String).includes(uid));
  return own.length?own:all;
}

function renderMaterials(state){
  const objects=assignedObjects(state);
  const selected=txt(state?.currentObject?.id);
  const materials=selected?arr(state?.materials).filter(m=>!m?.objectId||txt(m?.objectId)===selected||arr(m?.objectIds??m?.assignedObjectIds).map(String).includes(selected)):[];
  return `<section class="content-page"><header class="dashboard-heading"><div><span class="eyebrow">MATERIALMELDUNG</span><h1>Material bestellen</h1><p>Zuerst muss ein zugewiesenes Objekt gew&auml;hlt werden.</p></div></header>
  <form id="material-order-form" class="material-order-form">
    <label>Objekt<select id="material-object" name="objectId" required><option value="">Objekt ausw&auml;hlen</option>${objects.map(o=>`<option value="${esc(oid(o))}" ${oid(o)===selected?"selected":""}>${esc(oname(o))}</option>`).join("")}</select></label>
    <label>Material<select name="materialId" required ${selected?"":"disabled"}><option value="">Material ausw&auml;hlen</option>${materials.map(m=>`<option value="${esc(m?.id??m?.materialId??"")}">${esc(m?.name??m?.Name??"Material")}</option>`).join("")}</select></label>
    <label>Einheit<select name="unit" required ${selected?"":"disabled"}><option value="">Einheit ausw&auml;hlen</option><option>St&uuml;ck</option><option>Flasche</option><option>Liter</option><option>Packung</option><option>Rolle</option></select></label>
    <label>Anzahl<input name="quantity" type="number" min="1" required ${selected?"":"disabled"}></label>
    <button type="submit" class="primary" ${selected?"":"disabled"}>Bestellung absenden</button><div id="material-order-message" class="message"></div>
  </form></section>`;
}

function generic(route){
  const title=({[ROUTES.TASKS]:"Aufgaben",[ROUTES.COMMUNICATION]:"Meldungen",[ROUTES.MORE]:"Mehr",[ROUTES.HELP]:"Hilfe",[ROUTES.PERSONNEL]:"Mitarbeiter",[ROUTES.TIMES]:"Zeiten",[ROUTES.REPORTS]:"Berichte"}[route]??"Facility OS");
  return `<section class="content-page"><header class="dashboard-heading"><div><span class="eyebrow">FACILITY OS</span><h1>${title}</h1><p>Der rollenspezifische Inhalt wird im n&auml;chsten Schritt erg&auml;nzt.</p></div></header></section>`;
}

function nav(cls){
  const items=[[ROUTES.OVERVIEW,"home","Start"],[ROUTES.TASKS,"tasks","Aufgaben"],[ROUTES.COMMUNICATION,"message","Meldungen"],[ROUTES.MORE,"more","Mehr"]];
  return `<nav class="${cls}">${items.map(([r,i,l])=>`<button data-route="${r}" class="${runtime.route===r?"active":""}" type="button"><span>${svg(i)}</span><small>${l}</small></button>`).join("")}</nav>`;
}

function shell(state){
  let page=generic(runtime.route);
  if(runtime.route===ROUTES.OVERVIEW) page=renderDashboardPage(state);
  if(runtime.route===ROUTES.OBJECT_DETAIL) page=renderObjectDetail(state);
  if(runtime.route===ROUTES.MATERIALS) page=renderMaterials(state);
  const u=state?.currentUser;
  return `<div class="app-shell"><aside class="sidebar"><div class="brand"><span class="brand-logo">${svg("logo")}</span><strong>FACILITY OS</strong></div>${nav("sidebar-nav")}<button class="logout" data-action="logout" type="button">Abmelden</button></aside><div class="app-area"><header class="topbar"><div class="brand mobile-brand"><span class="brand-logo">${svg("logo")}</span><strong>FACILITY OS</strong></div><div class="profile"><span class="profile-avatar">${esc(userName(u).slice(0,2).toUpperCase())}</span><div><strong>${esc(userName(u).split(/\s+/)[0])}</strong><small>${esc(roleLabel(u?.role))}</small></div></div></header><main>${page}</main>${nav("bottom-nav")}</div></div>`;
}

async function submit(e){
  if(e.target?.id==="login-form"){
    e.preventDefault(); const d=new FormData(e.target);
    try{await runtime.onLogin?.({identifier:d.get("identifier"),password:d.get("password")});}
    catch(err){const m=document.getElementById("login-message");if(m)m.textContent=err instanceof Error?err.message:String(err);}
  }else if(e.target?.id==="material-order-form"){
    e.preventDefault(); const m=document.getElementById("material-order-message");if(m)m.innerHTML="Materialmeldung vollst&auml;ndig erfasst. Dauerhafte Speicherung folgt.";
  }
}

async function click(e){
  const r=e.target.closest("[data-route]");
  if(r){runtime.onNavigate?.(r.getAttribute("data-route"));return;}
  const o=e.target.closest("[data-object-id]");
  if(o){try{await runtime.onSelectObject?.(o.getAttribute("data-object-id"));runtime.onNavigate?.(ROUTES.OBJECT_DETAIL);}catch(err){alert(err instanceof Error?err.message:String(err));}return;}
  const a=e.target.closest("[data-action]")?.getAttribute("data-action");
  try{
    if(a==="logout")await runtime.onLogout?.();
    if(a==="checkin")await runtime.onCheckin?.();
    if(a==="checkout")await runtime.onCheckout?.();
  }catch(err){alert(err instanceof Error?err.message:String(err));}
}

async function change(e){
  if(e.target?.id!=="material-object"||!e.target.value)return;
  try{await runtime.onSelectObject?.(e.target.value);runtime.onNavigate?.(ROUTES.MATERIALS);}catch(err){alert(err instanceof Error?err.message:String(err));}
}

function bind(){
  const app=root(); if(!app||eventsBound)return;
  app.addEventListener("submit",submit);app.addEventListener("click",click);app.addEventListener("change",change);eventsBound=true;
}

export function renderApp(options={}){
  const app=root(); if(!app)throw new Error('Das Element "#app" wurde nicht gefunden.');
  runtime.route=txt(options.route)||ROUTES.LOGIN;
  runtime.state=options.state&&typeof options.state==="object"?options.state:{};
  for(const key of ["onNavigate","onLogin","onLogout","onCheckin","onCheckout","onSelectObject"])runtime[key]=typeof options[key]==="function"?options[key]:null;
  app.innerHTML=runtime.route===ROUTES.LOGIN||!runtime.state?.currentUser?renderLogin(runtime.state):shell(runtime.state);
  bind();
}