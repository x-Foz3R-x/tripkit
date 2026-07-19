const STORAGE_PREFIX = "wyjezdnik";
const LEGACY_STORAGE_PREFIXES = ["wyjazdnik", ["trip", "kit"].join("")];

function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}_${key}`;
}

function getLegacyStorageKeys(key: string) {
  return LEGACY_STORAGE_PREFIXES.map((prefix) => `${prefix}_${key}`);
}

function removeLegacyStorageItems(key: string) {
  for (const legacyStorageKey of getLegacyStorageKeys(key)) {
    localStorage.removeItem(legacyStorageKey);
  }
}

export function getAppStorageItem(key: string) {
  const storageKey = getStorageKey(key);
  const storedValue = localStorage.getItem(storageKey);

  if (storedValue !== null) return storedValue;

  for (const legacyStorageKey of getLegacyStorageKeys(key)) {
    const legacyValue = localStorage.getItem(legacyStorageKey);

    if (legacyValue !== null) {
      localStorage.setItem(storageKey, legacyValue);
      removeLegacyStorageItems(key);
      return legacyValue;
    }
  }

  return null;
}

export function setAppStorageItem(key: string, value: string) {
  localStorage.setItem(getStorageKey(key), value);
  removeLegacyStorageItems(key);
}

export function removeAppStorageItem(key: string) {
  localStorage.removeItem(getStorageKey(key));
  removeLegacyStorageItems(key);
}
