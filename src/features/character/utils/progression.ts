const CORE_STAT_KEYS = ['might', 'speed', 'intellect'] as const
const ATTRIBUTE_KEYS = ['atk', 'def', 'mag_atk', 'mag_def', 'range', 'rate'] as const

type CivilizationKey = 'Ard' | 'Hartenn' | 'Ikarans' | 'Zhand' | 'Shinkari' | 'Tarki'

type CoreStats = Record<(typeof CORE_STAT_KEYS)[number], number>
type Attributes = Record<(typeof ATTRIBUTE_KEYS)[number], number>

const CORE_BASE: Record<CivilizationKey, CoreStats> = {
  Ard: { might: 3, speed: 2, intellect: 1 },
  Hartenn: { might: 3, speed: 1, intellect: 2 },
  Ikarans: { might: 1, speed: 3, intellect: 2 },
  Zhand: { might: 1, speed: 2, intellect: 3 },
  Shinkari: { might: 2, speed: 3, intellect: 1 },
  Tarki: { might: 3, speed: 2, intellect: 1 }
}

const ATTRIBUTE_BASE: Record<CivilizationKey, Attributes> = {
  Ard: { atk: 2, def: 1, mag_atk: 0, mag_def: 0, range: 0, rate: 0 },
  Hartenn: { atk: 1, def: 0, mag_atk: 0, mag_def: 2, range: 0, rate: 0 },
  Ikarans: { atk: 1, def: 0, mag_atk: 0, mag_def: 0, range: 1, rate: 1 },
  Zhand: { atk: 0, def: 0, mag_atk: 2, mag_def: 0, range: 0, rate: 1 },
  Shinkari: { atk: 1, def: 0, mag_atk: 1, mag_def: 0, range: 0, rate: 1 },
  Tarki: { atk: 2, def: 0, mag_atk: 0, mag_def: 0, range: 0, rate: 1 }
}

const CIVILIZATION_INDEX: Record<CivilizationKey, number> = {
  Ard: 0,
  Hartenn: 1,
  Ikarans: 2,
  Zhand: 3,
  Shinkari: 4,
  Tarki: 5
}

const DEFAULT_CORE: CoreStats = { might: 0, speed: 0, intellect: 0 }
const DEFAULT_ATTRIBUTES: Attributes = { atk: 0, def: 0, mag_atk: 0, mag_def: 0, range: 0, rate: 0 }

const normalizeCivilization = (value: string): CivilizationKey | null => {
  const normalized = value.replace(/[^a-z]/gi, '').toLowerCase()
  return (
    (Object.keys(CORE_BASE) as CivilizationKey[]).find(
      (key) => key.replace(/[^a-z]/gi, '').toLowerCase() === normalized
    ) ?? null
  )
}

const toNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : undefined
  }
  return undefined
}

const diffSum = <T extends readonly string[]>(
  keys: T,
  values: Partial<Record<T[number], number>>,
  base: Record<T[number], number>
) =>
  keys.reduce((total, key) => {
    const typedKey = key as T[number]
    const existing = values[typedKey]
    const current = toNumber(existing) ?? base[typedKey]
    const baseline = base[typedKey]
    return total + Math.max(0, current - baseline)
  }, 0)

export const totalCorePointsForLevel = (level: number) => Math.max(0, level - 1)

export const totalAttributePointsForLevel = (level: number) => Math.max(0, Math.floor((level - 1) / 5))

export const getCoreBaseStats = (civilization: string): CoreStats => {
  const key = normalizeCivilization(civilization)
  return key ? CORE_BASE[key] : DEFAULT_CORE
}

export const getAttributeBaseStats = (civilization: string): Attributes => {
  const key = normalizeCivilization(civilization)
  return key ? ATTRIBUTE_BASE[key] : DEFAULT_ATTRIBUTES
}

export const resolveCivilizationIndex = (civilization: string) => {
  const key = normalizeCivilization(civilization)
  return key ? CIVILIZATION_INDEX[key] : 0
}

export const calculateCorePointAvailability = (
  level: number,
  civilization: string,
  stats: Partial<Record<(typeof CORE_STAT_KEYS)[number], number>>
) => {
  const base = getCoreBaseStats(civilization)
  const spent = diffSum(CORE_STAT_KEYS, stats, base)
  const total = totalCorePointsForLevel(level)
  return { total, spent, available: Math.max(0, total - spent), base }
}

export const calculateAttributePointAvailability = (
  level: number,
  civilization: string,
  attributes: Partial<Record<(typeof ATTRIBUTE_KEYS)[number], number>>
) => {
  const base = getAttributeBaseStats(civilization)
  const spent = diffSum(ATTRIBUTE_KEYS, attributes, base)
  const total = totalAttributePointsForLevel(level)
  return { total, spent, available: Math.max(0, total - spent), base }
}
