import { useMemo } from 'react'

export const useChartData = (rollingArray, valueKey = 'value') => {
  return useMemo(() => {
    return rollingArray.map((val, i) => ({
      index: i,
      [valueKey]: val
    }))
  }, [rollingArray, valueKey])
}

export const useMultiChartData = (rollingArrays) => {
  return useMemo(() => {
    const keys  = Object.keys(rollingArrays)
    const len   = Math.max(...keys.map(k => rollingArrays[k].length))
    const result = []

    for (let i = 0; i < len; i++) {
      const point = { index: i }
      keys.forEach(k => {
        point[k] = rollingArrays[k][i] ?? 0
      })
      result.push(point)
    }

    return result
  }, [rollingArrays])
}