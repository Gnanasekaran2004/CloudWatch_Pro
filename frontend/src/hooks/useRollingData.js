import { useState, useCallback } from 'react'

export const useRollingData = (maxPoints = 60) => {
  const [data, setData] = useState([])

  const addPoint = useCallback((value) => {
    setData(prev => {
      const next = [...prev, value]
      return next.length > maxPoints ? next.slice(-maxPoints) : next
    })
  }, [maxPoints])

  const reset = useCallback(() => setData([]), [])

  return [data, addPoint, reset]
}