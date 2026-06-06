import { useRef, useEffect } from 'react'

export const usePrevious = (value) => {
  const ref = useRef(undefined)
  useEffect(() => { ref.current = value })
  return ref.current
}