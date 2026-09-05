import dotenv from 'dotenv'
import path from 'node:path'
import express from 'express'

const projectRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../../..')
dotenv.config({ path: path.join(projectRoot, '.env') })
import cors from 'cors'
import { createExpressMiddleware } from '@trpc/server/adapters/express'
import { createContext } from './trpc.js'
import { appRouter } from './routers/index.js'
import { getRuntimeMode, getStore, isDemoMode } from './store.js'
import { startNotifier, stopNotifier } from './services/notifier.js'
import { closeImapPool } from './services/imapPool.js'
import { listMails } from './services/mxroute.js'

const app = express()
const port = Number(process.env.PORT || 3000)
console.log(`[config] Loaded .env from ${path.join(projectRoot, '.env')}`)
app.use(cors({ origin: process.env.WEB_ORIGIN?.split(',') || ['http://localhost:5173'], credentials: true }))
app.use('/trpc', createExpressMiddleware({ router: appRouter, createContext, onError({ path, error }) { console.error(`[trpc:${path}]`, error.message) } }))
app.get('/health', async (_req, res) => {
  const mode = await getRuntimeMode()
  const store = await getStore()
  res.json({ ok: true, demo: mode.demo, forcedDemo: mode.forcedDemo, missing: mode.missing, telegramConfigured: Boolean(store.settings.botToken && store.settings.chatId), envFile: path.join(projectRoot, '.env'), timestamp: new Date().toISOString() })
})

const mode = await getRuntimeMode()
app.listen(port, () => {
  console.log(`Mail API listening on http://localhost:${port} (${mode.demo ? 'demo' : 'live'} mode)`)
  if (mode.forcedDemo) console.warn('[config] DEMO_MODE=true explicitly forces demo mode')
  if (mode.missing.length) console.warn(`[config] No configured mailbox and missing legacy IMAP variables: ${mode.missing.join(', ')}`)
  startNotifier()
  if (!mode.demo) void listMails(1, 50).then(result => console.log(`[imap] Warmed ${result.items.length} messages`)).catch(error => console.error('[imap] Warmup failed:', error instanceof Error ? error.message : error))
})

for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { stopNotifier(); await closeImapPool(); process.exit(0) })
