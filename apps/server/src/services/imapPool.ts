import { ImapFlow } from 'imapflow'
import type { MailConnection } from './connection.js'

interface PoolEntry {
  client: ImapFlow
  connection: MailConnection
  connecting?: Promise<void>
  queue: Promise<unknown>
  lastUsed: number
}

const pool = new Map<string, PoolEntry>()
const IDLE_TTL = 10 * 60_000

function key(connection: MailConnection) {
  return `${connection.user}@${connection.host}:${connection.port}`
}

function createEntry(connection: MailConnection): PoolEntry {
  const client = new ImapFlow({
    host: connection.host,
    port: connection.port,
    secure: connection.secure,
    auth: { user: connection.user, pass: connection.password },
    logger: false,
    connectionTimeout: 10_000,
    greetingTimeout: 8_000,
    socketTimeout: 5 * 60_000,
  })
  const entry: PoolEntry = { client, connection, queue: Promise.resolve(), lastUsed: Date.now() }
  client.on('close', () => { entry.connecting = undefined })
  client.on('error', error => { console.error(`[imap:${connection.user}]`, error.message) })
  return entry
}

async function ensureConnected(entry: PoolEntry) {
  if (entry.client.usable) return
  if (!entry.connecting) {
    entry.connecting = entry.client.connect().finally(() => { entry.connecting = undefined })
  }
  await entry.connecting
}

export async function withImap<T>(connection: MailConnection, operation: (client: ImapFlow) => Promise<T>): Promise<T> {
  const poolKey = key(connection)
  let entry = pool.get(poolKey)
  if (!entry || entry.connection.password !== connection.password) {
    if (entry?.client.usable) await entry.client.logout().catch(() => undefined)
    entry = createEntry(connection)
    pool.set(poolKey, entry)
  }

  const run = entry.queue.then(async () => {
    await ensureConnected(entry!)
    entry!.lastUsed = Date.now()
    return operation(entry!.client)
  })
  entry.queue = run.catch(() => undefined)
  return run
}

export async function closeImapPool() {
  const entries = [...pool.values()]
  pool.clear()
  await Promise.all(entries.map(entry => entry.client.usable ? entry.client.logout().catch(() => undefined) : Promise.resolve()))
}

setInterval(() => {
  const now = Date.now()
  for (const [poolKey, entry] of pool) {
    if (now - entry.lastUsed > IDLE_TTL) {
      pool.delete(poolKey)
      if (entry.client.usable) void entry.client.logout().catch(() => undefined)
    }
  }
}, 60_000).unref()
