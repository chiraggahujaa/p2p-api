import { defineConfig } from 'cypress';
import * as dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5000',
    specPattern: 'cypress/e2e-tests/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    fixturesFolder: 'cypress/fixtures',
    screenshotsFolder: 'cypress/screenshots',
    videosFolder: 'cypress/videos',
    downloadsFolder: 'cypress/downloads',
    testIsolation: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    video: true,
    videoCompression: 32,
    screenshotOnRunFailure: true,
    setupNodeEvents(on, config) {
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        },
      });
      
      config.env = {
        ...config.env,
        API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:5000/api',
        DB_URL: process.env.DATABASE_URL,
      };
      
      return config;
    },
    
    // Environment variables
    env: {
      API_BASE_URL: 'http://localhost:5000/api',
      FAIL_FAST: false,
    },
    
    // Exclude node_modules from watching
    watchForFileChanges: true,
    excludeSpecPattern: [
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
    ],
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