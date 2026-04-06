import { NextFunction, Request, Response } from "express"
import { AppError } from "../errors/base.error.js"

export const errorMiddleware = async(err:Error,req:Request,res:Response,next:NextFunction)=>{

    if(err instanceof AppError){
        res.status(err.statusCode).json({
            success: false,
            error: err.message,
        });
        return;
    }

    console.error('Unhandled error:', err);

    res.status(500).json({
        success: false,
        error: 'Something went wrong',
    });
}