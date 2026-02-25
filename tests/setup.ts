import { config } from 'dotenv'
import { resolve } from 'path'

config({ path: resolve(__dirname, '../.env.test') })

export default async function globalSetup() {
  console.log('🧪 Test environment loaded')
}
