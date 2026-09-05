import { z } from 'zod'
import { notificationSettingsSchema } from '@mail/shared'
import { publicProcedure, router } from '../trpc.js'
import { getStore, saveStore } from '../store.js'
import { renderTemplate, validateTemplate } from '../services/template.js'
import { sendTelegram } from '../services/telegram.js'
import { getMail, listMails } from '../services/mxroute.js'

export const notificationRouter = router({
  get: publicProcedure.query(async () => {
    const settings = (await getStore()).settings
    return { ...settings, botToken: settings.botToken ? `${settings.botToken.slice(0, 8)}••••••••` : '' }
  }),
  save: publicProcedure.input(notificationSettingsSchema).mutation(async ({ input }) => {
    validateTemplate(input.template)
    const store = await getStore()
    const token = input.botToken.includes('••••') ? store.settings.botToken : input.botToken.trim()
    store.settings = { ...input, botToken: token }
    await saveStore(store)
    return { ...store.settings, botToken: token ? `${token.slice(0, 8)}••••••••` : '' }
  }),
  preview: publicProcedure.input(z.object({ template: z.string(), previewLength: z.number().default(280) })).mutation(async ({ input }) => { const list = await listMails(1, 1); const sample = list.items[0]; if (!sample) throw new Error('没有可用于预览的邮件'); const mail = sample.text ? sample : await getMail(sample.uid); return renderTemplate(input.template, mail, input.previewLength) }),
  test: publicProcedure.input(z.object({ text: z.string().optional(), botToken: z.string().optional(), chatId: z.string().optional() }).default({})).mutation(async ({ input }) => {
    const store = await getStore()
    const token = input.botToken?.trim() || store.settings.botToken
    const chatId = input.chatId?.trim() || store.settings.chatId
    return sendTelegram(input.text || 'MXRoute Mail System 测试通知发送成功。', chatId, token)
  }),
})
