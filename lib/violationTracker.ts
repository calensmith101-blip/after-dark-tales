const violationMap = new Map<string, number>();
const bannedSessions = new Set<string>();

export async function isBanned(sessionId: string): Promise<boolean> {
  return bannedSessions.has(sessionId);
}

export async function recordViolation(sessionId: string, highSeverity = false): Promise<{ banned: boolean; violationCount: number }> {
  const nextCount = (violationMap.get(sessionId) ?? 0) + 1;
  violationMap.set(sessionId, nextCount);

  if (highSeverity || nextCount >= 3) {
    bannedSessions.add(sessionId);
    return { banned: true, violationCount: nextCount };
  }

  return { banned: false, violationCount: nextCount };
}
