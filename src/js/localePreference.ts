const STORAGE_KEY = "locale-preference";

export function setLocalePreference(value: string): void {
  localStorage.setItem(STORAGE_KEY, value);
}
