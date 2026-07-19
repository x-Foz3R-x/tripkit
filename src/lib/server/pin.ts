export function normalizeStoredPin(value: string | number) {
  return String(value).padStart(4, "0");
}

export function verifyPin(pin: string, storedValue: string | number) {
  return pin === normalizeStoredPin(storedValue);
}
