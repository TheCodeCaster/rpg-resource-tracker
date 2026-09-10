export interface Category {
  id: string
  name: string
}

export interface Tracker {
  id: string
  name: string
  categoryId: string
  currentValue: number
  maxValue: number
}

export interface AppData {
  categories: Category[]
  trackers: Tracker[]
}
