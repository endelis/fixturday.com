import { format } from 'date-fns'
import { lv } from 'date-fns/locale'

/**
 * Shared date formatting utilities.
 * All accept string, number, or Date — wraps in new Date() automatically.
 */

export const formatDate = (d) =>
  format(new Date(d), 'dd/MM/yyyy', { locale: lv })

export const formatTime = (d) =>
  format(new Date(d), 'HH:mm', { locale: lv })

export const formatDateTime = (d) =>
  format(new Date(d), 'dd/MM/yyyy HH:mm', { locale: lv })
