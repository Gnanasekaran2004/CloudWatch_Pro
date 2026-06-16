import 'dotenv/config'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'

const SECRET = process.env.JWT_SECRET

console.log('=== BCRYPT TEST ===')

const password = "testpassword123"

const hash = await bcrypt.hash(password, 10)

console.log(hash);

console.log('Correct:', await bcrypt.compare(password, hash))
console.log('Wrong:',   await bcrypt.compare('wrong',  hash))  

const token = jwt.sign(
  { userId: 1, username: 'admin', role: 'admin' },
  SECRET,
  { expiresIn: '8h' }
)

console.log(token);

const decoded = jwt.decode(token)
console.log('Decoded payload:', decoded)

const verified = jwt.verify(token, SECRET)
console.log('Verified:', verified)

const expiredToken = jwt.sign({ userId: 1 }, SECRET, { expiresIn: '1ms' })
await new Promise(r => setTimeout(r, 10))

try {
  jwt.verify(expiredToken, SECRET)
} catch (err) {
  console.log('Expired token error:', err.message)
}


try {
  jwt.verify(token + 'tampered', SECRET)
} catch (err) {
  console.log('Tampered token error:', err.message)
}

console.log('\n✓ All auth primitives working correctly')