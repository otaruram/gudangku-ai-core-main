const SENSITIVE_SESSION_KEYS = [
  "csvContext",
  "csvFileName",
  "forecastData",
  "chatHistory",
  "assistant_prompt",
];

export function getSessionData(key: string): string | null {
  const current = sessionStorage.getItem(key);
  if (current !== null) return current;

  // One-time migration from old localStorage keys.
  const legacy = localStorage.getItem(key);
  if (legacy !== null) {
    sessionStorage.setItem(key, legacy);
    localStorage.removeItem(key);
    return legacy;
  }

  return null;
}

export function setSessionData(key: string, value: string): void {
  sessionStorage.setItem(key, value);
}

export function removeSessionData(key: string): void {
  sessionStorage.removeItem(key);
  localStorage.removeItem(key);
}

export function clearSensitiveSessionData(): void {
  for (const key of SENSITIVE_SESSION_KEYS) {
    sessionStorage.removeItem(key);
    localStorage.removeItem(key);
  }
}
