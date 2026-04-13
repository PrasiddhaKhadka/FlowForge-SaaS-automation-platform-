import { NextFunction, Request, Response } from "express"

export const notFoundMiddleware = async(req:Request,res:Response,next:NextFunction)=>{
    res.status(404).json({
            success: false,
            error: 'Not Found'
    });
}