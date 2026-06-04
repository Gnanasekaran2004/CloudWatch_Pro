export const formatBytes = (bytes, decimals = 1) => {
  if (!bytes || bytes === 0) return '0 B'
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return parseFloat((bytes / Math.pow(1024, i)).toFixed(decimals)) + ' ' + sizes[i]
}

export const formatPercent = (value, decimals = 1) => {
  return parseFloat(Number(value ?? 0).toFixed(decimals))
}

export const formatNetSpeed = (bytesPerSec) => {
  if (!bytesPerSec || bytesPerSec === 0) return '0 B/s'
  if (bytesPerSec > 1e6) return (bytesPerSec / 1e6).toFixed(1) + ' MB/s'
  if (bytesPerSec > 1e3) return (bytesPerSec / 1e3).toFixed(1) + ' KB/s'
  return bytesPerSec + ' B/s'
}

export const formatUptime = (seconds) => {
  if (!seconds) return '0m'
  const d = Math.floor(seconds / 86400)
  const h = Math.floor((seconds % 86400) / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (d > 0) return `${d}d ${h}h ${m}m`
  if (h > 0) return `${h}h ${m}m`
  return `${m}m`
}