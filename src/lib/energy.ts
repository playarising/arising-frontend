import type { CodexQuest, CodexRecipe, QuestReward, RecipeOutput } from './characters'

const CORE_STATS = ['might', 'speed', 'intellect'] as const
type CoreStatKey = (typeof CORE_STATS)[number]

export type CoreStats = Partial<Record<CoreStatKey, number>>

const MAX_EFFICIENCY_DISCOUNT = 0.6
const MAX_EFFICIENCY_PENALTY = 1.4

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const toNumber = (value: unknown, fallback = 0): number => {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

const normalizeStats = (stats?: Partial<Record<CoreStatKey, unknown>>): Record<CoreStatKey, number> =>
  CORE_STATS.reduce(
    (acc, key) => {
      acc[key] = toNumber(stats?.[key])
      return acc
    },
    { might: 0, speed: 0, intellect: 0 } as Record<CoreStatKey, number>
  )

const computeEfficiencyFloor = (levelRequired: number, characterLevel: number) => {
  const questFloor = 1 + Math.floor(levelRequired / 10)
  const missingLevels = Math.max(0, 10 - characterLevel)
  return questFloor + Math.floor((missingLevels + 1) / 2)
}

const computeEfficiency = (
  required: Record<CoreStatKey, number>,
  stats: Record<CoreStatKey, number>,
  efficiencyFloor: number
) =>
  Math.min(
    ...CORE_STATS.map((key) => {
      const denominator = Math.max(required[key], efficiencyFloor, 1)
      return denominator > 0 ? stats[key] / denominator : 0
    })
  )

const computeStatModifier = (efficiency: number) => {
  if (efficiency <= 0) return MAX_EFFICIENCY_PENALTY
  if (efficiency >= 1) return clamp(1 / efficiency, MAX_EFFICIENCY_DISCOUNT, 1)
  return clamp(1 / efficiency, 1, MAX_EFFICIENCY_PENALTY)
}

const computeLowLevelPenalty = (characterLevel: number) => (characterLevel >= 10 ? 1 : 1 + (10 - characterLevel) * 0.04)

const computeCooldownHours = (cooldownSeconds?: number) => Math.max((toNumber(cooldownSeconds, 3600) || 0) / 3600, 0.25)

const computeRewardPressure = (rewards: QuestReward[] | undefined, cooldownHours: number) => {
  const rewardArray = Array.isArray(rewards) ? rewards : []
  const rewardWeight = Math.max(
    rewardArray.reduce((sum, reward) => {
      if (!reward || typeof reward !== 'object') return sum
      const amount = Math.max(0, toNumber(reward.amount))
      if (reward.type === 'Experience') {
        return sum + Math.max(0.5, amount / 100)
      }
      return sum + Math.max(0.5, Math.sqrt(amount))
    }, 0),
    0.5
  )
  return clamp(rewardWeight / cooldownHours / 1.5, 0.85, 1.3)
}

const computeOutputPressure = (output: RecipeOutput | RecipeOutput[] | undefined, cooldownHours: number) => {
  const outputs = Array.isArray(output) ? output : output ? [output] : []
  const outputWeight = Math.max(
    outputs.reduce((sum, item) => {
      if (!item || typeof item !== 'object') return sum
      const amount = Math.max(0, toNumber(item.amount))
      return sum + Math.max(0.5, Math.sqrt(amount))
    }, 0),
    0.5
  )
  return clamp(outputWeight / cooldownHours / 1.5, 0.85, 1.3)
}

const computeStatsPressure = (required: Record<CoreStatKey, number>) => {
  const total = CORE_STATS.reduce((sum, key) => sum + Math.max(0, required[key]), 0)
  return clamp(total / 12, 1, 1.35)
}

// Energy floor constants matching Rust implementation
const MINIMUM_ENERGY_COST = 1
const ENERGY_LEVEL_BASE = 5
const ENERGY_LEVEL_DIVISOR = 12

const resolveBaseEnergy = (baseEnergyCost: number, levelRequired: number, bypassStatFloors?: boolean) => {
  const floor = bypassStatFloors
    ? MINIMUM_ENERGY_COST
    : ENERGY_LEVEL_BASE + Math.floor(levelRequired / ENERGY_LEVEL_DIVISOR)

  return Math.max(baseEnergyCost, floor, MINIMUM_ENERGY_COST)
}

const finalizeEnergy = (
  baseEnergy: number,
  statModifier: number,
  lowLevelPenalty: number,
  cooldownPressure: number,
  rewardOrOutputPressure: number,
  statsPressure: number
) =>
  Math.max(
    1,
    Math.ceil(baseEnergy * statModifier * lowLevelPenalty * cooldownPressure * rewardOrOutputPressure * statsPressure)
  )

export const calculateQuestEnergyCost = (
  quest: Pick<
    CodexQuest,
    'baseEnergyCost' | 'levelRequired' | 'cooldownSeconds' | 'minimumStats' | 'rewards' | 'bypassStatFloors'
  >,
  characterLevel: number,
  characterStats: CoreStats
) => {
  const levelRequired = toNumber(quest.levelRequired, 1)
  const baseEnergy = resolveBaseEnergy(toNumber(quest.baseEnergyCost, 1), levelRequired, quest.bypassStatFloors)
  const requiredStats = normalizeStats(quest.minimumStats)
  const stats = normalizeStats(characterStats)
  const efficiencyFloor = computeEfficiencyFloor(levelRequired, characterLevel)
  const efficiency = computeEfficiency(requiredStats, stats, efficiencyFloor)
  const statModifier = computeStatModifier(efficiency)
  const lowLevelPenalty = computeLowLevelPenalty(characterLevel)
  const cooldownHours = computeCooldownHours(quest.cooldownSeconds)
  const cooldownPressure = clamp(1 / cooldownHours, 0.85, 1.25)
  const rewardPressure = computeRewardPressure(quest.rewards, cooldownHours)
  const statsPressure = computeStatsPressure(requiredStats)

  return finalizeEnergy(baseEnergy, statModifier, lowLevelPenalty, cooldownPressure, rewardPressure, statsPressure)
}

export const calculateRecipeEnergyCost = (
  recipe: Pick<CodexRecipe, 'baseEnergyCost' | 'levelRequired' | 'cooldownSeconds' | 'minimumStats' | 'output'>,
  characterLevel: number,
  characterStats: CoreStats
) => {
  const levelRequired = toNumber(recipe.levelRequired, 1)
  const baseEnergy = resolveBaseEnergy(toNumber(recipe.baseEnergyCost, 1), levelRequired)
  const requiredStats = normalizeStats(recipe.minimumStats)
  const stats = normalizeStats(characterStats)
  const efficiencyFloor = computeEfficiencyFloor(levelRequired, characterLevel)
  const efficiency = computeEfficiency(requiredStats, stats, efficiencyFloor)
  const statModifier = computeStatModifier(efficiency)
  const lowLevelPenalty = computeLowLevelPenalty(characterLevel)
  const cooldownHours = computeCooldownHours(recipe.cooldownSeconds)
  const cooldownPressure = clamp(1 / cooldownHours, 0.85, 1.25)
  const outputPressure = computeOutputPressure(recipe.output, cooldownHours)
  const statsPressure = computeStatsPressure(requiredStats)

  return finalizeEnergy(baseEnergy, statModifier, lowLevelPenalty, cooldownPressure, outputPressure, statsPressure)
}
