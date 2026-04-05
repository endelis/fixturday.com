import { format } from 'date-fns'

/**
 * Shared date formatting utilities.
 * All accept string, number, or Date — wraps in new Date() automatically.
 * Note: format strings dd/MM/yyyy and HH:mm have no locale-specific tokens,
 * so the lv locale import is not needed here.
 */

export const formatDate = (d) => format(new Date(d), 'dd/MM/yyyy')

export const formatTime = (d) => format(new Date(d), 'HH:mm')

export const formatDateTime = (d) => format(new Date(d), 'dd/MM/yyyy HH:mm')
