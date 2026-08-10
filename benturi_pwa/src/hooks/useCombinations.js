import { useState, useEffect, useCallback } from 'react'

export function useCombinations() {
  const [combos, setCombos] = useState(null)
  
  useEffect(() => {
    fetch('/data/texts.json') // load texts first so we don't block
    fetch('/data/combinations.json').then(r => r.json()).then(setCombos).catch(() => setCombos({}))
  }, [])

  const getMeaning = useCallback((card1Name, card2Name) => {
    if (!combos) return null
    const key1 = `${card1Name}+ ${card2Name}`
    const key2 = `${card2Name}+ ${card1Name}`
    const key1b = `${card1Name}+${card2Name}`
    const key2b = `${card2Name}+${card1Name}`
    // Try different spacing variants
    for (const k of [key1, key2, key1b, key2b]) {
      if (combos[k]) return combos[k]
    }
    // Fuzzy search
    const entries = Object.entries(combos)
    for (const [k, v] of entries) {
      if (k.includes(card1Name) && k.includes(card2Name)) return v
    }
    return 'Sin significado específico registrado para esta combinación.'
  }, [combos])

  return getMeaning
}
