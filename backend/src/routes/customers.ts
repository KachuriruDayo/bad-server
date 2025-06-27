import { Router } from 'express'
import { rateLimit } from "express-rate-limit";
import {
    deleteCustomer,
    getCustomerById,
    getCustomers,
    updateCustomer,
} from '../controllers/customers'
import auth, {roleGuardMiddleware} from '../middlewares/auth'
import {Role} from "../models/user";

const customerRouter = Router()

const customerLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    limit: 10,
    keyGenerator: (req) => (req as any).user?.id || req.ip,
    message: 'Слишком много запросов, попробуйте позже.',
    standardHeaders: true,
    legacyHeaders: false,
})

customerRouter.get('/', auth, roleGuardMiddleware(Role.Admin), customerLimiter, getCustomers)
customerRouter.get('/:id', auth, roleGuardMiddleware(Role.Admin), getCustomerById)
customerRouter.patch('/:id', auth, roleGuardMiddleware(Role.Admin), updateCustomer)
customerRouter.delete('/:id', auth, roleGuardMiddleware(Role.Admin), deleteCustomer)

export default customerRouter
