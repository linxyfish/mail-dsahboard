import { router } from '../trpc.js'
import { mailboxRouter } from './mailbox.js'
import { mailRouter } from './mail.js'
import { notificationRouter } from './notification.js'

export const appRouter = router({ mailbox: mailboxRouter, mail: mailRouter, notification: notificationRouter })
export type AppRouter = typeof appRouter
