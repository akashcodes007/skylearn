/**
 * Application Configuration
 */

const config = {
  // Server configuration
  server: {
    port: parseInt(process.env.PORT || '3000'),
    host: process.env.HOST || '0.0.0.0'
  },
  
  // Session configuration
  session: {
    secret: process.env.SESSION_SECRET || 'default_secret_change_in_production',
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  },
  
  // Database configuration (if using external DB)
  database: {
    url: process.env.DATABASE_URL || null
  },
  
  // OpenAI configuration
  openai: {
    apiKey: process.env.OPENAI_API_KEY || null,
    model: 'gpt-4o' // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
  },
  
  // Code execution configuration
  codeExecution: {
    timeout: 10000, // 10 seconds
    maxMemory: '128m'
  }
};

export default config;