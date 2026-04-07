import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt.utils.js';

export interface AuthRequest extends Request{
    user?:{
        userId: string,
        email:string
    };
}

export const authMiddleware = async(
  req: AuthRequest,
  res: Response,
  next: NextFunction)=>{

    const authHeader = req.headers.authorization;

    if(!authHeader || !authHeader.startsWith('Bearer ')){
         res.status(401).json({ error: 'No token provided' });
         return
    }

    const token = authHeader.split(' ')[1]

   try {
         const payload = verifyAccessToken(token)
         req.user = payload
         next()
   } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
   }

}