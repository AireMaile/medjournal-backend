import 'dotenv/config'
import app from './app'
import { logger } from './lib/logger'

const PORT = process.env.PORT ?? 3000

app.listen(PORT, () => {
  // Note: this only fires when running locally (npm run dev / npm start).
  // Vercel's serverless runtime never calls app.listen().
  logger.info({ port: PORT }, 'MedJournal API running')
})
