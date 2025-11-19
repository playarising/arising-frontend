'use client'

import { Badge, Flex } from '@chakra-ui/react'
import type { RecipeInput, RecipeOutput, QuestReward } from '@/lib/characters'
import { parseJson, sanitizeName } from './taskUtils'

export const StatRequirementBadges = ({ value }: { value: Record<string, number> | undefined }) => {
  const parsed = parseJson(value)
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const entries = Object.entries(parsed as Record<string, unknown>).filter(([, val]) => Number(val) > 0)
    if (!entries.length)
      return (
        <Badge colorScheme="gray" fontSize="xs">
          None
        </Badge>
      )

    return (
      <Flex gap={1.5} flexWrap="wrap">
        {entries.map(([key, val]) => {
          const capitalizedKey = key.charAt(0).toUpperCase() + key.slice(1)
          return (
            <Badge key={key} colorScheme="purple" fontSize="xs" px={2} py={0.5}>
              {capitalizedKey} {String(val ?? 0)}
            </Badge>
          )
        })}
      </Flex>
    )
  }
  return (
    <Badge colorScheme="gray" fontSize="xs">
      None
    </Badge>
  )
}

export const RewardBadges = ({ value }: { value: QuestReward[] | unknown }) => {
  const parsed = parseJson(value)
  if (Array.isArray(parsed)) {
    return (
      <Flex gap={1} flexWrap="wrap" justifyContent="center">
        {parsed.map((item, idx) => {
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>
            const amount = String(obj.amount ?? '')
            const resource = String(obj.resource ?? obj.type ?? 'Reward')
            return (
              <Badge key={idx} colorScheme="green" fontSize="xs" px={2} py={0.5}>
                {amount} {resource}
              </Badge>
            )
          }
          return (
            <Badge key={idx} colorScheme="green" fontSize="xs" px={2} py={0.5}>
              {String(item)}
            </Badge>
          )
        })}
      </Flex>
    )
  }
  return (
    <Badge colorScheme="gray" fontSize="xs">
      None
    </Badge>
  )
}

export const ResourceBadges = ({
  value,
  type
}: {
  value: RecipeInput | RecipeOutput | unknown
  type: 'input' | 'output'
}) => {
  const parsed = parseJson(value)

  if (!parsed || typeof parsed !== 'object') {
    return (
      <Badge colorScheme="gray" fontSize="xs">
        None
      </Badge>
    )
  }

  if (!Array.isArray(parsed)) {
    const obj = parsed as Record<string, unknown>

    if (type === 'input' && obj.type === 'Craft' && Array.isArray(obj.materials)) {
      const materials = obj.materials as Array<Record<string, unknown>>
      const goldAmount = obj.gold_amount

      return (
        <Flex gap={1.5} flexWrap="wrap">
          {materials.map((material, idx) => {
            const amount = String(material.amount ?? '')
            const rawRes = material.resource ?? material.raw_material ?? 'Material'
            const res = sanitizeName(String(rawRes))
            return (
              <Badge key={`mat-${idx}`} colorScheme="orange" fontSize="xs" px={2} py={0.5}>
                {amount} {res}
              </Badge>
            )
          })}
          {goldAmount ? (
            <Badge colorScheme="yellow" fontSize="xs" px={2} py={0.5}>
              {String(goldAmount)} Gold
            </Badge>
          ) : null}
        </Flex>
      )
    }

    const amount = String(obj.amount ?? '')
    const rawRes = obj.resource ?? obj.raw_material ?? obj.material ?? obj.item ?? obj.name ?? obj.displayName ?? 'Item'
    const res = sanitizeName(String(rawRes))
    return (
      <Badge colorScheme={type === 'output' ? 'green' : 'orange'} fontSize="xs" px={2} py={0.5}>
        {amount} {res}
      </Badge>
    )
  }

  return (
    <Flex gap={1.5} flexWrap="wrap">
      {parsed.map((item, idx) => {
        if (item && typeof item === 'object') {
          const itemObj = item as Record<string, unknown>
          const amount = String(itemObj.amount ?? '')
          const rawRes =
            itemObj.resource ??
            itemObj.raw_material ??
            itemObj.material ??
            itemObj.item ??
            itemObj.name ??
            itemObj.displayName ??
            'Item'
          const res = sanitizeName(String(rawRes))
          return (
            <Badge key={idx} colorScheme={type === 'output' ? 'green' : 'orange'} fontSize="xs" px={2} py={0.5}>
              {amount} {res}
            </Badge>
          )
        }
        return (
          <Badge key={idx} colorScheme={type === 'output' ? 'green' : 'orange'} fontSize="xs" px={2} py={0.5}>
            {sanitizeName(String(item))}
          </Badge>
        )
      })}
    </Flex>
  )
}
