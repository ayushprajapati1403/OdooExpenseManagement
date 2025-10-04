import dotenv from 'dotenv';
dotenv.config();
export const config = {
    port: process.env.PORT || 3000,
    nodeEnv: process.env.NODE_ENV || 'development',
    jwt: {
        secret: process.env.JWT_SECRET || 'your-secret-key',
        expiresIn: '7d'
    },
    database: {
        url: process.env.DATABASE_URL || ''
    },
    uploads: {
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    },
    externalApis: {
        countriesApi: 'https://restcountries.com/v3.1/name',
        exchangeRateApi: 'https://api.exchangerate-api.com/v4/latest'
    }
};
//# sourceMappingURL=index.js.map