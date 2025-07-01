import { NextFunction, Request, Response } from 'express'
import { FilterQuery } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'
import escapeRegExp from "../utils/escapeRegExp";
import { normalizeCustomerQueryParams } from "../utils/parseOrderQuery";

// TODO: Добавить guard admin
// eslint-disable-next-line max-len
// Get GET /customers?page=2&limit=5&sort=totalAmount&order=desc&registrationDateFrom=2023-01-01&registrationDateTo=2023-12-31&lastOrderDateFrom=2023-01-01&lastOrderDateTo=2023-12-31&totalAmountFrom=100&totalAmountTo=1000&orderCountFrom=1&orderCountTo=10
export const getCustomers = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const {
            page,
            limit,
            sortField,
            sortOrder,
            registrationDateFrom,
            registrationDateTo,
            lastOrderDateFrom,
            lastOrderDateTo,
            totalAmountFrom,
            totalAmountTo,
            orderCountFrom,
            orderCountTo,
            search,
        } = normalizeCustomerQueryParams(req.query, 10);

        const filters: FilterQuery<Partial<IUser>> = {};

        if (registrationDateFrom || registrationDateTo) {
            filters.createdAt = {};
            if (registrationDateFrom) {
                filters.createdAt.$gte = registrationDateFrom;
            }
            if (registrationDateTo) {
                const endOfDay = new Date(registrationDateTo);
                endOfDay.setHours(23, 59, 59, 999);
                filters.createdAt.$lte = endOfDay;
            }
        }

        if (lastOrderDateFrom || lastOrderDateTo) {
            filters.lastOrderDate = {};
            if (lastOrderDateFrom) {
                filters.lastOrderDate.$gte = lastOrderDateFrom;
            }
            if (lastOrderDateTo) {
                const endOfDay = new Date(lastOrderDateTo);
                endOfDay.setHours(23, 59, 59, 999);
                filters.lastOrderDate.$lte = endOfDay;
            }
        }

        if (totalAmountFrom !== undefined || totalAmountTo !== undefined) {
            filters.totalAmount = {};
            if (totalAmountFrom !== undefined) {
                filters.totalAmount.$gte = totalAmountFrom;
            }
            if (totalAmountTo !== undefined) {
                filters.totalAmount.$lte = totalAmountTo;
            }
        }

        if (orderCountFrom !== undefined || orderCountTo !== undefined) {
            filters.orderCount = {};
            if (orderCountFrom !== undefined) {
                filters.orderCount.$gte = orderCountFrom;
            }
            if (orderCountTo !== undefined) {
                filters.orderCount.$lte = orderCountTo;
            }
        }

        if (search) {
            const safeSearch = escapeRegExp(search);
            const searchRegex = new RegExp(safeSearch, 'i');

            // Найдем все заказы, где deliveryAddress соответствует поиску
            const orders = await Order.find({ deliveryAddress: searchRegex }, '_id').exec();
            const orderIds = orders.map((order) => order._id);

            filters.$or = [
                { name: searchRegex },
                { lastOrder: { $in: orderIds } },
            ];
        }

        const sort: { [key: string]: 1 | -1 } = {};
        sort[sortField] = sortOrder === 'desc' ? -1 : 1;

        const options = {
            sort,
            skip: (page - 1) * limit,
            limit: limit,
        };

        const users = await User.find(filters, null, options)
            .populate([
                'orders',
                {
                    path: 'lastOrder',
                    populate: { path: 'products' },
                },
                {
                    path: 'lastOrder',
                    populate: { path: 'customer' },
                },
            ])
            .exec();

        const totalUsers = await User.countDocuments(filters).exec();
        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            customers: users,
            pagination: {
                totalUsers,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (error) {
        next(error);
    }
};

// TODO: Добавить guard admin
// Get /customers/:id
export const getCustomerById = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const user = await User.findById(req.params.id).populate([
            'orders',
            'lastOrder',
        ])
        res.status(200).json(user)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Patch /customers/:id
export const updateCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
            }
        )
            .orFail(
                () =>
                    new NotFoundError(
                        'Пользователь по заданному id отсутствует в базе'
                    )
            )
            .populate(['orders', 'lastOrder'])
        res.status(200).json(updatedUser)
    } catch (error) {
        next(error)
    }
}

// TODO: Добавить guard admin
// Delete /customers/:id
export const deleteCustomer = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id).orFail(
            () =>
                new NotFoundError(
                    'Пользователь по заданному id отсутствует в базе'
                )
        )
        res.status(200).json(deletedUser)
    } catch (error) {
        next(error)
    }
}
