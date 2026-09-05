import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import path from 'node:path'
import type { Mailbox, NotificationSettings } from '@mail/shared'

export interface StoredMailbox extends Mailbox {
  password: string
}

export interface StoreData {
  mailboxes: StoredMailbox[]
  settings: NotificationSettings
  notifiedUids: number[]
}

const defaultTemplate = `🔔 新邮件通知\n\n📌 主题：{{subject}}\n👤 发件人：{{from.name}} <{{from.address}}>\n🕒 时间：{{date}}\n📎 附件：{{attachments.length}} 个\n\n—— 正文预览 ——\n{{body.text}}`

const defaults: StoreData = {
  mailboxes: [
    { id: 'primary', address: process.env.IMAP_USER || 'hello@example.com', displayName: '主要邮箱', quotaUsed: 684, quotaLimit: 2048, unread: 3, status: 'active', createdAt: new Date().toISOString(), password: process.env.IMAP_PASSWORD || '', imapHost: process.env.IMAP_HOST, imapPort: Number(process.env.IMAP_PORT || 993), imapSecure: process.env.IMAP_SECURE !== 'false' },
    { id: 'support', address: 'support@example.com', displayName: '客户支持', quotaUsed: 312, quotaLimit: 2048, unread: 1, status: 'active', createdAt: new Date().toISOString(), password: '', imapPort: 993, imapSecure: true },
  ],
  settings: { enabled: false, botToken: process.env.TG_BOT_TOKEN || '', chatId: process.env.TG_CHAT_ID || '', template: defaultTemplate, keywords: [], senderAllowlist: [], quietEnabled: true, quietStart: '23:00', quietEnd: '07:00', previewLength: 280 },
  notifiedUids: [],
}

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..')
const file = path.resolve(projectRoot, process.env.DATABASE_FILE || './data/store.json')
let current: StoreData | undefined
let writeQueue = Promise.resolve()

export async function getStore() {
  if (current) return current
  try {
    const saved = JSON.parse(await readFile(file, 'utf8')) as Partial<StoreData>
    current = { ...defaults, ...saved, settings: { ...defaults.settings, ...(saved.settings || {}), botToken: saved.settings?.botToken || process.env.TG_BOT_TOKEN || '', chatId: saved.settings?.chatId || process.env.TG_CHAT_ID || '' }, mailboxes: (saved.mailboxes || defaults.mailboxes).map(mailbox => ({ ...mailbox, password: 'password' in mailbox ? String(mailbox.password || '') : '', imapPort: mailbox.imapPort || 993, imapSecure: mailbox.imapSecure ?? true })) }
  } catch { current = structuredClone(defaults); await saveStore(current) }
  return current
}

export async function saveStore(data: StoreData) {
  current = data
  writeQueue = writeQueue.then(async () => {
    await mkdir(path.dirname(file), { recursive: true })
    const temp = `${file}.tmp`
    await writeFile(temp, JSON.stringify(data, null, 2))
    await rename(temp, file)
  })
  await writeQueue
}

export async function getRuntimeMode() {
  const store = await getStore()
  const hasStoredMailbox = store.mailboxes.some(mailbox => Boolean(mailbox.password))
  const legacyMissing = ['IMAP_HOST', 'IMAP_USER', 'IMAP_PASSWORD'].filter(key => !process.env[key]?.trim())
  const forcedDemo = process.env.DEMO_MODE?.trim().toLowerCase() === 'true'
  return { demo: forcedDemo || (!hasStoredMailbox && legacyMissing.length > 0), forcedDemo, missing: hasStoredMailbox ? [] : legacyMissing }
}

export async function isDemoMode() {
  return (await getRuntimeMode()).demo
}
