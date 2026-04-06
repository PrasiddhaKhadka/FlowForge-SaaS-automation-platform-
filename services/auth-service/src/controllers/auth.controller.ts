import { Request, Response } from "express"
import { prisma } from "../lib/prisma.js"
import bcrypt from "bcryptjs"

export const registerController = async(req:Request,res:Response)=>{
     try {
        const { email, firstName, lastName, password } = req.body

        if(!email || !firstName || !lastName || !password){
            console.log('Such Fields are required !! ')
        }
        
        const userexist = await prisma.user.findUnique({
            where:{email}
        })

        let saltRound = 10
        const hashPassword = await bcrypt.hash(password,saltRound)

        console.log(hashPassword)

       if(userexist){
            throw new Error('ALREADY EXIST YAR ')
       }

       const user = await prisma.user.create({
                data:{
                    email: email,
                    firstName: firstName,
                    lastName: lastName,
                    password:hashPassword,
                }
            })

       res.status(200).json(user)
    } catch (error) {
        if(error instanceof Error){
            res.status(500).json({
                msg:error.message
            })
        }
    }
}