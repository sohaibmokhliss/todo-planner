import type { Database } from '@/types/database'

type RecurrenceRow = Database['public']['Tables']['recurrence']['Row'] | null | undefined

const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Sun',
  1: 'Mon',
  2: 'Tue',
  3: 'Wed',
  4: 'Thu',
  5: 'Fri',
  6: 'Sat',
}

export function formatRecurrenceDescription(recurrence: RecurrenceRow): string | null {
  if (!recurrence) {
    return null
  }

  let description: string

  switch (recurrence.frequency) {
    case 'daily': {
      description = recurrence.interval === 1 ? 'Repeats daily' : `Every ${recurrence.interval} days`
      break
    }
    case 'weekly': {
      const selectedDays = (recurrence.days_of_week ?? []).map(day => WEEKDAY_LABELS[day]).filter(Boolean)
      const daysPart = selectedDays.length > 0 ? ` on ${selectedDays.join(', ')}` : ''
      description =
        recurrence.interval === 1
          ? `Repeats weekly${daysPart}`
          : `Every ${recurrence.interval} weeks${daysPart}`
      break
    }
    case 'monthly': {
      description = recurrence.interval === 1 ? 'Repeats monthly' : `Every ${recurrence.interval} months`
      break
    }
    case 'custom': {
      description = `Repeats every ${recurrence.interval} ${recurrence.frequency}`
      break
    }
    default: {
      description = 'Repeats'
      break
    }
  }

  if (recurrence.end_date) {
    description += ` until ${new Date(recurrence.end_date).toLocaleDateString()}`
  }

  return description
}
