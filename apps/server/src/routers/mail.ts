import { z } from 'zod'
import { publicProcedure, router } from '../trpc.js'
import { deleteMail, getMail, listMails, sendMail, updateFlags } from '../services/mxroute.js'

export const mailRouter = router({
  list: publicProcedure.input(z.object({ page: z.number().int().positive().default(1), pageSize: z.number().int().min(1).max(100).default(30), search: z.string().default('') })).query(async ({ input }) => {
    const result = await listMails(input.page, input.pageSize)
    if (!input.search) return result
    const query = input.search.toLowerCase()
    return { ...result, items: result.items.filter(m => `${m.subject} ${m.from.name} ${m.from.address}`.toLowerCase().includes(query)) }
  }),
  detail: publicProcedure.input(z.object({ uid: z.number().int(), mailbox: z.string().email().optional() })).query(({ input }) => getMail(input.uid, input.mailbox)),
  updateFlags: publicProcedure.input(z.object({ uid: z.number().int(), mailbox: z.string().email().optional(), action: z.enum(['read', 'unread', 'flag', 'unflag']) })).mutation(({ input }) => updateFlags(input.uid, input.action, input.mailbox)),
  delete: publicProcedure.input(z.object({ uid: z.number().int(), mailbox: z.string().email().optional() })).mutation(({ input }) => deleteMail(input.uid, input.mailbox)), 
  send: publicProcedure.input(z.object({ to: z.string().email(), subject: z.string().min(1), text: z.string().min(1) })).mutation(({ input }) => sendMail(input)),
})
