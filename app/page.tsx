 "use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Activity, Antenna, Bell, Boxes, Cable, ChartNoAxesCombined, CheckSquare, ChevronDown,
  ChevronLeft, ChevronRight, CircleHelp, ClipboardCheck, CloudUpload, Database, Download,
  FileClock, FileSpreadsheet, Filter, Gauge, HardDrive, LayoutDashboard, ListChecks,
  Menu, Network, Plus, RadioTower, RefreshCw, Search, Settings, ShieldCheck, Signal,
  SlidersHorizontal, Table2, Users, Wifi, X, ArrowUpRight, CircleAlert, CalendarDays,
  BookOpen, MonitorCog, Save
} from "lucide-react";
import sampleData from "../public/sample-data.json";

type Row = Record<string, any>;
const NAV = [
  { label: "Dashboard", icon: LayoutDashboard, group: "OVERVIEW" },
  { label: "Site Master", icon: Database, key: "SITE_MASTER", group: "DATABASE" },
  { label: "Vendor Master", icon: Users, key: "VENDOR_MASTER", group: "DATABASE" },
  { label: "Site Reguler Down", icon: Signal, key: "SITE_REGULER_DOWN", group: "DATABASE" },
  { label: "HUB & Beam", icon: RadioTower, key: "HUB_MASTER", group: "DATABASE" },
  { label: "CAC Database", icon: ShieldCheck, key: "CAC_DATABASE", group: "DATABASE" },
  { label: "RCA Database", icon: CircleHelp, key: "RCA_DATABASE", group: "DATABASE" },
  { label: "Update Template", icon: FileSpreadsheet, key: "UPDATE_TEMPLATE", group: "OPERASIONAL" },
  { label: "Pergantian Modem", icon: RefreshCw, key: "LOG_PERGANTIAN_MODEM", group: "OPERASIONAL" },
  { label: "Log Swab Modem", icon: Cable, key: "LOG_SWAB_MODEM", group: "OPERASIONAL" },
  { label: "Daily Task", icon: ListChecks, key: "DAILY_CHECKLIST", group: "OPERASIONAL" },
  { label: "Education Asset", icon: BookOpen, key: "EDDUCATION_ASSET", group: "REFERENSI" },
  { label: "User Access", icon: Settings, key: "USER_ACCESS", group: "SYSTEM" }
];
const TITLE: Record<string,string> = {
 SITE_MASTER:"Site Master", VENDOR_MASTER:"Vendor Master", SITE_REGULER_DOWN:"Site Reguler Down", HUB_MASTER:"HUB & Beam",
 CAC_DATABASE:"CAC Database", RCA_DATABASE:"RCA Database", UPDATE_TEMPLATE:"Update Template",
 LOG_PERGANTIAN_MODEM:"Log Pergantian Modem", LOG_SWAB_MODEM:"Log Swab Modem", DAILY_CHECKLIST:"Daily Task",
 EDDUCATION_ASSET:"Education Asset", USER_ACCESS:"User Access"
};
const LABELS: Record<string,string> = {
 "SITE ID":"Site ID","SITE_ID":"Site ID","PENYEDIA":"Penyedia","VENDOR":"Vendor / Mitra","MITRA":"Vendor / Mitra",
 "NAME":"Nama Site","Site Name":"Nama Site","Site ID":"Site ID","HUB":"HUB","Beam":"Beam","Gateway":"Gateway",
 "SN MODEM LAMA":"SN Modem Lama","SN BARU":"SN Modem Baru","SN MODEM ASAL":"SN Modem Asal","SN MODEM TUJUAN":"SN Modem Tujuan",
 "TANGGAL SWAP":"Tanggal Swab","DATE PROGRES":"Tanggal Progres","PIC":"PIC","REASON":"Alasan"
};
const fmt = (v:any) => v === null || v === undefined || v === "" ? "—" : String(v).replace("T00:00:00","").replace(/\.0$/,"");
const columnsFor = (rows:Row[]) => rows.length ? Object.keys(rows[0]).filter(k=>!k.startsWith("FIELD_")) : [];
const initials = (s:string) => s.split(" ").map(x=>x[0]).slice(0,2).join("");

