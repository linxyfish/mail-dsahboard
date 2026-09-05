import cron, { type ScheduledTask } from 'node-cron'
import { getStore, saveStore } from '../store.js'
import { getMail, listMails } from './mxroute.js'
import { renderTemplate } from './template.js'
import { sendTelegram } from './telegram.js'

let task: ScheduledTask | undefined
let running = false

function inQuietHours(start: string, end: string) {
  const now = new Date(); const value = now.getHours() * 60 + now.getMinutes()
  const [sh, sm] = start.split(':').map(Number); const [eh, em] = end.split(':').map(Number)
  const from = (sh || 0) * 60 + (sm || 0); const to = (eh || 0) * 60 + (em || 0)
  return from <= to ? value >= from && value < to : value >= from || value < to
}

export async function pollNewMail() {
  if (running) return
  running = true
  try {
    const store = await getStore(); const settings = store.settings
    if (!settings.enabled || (settings.quietEnabled && inQuietHours(settings.quietStart, settings.quietEnd))) return
    const { items, demo } = await listMails(1, 20)
    if (demo) return
    for (const summary of [...items].reverse()) {
      if (store.notifiedUids.includes(summary.uid)) continue
      const haystack = `${summary.subject} ${summary.from.address}`.toLowerCase()
      if (settings.keywords.length && !settings.keywords.some(k => haystack.includes(k.toLowerCase()))) continue
      if (settings.senderAllowlist.length && !settings.senderAllowlist.some(s => summary.from.address.toLowerCase().includes(s.toLowerCase()))) continue
      const mail = await getMail(summary.uid, summary.mailbox)
      await sendTelegram(renderTemplate(settings.template, mail, settings.previewLength), settings.chatId, settings.botToken)
      store.notifiedUids.push(summary.uid)
    }
    store.notifiedUids = store.notifiedUids.slice(-1000); await saveStore(store)
  } catch (error) { console.error('[notifier]', error) }
  finally { running = false }
}

export function startNotifier() {
  const expression = process.env.POLL_CRON || '*/1 * * * *'
  if (!cron.validate(expression)) throw new Error(`无效的 POLL_CRON: ${expression}`)
  task = cron.schedule(expression, pollNewMail)
  return task
}

export function stopNotifier() { task?.stop() }
