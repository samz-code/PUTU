interface IcsEventInput {
  title: string;
  description: string;
  location: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  url?: string;
}

function toIcsDate(dateStr: string): string {
  // All-day-style event date in UTC basic format: YYYYMMDD
  return dateStr.replace(/-/g, '');
}

function escapeIcsText(text: string): string {
  return text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
}

export function generateIcsContent(event: IcsEventInput): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}@pututravels.com`;
  const now = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

  // End date in ICS DTEND for all-day events is exclusive, so bump by one day
  const end = new Date(event.endDate);
  end.setDate(end.getDate() + 1);
  const endStr = end.toISOString().split('T')[0];

  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Putu Travels//Her Turn//EN',
    'CALSCALE:GREGORIAN',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${toIcsDate(event.startDate)}`,
    `DTEND;VALUE=DATE:${toIcsDate(endStr)}`,
    `SUMMARY:${escapeIcsText(event.title)}`,
    `DESCRIPTION:${escapeIcsText(event.description)}${event.url ? escapeIcsText('\n\n' + event.url) : ''}`,
    `LOCATION:${escapeIcsText(event.location)}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');
}

export function downloadIcsFile(event: IcsEventInput) {
  const content = generateIcsContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function buildGoogleCalendarUrl(event: IcsEventInput): string {
  const end = new Date(event.endDate);
  end.setDate(end.getDate() + 1);
  const endStr = end.toISOString().split('T')[0].replace(/-/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    dates: `${toIcsDate(event.startDate)}/${endStr}`,
    details: event.description + (event.url ? `\n\n${event.url}` : ''),
    location: event.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/** Publicly hosted QR generator — no server-side QR library needed. */
export function qrImageUrl(token: string, size = 240): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(token)}`;
}
