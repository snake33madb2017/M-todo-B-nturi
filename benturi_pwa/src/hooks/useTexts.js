import { useState, useEffect, useCallback } from 'react'

export function useTexts() {
  const [texts, setTexts] = useState(null)
  
  useEffect(() => {
    fetch('/data/texts.json').then(r => r.json()).then(setTexts).catch(() => setTexts({}))
  }, [])
  
  const t = useCallback((section, key, fallback = '') => {
    if (!texts) return fallback
    return texts[section]?.[key] ?? fallback
  }, [texts])
  
  const tList = useCallback((section, key, fallback = []) => {
    if (!texts) return fallback
    return texts[section]?.[key] ?? fallback
  }, [texts])
  
  return { t, tList }
}
