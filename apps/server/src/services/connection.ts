import { ImapFlow } from 'imapflow'
import type { CreateMailboxInput } from '@mail/shared'

export interface MailConnection {
  host: string
  port: number
  secure: boolean
  user: string
  password: string
}

export function inferMailHost(address: string, explicitHost?: string) {
  if (explicitHost?.trim()) return explicitHost.trim()
  const domain = address.split('@')[1]?.trim().toLowerCase()
  if (!domain) throw new Error('邮箱地址格式不正确，无法推导邮件服务器')
  return `mail.${domain}`
}

export function connectionFromMailbox(mailbox: { address: string; password: string; imapHost?: string; imapPort?: number; imapSecure?: boolean }): MailConnection {
  return { host: inferMailHost(mailbox.address, mailbox.imapHost), port: mailbox.imapPort || 993, secure: mailbox.imapSecure ?? true, user: mailbox.address, password: mailbox.password }
}

export async function verifyMailboxConnection(input: CreateMailboxInput) {
  const connection = connectionFromMailbox({ ...input, password: input.password })
  const imap = new ImapFlow({ host: connection.host, port: connection.port, secure: connection.secure, auth: { user: connection.user, pass: connection.password }, logger: false })
  try {
    await imap.connect()
    await imap.logout()
    return connection
  } catch (error) {
    try { await imap.logout() } catch { /* connection may not have opened */ }
    const reason = error instanceof Error ? error.message : '未知连接错误'
    throw new Error(`无法连接 ${connection.host}:${connection.port}，请确认邮箱密码和 MXRoute 邮件服务器设置。(${reason})`)
  }
}
