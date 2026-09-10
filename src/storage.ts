import type { AppData } from './types'

const STORAGE_KEY = 'rpg-resource-tracker:data'
const emptyData: AppData = { categories: [], trackers: [] }

export function loadData(): AppData {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (!saved) return emptyData

    const parsed: unknown = JSON.parse(saved)
    if (!isAppData(parsed)) return emptyData
    return parsed
  } catch {
    return emptyData
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function isAppData(value: unknown): value is AppData {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<AppData>
  return Array.isArray(data.categories) && Array.isArray(data.trackers)
}
