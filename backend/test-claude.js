import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
})

const testSnapshot = {
  timestamp: Date.now(),
  cpu:     { percent: 94.2, cores: [98, 95, 91, 97] },
  memory:  { percent: 87.4, used: 14200000000, total: 16000000000 },
  disk:    { percent: 75.1 },
  network: { rx_sec: 52000000, tx_sec: 1200000 }
}

const response = await client.messages.create({
  model:      'claude-haiku-4-5', 
  max_tokens: 300,
  messages: [{
    role:    'user',
    content: `Analyze these server metrics and identify any anomalies.
    
Current snapshot: ${JSON.stringify(testSnapshot, null, 2)}

Respond ONLY with valid JSON in this exact shape:
{
  "isAnomaly": true or false,
  "severity": "low" or "medium" or "high",
  "title": "short title under 8 words",
  "message": "one sentence plain English explanation",
  "suggestedAction": "one sentence action to take"
}`
  }]
})

console.log('Raw response:')
console.log(response.content[0].text)

const parsed = JSON.parse(response.content[0].text)
console.log('\nParsed alert:')
console.log(parsed)

console.log('\nToken usage:')
console.log('Input tokens:', response.usage.input_tokens)
console.log('Output tokens:', response.usage.output_tokens)
console.log('Estimated cost: $' + ((response.usage.input_tokens * 0.0000008) + (response.usage.output_tokens * 0.000004)).toFixed(6))