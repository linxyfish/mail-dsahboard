import type { z } from 'zod'
import type { attachmentSchema, createMailboxSchema, mailAddressSchema, mailSchema, mailboxSchema, notificationSettingsSchema } from './schemas.js'

export type Mailbox = z.infer<typeof mailboxSchema>
export type MailAddress = z.infer<typeof mailAddressSchema>
export type Attachment = z.infer<typeof attachmentSchema>
export type Mail = z.infer<typeof mailSchema>
export type CreateMailboxInput = z.infer<typeof createMailboxSchema>
export type NotificationSettings = z.infer<typeof notificationSettingsSchema>

export interface MailboxListResponse { list: Mailbox[]; totalUsed: number; totalLimit: number; demo: boolean; domains: string[] }
export interface MailListResponse { items: Mail[]; total: number; demo: boolean }
