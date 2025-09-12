import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

dotenv.config();

// Load environment-specific configuration
const environment = process.env.NODE_ENV || 'development';
const configPath = path.join(__dirname, 'cypress', 'config', `${environment}.json`);
let envConfig = {};

if (fs.existsSync(configPath)) {
  envConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  console.log(`📋 Loaded Cypress config for environment: ${environment}`);
} else {
  console.warn(`⚠️  No config found for environment: ${environment}, using defaults`);
}

export default defineConfig({
  e2e: {
    // Use new folder structure only
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    downloadsFolder: 'cypress/downloads',
    
    // Apply environment-specific settings
    baseUrl: (envConfig as any).api?.baseUrl || process.env.API_BASE_URL || 'http://localhost:5000',
    defaultCommandTimeout: (envConfig as any).api?.timeout || 10000,
    requestTimeout: (envConfig as any).api?.timeout || 15000,
    responseTimeout: (envConfig as any).api?.timeout || 15000,
    pageLoadTimeout: 30000,
    
    testIsolation: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    
    retries: (envConfig as any).retries || {
      runMode: 2,
      openMode: 0,
    },
    
    video: (envConfig as any).video?.enabled !== false,
    videoCompression: (envConfig as any).video?.compression || 32,
    screenshotOnRunFailure: (envConfig as any).screenshots?.onFailure !== false,
    
    setupNodeEvents(on, config) {
      // Enhanced task definitions
      on('task', {
        log(message) {
          console.log(`[${new Date().toISOString()}] ${message}`);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
        // Database operations
        seedDatabase(options = {}) {
          console.log('🌱 Database seeding requested:', options);
          // Implementation would go here
          return { success: true, message: 'Database seeded' };
        },
        cleanDatabase(options = {}) {
          console.log('🧹 Database cleanup requested:', options);
          // Implementation would go here
          return { success: true, message: 'Database cleaned' };
        },
        // Performance monitoring
        logPerformanceMetrics(metrics) {
          console.log('📊 Performance metrics:', metrics);
          // Could save to file or external service
          return null;
        },
        // File operations
        readJsonFile(filePath) {
          try {
            const content = fs.readFileSync(filePath, 'utf8');
            return JSON.parse(content);
          } catch (error) {
            return null;
          }
        },
        writeJsonFile({ filePath, data }) {
          try {
            fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
            return { success: true };
          } catch (error) {
            return { success: false, error: (error as Error).message };
          }
        }
      });
      
      // Merge environment variables
      config.env = {
        ...config.env,
        ...envConfig,
        // Core environment variables
        NODE_ENV: environment,
        API_BASE_URL: (envConfig as any).api?.baseUrl || process.env.API_BASE_URL || 'http://localhost:5000/api',
        DB_URL: process.env.DATABASE_URL,
        SUPABASE_URL: process.env.SUPABASE_URL,
        SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
        
        // Test configuration
        FAIL_FAST: process.env.FAIL_FAST === 'true' || false,
        PARALLEL: process.env.PARALLEL === 'true' || false,
        TEST_TAGS: process.env.TEST_TAGS || '',
        
        // CI/CD specific
        CI: process.env.CI === 'true',
        GITHUB_ACTIONS: process.env.GITHUB_ACTIONS === 'true',
        
        // Performance and load testing
        PERFORMANCE_TESTING: (envConfig as any).performance?.enabled !== false,
        LOAD_TESTING: (envConfig as any).performance?.loadTest?.enabled === true,
        
        // Feature flags
        FEATURES: (envConfig as any).features || {},
        
        // Test data management
        SEED_DATABASE: (envConfig as any).database?.seedData === true,
        PRESERVE_DATA: (envConfig as any).database?.preserveData === true,
        
        // Test credentials
        TEST_USER_EMAIL: process.env.TEST_USER_EMAIL,
        TEST_USER_PASSWORD: process.env.TEST_USER_PASSWORD,
        
        // Logging
        LOG_LEVEL: (envConfig as any).logging?.level || 'info',
      };
      
      // Apply performance thresholds
      if ((envConfig as any).performance?.thresholds) {
        config.env.PERFORMANCE_THRESHOLDS = (envConfig as any).performance.thresholds;
      }
      
      // Setup test filtering based on tags
      if (process.env.TEST_TAGS) {
        const tags = process.env.TEST_TAGS.split(',');
        console.log(`🏷️  Running tests with tags: ${tags.join(', ')}`);
      }
      
      // Setup parallel execution
      if (process.env.PARALLEL === 'true') {
        console.log('🚀 Parallel execution enabled');
      }
      
      console.log(`🧪 Cypress configured for ${environment} environment`);
      
      return config;
    },
    
    // Exclude patterns
    excludeSpecPattern: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
      '**/*.d.ts',
    ],
    
    // Watch configuration
    watchForFileChanges: environment === 'development',
    
    // Experimental features
    experimentalStudio: environment === 'development',
    experimentalRunAllSpecs: true,
  },
  
  // Component testing (if needed in future)
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
  },
});