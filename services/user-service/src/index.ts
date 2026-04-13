// src/index.ts
import 'dotenv/config';
import app from './app.js';

const REQUIRED_ENV = ['JWT_SECRET', 'DATABASE_URL'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env variable: ${key}`);
    process.exit(1);
  }
}

const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`User service running on port ${PORT}`);
});