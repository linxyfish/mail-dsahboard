import { ArrowRight, BellRing, HardDrive, Inbox, Mail, RefreshCw, Server } from 'lucide-react'
import { trpc } from '../trpc'
import { StatusPill } from '../components/StatusPill'

export function Dashboard({ navigate }: { navigate: (page: string) => void }) {
  const mailboxes = trpc.mailbox.list.useQuery(); const mails = trpc.mail.list.useQuery({ page: 1, pageSize: 6, search: '' }); const settings = trpc.notification.get.useQuery()
  const loading = mailboxes.isLoading || mails.isLoading
  const unread = mails.data?.items.filter(m => !m.seen).length || 0
  const usage = mailboxes.data ? Math.round(mailboxes.data.totalUsed / Math.max(mailboxes.data.totalLimit, 1) * 100) : 0
  return <div className="page-content">
    <div className="page-heading"><div><p className="eyebrow">工作台</p><h1>邮箱运行概览</h1><p>集中查看邮箱状态、容量和最新来信。</p></div><button className="secondary-button" onClick={() => { void mailboxes.refetch(); void mails.refetch() }}><RefreshCw size={16} />刷新数据</button></div>
    {mailboxes.data?.demo && <div className="demo-banner"><Server size={18} /><div><strong>当前为演示模式</strong><span>配置 IMAP 环境变量后，系统会自动连接真实 MXRoute 邮箱。</span></div></div>}
    <div className="metrics-grid">
      <article className="metric"><span className="metric-icon green"><Mail size={20} /></span><div><label>邮箱账号</label><strong>{loading ? '—' : mailboxes.data?.list.length || 0}</strong><small>全部处于正常监控</small></div></article>
      <article className="metric"><span className="metric-icon coral"><Inbox size={20} /></span><div><label>未读邮件</label><strong>{loading ? '—' : unread}</strong><small>最近同步的邮件</small></div></article>
      <article className="metric"><span className="metric-icon blue"><HardDrive size={20} /></span><div><label>存储占用</label><strong>{loading ? '—' : `${usage}%`}</strong><small>{mailboxes.data ? `${mailboxes.data.totalUsed} MB / ${mailboxes.data.totalLimit} MB` : '正在计算'}</small></div></article>
      <article className="metric"><span className="metric-icon gold"><BellRing size={20} /></span><div><label>Telegram 通知</label><strong className="metric-word">{settings.data?.enabled ? '已开启' : '未开启'}</strong><small>{settings.data?.chatId ? `发送至 ${settings.data.chatId}` : '尚未设置 Chat ID'}</small></div></article>
    </div>
    <div className="dashboard-grid">
      <section className="panel recent-panel"><div className="panel-header"><div><h2>最近来信</h2><p>所有已连接邮箱的最新邮件</p></div><button className="text-button" onClick={() => navigate('mail')}>查看全部 <ArrowRight size={15} /></button></div>
        <div className="mail-list compact">{mails.data?.items.map(mail => <button key={mail.id} className={`mail-row ${!mail.seen ? 'unread' : ''}`} onClick={() => navigate('mail')}><span className="avatar">{(mail.from.name || mail.from.address).slice(0, 1).toUpperCase()}</span><span className="mail-primary"><strong>{mail.from.name || mail.from.address}</strong><span>{mail.subject}</span></span><span className="mail-preview">{mail.preview || mail.from.address}</span><time>{relative(mail.date)}</time>{!mail.seen && <i className="unread-dot" />}</button>)}</div>
      </section>
      <section className="panel account-panel"><div className="panel-header"><div><h2>邮箱容量</h2><p>账号配额使用情况</p></div></div>{mailboxes.data?.list.map(box => { const percent = Math.round(box.quotaUsed / box.quotaLimit * 100); return <div className="quota-row" key={box.id}><div><strong>{box.address}</strong><span>{box.displayName || '邮箱账号'}</span></div><StatusPill active={box.status === 'active'}>{box.status === 'active' ? '正常' : '停用'}</StatusPill><div className="progress"><i style={{ width: `${percent}%` }} /></div><small>{box.quotaUsed} MB / {box.quotaLimit} MB</small></div>})}<button className="wide-link" onClick={() => navigate('mailboxes')}>管理邮箱账号 <ArrowRight size={15} /></button></section>
    </div>
  </div>
}
function relative(value: string) { const diff = Date.now() - new Date(value).getTime(); if (diff < 3600_000) return `${Math.max(1, Math.floor(diff / 60_000))} 分钟前`; if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`; return new Date(value).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) }
