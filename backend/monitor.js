import { getCleanSnapshot, getHealth,
         getTopProcesses, getPorts }    from './collector/index.js'
import { MetricsEmitter }              from './collector/index.js'
import { formatBytes, formatNetSpeed } from './utils/index.js'

const args  = process.argv.slice(2)
const flags = {}
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith('--')) {
    const key = args[i].slice(2)
    const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true
    flags[key] = val
    if (val !== true) i++
  }
}

const limit = parseInt(flags.limit) || 10

const green  = s => `\x1b[32m${s}\x1b[0m`
const yellow = s => `\x1b[33m${s}\x1b[0m`
const red    = s => `\x1b[31m${s}\x1b[0m`
const bold   = s => `\x1b[1m${s}\x1b[0m`

const colorPct = (pct) => {
  if (pct < 60) return green(pct + '%')
  if (pct < 80) return yellow(pct + '%')
  return red(pct + '%')
}

const makeBar = (pct, width = 20) => {
  const safe   = Math.min(Math.max(pct, 0), 100)
  const filled = Math.round((safe / 100) * width)
  const bar    = '█'.repeat(filled) + '░'.repeat(width - filled)
  if (pct < 60) return green(bar)
  if (pct < 80) return yellow(bar)
  return red(bar)
}

const showCpu = (data) => {
  console.log(bold('\n  CPU'))
  console.log(`  Overall  ${makeBar(data.cpu.percent)} ${colorPct(data.cpu.percent)}`)
  data.cpu.cores.forEach((load, i) => {
    const bar = makeBar(load, 10)
    process.stdout.write(`  Core ${i}   ${bar} ${String(load + '%').padEnd(6)}`)
    if (i % 2 === 1) console.log()
  })
  if (data.cpu.cores.length % 2 !== 0) console.log()
}

const showMemory = (data) => {
  const m = data.memory
  console.log(bold('\n  Memory'))
  console.log(`  RAM   ${makeBar(m.percent)} ${colorPct(m.percent)}`)
  console.log(`        ${formatBytes(m.used)} used of ${formatBytes(m.total)} (${formatBytes(m.free)} free)`)
}

const showDisk = (data) => {
  const d = data.disk
  console.log(bold('\n  Disk'))
  console.log(`  ${makeBar(d.percent)} ${colorPct(d.percent)}`)
  console.log(`  ${formatBytes(d.used)} used of ${formatBytes(d.total)}`)
}

const showNetwork = (data) => {
  const n = data.network
  console.log(bold('\n  Network'))
  console.log(`  ↓ Download  ${formatNetSpeed(n.rx_sec)}`)
  console.log(`  ↑ Upload    ${formatNetSpeed(n.tx_sec)}`)
}

const showProcesses = (data) => {
  console.log(bold(`\n  Top ${limit} Processes`))
  console.log('  ' + '─'.repeat(50))
  console.log(`  ${'PID'.padEnd(7)} ${'NAME'.padEnd(22)} ${'CPU'.padEnd(8)} MEM`)
  console.log('  ' + '─'.repeat(50))
  data.processes.slice(0, limit).forEach(p => {
    console.log(
      `  ${String(p.pid).padEnd(7)} ${p.name.padEnd(22)} ${colorPct(p.cpu).padEnd(8)} ${p.mem}%`
    )
  })
}

const showPorts = (data) => {
  console.log(bold('\n  Listening Ports'))
  console.log('  ' + '─'.repeat(40))
  data.ports.slice(0, limit).forEach(p => {
    const label = p.label ? yellow(` ← ${p.label}`) : ''
    console.log(`  :${String(p.port).padEnd(7)} ${p.protocol.padEnd(5)} PID: ${p.pid}${label}`)
  })
}

const showAll = (data) => {
  console.clear()
  console.log(bold('╔═══════════════════════════════════════════════╗'))
  console.log(bold('║          RESOURCE MONITOR — live              ║'))
  console.log(bold('╚═══════════════════════════════════════════════╝'))
  showCpu(data)
  showMemory(data)
  showDisk(data)
  showNetwork(data)
  showProcesses(data)
  showPorts(data)
  console.log(`\n  Updated: ${new Date(data.timestamp).toLocaleTimeString()}`)
}

if (flags.health) {
  const health = getHealth()
  const icon   = health.status === 'ok' ? green('✓') : red('✗')
  console.log(`\n  Health: ${icon} ${health.status}`)
  if (health.failedSources.length > 0) {
    console.log(`  Failed: ${health.failedSources.join(', ')}`)
  }
  process.exit(0)
}

if (flags.snapshot) {
  const data = await getCleanSnapshot()
  showAll(data)
  process.exit(0)
}

const target  = flags.watch || 'all'
const emitter = new MetricsEmitter(2000)

emitter.on('snapshot', (data) => {
    if(flags.alert){
        const threshold = parseInt(flags.alert) || 80
        if(data.cpu.present <= threshold){
            return
        }
    }
  if (target === 'all')       { showAll(data);       return }
  console.clear()
  if (target === 'cpu')       showCpu(data)
  if (target === 'mem')       showMemory(data)
  if (target === 'disk')      showDisk(data)
  if (target === 'network')   showNetwork(data)
  if (target === 'processes') showProcesses(data)
  if (target === 'ports')     showPorts(data)
  console.log(`\n  Updated: ${new Date().toLocaleTimeString()}`)
})

emitter.on('error', err => console.error('[error]', err.message))
emitter.start()

process.on('SIGINT', () => {
  emitter.stop()
  console.log('\n  Monitor stopped.')
  process.exit(0)
})