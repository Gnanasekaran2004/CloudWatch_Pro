import si from 'systeminformation'
import { safeFetch } from './fetcher.js'

export const getTopProcesses = async ({
  sortBy  = 'cpu',   
  limit   = 20,
  minCpu  = 0       
} = {}) => {

  const raw = await safeFetch(
    () => si.processes(),
    { list: [], all: 0 },
    'processes'
  )

  const filtered = raw.list
    .filter(p => p.cpu >= minCpu)
    .sort((a, b) => b[sortBy] - a[sortBy])
    .slice(0, limit)
    .map(p => ({
      pid:     p.pid,
      name:    p.name,
      cpu:     parseFloat(p.cpu.toFixed(1)),
      mem:     parseFloat(p.mem.toFixed(1)),
      memRss:  p.memRss,    
      state:   p.state,
      user:    p.user,
      started: p.started
    }))

  return {
    total:     raw.all,
    running:   raw.running,
    sleeping:  raw.sleeping,
    processes: filtered
  }
}

export const getProcessByPid = async (pid) => {
  const raw = await safeFetch(
    () => si.processes(),
    { list: [] },
    'processes'
  )

  const found = raw.list.find(p => p.pid === parseInt(pid, 10))
  if (!found) return null

  return {
    pid:     found.pid,
    name:    found.name,
    cpu:     parseFloat(found.cpu.toFixed(1)),
    mem:     parseFloat(found.mem.toFixed(1)),
    memRss:  found.memRss,
    state:   found.state,
    user:    found.user,
    started: found.started,
    command: found.command
  }
}