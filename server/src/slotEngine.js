// slotEngine.js
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc.js';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore.js';

dayjs.extend(utc);
dayjs.extend(isSameOrBefore);

// Helpers
const normISO = (s) => {
  if (!s) return s;
  // If timestamp lacks timezone, treat as UTC by appending Z
  return /Z$|[+\-]\d{2}:\d{2}$/.test(s) ? s : `${s}Z`;
};

function* iterateSlots(startUtc, endUtc, minutes, capacity, base) {
  let cursor = startUtc;
  while (cursor.isSameOrBefore(endUtc)) {
    const end = cursor.add(minutes, 'minute');
    if (end.isAfter(endUtc)) break;
    for (let i = 0; i < capacity; i++) {
      yield {
        start: cursor.toISOString(),
        end: end.toISOString(),
        departmentId: base.departmentId,
        providerId: base.providerId,
        visitTypeIdsAllowed: base.visitTypeIdsAllowed,
        token: `${base.providerId}-${base.departmentId}-${cursor.unix()}-${i}`,
      };
    }
    cursor = end;
  }
}

// Accepts two template styles:
// A) Absolute windows (your current file): { start, end, slotSizeMin, visitTypeIdsAllowed, capacity }
// B) Recurring windows: { daysOfWeek:[1..5], startHour, endHour, durationMinutes, ... }
export function expandSlots(templates, fromISO, toISO) {
  const from = dayjs.utc(normISO(fromISO));
  const to   = dayjs.utc(normISO(toISO));

  const out = [];

  for (const t of templates) {
    const base = {
      providerId: t.providerId,
      departmentId: t.departmentId,
      visitTypeIdsAllowed: t.visitTypeIdsAllowed || [],
    };

    // Absolute template
    if (t.start && t.end && t.slotSizeMin) {
      const winStart = dayjs.utc(normISO(t.start));
      const winEnd   = dayjs.utc(normISO(t.end));
      // intersect with requested range
      const start = winStart.isAfter(from) ? winStart : from;
      const end   = winEnd.isBefore(to) ? winEnd : to;
      if (start.isSameOrBefore(end)) {
        for (const slot of iterateSlots(start, end, t.slotSizeMin, t.capacity || 1, base)) {
          out.push(slot);
        }
      }
      continue;
    }

    // Recurring template
    if (t.daysOfWeek && t.startHour != null && t.endHour != null && t.durationMinutes) {
      // Iterate each day in [from, to]
      let cursor = from.startOf('day');
      const last = to.startOf('day');
      while (cursor.isSameOrBefore(last)) {
        const dow = cursor.day(); // 0..6 (0=Sun)
        // Expect daysOfWeek to be 1..5 for Mon..Fri etc.
        if (t.daysOfWeek.includes(dow)) {
          const dayStart = cursor.hour(t.startHour).minute(0).second(0).millisecond(0);
          const dayEnd   = cursor.hour(t.endHour).minute(0).second(0).millisecond(0);
          for (const slot of iterateSlots(dayStart, dayEnd, t.durationMinutes, t.capacity || 1, base)) {
            // Only include if slot fully inside the overall [from, to]
            const s = dayjs.utc(slot.start);
            const e = dayjs.utc(slot.end);
            if (!s.isBefore(from) && !e.isAfter(to)) {
              out.push(slot);
            }
          }
        }
        cursor = cursor.add(1, 'day');
      }
      continue;
    }

    // Unknown template shape: skip silently
  }

  // Sort by start ascending
  out.sort((a, b) => dayjs.utc(a.start).valueOf() - dayjs.utc(b.start).valueOf());
  return out;
}