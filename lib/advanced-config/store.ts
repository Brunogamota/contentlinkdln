import { AdvancedPostConfig } from "./types";
import { DEFAULT_CONFIG } from "./defaults";

const KEY = "advanced_post_config";

export function getAdvancedConfig(): AdvancedPostConfig {
  if (typeof window === "undefined") return DEFAULT_CONFIG;
  const raw = localStorage.getItem(KEY);
  if (!raw) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(raw) as Partial<AdvancedPostConfig>;
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveAdvancedConfig(config: AdvancedPostConfig): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(config));
}

export function resetAdvancedConfig(): AdvancedPostConfig {
  if (typeof window !== "undefined") localStorage.removeItem(KEY);
  return DEFAULT_CONFIG;
}
