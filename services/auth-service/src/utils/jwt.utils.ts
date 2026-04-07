import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET!;
const ACCESS_TOKEN_EXPIRY = process.env.JWT_EXPIRATION || '15m';
const REFRESH_TOKEN_EXPIRES_IN_MS = 1000 * 60 * 60 * 24 * 7

export interface TokenPayload{
    userId: string;
    email: string;
}


export const generateAccessToken = (payload:TokenPayload):string=>{
    return jwt.sign(payload,ACCESS_TOKEN_SECRET,{
        expiresIn:ACCESS_TOKEN_EXPIRY
    }as jwt.SignOptions)
}



export const verifyAccessToken = (token:string):TokenPayload=>{
    return jwt.verify(token,ACCESS_TOKEN_SECRET) as TokenPayload
}


export const generateRefreshToken = ():string=>{
    return crypto.randomBytes(64).toString('hex')
}

export const getRefreshTokenExpiry = (): Date => {
    // current time + 7 days
    // if user login at 1:00pm second time the before expiry time will be updated with the current time + 7 days
  return new Date(Date.now() + REFRESH_TOKEN_EXPIRES_IN_MS);
};