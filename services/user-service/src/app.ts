// src/app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import morgan from 'morgan';
import orgRoutes from './routes/org.route.js'
import { notFoundMiddleware } from './middlewares/notfound.middleware.js';
import { errorMiddleware } from './middlewares/error.middleware.js';



dotenv.config();

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ service: 'user-service', status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/v1/orgs', orgRoutes);

app.use(notFoundMiddleware);
app.use(errorMiddleware);

export default app;