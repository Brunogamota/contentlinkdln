const KEY = "openai_api_key";

export function getApiKey(): string {
  if (typeof window === "undefined") return "";
  return localStorage.getItem(KEY) ?? "";
}

export function setApiKey(key: string): void {
  localStorage.setItem(KEY, key.trim());
}

export function hasApiKey(): boolean {
  return getApiKey().length > 0;
}
