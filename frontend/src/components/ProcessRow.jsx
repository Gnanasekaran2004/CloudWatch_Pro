import { memo } from 'react'
import { cn }   from '../utils/cn'

const ProcessRow = memo(function ProcessRow({ pid, name, cpu, mem }) {

  const cpuColor = cn({
    'text-green-400':  cpu < 40,
    'text-yellow-400': cpu >= 40 && cpu < 80,
    'text-red-400':    cpu >= 80,
  })

  return (
    <div className="grid grid-cols-[1fr_2fr_1fr_1fr] px-4 py-3
                    border-b border-slate-700 text-sm
                    hover:bg-slate-700/50 transition-colors">
      <div className="text-slate-400">{pid}</div>
      <div className="font-medium text-slate-200 truncate pr-2">{name}</div>
      <div className={cn('font-bold', cpuColor)}>{cpu}%</div>
      <div className="text-slate-300">{mem}%</div>
    </div>
  )
})

export default ProcessRow