import { cn } from '../utils/cn'

function Skeleton({ className = '' }) {
    return (
        <div className={cn(
            'bg-slate-700 rounded animate-pulse',
            className
        )} />
    )
}

export default Skeleton