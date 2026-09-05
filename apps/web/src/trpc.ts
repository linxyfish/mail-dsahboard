import { createTRPCReact } from '@trpc/react-query'
import type { AppRouter } from '@mail/server/src/routers/index.js'

export const trpc = createTRPCReact<AppRouter>()