function Status({value}:{value:any}) {
 const v=String(value??"").toLowerCase();
 let cls="neutral";
 if (v.includes("up")||v.includes("online")||v==="aktif"||v==="true") cls="green";
 else if (v.includes("warning")||v.includes("pending")||v.includes("parking")) cls="orange";
 else if (v.includes("down")||v.includes("offline")||v.includes("close")||v==="false") cls="red";
 return <span className={`status ${cls}`}><i />{fmt(value)}</span>;
}
function MiniBars() {
 const bars=[42,58,47,70,54,62,85,63,74,55,67,89,72,61,78,92,66,76,59,83,70,64,88,74,96,77,62,82,71,90,67,80];
 return <div className="bars">{bars.map((h,i)=><span key={i} style={{height:`${h}%`}} />)}</div>;
}
export default function Home() {
 const [active,setActive]=useState("Dashboard");
 const [search,setSearch]=useState("");
 const [filter,setFilter]=useState("Semua");
 const [rowsBySheet,setRowsBySheet]=useState<Record<string,Row[]>>(sampleData as any);
 const [taskChecks,setTaskChecks]=useState<Record<number,boolean>>({});
 const [modal,setModal]=useState(false);
 const [toast,setToast]=useState("");
 const [mobileNav,setMobileNav]=useState(false);
 const [form,setForm]=useState<Record<string,string>>({});
 const [loading,setLoading]=useState(false);
 const [page,setPage]=useState(1);
 const [syncText,setSyncText]=useState("Mode preview · data contoh");
 const activeNav=NAV.find(n=>n.label===active);
 const key=activeNav?.key;
 const rows=key ? (rowsBySheet[key]||[]) : [];
 const columns=columnsFor(rows);
 const filtered=useMemo(()=>rows.filter(r=>{
   const matches=Object.values(r).some(v=>String(v??"").toLowerCase().includes(search.toLowerCase()));
   if(!matches) return false;
   if(filter==="Semua") return true;
   const statusVal=String(r.STATUS??r.Status??r.status??r.TREND??"").toLowerCase();
   return statusVal.includes(filter.toLowerCase());
 }),[rows,search,filter]);
 const pageSize=10;
 const shown=filtered.slice((page-1)*pageSize,page*pageSize);
 const totalPages=Math.max(1,Math.ceil(filtered.length/pageSize));
 useEffect(()=>{setPage(1)},[active,search,filter]);
 const notify=(s:string)=>{setToast(s);setTimeout(()=>setToast(""),3200)};
 const endpoint=process.env.NEXT_PUBLIC_GOOGLE_SCRIPT_URL || "";
 async function sendToSheet(payload:Row) {
   if(!endpoint) return false;
   try {
     const res=await fetch(endpoint,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(payload)});
     return res.ok;
   } catch { return false; }
 }
 const openAdd=()=>{setForm({});setModal(true)};
 const saveForm=async()=>{
   if(!key) return;
   setLoading(true);
   const item:Row={...form, _createdAt:new Date().toISOString(), _source:"NOC Vault Control Web"};
   const ok=await sendToSheet({action:"create",sheet:key,row:item});
   setRowsBySheet(prev=>({...prev,[key]:[item,...(prev[key]||[])]}));
   setModal(false);setLoading(false);
   notify(ok?"Data berhasil dikirim ke Google Sheets.":"Data ditambahkan ke prototype lokal. Atur NEXT_PUBLIC_GOOGLE_SCRIPT_URL untuk sinkronisasi Sheets.");
 };
 const toggleTask=(i:number)=>setTaskChecks(p=>({...p,[i]:!p[i]}));
 const tasks=(rowsBySheet.DAILY_CHECKLIST||[]).filter(r=>r.Task||r.TASK||r["Task"]);
 const taskDone=tasks.reduce((n,r,i)=>n+(taskChecks[i]??Boolean(r["Check List"]===true||String(r["Check List"]).toLowerCase()==="true")?1:0),0);
 const metricSite=(sampleData.SITE_MASTER as any[]).length;
 const metricHub=(sampleData.HUB_MASTER as any[]).length;
 const dashboard=active==="Dashboard";
 const pageHeading=dashboard?"Dashboard Operasional":active;
 const dateLabel=new Intl.DateTimeFormat("id-ID",{weekday:"long",day:"2-digit",month:"long",year:"numeric"}).format(new Date());
 return <div className="app-shell">
   <aside className={`sidebar ${mobileNav?"open":""}`}>
     <div className="brand"><div className="brand-mark"><Antenna size={22}/></div><div><b>NOC <span>VAULT</span></b><small>CONTROL CENTER</small></div><button className="close-nav" onClick={()=>setMobileNav(false)}><X size={18}/></button></div>
     <div className="workspace"><span className="workspace-icon"><RadioTower size={17}/></span><div><b>NOC PT BALI TOWER</b><small>Operational workspace</small></div><ChevronDown size={14}/></div>
     <nav>{["OVERVIEW","DATABASE","OPERASIONAL","REFERENSI","SYSTEM"].map(group=><div className="nav-group" key={group}><p>{group}</p>{NAV.filter(n=>n.group===group).map(n=>{const Icon=n.icon;return <button key={n.label} onClick={()=>{setActive(n.label);setMobileNav(false);setSearch("");setFilter("Semua")}} className={`nav-item ${active===n.label?"active":""}`}><Icon size={17}/><span>{n.label}</span>{n.label==="Daily Task"&&<em>Today</em>}</button>})}</div>)}</nav>
     <div className="sidebar-bottom"><div className="connection"><span className="pulse"/><div><b>System status</b><small>{endpoint?"Endpoint configured":"Preview mode"}</small></div></div><div className="user-mini"><div className="avatar">PI</div><div><b>PT. Paramitra Intimega</b><small>Operator workspace</small></div><ChevronDown size={15}/></div></div>
   </aside>
   {mobileNav&&<div className="scrim" onClick={()=>setMobileNav(false)}/>}
   <main className="main">
     <header className="topbar"><button className="mobile-menu" onClick={()=>setMobileNav(true)}><Menu size={20}/></button><div className="crumb"><span>Workspace</span><ChevronRight size={13}/><b>{pageHeading}</b></div><div className="top-actions"><span className="live"><i/> SYSTEM ONLINE</span><button className="icon-button" title="Notifikasi" onClick={()=>notify("Tidak ada notifikasi baru.")}><Bell size={18}/><i className="notification-dot"/></button><div className="top-user"><div className="avatar">PI</div><div><b>PT. PARAMITRA INTIMEGA</b><small>NOC Operator</small></div><ChevronDown size={14}/></div></div></header>
     <div className="content">
       <div className="page-title-row"><div><div className="eyebrow"><span className="eyebrow-dot"/>{dashboard?"NETWORK OPERATIONS CENTER":"DATABASE MANAGEMENT"}</div><h1>{pageHeading}</h1><p>{dashboard?"Pantau status site, aktivitas harian, dan pekerjaan operasional dalam satu tempat.":"Cari, filter, dan kelola data operasional NOC secara terpusat."}</p></div><div className="title-actions"><div className="date-pill"><CalendarDays size={15}/>{dateLabel}</div>{!dashboard&&key&&<button className="primary-btn" onClick={openAdd}><Plus size={16}/> Tambah Data</button>}</div></div>
       {dashboard ? <>
         <div className="metrics-grid">
           <Metric title="Total Site Terdaftar" value="6.293" detail="Site Master" icon={Database} tone="blue" trend="Database operasional"/>
           <Metric title="Site Up" value="5.273" detail="83,79% dari total" icon={Wifi} tone="green" trend="Status jaringan"/>
           <Metric title="Site Warning" value="31" detail="Perlu pemantauan" icon={CircleAlert} tone="orange" trend="Prioritas monitoring"/>
           <Metric title="Site Down" value="989" detail="Perlu tindak lanjut" icon={Activity} tone="red" trend="Monitoring gangguan"/>
         </div>
         <div className="metrics-grid secondary-metrics">
           <Metric title="Vendor / Mitra" value="8" detail="Mitra operasional" icon={Users} tone="purple" trend="Vendor terdaftar"/>
           <Metric title="HUB & Beam" value="H58 / H47" detail="Referensi jaringan" icon={RadioTower} tone="blue" trend="HUB satelit"/>
           <Metric title="Log Modem" value={`${(sampleData.LOG_PERGANTIAN_MODEM as any[]).length}+`} detail="Contoh baris dimuat" icon={RefreshCw} tone="teal" trend="Pergantian & swab"/>
           <Metric title="Task Hari Ini" value={`${taskDone}/${Math.max(tasks.length,12)}`} detail="Checklist operasional" icon={ClipboardCheck} tone="green" trend="Progress shift"/>
         </div>
         <div className="dashboard-grid">
           <section className="panel monitoring-panel"><div className="panel-head"><div><h2><Signal size={17}/> Monitoring Site</h2><p>Ringkasan data site dari Site Master</p></div><button className="text-btn" onClick={()=>setActive("Site Master")}>Lihat semua <ArrowUpRight size={15}/></button></div><div className="quick-filters"><div className="search-box"><Search size={16}/><input placeholder="Cari Site ID atau nama site..." value={search} onChange={e=>setSearch(e.target.value)}/></div><button className="filter-btn" onClick={()=>setActive("Site Master")}><SlidersHorizontal size={15}/> Filter lanjutan</button></div><div className="table-wrap"><table><thead><tr><th>Site ID / Nama Site</th><th>Penyedia</th><th>Cluster</th><th>Vendor / Mitra</th></tr></thead><tbody>{(rowsBySheet.SITE_MASTER||[]).slice(0,5).filter(r=>Object.values(r).some(v=>String(v??"").toLowerCase().includes(search.toLowerCase()))).map((r,i)=><tr key={i}><td><b className="site-id">{fmt(r["SITE ID"])}</b><small className="cell-sub">{fmt(r.NAME)}</small></td><td><span className="provider-pill">{fmt(r.PENYEDIA)}</span></td><td>{fmt(r.CLUSTER)}</td><td>{fmt((rowsBySheet.VENDOR_MASTER||[]).find(v=>v["SITE ID"]===r["SITE ID"])?.VENDOR)}</td></tr>)}</tbody></table></div><div className="panel-foot"><span>Preview menampilkan sebagian data contoh</span><button onClick={()=>setActive("Site Master")}>Buka database <ChevronRight size={14}/></button></div></section>
           <section className="panel latency-panel"><div className="panel-head"><div><h2><ChartNoAxesCombined size={17}/> Network Performance</h2><p>Visualisasi contoh · bukan data live</p></div><span className="soft-tag">LAST 24 HOURS</span></div><div className="chart-summary"><div><small>Average latency</small><strong>— <small>ms</small></strong></div><div><small>Packet loss</small><strong>— <small>%</small></strong></div></div><div className="chart-area"><div className="y-labels"><span>100</span><span>75</span><span>50</span><span>25</span><span>0</span></div><div className="chart"><div className="gridline g1"/><div className="gridline g2"/><div className="gridline g3"/><div className="gridline g4"/><svg viewBox="0 0 600 180" preserveAspectRatio="none"><path d="M0 100 C35 85 42 115 70 93 S115 75 140 90 S185 115 210 78 S250 100 275 75 S320 95 350 60 S395 90 420 80 S460 110 490 70 S540 95 570 55 S590 78 600 60" fill="none" stroke="#4778e8" strokeWidth="2.6"/><path d="M0 125 C35 118 42 135 70 120 S115 105 140 128 S185 130 210 116 S250 132 275 110 S320 130 350 100 S395 130 420 115 S460 137 490 112 S540 130 570 98 S590 120 600 106" fill="none" stroke="#17a67a" strokeWidth="2.2" strokeDasharray="5 4"/></svg><div className="x-labels"><span>00:00</span><span>04:00</span><span>08:00</span><span>12:00</span><span>16:00</span><span>20:00</span><span>24:00</span></div></div></div><div className="legend"><span><i className="blue-dot"/> Latency</span><span><i className="green-dot"/> Min latency</span><span className="chart-note">Sambungkan sumber monitoring untuk data aktual</span></div></section>
           <section className="panel task-panel"><div className="panel-head"><div><h2><CheckSquare size={17}/> Daily Task</h2><p>Checklist pekerjaan operasional</p></div><button className="text-btn" onClick={()=>setActive("Daily Task")}>Lihat semua <ArrowUpRight size={15}/></button></div><div className="task-progress"><div><b>{taskDone} task selesai</b><span>{Math.max(tasks.length,12)} task</span></div><div className="progress-track"><span style={{width:`${Math.min(100,taskDone/Math.max(tasks.length,12)*100)}%`}}/></div></div><div className="task-list">{tasks.slice(0,4).map((t,i)=>{const title=t.Task||t.TASK||t["Task"]||"Task operasional";const checked=taskChecks[i]??(t["Check List"]===true||String(t["Check List"]).toLowerCase()==="true");return <label className={`task-row ${checked?"done":""}`} key={i}><input type="checkbox" checked={checked} onChange={()=>toggleTask(i)}/><span className="custom-check"><CheckSquare size={13}/></span><span className="task-copy"><b>{fmt(title)}</b><small>{fmt(t.Media||"Operational checklist")}</small></span><span className="task-time">{fmt(t[""]||t["Waktu"]||"Shift")}</span></label>})}</div></section>
           <section className="panel activity-panel"><div className="panel-head"><div><h2><FileClock size={17}/> Aktivitas Modem Terbaru</h2><p>Log pergantian modem</p></div><button className="text-btn" onClick={()=>setActive("Pergantian Modem")}>Buka log <ArrowUpRight size={15}/></button></div><div className="activity-list">{(rowsBySheet.LOG_PERGANTIAN_MODEM||[]).slice(0,4).map((r,i)=><div className="activity-row" key={i}><div className="activity-icon"><RefreshCw size={15}/></div><div className="activity-copy"><b>{fmt(r["Site ID"])}</b><small>{fmt(r["Site Name"])}</small><span>{fmt(r.Mitra)} · PIC {fmt(r.PIC)}</span></div><div className="activity-date">{fmt(r["DATE PROGRES"])}</div></div>)}</div><div className="panel-foot"><span>Riwayat berdasarkan data contoh workbook</span><button onClick={()=>setActive("Log Swab Modem")}>Log swab <ChevronRight size={14}/></button></div></section>
         </div>
         <div className="bottom-info"><div className="info-icon"><Database size={18}/></div><div><b>Database connection</b><p>{endpoint?"Google Apps Script endpoint terkonfigurasi. Uji koneksi sebelum penggunaan produksi.":"Website saat ini menggunakan data contoh dari workbook. Atur endpoint Apps Script untuk sinkronisasi Google Sheets."}</p></div><span className={`connection-tag ${endpoint?"connected":""}`}><i/>{endpoint?"Endpoint configured":"Preview mode"}</span></div>
       </> : <section className="panel database-panel">
         <div className="panel-head database-head"><div><h2><Table2 size={18}/>{TITLE[key||""]||active}</h2><p>{key==="SITE_MASTER"?"Master data lokasi/site operasional":key==="HUB_MASTER"?"Mapping HUB, Beam, Gateway, dan site":key==="UPDATE_TEMPLATE"?"Cari template issue dan klasifikasi untuk update NMT":key==="LOG_SWAB_MODEM"?"Riwayat perpindahan / swab modem antar-site":key==="LOG_PERGANTIAN_MODEM"?"Riwayat penggantian perangkat modem":"Kelola dan telusuri data pada workbook NOC"}</p></div><div className="table-actions"><button className="secondary-btn" onClick={()=>notify("Export CSV akan diaktifkan pada tahap berikutnya.")}><Download size={15}/> Export</button><button className="primary-btn" onClick={openAdd}><Plus size={16}/> Tambah Data</button></div></div>
         <div className="filter-bar"><div className="search-box wide-search"><Search size={16}/><input placeholder={`Cari di ${active}...`} value={search} onChange={e=>setSearch(e.target.value)}/>{search&&<button onClick={()=>setSearch("")}><X size={14}/></button>}</div><div className="filter-select"><Filter size={15}/><select value={filter} onChange={e=>setFilter(e.target.value)}><option>Semua</option><option>Up</option><option>Online</option><option>Warning</option><option>Down</option><option>Offline</option><option>Parking</option></select><ChevronDown size={13}/></div><span className="results-count">{filtered.length.toLocaleString("id-ID")} baris contoh</span></div>
         {key==="DAILY_CHECKLIST" ? <div className="daily-table-list">{rows.map((r,i)=>{const title=r.Task||r.TASK||r["Task"]||Object.values(r).find(v=>typeof v==="string"&&v.length>5)||"Task";const checked=taskChecks[i]??(r["Check List"]===true||String(r["Check List"]).toLowerCase()==="true");return <label className={`daily-item ${checked?"done":""}`} key={i}><input type="checkbox" checked={checked} onChange={()=>toggleTask(i)}/><span className="custom-check"><CheckSquare size={13}/></span><span className="daily-time">{fmt(r["WAKTU"]||r["Jam"]||r["Time"]||r["Waktu"]||Object.values(r)[0])}</span><span className="daily-desc"><b>{fmt(title)}</b><small>{fmt(r.Media||r.Keterangan||"Checklist operasional")}</small></span><span className="task-status">{checked?"Selesai":"Belum selesai"}</span></label>})}</div> :
         <div className="table-wrap large-table"><table><thead><tr>{columns.slice(0,8).map(c=><th key={c}>{LABELS[c]||c}</th>)}</tr></thead><tbody>{shown.map((r,i)=><tr key={i}>{columns.slice(0,8).map((c,j)=><td key={c}>{j===0&&String(r[c]??"").length>9&&c.toLowerCase().includes("site")?<b className="site-id">{fmt(r[c])}</b>:c.toLowerCase().includes("status")||c.toLowerCase()==="trend"||c.toLowerCase()==="type"?<Status value={r[c]}/>:<span title={fmt(r[c])}>{fmt(r[c])}</span>}</td>)}</tr>)}</tbody></table>{shown.length===0&&<div className="empty-state"><Search size={28}/><b>Data tidak ditemukan</b><span>Coba kata kunci atau filter lainnya.</span></div>}</div>}
         <div className="pagination"><span>Menampilkan {filtered.length?((page-1)*pageSize+1):0}–{Math.min(page*pageSize,filtered.length)} dari {filtered.length} baris contoh</span><div><button disabled={page<=1} onClick={()=>setPage(p=>Math.max(1,p-1))}><ChevronLeft size={16}/></button><span className="page-current">{page} / {totalPages}</span><button disabled={page>=totalPages} onClick={()=>setPage(p=>Math.min(totalPages,p+1))}><ChevronRight size={16}/></button></div></div>
         <div className="data-note"><CircleAlert size={15}/><span>Prototype memuat maksimal 40 baris contoh per sheet (template hingga 100 baris). Data penuh dan perubahan permanen membutuhkan integrasi Google Sheets.</span></div>
       </section>}
       <footer className="footer"><span>© 2026 NOC VAULT CONTROL</span><span><span className="footer-dot"/> Operational Workspace · v1.0.0</span></footer>
     </div>
   </main>
   {modal&&<div className="modal-backdrop" onClick={()=>setModal(false)}><div className="modal" onClick={e=>e.stopPropagation()}><div className="modal-head"><div><span className="eyebrow">DATA ENTRY</span><h2>Tambah {active}</h2><p>Isi kolom yang tersedia. Data bisa dikirim ke Apps Script setelah endpoint dikonfigurasi.</p></div><button className="icon-button" onClick={()=>setModal(false)}><X size={18}/></button></div><div className="form-grid">{(columns.length?columns.slice(0,12):["SITE ID","PENYEDIA","VENDOR","HUB","Beam","Keterangan"]).map(c=><label key={c}><span>{LABELS[c]||c}</span><input value={form[c]||""} onChange={e=>setForm(p=>({...p,[c]:e.target.value}))} placeholder={`Input ${LABELS[c]||c}`} /></label>)}</div><div className="modal-actions"><button className="secondary-btn" onClick={()=>setModal(false)}>Batal</button><button className="primary-btn" onClick={saveForm} disabled={loading}><Save size={15}/>{loading?"Menyimpan...":"Simpan Data"}</button></div></div></div>}
   {toast&&<div className="toast"><span className="toast-check"><CheckSquare size={16}/></span>{toast}</div>}
 </div>;
}
function Metric({title,value,detail,icon:Icon,tone,trend}:{title:string,value:string,detail:string,icon:any,tone:string,trend:string}) {
 return <div className="metric-card"><div className={`metric-icon ${tone}`}><Icon size={19}/></div><div className="metric-main"><span>{title}</span><strong>{value}</strong><small>{detail}</small></div><div className="metric-foot"><span>{trend}</span><ArrowUpRight size={14}/></div><div className={`metric-glow ${tone}`}/></div>
}