import { MetricsEmitter }              from './collector/index.js'
import { formatBytes, formatNetSpeed } from './utils/index.js'

const monitor = new MetricsEmitter(2000)

monitor.on('snapshot', (data) => {
  console.clear()
  console.log('╔══════════════════════════════════════════════╗')
  console.log('║          RESOURCE MONITOR — backend          ║')
  console.log('╚══════════════════════════════════════════════╝')
  console.log(`  CPU      ${data.cpu.percent}%`)
  console.log(`  Memory   ${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)} (${data.memory.percent}%)`)
  console.log(`  Disk     ${formatBytes(data.disk.used)} / ${formatBytes(data.disk.total)} (${data.disk.percent}%)`)
  console.log(`  Network  ↓ ${formatNetSpeed(data.network.rx_sec)}  ↑ ${formatNetSpeed(data.network.tx_sec)}`)
  console.log(`  Procs    ${data.processes.length} tracked  |  Top: ${data.processes[0]?.name} (${data.processes[0]?.cpu}%)`)
  console.log(`  Ports    ${data.ports.map(p => p.port).join(', ') || 'none'}`)
  console.log(`  Updated  ${new Date(data.timestamp).toLocaleTimeString()}`)
})

monitor.on('error', (err) => {
  console.error('[Monitor error]', err.message)
})

monitor.start()

process.on('SIGINT', () => {
  monitor.stop()
  console.log('\nShutdown complete.')
  process.exit(0)
})