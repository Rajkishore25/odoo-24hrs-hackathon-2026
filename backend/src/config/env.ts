import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'change-this-secret',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '8h',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  companyName: process.env.COMPANY_NAME || 'PeoplePay360',
};

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

if (config.nodeEnv === 'production' && config.jwtSecret === 'change-this-secret') {
  throw new Error('JWT_SECRET must be set in production');
}
