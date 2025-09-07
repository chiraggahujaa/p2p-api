-- Migration: Revert OTP-based KYC tables and columns
-- Purpose: Remove deprecated Aadhaar OTP verification infrastructure
-- Created: 2025-01-06

-- Remove KYC-related columns from users table
ALTER TABLE users 
DROP COLUMN IF EXISTS verification_method,
DROP COLUMN IF EXISTS verified_at;

-- Drop cleanup function
DROP FUNCTION IF EXISTS cleanup_expired_kyc_sessions();

-- Drop trigger
DROP TRIGGER IF EXISTS update_kyc_sessions_updated_at ON kyc_sessions;

-- Drop kyc_sessions table
DROP TABLE IF EXISTS kyc_sessions;

-- Drop kyc_session_status enum
DROP TYPE IF EXISTS kyc_session_status;

-- Add comment
COMMENT ON SCHEMA public IS 'Reverted OTP-based KYC infrastructure - migrating to DigiLocker';