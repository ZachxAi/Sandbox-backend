// Configuration file with environment variable support
module.exports = {
  PORT: process.env.PORT || 3000,
  MONGO_URI: process.env.MONGO_URI || 'mongodb://localhost:27017/sandbox',
  JWT_SECRET: process.env.JWT_SECRET || 'sandbox_dev_secret_key_change_in_production',
  NODE_ENV: process.env.NODE_ENV || 'development'
};
