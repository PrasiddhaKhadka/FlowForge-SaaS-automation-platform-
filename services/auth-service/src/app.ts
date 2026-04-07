import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import authRoutes from './routes/auth.routes.js';
import { errorMiddleware } from './middlewares/error.middleware.js';
import { notFoundMiddleware } from './middlewares/notfound.middleware.js';

dotenv.config()

const app = express()

app.use(helmet())
app.use(cors())
app.use(express.json())
app.use(morgan('dev'))

app.get('/health',(req,res)=>{
    res.json({
    service: 'auth-service',
    status: 'ok',
    timestamp: new Date().toISOString(),
  });
})

app.use('/api/v1',authRoutes)


app.use(notFoundMiddleware)
app.use(errorMiddleware)

export default app;