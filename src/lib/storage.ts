const STORAGE_PREFIX = "wyjazdnik";
const LEGACY_STORAGE_PREFIX = ["trip", "kit"].join("");

function getStorageKey(key: string) {
  return `${STORAGE_PREFIX}_${key}`;
}

function getLegacyStorageKey(key: string) {
  return `${LEGACY_STORAGE_PREFIX}_${key}`;
}

export function getAppStorageItem(key: string) {
  const storageKey = getStorageKey(key);
  const storedValue = localStorage.getItem(storageKey);

  if (storedValue !== null) return storedValue;

  const legacyStorageKey = getLegacyStorageKey(key);
  const legacyValue = localStorage.getItem(legacyStorageKey);

  if (legacyValue !== null) {
    localStorage.setItem(storageKey, legacyValue);
    localStorage.removeItem(legacyStorageKey);
  }

  return legacyValue;
}

export function setAppStorageItem(key: string, value: string) {
  localStorage.setItem(getStorageKey(key), value);
  localStorage.removeItem(getLegacyStorageKey(key));
}

export function removeAppStorageItem(key: string) {
  localStorage.removeItem(getStorageKey(key));
  localStorage.removeItem(getLegacyStorageKey(key));
}
