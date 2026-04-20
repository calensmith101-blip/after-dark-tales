type ViolationRecord = {
  count: number;
  banned: boolean;
};

const store = new Map<string, ViolationRecord>();

export async function isBanned(sessionId: string): Promise<boolean> {
  const record = store.get(sessionId);
  return record?.banned ?? false;
}

export async function recordViolation(
  sessionId: string,
  highSeverity: boolean = false
): Promise<{ banned: boolean; violationCount: number }> {
  const current = store.get(sessionId) ?? { count: 0, banned: false };

  const nextCount = current.count + 1;
  const banned = highSeverity || nextCount >= 3;

  store.set(sessionId, {
    count: nextCount,
    banned,
  });

  return {
    banned,
    violationCount: nextCount,
  };
}
