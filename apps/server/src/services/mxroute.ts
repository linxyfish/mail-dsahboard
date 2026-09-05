import { ImapFlow } from 'imapflow'
import { simpleParser } from 'mailparser'
import nodemailer from 'nodemailer'
import type { Mail } from '@mail/shared'
import { getStore, isDemoMode } from '../store.js'
import { connectionFromMailbox, type MailConnection } from './connection.js'
import { withImap } from './imapPool.js'

const demoMails: Mail[] = [
  { id: 'demo-1042', uid: 1042, mailbox: 'INBOX', subject: '三月服务账单已生成', from: { name: 'MXRoute Billing', address: 'billing@mxroute.com' }, to: [{ name: '', address: 'hello@example.com' }], date: new Date(Date.now() - 18 * 60_000).toISOString(), preview: '您好，三月份的服务账单已经生成。请登录账户中心查看详情。', text: '您好，三月份的服务账单已经生成。请登录账户中心查看详情。如有任何疑问，请联系我们。', seen: false, flagged: true, attachments: [{ filename: 'invoice-2025-03.pdf', contentType: 'application/pdf', size: 184320, part: '2' }] },
  { id: 'demo-1041', uid: 1041, mailbox: 'INBOX', subject: 'Website contact: Partnership inquiry', from: { name: 'Leo Chen', address: 'leo@northstar.studio' }, to: [{ name: '', address: 'hello@example.com' }], date: new Date(Date.now() - 2 * 3600_000).toISOString(), preview: 'Hi team, we have been following your work and would like to explore a partnership...', text: 'Hi team,\n\nWe have been following your work and would like to explore a partnership for our upcoming campaign.\n\nBest,\nLeo', seen: false, flagged: false, attachments: [] },
  { id: 'demo-1039', uid: 1039, mailbox: 'INBOX', subject: 'Weekly infrastructure report', from: { name: 'Uptime Monitor', address: 'reports@statuskit.io' }, to: [{ name: '', address: 'hello@example.com' }], date: new Date(Date.now() - 24 * 3600_000).toISOString(), preview: 'All systems operational. Availability this week: 99.99%.', text: 'All systems operational. Availability this week: 99.99%. No incidents were detected.', seen: true, flagged: false, attachments: [] },
  { id: 'demo-1037', uid: 1037, mailbox: 'INBOX', subject: 'Your verification code is 482913', from: { name: 'Cloud Console', address: 'no-reply@cloudconsole.dev' }, to: [{ name: '', address: 'support@example.com' }], date: new Date(Date.now() - 2 * 86400_000).toISOString(), preview: 'Use code 482913 to verify your account. This code expires in 10 minutes.', text: 'Use code 482913 to verify your account. This code expires in 10 minutes.', seen: true, flagged: false, attachments: [] },
]

async function connections(): Promise<MailConnection[]> {
  const store = await getStore()
  const configured = store.mailboxes.filter(mailbox => mailbox.password)
  if (configured.length) return configured.map(connectionFromMailbox)
  if (process.env.IMAP_HOST && process.env.IMAP_USER && process.env.IMAP_PASSWORD) return [{ host: process.env.IMAP_HOST, port: Number(process.env.IMAP_PORT || 993), secure: process.env.IMAP_SECURE !== 'false', user: process.env.IMAP_USER, password: process.env.IMAP_PASSWORD }]
  return []
}

async function listForConnection(connection: MailConnection, address: string, pageSize: number) {
  return withImap(connection, async imap => {
    const lock = await imap.getMailboxLock('INBOX')
    try {
      const total = imap.mailbox && 'exists' in imap.mailbox ? imap.mailbox.exists : 0
      if (!total) return [] as Mail[]
      const start = Math.max(1, total - pageSize + 1)
      const items: Mail[] = []
      for await (const msg of imap.fetch(`${start}:${total}`, { uid: true, envelope: true, flags: true })) {
        const from = msg.envelope?.from?.[0]
        const subject = msg.envelope?.subject || '(无主题)'
        items.push({ id: `${address}:${msg.uid}`, uid: msg.uid, mailbox: address, subject, from: { name: from?.name || '', address: from?.address || '' }, to: (msg.envelope?.to || []).map(v => ({ name: v.name || '', address: v.address || '' })), date: (msg.envelope?.date || new Date()).toISOString(), preview: '', seen: msg.flags?.has('\\Seen') || false, flagged: msg.flags?.has('\\Flagged') || false, attachments: [] })
      }
      return items.reverse()
    } finally { lock.release() }
  })
}

type MailListResult = { items: Mail[]; total: number; demo: boolean }
let listCache: { expires: number; pageSize: number; result: MailListResult } | undefined
let listRequest: Promise<MailListResult> | undefined

export function invalidateMailCache() { listCache = undefined }

