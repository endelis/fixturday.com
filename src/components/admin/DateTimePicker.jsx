/**
 * DateTimePicker — themed date + optional time selector.
 *
 * Props:
 *   value    – ISO string ('yyyy-MM-dd' for dateOnly, 'yyyy-MM-ddTHH:mm' for datetime) or ''
 *   onChange – (isoString | null) => void
 *   onBlur   – (isoString | null) => void — called when either sub-control blurs
 *   dateOnly – boolean; when true renders only the date input
 *   style    – style overrides applied to each control element
 */
export default function DateTimePicker({ value, onChange, onBlur, dateOnly = false, style }) {
  const controlStyle = {
    background: 'var(--color-surface-2)',
    border: '1px solid var(--color-border)',
    color: 'var(--color-text)',
    padding: '0.25rem 0.5rem',
    borderRadius: 'var(--radius-sm)',
    fontSize: '0.875rem',
    ...style,
  }

  const datePart = value ? value.slice(0, 10) : ''
  // Derive time from value; fall back to 09:00 when no time component is present
  const timePart = !dateOnly && value && value.length > 10 ? value.slice(11, 16) : '09:00'

  // 15-minute slots 07:00 – 22:00
  const timeOptions = []
  for (let h = 7; h <= 22; h++) {
    for (let m = 0; m < 60; m += 15) {
      if (h === 22 && m > 0) break
      timeOptions.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`)
    }
  }

  // Values not on a 15-min boundary (e.g. scheduler output) stay selectable
  const showCustomTime = !dateOnly && timePart && !timeOptions.includes(timePart)

  function assembled(date, time) {
    if (!date) return null
    return dateOnly ? date : `${date}T${time}`
  }

  return (
    <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
      <input
        type="date"
        value={datePart}
        onChange={e => onChange?.(assembled(e.target.value, timePart))}
        onBlur={e => onBlur?.(assembled(e.target.value || datePart, timePart))}
        style={{ ...controlStyle, flex: 1 }}
      />
      {!dateOnly && (
        <select
          value={timePart}
          onChange={e => onChange?.(assembled(datePart, e.target.value))}
          onBlur={() => onBlur?.(assembled(datePart, timePart))}
          style={{ ...controlStyle, flexShrink: 0 }}
        >
          {showCustomTime && <option value={timePart}>{timePart}</option>}
          {timeOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}
    </div>
  )
}
