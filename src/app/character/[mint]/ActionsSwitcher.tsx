'use client'

import { Badge, Box, Button, Stack, Text } from '@chakra-ui/react'
import { type JSX, useCallback, useState } from 'react'

export type ActionsSwitcherProps = {
  quests: {
    id: number
    name: string
    levelRequired: number
    energyCost: number
    type: string
    rewards?: unknown
    requirements?: unknown
  }[]
  recipes: {
    id: number
    name: string
    levelRequired: number
    type: string
    energyCost: number
    input?: unknown
    output?: unknown
  }[]
}

const VIEWS = ['quests', 'craft', 'forge'] as const
const QUEST_TYPE_COPY: Record<string, string> = {
  Job: 'Short tasks that pay out steady resources.',
  Farm: 'Resource-focused runs to gather materials.',
  Raid: 'Harder encounters with higher risk and reward.'
}

export function ActionsSwitcher({ quests, recipes }: ActionsSwitcherProps) {
  const [view, setView] = useState<(typeof VIEWS)[number]>('quests')

  const parseJson = (value: unknown) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value)
      } catch {
        return value
      }
    }
    return value
  }

  const formatStatRequirements = (value: unknown) => {
    const parsed = parseJson(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const entries = Object.entries(parsed as Record<string, unknown>).map(
        ([key, val]) => `${key}: ${String(val ?? 0)}`
      )
      return entries.length ? entries.join(', ') : 'None'
    }
    return parsed ? String(parsed) : 'None'
  }

  const formatRewards = (value: unknown) => {
    const parsed = parseJson(value)
    if (Array.isArray(parsed)) {
      return parsed
        .map((item) => {
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>
            const amount = obj.amount ?? ''
            const resource = obj.resource ?? obj.type ?? 'Reward'
            return `${amount} ${resource}`.trim()
          }
          return String(item)
        })
        .join(', ')
    }
    if (parsed && typeof parsed === 'object') return JSON.stringify(parsed)
    return parsed ? String(parsed) : 'None'
  }

  const formatResources = (value: unknown, label: string) => {
    const parsed = parseJson(value)
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const obj = parsed as Record<string, unknown>
      const amount = obj.amount ?? ''
      const res = obj.resource ?? obj.raw_material ?? obj.type ?? 'Item'
      return `${label}: ${amount} ${res}`.trim()
    }
    if (Array.isArray(parsed)) {
      return `${label}: ${parsed.map((item) => String(item)).join(', ')}`
    }
    return `${label}: None`
  }

  const goPrev = useCallback(() => {
    setView((prev) => {
      const idx = VIEWS.indexOf(prev)
      const nextIdx = (idx - 1 + VIEWS.length) % VIEWS.length
      return VIEWS[nextIdx]
    })
  }, [])

  const goNext = useCallback(() => {
    setView((prev) => {
      const idx = VIEWS.indexOf(prev)
      const nextIdx = (idx + 1) % VIEWS.length
      return VIEWS[nextIdx]
    })
  }, [])

  const isQuests = view === 'quests'
  const isCraft = view === 'craft'
  const headerItem = (label: string, active: boolean) => (
    <Text
      cursor="pointer"
      color={active ? 'white' : 'gray.500'}
      fontWeight={active ? '800' : '700'}
      onClick={() => setView(label.toLowerCase() as (typeof VIEWS)[number])}
    >
      {label}
    </Text>
  )

  const questList = quests.map((quest) => (
    <Box
      key={quest.id}
      border="1px solid rgba(255,255,255,0.1)"
      borderRadius="md"
      padding={3}
      bg="rgba(255,255,255,0.02)"
    >
      <Stack gap={2}>
        <Text color="white" fontWeight="800" fontSize="md">
          {quest.name}
        </Text>
        <Text color="gray.300" fontSize="sm">
          Req. Level {quest.levelRequired} · {quest.energyCost} energy · {quest.type}
        </Text>
        <Text color="gray.100" fontWeight="700" fontSize="sm">
          Required Stats: {formatStatRequirements(quest.requirements)}
        </Text>
        <Text color="gray.100" fontWeight="700" fontSize="sm">
          Reward: {formatRewards(quest.rewards)}
        </Text>
        <Button
          size="sm"
          alignSelf="flex-end"
          background="custom-blue"
          color="black"
          fontWeight="700"
          _hover={{ bg: 'white', color: 'black' }}
        >
          Start quest
        </Button>
      </Stack>
    </Box>
  ))
  const cardsForType = (needle: string) =>
    quests
      .map((quest, idx) => ((quest.type ?? '').toLowerCase().includes(needle) ? questList[idx] : null))
      .filter(Boolean) as JSX.Element[]
  const questSections = [
    { title: 'Jobs', copy: QUEST_TYPE_COPY.Job, items: cardsForType('job') },
    { title: 'Farms', copy: QUEST_TYPE_COPY.Farm, items: cardsForType('farm') },
    { title: 'Raids', copy: QUEST_TYPE_COPY.Raid, items: cardsForType('raid') }
  ].filter((section) => section.items.length)

  const craftList = recipes
    .filter((recipe) => (recipe.type ?? '').toLowerCase().includes('craft'))
    .map((recipe) => (
      <Box
        key={recipe.id}
        border="1px solid rgba(255,255,255,0.1)"
        borderRadius="md"
      padding={3}
      bg="rgba(255,255,255,0.02)"
    >
      <Stack gap={2}>
        <Text color="white" fontWeight="800" fontSize="md">
          {recipe.name}
        </Text>
        <Text color="gray.300" fontSize="sm">
          Req. Level {recipe.levelRequired} · {recipe.type} · {recipe.energyCost} energy
        </Text>
        <Text color="gray.100" fontWeight="700" fontSize="sm">
          Required resources: {formatResources(recipe.input, 'Requires')}
        </Text>
        <Text color="gray.100" fontWeight="700" fontSize="sm">
          Reward: {formatResources(recipe.output, 'Produces')}
        </Text>
        <Button
          size="sm"
          alignSelf="flex-end"
          background="custom-blue"
          color="black"
          fontWeight="700"
          _hover={{ bg: 'white', color: 'black' }}
        >
            Start craft
          </Button>
        </Stack>
      </Box>
    ))

  const forgeList = recipes
    .filter((recipe) => (recipe.type ?? '').toLowerCase().includes('forge'))
    .map((recipe) => (
      <Box
        key={recipe.id}
        border="1px solid rgba(255,255,255,0.1)"
        borderRadius="md"
      padding={3}
      bg="rgba(255,255,255,0.02)"
    >
      <Stack gap={2}>
        <Text color="white" fontWeight="800" fontSize="md">
          {recipe.name}
        </Text>
        <Text color="gray.300" fontSize="sm">
          Req. Level {recipe.levelRequired} · {recipe.type} · {recipe.energyCost} energy
        </Text>
        <Text color="gray.100" fontWeight="700" fontSize="sm">
          Required resources: {formatResources(recipe.input, 'Requires')}
        </Text>
        <Text color="gray.100" fontWeight="700" fontSize="sm">
          Reward: {formatResources(recipe.output, 'Produces')}
        </Text>
        <Button
          size="sm"
          alignSelf="flex-end"
          background="custom-blue"
          color="black"
          fontWeight="700"
          _hover={{ bg: 'white', color: 'black' }}
        >
            Start forge
          </Button>
        </Stack>
      </Box>
    ))

  let content: JSX.Element | JSX.Element[] = questSections.length
    ? questSections.map((section) => (
        <Stack key={section.title} gap={2} border="1px solid rgba(255,255,255,0.1)" borderRadius="md" padding={3}>
          <Text color="white" fontWeight="800">
            {section.title}
          </Text>
          <Text color="gray.400" fontSize="sm">
            {section.copy}
          </Text>
          <Stack gap={2}>{section.items}</Stack>
        </Stack>
      ))
    : [<Text key="no-quests">None</Text>]

  if (isCraft) content = craftList.length ? craftList : [<Text key="no-craft">None</Text>]
  if (view === 'forge') content = forgeList.length ? forgeList : [<Text key="no-forge">None</Text>]
  const hasContent = Array.isArray(content) ? content.length > 0 : true

  return (
    <Stack gap={4} width="full">
      <Stack direction="row" align="center" justify="space-between">
        <Box as="button" aria-label="Previous view" background="transparent" _hover={{ opacity: 0.7 }} onClick={goPrev}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
            <title>ChevronLeft</title>
            <path d="M15 6l-6 6 6 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
        <Stack direction="row" align="center" gap={3} color="white" fontWeight="700" fontSize="md">
          {headerItem('Quests', isQuests)}
          <Text color="gray.500">|</Text>
          {headerItem('Craft', isCraft)}
          <Text color="gray.500">|</Text>
          {headerItem('Forge', view === 'forge')}
        </Stack>
        <Box as="button" aria-label="Next view" background="transparent" _hover={{ opacity: 0.7 }} onClick={goNext}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden focusable="false">
            <title>ChevronRight</title>
            <path d="M9 6l6 6-6 6" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Box>
      </Stack>

      <Stack gap={3} color="gray.500" fontSize="sm">
        {hasContent ? content : <Text>None</Text>}
      </Stack>
    </Stack>
  )
}
