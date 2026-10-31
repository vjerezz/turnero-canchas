// D05: límites inclusivos sobre el inicio del turno. El llamador debe aportar
// la hora del servidor; esta función no autoriza ni crea una reserva.
export const minimumNoticeMinutes = 120;
export const maximumAdvanceDays = 30;

export function checkBookingWindow(startsAt: Date, serverNow: Date) {
  const start = startsAt.getTime();
  const now = serverNow.getTime();
  if (!Number.isFinite(start) || !Number.isFinite(now)) {
    return { allowed: false, reason: "invalid-date" } as const;
  }
  const advance = start - now;
  if (advance < minimumNoticeMinutes * 60_000) {
    return { allowed: false, reason: "too-soon" } as const;
  }
  if (advance > maximumAdvanceDays * 24 * 60 * 60_000) {
    return { allowed: false, reason: "too-far" } as const;
  }
  return { allowed: true } as const;
}
