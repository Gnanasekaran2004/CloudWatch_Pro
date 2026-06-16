import 'dotenv/config'
import Groq from 'groq-sdk'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY
})

const DEFAULT_THRESHOLDS = {
  cpu:    85,
  memory: 90,
  disk:   95
}

export class AnomalyDetector {
  constructor() {
    this.lastCallAt  = 0
    this.cooldownMs  = 60000
    this.thresholds = { cpu: 5, memory: 5, disk: 5 }
    this.totalCalls  = 0
  }

  setThresholds(thresholds) {
    this.thresholds = { ...DEFAULT_THRESHOLDS, ...thresholds }
  }

  isAboveThreshold(snapshot) {
    return (
      snapshot.cpu?.percent    > this.thresholds.cpu    ||
      snapshot.memory?.percent > this.thresholds.memory ||
      snapshot.disk?.percent   > this.thresholds.disk
    )
  }

  isCooledDown() {
    return Date.now() - this.lastCallAt >= this.cooldownMs
  }

  calcTrend(values) {
    const valid = values.filter(v => v !== undefined && v !== null)
    if (valid.length < 2) return 'stable'
    const mid      = Math.floor(valid.length / 2)
    const avgFirst = valid.slice(0, mid).reduce((a, b) => a + b, 0) / mid
    const avgLast  = valid.slice(mid).reduce((a, b) => a + b, 0) / (valid.length - mid)
    const diff     = avgLast - avgFirst
    if (diff >  3) return `rising (+${diff.toFixed(1)}%)`
    if (diff < -3) return `falling (${diff.toFixed(1)}%)`
    return 'stable'
  }

  formatBytes(bytes) {
    if (!bytes) return '0 B'
    if (bytes > 1e6) return (bytes / 1e6).toFixed(1) + ' MB'
    if (bytes > 1e3) return (bytes / 1e3).toFixed(1) + ' KB'
    return bytes + ' B'
  }

  buildPrompt(snapshot, recentHistory = []) {
    const trends = recentHistory.length >= 3 ? {
      cpu: this.calcTrend(recentHistory.map(s => s.cpu?.percent)),
      mem: this.calcTrend(recentHistory.map(s => s.memory?.percent))
    } : null

    return `You are a server monitoring expert. Analyze these metrics.

Current:
- CPU:     ${snapshot.cpu?.percent?.toFixed(1)}%
- Memory:  ${snapshot.memory?.percent?.toFixed(1)}%
- Disk:    ${snapshot.disk?.percent?.toFixed(1)}%
- Net ↓:   ${this.formatBytes(snapshot.network?.rx_sec)}/s
- Net ↑:   ${this.formatBytes(snapshot.network?.tx_sec)}/s
${trends ? `Trends: CPU ${trends.cpu}, Memory ${trends.mem}` : ''}
Thresholds: CPU>${this.thresholds.cpu}% MEM>${this.thresholds.memory}% DISK>${this.thresholds.disk}%

Return ONLY a raw JSON object. No markdown. No code blocks. Start with { end with }.
{
  "isAnomaly": true,
  "severity": "low|medium|high",
  "title": "under 8 words",
  "message": "one sentence plain English explanation",
  "suggestedAction": "one specific action to take"
}`
  }

  async analyze(snapshot, recentHistory = []) {
    if (!this.isAboveThreshold(snapshot)) return null

    if (!this.isCooledDown()) {
      const remaining = Math.ceil((this.cooldownMs - (Date.now() - this.lastCallAt)) / 1000)
      console.log(`[AI] Cooldown — ${remaining}s remaining`)
      return null
    }

    console.log(`[AI] Calling Groq... (call #${this.totalCalls + 1})`)
    this.lastCallAt = Date.now()

    try {
      const response = await client.chat.completions.create({
        model:       'llama-3.1-8b-instant',
        max_tokens:  300,
        temperature: 0.1,
        messages: [{
          role:    'user',
          content: this.buildPrompt(snapshot, recentHistory)
        }]
      })

      this.totalCalls++

      const raw   = response.choices[0].message.content.trim()
      console.log('[AI] Raw response:', raw)

      const clean = raw
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/,      '')
        .replace(/```\s*$/,      '')
        .trim()

      const alert = JSON.parse(clean)
      console.log(`[AI] ✓ Parsed — severity: ${alert.severity}`)

      return {
        ...alert,
        timestamp: Date.now(),
        metrics: {
          cpu:    snapshot.cpu?.percent,
          memory: snapshot.memory?.percent,
          disk:   snapshot.disk?.percent
        }
      }

    } catch (err) {
      console.error('[AI] Error:', err.message)
      return {
        isAnomaly:       true,
        severity:        'medium',
        title:           'Metric threshold exceeded',
        message:         `CPU ${snapshot.cpu?.percent?.toFixed(1)}% or memory ${snapshot.memory?.percent?.toFixed(1)}% is above threshold.`,
        suggestedAction: 'Check the process table for high resource consumers.',
        timestamp:       Date.now(),
        metrics: {
          cpu:    snapshot.cpu?.percent,
          memory: snapshot.memory?.percent,
          disk:   snapshot.disk?.percent
        }
      }
    }
  }

  getStats() {
    return {
      provider:     'Groq (free tier)',
      model:        'llama-3.1-8b-instant',
      totalCalls:   this.totalCalls,
      cost:         '$0.00 (free tier)',
      cooldownLeft: Math.max(0, Math.ceil((this.cooldownMs - (Date.now() - this.lastCallAt)) / 1000)),
      thresholds:   this.thresholds
    }
  }
}