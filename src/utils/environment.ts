/**
 * Environment utilities for getting configuration values
 */

/**
 * Get the frontend URL based on the current environment
 * @returns The appropriate frontend URL for the current environment
 */
export const getFrontendUrl = (): string => {
  const env = process.env.NODE_ENV || 'development';
  
  if (env === 'production') {
    return process.env.FRONTEND_URL_PROD || 'https://p2p-web-seven.vercel.app';
  }
  
  return process.env.FRONTEND_URL_DEV || 'http://localhost:3000';
};