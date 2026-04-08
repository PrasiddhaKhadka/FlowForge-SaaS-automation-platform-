import { describe, it, expect, beforeEach, afterAll } from '@jest/globals';
import { prisma } from '../lib/prisma.js';
import * as authService from '../services/auth.service.js'
import { ConflictError, UnauthorizedError, NotFoundError } from '../errors/index.js';


const TEST_USER = {
  email: 'service@test.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe',
}

describe('Auth Service',()=>{

    // clean slate before each test
    beforeEach(async()=>{
        await prisma.user.deleteMany({
            where:{
                email:TEST_USER.email
            }
        });

        await prisma.user.deleteMany({
            where: { email: TEST_USER.email },
        });
    })


    describe('signup',()=>{

        it('should create a user and return access + refresh tokens', async () => {

            const result = await authService.signup(TEST_USER)

            expect(result).toHaveProperty('accessToken')
            expect(result).toHaveProperty('refreshToken')
            expect(typeof result.accessToken).toBe('string')
            expect(typeof result.refreshToken).toBe('string');
        })

        
    })
})

