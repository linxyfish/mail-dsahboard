import { initTRPC, TRPCError } from '@trpc/server'
import type { CreateExpressContextOptions } from '@trpc/server/adapters/express'

export function createContext({ req, res }: CreateExpressContextOptions) {
  const requiredKey = process.env.API_KEY
  const authEnabled = process.env.AUTH_ENABLED?.trim().toLowerCase() === 'true'
  if (authEnabled && requiredKey) {
    const supplied = req.headers.authorization?.replace(/^Bearer\s+/i, '')
    if (supplied !== requiredKey) throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return { req, res }
}

const t = initTRPC.context<typeof createContext>().create()
export const router = t.router
export const publicProcedure = t.procedure
