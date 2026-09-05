import Handlebars from 'handlebars'
import type { Mail } from '@mail/shared'

export function validateTemplate(source: string) {
  try { Handlebars.precompile(source); return true }
  catch (error) { throw new Error(`模板语法错误：${error instanceof Error ? error.message : '未知错误'}`) }
}

export function renderTemplate(source: string, mail: Mail, previewLength = 280) {
  validateTemplate(source)
  const context = {
    ...mail,
    date: new Date(mail.date).toLocaleString('zh-CN'),
    body: { text: (mail.text || mail.preview).slice(0, previewLength), html: mail.html || '' },
    url: `${process.env.APP_URL || 'http://localhost:5173'}/?mail=${encodeURIComponent(mail.id)}`,
  }
  return Handlebars.compile(source, { noEscape: true })(context)
}
