const sanitizeName = (name: string) =>
  name
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim()

export const sanitizeRewards = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map((item) => {
      if (typeof item === 'string') return sanitizeName(item)
      if (item && typeof item === 'object') {
        const obj = item as Record<string, unknown>
        if (typeof obj.resource === 'string') obj.resource = sanitizeName(obj.resource)
        if (typeof obj.type === 'string') obj.type = sanitizeName(obj.type)
      }
      return item
    })
  }
  return value
}
