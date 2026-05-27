const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export function fmtDate(date) {
  return MONTHS[date.getMonth()] + ' ' + date.getDate();
}

export function parseISO(str) {
  return new Date(str);
}

export function calDayIdx(date, rangeStart) {
  return Math.round((date - rangeStart) / 86400000);
}

export function buildCalRange(today, monthsBefore = 1, monthsAfter = 3) {
  const start = new Date(today.getFullYear(), today.getMonth() - monthsBefore, 1);
  const end   = new Date(today.getFullYear(), today.getMonth() + monthsAfter + 1, 0);
  return { start, end, total: Math.round((end - start) / 86400000) + 1 };
}

export function isActiveTrip(trip, today) {
  const s = new Date(trip.startDate);
  const e = new Date(trip.endDate);
  return s <= today && e >= today;
}

export function getNextTrip(trips, userId, today) {
  return trips
    .filter((t) => t.going.some((u) => (u._id || u) === userId) && new Date(t.startDate) > today)
    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))[0] || null;
}

export function getActiveTrip(trips, userId, today) {
  return trips.find(
    (t) => t.going.some((u) => (u._id || u) === userId) && isActiveTrip(t, today),
  ) || null;
}
