import { useEffect, useState } from "react";
import { NavLink, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { Anchor, Archive, BookOpen, Ellipsis, LifeBuoy, MessageCircle, Pencil, Pin, Plus, Search, Settings, Trash2 } from "lucide-react";
import { api } from "./api.js";
import DashboardPage from "./pages/DashboardPage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";

export default function App() {
  const [documents, setDocuments] = useState([]), [health, setHealth] = useState("checking"), [ownerUrl, setOwnerUrl] = useState("");
  const [threads, setThreads] = useState([]), [searchOpen, setSearchOpen] = useState(false), [search, setSearch] = useState(""), [menuThread, setMenuThread] = useState(null), [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const location = useLocation(), navigate = useNavigate();
  const title = location.pathname === "/settings" ? "Settings" : location.pathname === "/chat" ? "Ask your documents" : "Overview";
  async function refreshDocuments() { try { setDocuments(await api.documents()); setHealth("online"); } catch (error) { setHealth("offline"); throw error; } }
  async function refreshThreads() { try { setThreads(await api.threads()); } catch { /* API status is shown in the page heading. */ } }
  async function newChat() { const thread = await api.createThread(); await refreshThreads(); navigate(`/chat?thread=${thread.id}`); }
  async function renameThread(thread) { const title = prompt("Rename chat", thread.title); if (title?.trim()) { await api.updateThread(thread.id, { title: title.trim() }); await refreshThreads(); } }
  async function archiveThread(thread) { await api.updateThread(thread.id, { is_archived: true }); setMenuThread(null); await refreshThreads(); }
  async function pinThread(thread) { await api.updateThread(thread.id, { is_pinned: !thread.is_pinned }); setMenuThread(null); await refreshThreads(); }
  async function deleteThread(thread) { if (!confirm(`Delete “${thread.title}” and its messages?`)) return; await api.deleteThread(thread.id); setMenuThread(null); if (location.search.includes(String(thread.id))) navigate("/chat"); await refreshThreads(); }
  useEffect(() => { api.health().then(() => setHealth("online")).catch(() => setHealth("offline")); refreshDocuments().catch(() => {}); api.settings().then((s) => setOwnerUrl(s.owner_contact_url || "")).catch(() => {}); refreshThreads(); }, []);
  useEffect(() => { if (location.pathname === "/chat") refreshThreads(); }, [location.pathname, location.search]);
  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand"><span className="brand-mark"><Anchor size={19}/></span>Doc Harbour</div>
      <p className="workspace-label">Workspace</p>
      <nav aria-label="Workspace navigation">
        <NavLink to="/" end className={({isActive})=>`nav-link ${isActive?"active":""}`}><BookOpen size={17}/>Overview</NavLink>
        <NavLink to="/settings" className={({isActive})=>`nav-link ${isActive?"active":""}`}><Settings size={17}/>Settings</NavLink>
      </nav>
      <div className="chats-section">
        <div className="chats-title"><span>Chats</span><span className="thread-count">{threads.length}</span></div>
        <div className="chat-actions">
          <button className={`sidebar-action ${searchOpen?"selected":""}`} onClick={()=>{setSearchOpen(v=>!v);setSearch("")}}><Search size={15}/>Search</button>
          <button className="sidebar-action" onClick={()=>newChat().catch(e=>setHealth("offline"))}><Plus size={15}/>New chat</button>
        </div>
        {searchOpen&&<input className="thread-search" autoFocus value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search chats…" aria-label="Search chats"/>}
        <nav className="thread-list" aria-label="Chat history">
          {threads.filter(t=>t.title.toLowerCase().includes(search.toLowerCase())).map(t=><div className="thread-row" key={t.id}><NavLink to={`/chat?thread=${t.id}`} className={({isActive})=>`thread-link ${isActive&&location.search.includes(String(t.id))?"active":""}`}><MessageCircle size={14}/><span>{t.title}</span>{t.is_pinned&&<Pin size={12}/>}</NavLink><button className="thread-menu-trigger" aria-label={`Options for ${t.title}`} onClick={(event)=>{const r=event.currentTarget.getBoundingClientRect();setMenuPosition({top:Math.min(r.bottom+4,window.innerHeight-180),left:Math.min(r.right-150,window.innerWidth-160)});setMenuThread(menuThread===t.id?null:t.id)}}><Ellipsis size={17}/></button>{menuThread===t.id&&<div className="thread-menu" style={menuPosition}><button onClick={()=>pinThread(t).catch(()=>{})}><Pin size={14}/>{t.is_pinned?"Unpin":"Pin"}</button><button onClick={()=>archiveThread(t).catch(()=>{})}><Archive size={14}/>Archive</button><button onClick={()=>renameThread(t).catch(()=>{})}><Pencil size={14}/>Rename</button><button className="delete-action" onClick={()=>deleteThread(t).catch(()=>{})}><Trash2 size={14}/>Delete</button></div>}</div>)}
          {!threads.length&&<p className="thread-empty">Your conversations will appear here.</p>}
        </nav>
      </div>
      <div className="sidebar-bottom"><span className={`status-pill ${health}`}>{health === "online" ? "API connected" : health === "checking" ? "Connecting" : "API unavailable"}</span>{ownerUrl&&<a className="button contact-top" href={ownerUrl} target="_blank" rel="noreferrer"><LifeBuoy size={15}/>Contact owner</a>}<p>Answers draw only from documents in this workspace.</p></div>
    </aside>
    <main className={`main-area ${location.pathname === "/chat" ? "chat-main" : ""}`}><section className="page-heading"><div><h1>{title}</h1><span>{title==="Overview"?"A clear view of the files your team has shared with Doc Harbour.":title==="Settings"?"Choose the AI provider and contact details for this workspace.":"Find an answer and see exactly where it came from."}</span></div></section>
      <div className="page-content"><Routes><Route path="/" element={<DashboardPage documents={documents} refreshDocuments={refreshDocuments}/>}/><Route path="/chat" element={<ChatPage documents={documents} onThreadsChange={refreshThreads}/>}/><Route path="/settings" element={<SettingsPage onOwnerUrlChange={setOwnerUrl}/>}/></Routes></div>
    </main>
  </div>;
}
