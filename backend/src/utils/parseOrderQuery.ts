import {parsePhoneNumberFromString} from "libphonenumber-js";
import BadRequestError from "../errors/bad-request-error"

interface OrderQueryParams {
    page?: string | string[];
    limit?: string | string[];
    sortField?: string | string[];
    sortOrder?: string | string[];
    status?: string | string[];
    totalAmountFrom?: string | string[];
    totalAmountTo?: string | string[];
    orderDateFrom?: string | string[];
    orderDateTo?: string | string[];
    search?: string | string[];
}

interface NormalizedOrderParams {
    page: number;
    limit: number;
    sortField: string;
    sortOrder: 'asc' | 'desc';
    status?: string;
    totalAmountFrom?: number;
    totalAmountTo?: number;
    orderDateFrom?: Date;
    orderDateTo?: Date;
    search?: string;
}

interface CustomerQueryParams {
    page?: string | string[];
    limit?: string | string[];
    sortField?: string | string[];
    sortOrder?: string | string[];
    registrationDateFrom?: string | string[];
    registrationDateTo?: string | string[];
    lastOrderDateFrom?: string | string[];
    lastOrderDateTo?: string | string[];
    totalAmountFrom?: string | string[];
    totalAmountTo?: string | string[];
    orderCountFrom?: string | string[];
    orderCountTo?: string | string[];
    search?: string | string[];
}

interface NormalizedCustomerParams {
    page: number;
    limit: number;
    sortField: string;
    sortOrder: 'asc' | 'desc';
    registrationDateFrom?: Date;
    registrationDateTo?: Date;
    lastOrderDateFrom?: Date;
    lastOrderDateTo?: Date;
    totalAmountFrom?: number;
    totalAmountTo?: number;
    orderCountFrom?: number;
    orderCountTo?: number;
    search?: string;
}

export const normalizeLimit = (limitQuery: unknown, defaultLim: number ): number =>{
    let limitStr = '';

    if (typeof limitQuery === 'string') {
        limitStr = limitQuery;
    } else if (Array.isArray(limitQuery)) {
        limitStr = limitQuery[0] ?? '';
    } else {
        return defaultLim;
    }

    const limitNum = parseInt(limitStr, 10);

    if (Number.isNaN(limitNum) || limitNum <= 0) {
        return defaultLim;
    }

    return limitNum > defaultLim ? defaultLim : limitNum;
}

export const normalizePhone = (input: string, defaultCountry = 'RU' as any): string | null => {
    const phoneNumber = parsePhoneNumberFromString(input, defaultCountry);
    if (!phoneNumber || !phoneNumber.isValid()) return null;
    return phoneNumber.number; // возвращает номер в E.164 формате
}

function getSingleString(value?: string | string[]): string | undefined {
    if (Array.isArray(value)) {
        if (value.length === 0) return undefined;
        if (value.length > 1) throw new BadRequestError('Параметр не должен быть массивом');
        return value[0];
    }
    return value;
}

function toPositiveInt(value?: string): number | undefined {
    if (!value) return undefined;
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw new BadRequestError(`Параметр должен быть положительным целым числом: ${value}`);
    }
    return n;
}

function parsePositiveInt(value?: string, defaultValue = 1): number {
    if (!value) return defaultValue;
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw new BadRequestError(`Параметр должен быть положительным целым числом: ${value}`);
    }
    return n;
}

function toDate(value?: string): Date | undefined {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        throw new BadRequestError(`Параметр должен быть валидной датой: ${value}`);
    }
    return d;
}

function parseDate(value?: string): Date | undefined {
    return toDate(value);
}

function toSortOrder(value?: string): 'asc' | 'desc' {
    if (!value) return 'desc';
    if (value !== 'asc' && value !== 'desc') {
        throw new BadRequestError('sortOrder должен быть "asc" или "desc"');
    }
    return value;
}

function parseSortOrder(value?: string, defaultValue: 'asc' | 'desc' = 'desc'): 'asc' | 'desc' {
    if (!value) return defaultValue;
    if (value !== 'asc' && value !== 'desc') {
        throw new BadRequestError('sortOrder должен быть "asc" или "desc"');
    }
    return value;
}

function parseNonNegativeNumber(value?: string): number | undefined {
    if (!value) return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
        throw new BadRequestError(`Параметр должен быть неотрицательным числом: ${value}`);
    }
    return n;
}

function sanitizeSearch(value?: string): string | undefined {
    if (!value) return undefined;
    // Пример базовой проверки, можно усложнить при необходимости
    if (/[^a-zA-Z0-9\s]/.test(value)) {
        throw new BadRequestError('Поисковый запрос содержит недопустимые символы');
    }
    return value;
}

export function normalizeOrderQueryParams(query: OrderQueryParams, defaultLimit = 10): NormalizedOrderParams {

    const pageStr = getSingleString(query.page);
    const limitRaw = query.limit;

    const sortField = getSingleString(query.sortField) ?? 'createdAt';
    const sortOrder = toSortOrder(getSingleString(query.sortOrder));
    const status = getSingleString(query.status);
    const totalAmountFromStr = getSingleString(query.totalAmountFrom);
    const totalAmountToStr = getSingleString(query.totalAmountTo);
    const orderDateFromStr = getSingleString(query.orderDateFrom);
    const orderDateToStr = getSingleString(query.orderDateTo);
    const search = getSingleString(query.search);

    return {
        page: toPositiveInt(pageStr) ?? 1,
        limit: normalizeLimit(limitRaw, defaultLimit),
        sortField,
        sortOrder,
        status,
        totalAmountFrom: totalAmountFromStr ? Number(totalAmountFromStr) : undefined,
        totalAmountTo: totalAmountToStr ? Number(totalAmountToStr) : undefined,
        orderDateFrom: toDate(orderDateFromStr),
        orderDateTo: toDate(orderDateToStr),
        search,
    };
}

export function normalizeCustomerQueryParams(query: CustomerQueryParams, defaultLimit = 10): NormalizedCustomerParams {
    const page = parsePositiveInt(getSingleString(query.page), 1);
    const limit = parsePositiveInt(getSingleString(query.limit), defaultLimit);
    const sortField = getSingleString(query.sortField) || 'createdAt';
    const sortOrder = parseSortOrder(getSingleString(query.sortOrder), 'desc');

    const registrationDateFrom = parseDate(getSingleString(query.registrationDateFrom));
    const registrationDateTo = parseDate(getSingleString(query.registrationDateTo));
    const lastOrderDateFrom = parseDate(getSingleString(query.lastOrderDateFrom));
    const lastOrderDateTo = parseDate(getSingleString(query.lastOrderDateTo));

    const totalAmountFrom = parseNonNegativeNumber(getSingleString(query.totalAmountFrom));
    const totalAmountTo = parseNonNegativeNumber(getSingleString(query.totalAmountTo));

    const orderCountFrom = parseNonNegativeNumber(getSingleString(query.orderCountFrom));
    const orderCountTo = parseNonNegativeNumber(getSingleString(query.orderCountTo));

    const search = sanitizeSearch(getSingleString(query.search));

    return {
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
    };
}