export async function listMails(page = 1, pageSize = 30): Promise<MailListResult> {
  if (await isDemoMode()) return { items: demoMails.slice((page - 1) * pageSize, page * pageSize), total: demoMails.length, demo: true }
  if (page === 1 && listCache && listCache.pageSize >= pageSize && listCache.expires > Date.now()) return { ...listCache.result, items: listCache.result.items.slice(0, pageSize) }
  if (!listRequest) {
    listRequest = (async () => {
      const configured = await connections()
      const groups = await Promise.all(configured.map(connection => listForConnection(connection, connection.user, Math.max(pageSize, 50))))
      const items = groups.flat().sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      return { items, total: groups.reduce((sum, group) => sum + group.length, 0), demo: false }
    })().finally(() => { listRequest = undefined })
  }
  const result = await listRequest
  listCache = { expires: Date.now() + 10_000, pageSize: result.items.length, result }
  return { ...result, items: result.items.slice((page - 1) * pageSize, page * pageSize) }
}

export async function getMail(uid: number, mailboxAddress?: string): Promise<Mail> {
  if (await isDemoMode()) {
    const mail = demoMails.find(item => item.uid === uid)
    if (!mail) throw new Error('邮件不存在')
    return mail
  }
  const store = await getStore()
  const mailbox = store.mailboxes.find(item => item.address === mailboxAddress) || store.mailboxes.find(item => item.password)
  const connection = mailbox?.password ? connectionFromMailbox(mailbox) : (await connections())[0]
  if (!connection) throw new Error('没有已配置的邮箱连接')
  return withImap(connection, async imap => {
    const lock = await imap.getMailboxLock('INBOX')
    try {
      const message = await imap.fetchOne(uid, { source: true, flags: true }, { uid: true })
      if (!message || !message.source) throw new Error('邮件不存在')
      const parsed = await simpleParser(message.source)
      return { id: `${connection.user}:${uid}`, uid, mailbox: connection.user, subject: parsed.subject || '(无主题)', from: { name: parsed.from?.value[0]?.name || '', address: parsed.from?.value[0]?.address || '' }, to: (Array.isArray(parsed.to) ? parsed.to : parsed.to ? [parsed.to] : []).flatMap(v => v.value.map(a => ({ name: a.name || '', address: a.address || '' }))), date: (parsed.date || new Date()).toISOString(), preview: (parsed.text || '').slice(0, 240), text: parsed.text, html: typeof parsed.html === 'string' ? parsed.html : undefined, seen: message.flags?.has('\\Seen') || false, flagged: message.flags?.has('\\Flagged') || false, attachments: parsed.attachments.map((a, i) => ({ filename: a.filename || `attachment-${i + 1}`, contentType: a.contentType, size: a.size, part: String(i) })) }
    } finally { lock.release() }
  })
}

async function connectionForAddress(mailboxAddress?: string) {
  const store = await getStore()
  const mailbox = store.mailboxes.find(item => item.address === mailboxAddress) || store.mailboxes.find(item => item.password)
  if (mailbox?.password) return connectionFromMailbox(mailbox)
  return (await connections())[0]
}

export async function updateFlags(uid: number, action: 'read' | 'unread' | 'flag' | 'unflag', mailboxAddress?: string) {
  if (await isDemoMode()) { const item = demoMails.find(m => m.uid === uid); if (item) action === 'read' ? item.seen = true : action === 'unread' ? item.seen = false : action === 'flag' ? item.flagged = true : item.flagged = false; return true }
  const connection = await connectionForAddress(mailboxAddress)
  if (!connection) throw new Error('没有已配置的邮箱连接')
  const result = await withImap(connection, async imap => { const lock = await imap.getMailboxLock('INBOX'); try { const flag = action === 'read' || action === 'unread' ? '\\Seen' : '\\Flagged'; action === 'read' || action === 'flag' ? await imap.messageFlagsAdd(uid, [flag], { uid: true }) : await imap.messageFlagsRemove(uid, [flag], { uid: true }); return true } finally { lock.release() } })
  invalidateMailCache()
  return result
}

export async function deleteMail(uid: number, mailboxAddress?: string) {
  if (await isDemoMode()) { const i = demoMails.findIndex(m => m.uid === uid); if (i >= 0) demoMails.splice(i, 1); return true }
  const connection = await connectionForAddress(mailboxAddress)
  if (!connection) throw new Error('没有已配置的邮箱连接')
  const result = await withImap(connection, async imap => { const lock = await imap.getMailboxLock('INBOX'); try { await imap.messageDelete(uid, { uid: true }); return true } finally { lock.release() } })
  invalidateMailCache()
  return result
}

export async function sendMail(input: { to: string; subject: string; text: string; from?: string }) {
  if (await isDemoMode()) return { messageId: `demo-${Date.now()}` }
  const store = await getStore()
  const mailbox = store.mailboxes.find(item => item.address === input.from) || store.mailboxes.find(item => item.password)
  const connection = mailbox?.password ? connectionFromMailbox(mailbox) : (await connections())[0]
  if (!connection) throw new Error('没有已配置的邮箱连接')
  const transporter = nodemailer.createTransport({ host: connection.host, port: 465, secure: true, auth: { user: connection.user, pass: connection.password } })
  const result = await transporter.sendMail({ from: connection.user, to: input.to, subject: input.subject, text: input.text })
  return { messageId: result.messageId }
}
