const colors = {
  GET:    '\x1b[32m',  
  POST:   '\x1b[34m',  
  DELETE: '\x1b[31m', 
  reset:  '\x1b[0m'
}

const statusColor = (code) => {
  if (code < 300) return '\x1b[32m'   
  if (code < 400) return '\x1b[33m'   
  if (code < 500) return '\x1b[33m'   
  return '\x1b[31m'                  
}

export const requestLogger = (req, res, next) => {
  const start  = Date.now()
  const method = req.method
  const path   = req.path

  res.on('finish', () => {
    const ms     = Date.now() - start
    const code   = res.statusCode
    const mColor = colors[method]  || ''
    const sColor = statusColor(code)
    const reset  = colors.reset

    console.log(
      `  ${mColor}${method}${reset} ${path.padEnd(30)} ` +
      `${sColor}${code}${reset} ${ms}ms`
    )
  })

  next()
}