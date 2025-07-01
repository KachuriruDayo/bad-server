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

export const normalizePhone = (input: unknown, defaultCountry = 'RU' as any): string | null => {
    if (typeof input !== 'string') return null;
    
    const cleanedInput = input.replace(/[^\d+]/g, '');

    const phoneNumber = parsePhoneNumberFromString(cleanedInput, defaultCountry);
    if (!phoneNumber || !phoneNumber.isValid()) return null;

    return phoneNumber.number; // возвращает номер в E.164 формате
}

const getSingleString = (value?: string | string[]): string | undefined => {
    if (Array.isArray(value)) {
        if (value.length === 0) return undefined;
        if (value.length > 1) throw new BadRequestError('Параметр не должен быть массивом');
        return value[0];
    }
    return value;
}

const toPositiveInt = (value?: string): number | undefined => {
    if (!value) return undefined;
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw new BadRequestError(`Параметр должен быть положительным целым числом: ${value}`);
    }
    return n;
}

const parsePositiveInt = (value?: string, defaultValue = 1): number => {
    if (!value) return defaultValue;
    const n = Number(value);
    if (!Number.isInteger(n) || n <= 0) {
        throw new BadRequestError(`Параметр должен быть положительным целым числом: ${value}`);
    }
    return n;
}

const toDate = (value?: string): Date | undefined => {
    if (!value) return undefined;
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) {
        throw new BadRequestError(`Параметр должен быть валидной датой: ${value}`);
    }
    return d;
}

const parseDate = (value?: string): Date | undefined => toDate(value)

const toSortOrder = (value?: string): 'asc' | 'desc'  => {
    if (!value) return 'desc';
    if (value !== 'asc' && value !== 'desc') {
        throw new BadRequestError('sortOrder должен быть "asc" или "desc"');
    }
    return value;
}

const parseSortOrder = (value?: string, defaultValue: 'asc' | 'desc' = 'desc'): 'asc' | 'desc' => {
    if (!value) return defaultValue;
    if (value !== 'asc' && value !== 'desc') {
        throw new BadRequestError('sortOrder должен быть "asc" или "desc"');
    }
    return value;
}

const parseNonNegativeNumber = (value?: string): number | undefined => {
    if (!value) return undefined;
    const n = Number(value);
    if (!Number.isFinite(n) || n < 0) {
        throw new BadRequestError(`Параметр должен быть неотрицательным числом: ${value}`);
    }
    return n;
}

const sanitizeSearch = (value?: string): string | undefined => {
    if (!value) return undefined;
    
    const trimmed = value.trim();

    if (trimmed.length === 0) {
        return undefined;
    }

    const allowedPattern = /^[a-zA-Z0-9\s\-_.]+$/;

    if (!allowedPattern.test(trimmed)) {
        throw new BadRequestError('Поисковый запрос содержит недопустимые символы');
    }

    return trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


export const normalizeOrderQueryParams = (query: OrderQueryParams, defaultLimit = 10): NormalizedOrderParams => {
    const parseNumber = (value?: string | string[]) => {
        const str = getSingleString(value);
        return str ? Number(str) : undefined;
    };
    
    const parseDateString = (value?: string | string[]) => toDate(getSingleString(value));

    const pageStr = getSingleString(query.page);

    return {
        page: toPositiveInt(pageStr) ?? 1,
        limit: normalizeLimit(query.limit, defaultLimit),
        sortField: getSingleString(query.sortField) ?? 'createdAt',
        sortOrder: toSortOrder(getSingleString(query.sortOrder)),
        status: getSingleString(query.status),
        totalAmountFrom: parseNumber(query.totalAmountFrom),
        totalAmountTo: parseNumber(query.totalAmountTo),
        orderDateFrom: parseDateString(query.orderDateFrom),
        orderDateTo: parseDateString(query.orderDateTo),
        search: sanitizeSearch(getSingleString(query.search)),
    };
};


export const normalizeCustomerQueryParams = (
    query: CustomerQueryParams,
    defaultLimit = 10
): NormalizedCustomerParams => {
    const parseDateString = (value?: string | string[]) => parseDate(getSingleString(value));
    const parseNumberString = (value?: string | string[]) => parseNonNegativeNumber(getSingleString(value));
    const parsePositiveIntString = (value?: string | string[], fallback?: number) =>
        parsePositiveInt(getSingleString(value), fallback);

    const page = parsePositiveIntString(query.page, 1);
    const limitRaw = getSingleString(query.limit);
    const limit = normalizeLimit(limitRaw ? Number(limitRaw) : undefined, defaultLimit);

    return {
        page,
        limit,
        sortField: getSingleString(query.sortField) || 'createdAt',
        sortOrder: parseSortOrder(getSingleString(query.sortOrder), 'desc'),

        registrationDateFrom: parseDateString(query.registrationDateFrom),
        registrationDateTo: parseDateString(query.registrationDateTo),
        lastOrderDateFrom: parseDateString(query.lastOrderDateFrom),
        lastOrderDateTo: parseDateString(query.lastOrderDateTo),

        totalAmountFrom: parseNumberString(query.totalAmountFrom),
        totalAmountTo: parseNumberString(query.totalAmountTo),

        orderCountFrom: parseNumberString(query.orderCountFrom),
        orderCountTo: parseNumberString(query.orderCountTo),

        search: sanitizeSearch(getSingleString(query.search)),
    };
};

