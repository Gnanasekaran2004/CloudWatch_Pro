import { useState, useCallback, memo } from 'react'

const ExpensiveChild = memo(({ label, onClick }) => {
  console.log(`Rendering: ${label}`)
  return <button onClick={onClick}>{label}</button>
})

function Parent() {
  const [count,  setCount]  = useState(0)
  const [other,  setOther]  = useState(0)

  const handleClickBad = () => console.log('clicked')

  const handleClickGood = useCallback(() => {
    console.log('clicked')
  }, [])
  const handleClickWithCount = useCallback(() => {
    console.log('count is', count)
  }, [count])

  return (
    <div>
      <button onClick={() => setCount(c => c+1)}>Count: {count}</button>
      <button onClick={() => setOther(o => o+1)}>Other: {other}</button>

      <ExpensiveChild label="Bad"   onClick={handleClickBad} />
      <ExpensiveChild label="Good"  onClick={handleClickGood} />
      <ExpensiveChild label="Count" onClick={handleClickWithCount} />
    </div>
  )
}