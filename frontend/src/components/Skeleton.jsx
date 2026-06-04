
function Skeleton({ width = '100%', height = '1rem', borderRadius = '4px' }) {
  return (
    <div style={{
      width,
      height,
      borderRadius,
      background:  'var(--bg-hover)',
      animation:   'pulse 1.5s ease-in-out infinite'
    }} />
  )
}


export default Skeleton