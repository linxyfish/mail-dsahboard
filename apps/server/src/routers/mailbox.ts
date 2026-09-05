import { z } from 'zod'
import { createMailboxSchema } from '@mail/shared'
import { publicProcedure, router } from '../trpc.js'
import { getStore, isDemoMode, saveStore } from '../store.js'
import { verifyMailboxConnection } from '../services/connection.js'

export const mailboxRouter = router({
  list: publicProcedure.query(async () => {
    const store = await getStore()
    const list = store.mailboxes.map(({ password: _password, ...mailbox }) => mailbox)
    return { list, totalUsed: list.reduce((sum, m) => sum + m.quotaUsed, 0), totalLimit: list.reduce((sum, m) => sum + m.quotaLimit, 0), demo: await isDemoMode(), domains: [...new Set(list.map(m => m.address.split('@')[1]).filter(Boolean))] }
  }),
  create: publicProcedure.input(createMailboxSchema).mutation(async ({ input }) => {
    const store = await getStore()
    if (store.mailboxes.some(m => m.address.toLowerCase() === input.address.toLowerCase())) throw new Error('该邮箱已存在')
    const connection = await verifyMailboxConnection(input)
    const mailbox = { id: crypto.randomUUID(), address: input.address, displayName: input.displayName, quotaUsed: 0, quotaLimit: input.quotaLimit, unread: 0, status: 'active' as const, createdAt: new Date().toISOString(), password: input.password, imapHost: connection.host, imapPort: connection.port, imapSecure: connection.secure }
    store.mailboxes.push(mailbox); await saveStore(store)
    const { password: _password, ...publicMailbox } = mailbox
    return publicMailbox
  }),
  remove: publicProcedure.input(z.object({ id: z.string() })).mutation(async ({ input }) => {
    const store = await getStore(); const index = store.mailboxes.findIndex(m => m.id === input.id)
    if (index < 0) throw new Error('邮箱不存在')
    store.mailboxes.splice(index, 1); await saveStore(store); return true
  }),
})
