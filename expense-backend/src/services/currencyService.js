import axios from 'axios';
import { config } from '../config/index.js';
export class CurrencyService {
    exchangeRateApiUrl;
    cache = new Map();
    cacheExpiry = 60 * 60 * 1000; // 1 hour in milliseconds
    constructor() {
        this.exchangeRateApiUrl = config.exchangeRateApiUrl || 'https://api.exchangerate-api.com/v4/latest';
    }
    /**
     * Convert amount from one currency to another
     */
    async convertCurrency(amount, fromCurrency, toCurrency) {
        try {
            if (fromCurrency === toCurrency) {
                return {
                    fromCurrency,
                    toCurrency,
                    amount,
                    convertedAmount: amount,
                    rate: 1,
                    timestamp: new Date()
                };
            }
            const rate = await this.getExchangeRate(fromCurrency, toCurrency);
            const convertedAmount = amount * rate;
            return {
                fromCurrency,
                toCurrency,
                amount,
                convertedAmount: Math.round(convertedAmount * 100) / 100, // Round to 2 decimal places
                rate,
                timestamp: new Date()
            };
        }
        catch (error) {
            console.error('Error converting currency:', error);
            throw new Error(`Failed to convert ${fromCurrency} to ${toCurrency}`);
        }
    }
    /**
     * Get exchange rate between two currencies
     */
    async getExchangeRate(fromCurrency, toCurrency) {
        try {
            if (fromCurrency === toCurrency) {
                return 1;
            }
            const cacheKey = `${fromCurrency}_${toCurrency}`;
            const cached = this.cache.get(cacheKey);
            // Check if we have a valid cached rate
            if (cached && (Date.now() - cached.timestamp.getTime()) < this.cacheExpiry) {
                return cached.rate;
            }
            // Fetch fresh rate from API
            const response = await axios.get(`${this.exchangeRateApiUrl}/${fromCurrency}`);
            const rates = response.data.rates;
            if (!rates || !rates[toCurrency]) {
                throw new Error(`Exchange rate not found for ${fromCurrency} to ${toCurrency}`);
            }
            const rate = rates[toCurrency];
            // Cache the rate
            this.cache.set(cacheKey, {
                rate,
                timestamp: new Date()
            });
            return rate;
        }
        catch (error) {
            console.error('Error getting exchange rate:', error);
            // Fallback to a default rate if API fails
            console.warn(`Using fallback rate for ${fromCurrency} to ${toCurrency}`);
            return this.getFallbackRate(fromCurrency, toCurrency);
        }
    }
    /**
     * Get all available currencies and their rates
     */
    async getAllExchangeRates(baseCurrency = 'USD') {
        try {
            const response = await axios.get(`${this.exchangeRateApiUrl}/${baseCurrency}`);
            const rates = response.data.rates;
            const exchangeRates = Object.entries(rates).map(([currency, rate]) => ({
                currency,
                rate: rate,
                timestamp: new Date()
            }));
            return exchangeRates;
        }
        catch (error) {
            console.error('Error getting all exchange rates:', error);
            throw new Error('Failed to get exchange rates');
        }
    }
    /**
     * Get supported currencies list
     */
    async getSupportedCurrencies() {
        try {
            const response = await axios.get(`${this.exchangeRateApiUrl}/USD`);
            const rates = response.data.rates;
            return Object.keys(rates);
        }
        catch (error) {
            console.error('Error getting supported currencies:', error);
            // Return common currencies as fallback
            return ['USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL'];
        }
    }
    /**
     * Validate currency code
     */
    isValidCurrency(currency) {
        const validCurrencies = [
            'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'INR', 'BRL',
            'MXN', 'SGD', 'HKD', 'NOK', 'SEK', 'DKK', 'PLN', 'CZK', 'HUF', 'RUB',
            'TRY', 'ZAR', 'KRW', 'THB', 'MYR', 'PHP', 'IDR', 'VND', 'AED', 'SAR',
            'QAR', 'KWD', 'BHD', 'OMR', 'JOD', 'LBP', 'EGP', 'ILS', 'NZD', 'CLP',
            'COP', 'PEN', 'UYU', 'ARS', 'BOB', 'PYG', 'VES', 'GTQ', 'HNL', 'NIO',
            'CRC', 'PAB', 'DOP', 'HTG', 'JMD', 'TTD', 'BBD', 'XCD', 'AWG', 'ANG'
        ];
        return validCurrencies.includes(currency.toUpperCase());
    }
    /**
     * Format currency amount
     */
    formatCurrency(amount, currency, locale = 'en-US') {
        try {
            return new Intl.NumberFormat(locale, {
                style: 'currency',
                currency: currency.toUpperCase()
            }).format(amount);
        }
        catch (error) {
            console.error('Error formatting currency:', error);
            return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
        }
    }
    /**
     * Get currency symbol
     */
    getCurrencySymbol(currency) {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'JPY': '¥',
            'CAD': 'C$',
            'AUD': 'A$',
            'CHF': 'CHF',
            'CNY': '¥',
            'INR': '₹',
            'BRL': 'R$',
            'MXN': '$',
            'SGD': 'S$',
            'HKD': 'HK$',
            'NOK': 'kr',
            'SEK': 'kr',
            'DKK': 'kr',
            'PLN': 'zł',
            'CZK': 'Kč',
            'HUF': 'Ft',
            'RUB': '₽',
            'TRY': '₺',
            'ZAR': 'R',
            'KRW': '₩',
            'THB': '฿',
            'MYR': 'RM',
            'PHP': '₱',
            'IDR': 'Rp',
            'VND': '₫',
            'AED': 'د.إ',
            'SAR': '﷼',
            'QAR': '﷼',
            'KWD': 'د.ك',
            'BHD': 'د.ب',
            'OMR': '﷼',
            'JOD': 'د.ا',
            'LBP': 'ل.ل',
            'EGP': '£',
            'ILS': '₪',
            'NZD': 'NZ$',
            'CLP': '$',
            'COP': '$',
            'PEN': 'S/',
            'UYU': '$U',
            'ARS': '$',
            'BOB': 'Bs',
            'PYG': '₲',
            'VES': 'Bs.S',
            'GTQ': 'Q',
            'HNL': 'L',
            'NIO': 'C$',
            'CRC': '₡',
            'PAB': 'B/.',
            'DOP': 'RD$',
            'HTG': 'G',
            'JMD': 'J$',
            'TTD': 'TT$',
            'BBD': 'Bds$',
            'XCD': 'EC$',
            'AWG': 'ƒ',
            'ANG': 'ƒ'
        };
        return symbols[currency.toUpperCase()] || currency.toUpperCase();
    }
    /**
     * Get fallback exchange rate when API fails
     */
    getFallbackRate(fromCurrency, toCurrency) {
        // Common fallback rates (these should be updated periodically)
        const fallbackRates = {
            'USD': {
                'EUR': 0.85,
                'GBP': 0.73,
                'JPY': 110.0,
                'CAD': 1.25,
                'AUD': 1.35,
                'CHF': 0.92,
                'CNY': 6.45,
                'INR': 74.0,
                'BRL': 5.2
            },
            'EUR': {
                'USD': 1.18,
                'GBP': 0.86,
                'JPY': 129.0,
                'CAD': 1.47,
                'AUD': 1.59,
                'CHF': 1.08,
                'CNY': 7.6,
                'INR': 87.0,
                'BRL': 6.1
            },
            'GBP': {
                'USD': 1.37,
                'EUR': 1.16,
                'JPY': 150.0,
                'CAD': 1.71,
                'AUD': 1.85,
                'CHF': 1.26,
                'CNY': 8.8,
                'INR': 101.0,
                'BRL': 7.1
            }
        };
        const fromRates = fallbackRates[fromCurrency.toUpperCase()];
        if (fromRates && fromRates[toCurrency.toUpperCase()]) {
            return fromRates[toCurrency.toUpperCase()];
        }
        // If no fallback rate found, return 1 (no conversion)
        console.warn(`No fallback rate found for ${fromCurrency} to ${toCurrency}`);
        return 1;
    }
    /**
     * Clear currency cache
     */
    clearCache() {
        this.cache.clear();
    }
    /**
     * Get cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys())
        };
    }
    /**
     * Batch convert multiple amounts
     */
    async batchConvert(conversions) {
        try {
            const results = await Promise.all(conversions.map(conversion => this.convertCurrency(conversion.amount, conversion.fromCurrency, conversion.toCurrency)));
            return results;
        }
        catch (error) {
            console.error('Error in batch conversion:', error);
            throw new Error('Failed to perform batch currency conversion');
        }
    }
    /**
     * Get currency information
     */
    getCurrencyInfo(currency) {
        const currencyNames = {
            'USD': 'US Dollar',
            'EUR': 'Euro',
            'GBP': 'British Pound',
            'JPY': 'Japanese Yen',
            'CAD': 'Canadian Dollar',
            'AUD': 'Australian Dollar',
            'CHF': 'Swiss Franc',
            'CNY': 'Chinese Yuan',
            'INR': 'Indian Rupee',
            'BRL': 'Brazilian Real',
            'MXN': 'Mexican Peso',
            'SGD': 'Singapore Dollar',
            'HKD': 'Hong Kong Dollar',
            'NOK': 'Norwegian Krone',
            'SEK': 'Swedish Krona',
            'DKK': 'Danish Krone',
            'PLN': 'Polish Zloty',
            'CZK': 'Czech Koruna',
            'HUF': 'Hungarian Forint',
            'RUB': 'Russian Ruble',
            'TRY': 'Turkish Lira',
            'ZAR': 'South African Rand',
            'KRW': 'South Korean Won',
            'THB': 'Thai Baht',
            'MYR': 'Malaysian Ringgit',
            'PHP': 'Philippine Peso',
            'IDR': 'Indonesian Rupiah',
            'VND': 'Vietnamese Dong',
            'AED': 'UAE Dirham',
            'SAR': 'Saudi Riyal',
            'QAR': 'Qatari Riyal',
            'KWD': 'Kuwaiti Dinar',
            'BHD': 'Bahraini Dinar',
            'OMR': 'Omani Rial',
            'JOD': 'Jordanian Dinar',
            'LBP': 'Lebanese Pound',
            'EGP': 'Egyptian Pound',
            'ILS': 'Israeli Shekel',
            'NZD': 'New Zealand Dollar',
            'CLP': 'Chilean Peso',
            'COP': 'Colombian Peso',
            'PEN': 'Peruvian Sol',
            'UYU': 'Uruguayan Peso',
            'ARS': 'Argentine Peso',
            'BOB': 'Bolivian Boliviano',
            'PYG': 'Paraguayan Guarani',
            'VES': 'Venezuelan Bolivar',
            'GTQ': 'Guatemalan Quetzal',
            'HNL': 'Honduran Lempira',
            'NIO': 'Nicaraguan Cordoba',
            'CRC': 'Costa Rican Colon',
            'PAB': 'Panamanian Balboa',
            'DOP': 'Dominican Peso',
            'HTG': 'Haitian Gourde',
            'JMD': 'Jamaican Dollar',
            'TTD': 'Trinidad and Tobago Dollar',
            'BBD': 'Barbadian Dollar',
            'XCD': 'East Caribbean Dollar',
            'AWG': 'Aruban Florin',
            'ANG': 'Netherlands Antillean Guilder'
        };
        return {
            code: currency.toUpperCase(),
            symbol: this.getCurrencySymbol(currency),
            name: currencyNames[currency.toUpperCase()] || currency.toUpperCase()
        };
    }
}
//# sourceMappingURL=currencyService.js.map