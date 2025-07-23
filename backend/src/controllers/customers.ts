import { NextFunction, Request, Response } from 'express'
import { FilterQuery, Types } from 'mongoose'
import NotFoundError from '../errors/not-found-error'
import Order from '../models/order'
import User, { IUser } from '../models/user'
import { normalizeCustomerQueryParams } from "../utils/parseQueryParams";
import escapeRegExp from "../utils/escapeRegExp";

const isValidObjectId = (id: string): boolean =>
    Types.ObjectId.isValid(id) && new Types.ObjectId(id).toString() === id;

export const getCustomers = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const {
            page, limit, sortField, sortOrder,
            registrationDateFrom, registrationDateTo,
            lastOrderDateFrom, lastOrderDateTo,
            totalAmountFrom, totalAmountTo,
            orderCountFrom, orderCountTo, search
        } = normalizeCustomerQueryParams(req.query, 10);

         const filters: FilterQuery<Partial<IUser>> = {};

        if (registrationDateFrom || registrationDateTo) {
            filters.createdAt = {};
            if (registrationDateFrom) filters.createdAt.$gte = registrationDateFrom;
            if (registrationDateTo) {
                const end = new Date(registrationDateTo);
                end.setHours(23, 59, 59, 999);
                filters.createdAt.$lte = end;
            }
        }

        if (lastOrderDateFrom || lastOrderDateTo) {
            filters.lastOrderDate = {};
            if (lastOrderDateFrom) filters.lastOrderDate.$gte = lastOrderDateFrom;
            if (lastOrderDateTo) {
                const end = new Date(lastOrderDateTo);
                end.setHours(23, 59, 59, 999);
                filters.lastOrderDate.$lte = end;
            }
        }

        if (totalAmountFrom !== undefined || totalAmountTo !== undefined) {
            filters.totalAmount = {};
            if (totalAmountFrom !== undefined) filters.totalAmount.$gte = totalAmountFrom;
            if (totalAmountTo !== undefined) filters.totalAmount.$lte = totalAmountTo;
        }

        if (orderCountFrom !== undefined || orderCountTo !== undefined) {
            filters.orderCount = {};
            if (orderCountFrom !== undefined) filters.orderCount.$gte = orderCountFrom;
            if (orderCountTo !== undefined) filters.orderCount.$lte = orderCountTo;
        }
        
        console.log(search);

        if (typeof search === 'string' && search.length <= 100) {
      const safeSearch = escapeRegExp(search)
      const searchRegex = new RegExp(safeSearch, 'i')

      const orders = await Order.find(
        {
          $or: [{ deliveryAddress: searchRegex }],
        },
        '_id'
      )

      const orderIds = orders.map((order) => order._id)

      filters.$or = [{ name: searchRegex }, { lastOrder: { $in: orderIds } }]
    }

        const allowedSortFields = ["createdAt", "totalAmount", "orderCount", "name"];
        const safeSortField = allowedSortFields.includes(sortField) ? sortField : "createdAt";

        const users = await User.find(filters)
            .sort({ [safeSortField]: sortOrder === "desc" ? -1 : 1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .populate([
                "orders",
                { path: "lastOrder", populate: ["products", "customer"] },
            ]);

        const totalUsers = await User.countDocuments(filters);
        const totalPages = Math.ceil(totalUsers / limit);

        res.status(200).json({
            customers: users.map((u) => ({
                _id: u._id,
                name: u.name,
                email: u.email,
                roles: u.roles,
                totalAmount: u.totalAmount,
                orderCount: u.orderCount,
                lastOrderDate: u.lastOrderDate,
                orders: u.orders,
                lastOrder: u.lastOrder,
            })),
            pagination: {
                totalUsers,
                totalPages,
                currentPage: page,
                pageSize: limit,
            },
        });
    } catch (err) {
        next(err);
    }
};

// GET /customers/:id
export const getCustomerById = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    if (!isValidObjectId(id)) {
      return next(new NotFoundError('Неверный ID пользователя'))
    }

    const user = await User.findById(id).populate(['orders', 'lastOrder'])
    if (!user) {
      return next(new NotFoundError('Пользователь не найден'))
    }

    res.status(200).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      roles: user.roles,
      orders: user.orders,
      lastOrder: user.lastOrder,
    })
  } catch (error) {
    next(error)
  }
}

// PATCH /customers/:id
export const updateCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    if (!isValidObjectId(id)) {
      return next(new NotFoundError('Неверный ID пользователя'))
    }

    const updateData: Partial<IUser> = {}
    if (typeof req.body.name === 'string') updateData.name = req.body.name
    if (typeof req.body.email === 'string') updateData.email = req.body.email
    if (Array.isArray(req.body.roles)) updateData.roles = req.body.roles

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    })
      .orFail(() => new NotFoundError('Пользователь не найден'))
      .populate(['orders', 'lastOrder'])

    res.status(200).json({
      _id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      roles: updatedUser.roles,
      orders: updatedUser.orders,
      lastOrder: updatedUser.lastOrder,
    })
  } catch (error) {
    next(error)
  }
}

// DELETE /customers/:id
export const deleteCustomer = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id : ''
    if (!isValidObjectId(id)) {
      return next(new NotFoundError('Неверный ID пользователя'))
    }

    const deletedUser = await User.findByIdAndDelete(id).orFail(
      () => new NotFoundError('Пользователь не найден')
    )

    res.status(200).json({
      _id: deletedUser._id,
      email: deletedUser.email,
      name: deletedUser.name,
      roles: deletedUser.roles,
    })
  } catch (error) {
    next(error)
  }
}
