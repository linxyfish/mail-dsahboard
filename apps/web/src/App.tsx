import { BellRing, Inbox, LayoutDashboard, Menu, Server, Users, X } from 'lucide-react'
import { useState } from 'react'
import { Dashboard } from './pages/Dashboard'
import { Mailboxes } from './pages/Mailboxes'
import { Mail } from './pages/Mail'
import { Notifications } from './pages/Notifications'

const items = [{ id: 'dashboard', label: '概览', icon: LayoutDashboard }, { id: 'mailboxes', label: '邮箱账号', icon: Users }, { id: 'mail', label: '收件箱', icon: Inbox }, { id: 'notifications', label: '通知设置', icon: BellRing }]
export function App() {
  const [page, setPage] = useState('dashboard'); const [mobileNav, setMobileNav] = useState(false)
  function navigate(next: string) { setPage(next); setMobileNav(false) }
  return <div className="app-shell"><header className="mobile-header"><button className="icon-button" onClick={() => setMobileNav(true)} title="打开导航"><Menu size={20} /></button><Logo /><span /></header>{mobileNav && <button className="nav-scrim" onClick={() => setMobileNav(false)} aria-label="关闭导航" />}
    <aside className={`sidebar ${mobileNav ? 'open' : ''}`}><div className="brand-row"><Logo /><button className="icon-button close-nav" onClick={() => setMobileNav(false)} title="关闭导航"><X size={19} /></button></div><nav>{items.map(item => <button key={item.id} className={page === item.id ? 'active' : ''} onClick={() => navigate(item.id)}><item.icon size={18} /><span>{item.label}</span>{item.id === 'mail' && <b>3</b>}</button>)}</nav><div className="sidebar-status"><span><Server size={15} /></span><div><strong>邮件服务</strong><small><i /> 运行正常</small></div></div><footer><span className="avatar">A</span><div><strong>管理员</strong><small>系统控制台</small></div></footer></aside>
    <div className="main-area">{page === 'dashboard' && <Dashboard navigate={navigate} />}{page === 'mailboxes' && <Mailboxes />}{page === 'mail' && <Mail />}{page === 'notifications' && <Notifications />}</div>
  </div>
}
function Logo() { return <div className="logo"><span><Inbox size={19} /></span><div><strong>Postbridge</strong><small>MXRoute Console</small></div></div> }
