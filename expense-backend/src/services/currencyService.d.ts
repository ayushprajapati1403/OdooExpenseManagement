export interface CurrencyConversion {
    fromCurrency: string;
    toCurrency: string;
    amount: number;
    convertedAmount: number;
    rate: number;
    timestamp: Date;
}
export interface ExchangeRate {
    currency: string;
    rate: number;
    timestamp: Date;
}
export declare class CurrencyService {
    private exchangeRateApiUrl;
    private cache;
    private cacheExpiry;
    constructor();
    /**
     * Convert amount from one currency to another
     */
    convertCurrency(amount: number, fromCurrency: string, toCurrency: string): Promise<CurrencyConversion>;
    /**
     * Get exchange rate between two currencies
     */
    getExchangeRate(fromCurrency: string, toCurrency: string): Promise<number>;
    /**
     * Get all available currencies and their rates
     */
    getAllExchangeRates(baseCurrency?: string): Promise<ExchangeRate[]>;
    /**
     * Get supported currencies list
     */
    getSupportedCurrencies(): Promise<string[]>;
    /**
     * Validate currency code
     */
    isValidCurrency(currency: string): boolean;
    /**
     * Format currency amount
     */
    formatCurrency(amount: number, currency: string, locale?: string): string;
    /**
     * Get currency symbol
     */
    getCurrencySymbol(currency: string): string;
    /**
     * Get fallback exchange rate when API fails
     */
    private getFallbackRate;
    /**
     * Clear currency cache
     */
    clearCache(): void;
    /**
     * Get cache statistics
     */
    getCacheStats(): {
        size: number;
        keys: string[];
    };
    /**
     * Batch convert multiple amounts
     */
    batchConvert(conversions: Array<{
        amount: number;
        fromCurrency: string;
        toCurrency: string;
    }>): Promise<CurrencyConversion[]>;
    /**
     * Get currency information
     */
    getCurrencyInfo(currency: string): {
        code: string;
        symbol: string;
        name: string;
    };
}
//# sourceMappingURL=currencyService.d.ts.map