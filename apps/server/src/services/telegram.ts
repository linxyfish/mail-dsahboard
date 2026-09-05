export async function sendTelegram(text: string, chatId: string, botToken: string) {
  const token = botToken.trim()
  const target = chatId.trim()
  if (!token || !target) throw new Error('请先在网页中填写 Telegram Bot Token 和 Chat ID')
  const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: target, text, disable_web_page_preview: true }),
  })
  const result = await response.json() as { ok: boolean; description?: string }
  if (!response.ok || !result.ok) throw new Error(result.description || `Telegram 请求失败 (${response.status})`)
  return true
}
