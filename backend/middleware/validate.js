
export const validateQuery = (rules) => {
  return (req, res, next) => {
    const errors = []

    for (const [key, rule] of Object.entries(rules)) {
      const val = req.query[key]

      if (rule.required && val === undefined) {
        errors.push(`Missing required query param: ${key}`)
        continue
      }

      if (val !== undefined && rule.type === 'number') {
        const num = Number(val)
        if (isNaN(num)) {
          errors.push(`Query param '${key}' must be a number, got: ${val}`)
        } else {
          if (rule.min !== undefined && num < rule.min)
            errors.push(`Query param '${key}' must be >= ${rule.min}`)
          if (rule.max !== undefined && num > rule.max)
            errors.push(`Query param '${key}' must be <= ${rule.max}`)
          req.query[key] = num 
        }
      }

      if (val !== undefined && rule.oneOf && !rule.oneOf.includes(val)) {
        errors.push(`Query param '${key}' must be one of: ${rule.oneOf.join(', ')}`)
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors })
    }

    next()
  }
}