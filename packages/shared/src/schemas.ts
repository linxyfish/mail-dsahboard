import { z } from 'zod'

export const mailboxStatusSchema = z.enum(['active', 'disabled'])
export const mailboxSchema = z.object({ id: z.string(), address: z.string().email(), displayName: z.string().default(''), quotaUsed: z.number().nonnegative(), quotaLimit: z.number().positive(), unread: z.number().int().nonnegative(), status: mailboxStatusSchema, createdAt: z.string(), imapHost: z.string().optional(), imapPort: z.number().int().positive().default(993), imapSecure: z.boolean().default(true) })
export const mailAddressSchema = z.object({ name: z.string(), address: z.string() })
export const attachmentSchema = z.object({ filename: z.string(), contentType: z.string(), size: z.number().nonnegative(), part: z.string().optional() })
export const mailSchema = z.object({ id: z.string(), uid: z.number().int(), mailbox: z.string(), subject: z.string(), from: mailAddressSchema, to: z.array(mailAddressSchema), date: z.string(), preview: z.string(), text: z.string().optional(), html: z.string().optional(), seen: z.boolean(), flagged: z.boolean().default(false), attachments: z.array(attachmentSchema) })
export const createMailboxSchema = z.object({ address: z.string().email(), password: z.string().min(1), displayName: z.string().max(80).default(''), quotaLimit: z.number().min(128).max(102400).default(2048), imapHost: z.string().optional(), imapPort: z.number().int().positive().max(65535).default(993), imapSecure: z.boolean().default(true) })
export const notificationSettingsSchema = z.object({ enabled: z.boolean(), botToken: z.string().default(''), chatId: z.string(), template: z.string().min(1), keywords: z.array(z.string()), senderAllowlist: z.array(z.string()), quietEnabled: z.boolean(), quietStart: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), quietEnd: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), previewLength: z.number().int().min(0).max(4000) })
export const mailListInputSchema = z.object({ page: z.number().int().positive().default(1), pageSize: z.number().int().min(1).max(100).default(30), search: z.string().default('') })
export const mailUidInputSchema = z.object({ uid: z.number().int() })
