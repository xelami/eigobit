import { apiFetch } from "../api"

import type { SettingsData } from "./types"

export function getSettingsData(Astro: any) {
  return apiFetch<SettingsData>("/api/v1/settings", Astro)
}
