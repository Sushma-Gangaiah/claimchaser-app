const CENTRAL_TIME_ZONE = 'America/Chicago';
type SourceTimeZone = 'UTC' | typeof CENTRAL_TIME_ZONE;

export const getCentralDate = (date = new Date(), daysOffset = 0) => {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: CENTRAL_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find(item => item.type === type)!.value;
  const calendarDate = new Date(`${part('year')}-${part('month')}-${part('day')}T00:00:00Z`);
  calendarDate.setUTCDate(calendarDate.getUTCDate() + daysOffset);
  return calendarDate.toISOString().slice(0, 10);
};

const hasOffset = (value: string) => /(?:Z|[+-]\d{2}:?\d{2})$/i.test(value);

export const getDateOnly = (value: string | null, sourceTimeZone: SourceTimeZone = CENTRAL_TIME_ZONE) => {
  if (!value) return '';
  if (!value.includes('T')) return value;
  return hasOffset(value) || sourceTimeZone === 'UTC'
    ? getCentralDate(new Date(hasOffset(value) ? value : `${value}Z`))
    : value.split('T')[0];
};

export const formatDate = (value: string | null, sourceTimeZone: SourceTimeZone = CENTRAL_TIME_ZONE) => {
  if (!value) return '';
  const [year, month, day] = getDateOnly(value, sourceTimeZone).split('-');
  return `${month}/${day}/${year}`;
};

export const parseDisplayDate = (value: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return '';
  const [, month, day, year] = match;
  if (year === '0000') return '';
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === iso ? iso : '';
};

const timestampFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: CENTRAL_TIME_ZONE,
  year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZoneName: 'short',
});

export const formatDateTime = (
  value: string | null,
  sourceTimeZone: SourceTimeZone = CENTRAL_TIME_ZONE,
) => {
  if (!value) return '';
  if (!value.includes('T')) return formatDate(value);
  // Submissions are naive Central time; created_at fields are naive UTC.
  if (!hasOffset(value) && sourceTimeZone === CENTRAL_TIME_ZONE) {
    const [date, time] = value.split('T');
    const display = `${formatDate(date)}, ${time.slice(0, 5)}`;
    const candidates = ['-06:00', '-05:00'].map(offset =>
      timestampFormatter.format(new Date(`${value}${offset}`)),
    ).filter(formatted => formatted.startsWith(`${display} `));
    // A naive timestamp cannot disambiguate the repeated hour when DST ends.
    return candidates.length === 1 ? candidates[0] : `${display} CT`;
  }
  return timestampFormatter.format(new Date(hasOffset(value) ? value : `${value}Z`));
};

type EntryTimestamp = { submitted_at: string | null; created_at: string };

export const getEntryDate = (entry: EntryTimestamp) => entry.submitted_at
  ? getDateOnly(entry.submitted_at)
  : getDateOnly(entry.created_at, 'UTC');

export const formatEntryDateTime = (entry: EntryTimestamp) => entry.submitted_at
  ? formatDateTime(entry.submitted_at)
  : formatDateTime(entry.created_at, 'UTC');
