-- Migration: Add DigiLocker KYC verification tables
-- Purpose: Support DigiLocker-based document verification
-- Created: 2025-01-06

-- Create DigiLocker session status enum
CREATE TYPE digilocker_session_status AS ENUM (
    'initiated',      -- Session created, user not redirected yet
    'redirected',     -- User redirected to DigiLocker
    'authorized',     -- User authorized document access
    'documents_fetched', -- Documents retrieved successfully
    'expired',        -- Session expired
    'failed'          -- Session failed
);

-- Create document types enum
CREATE TYPE digilocker_document_type AS ENUM (
    'aadhaar',
    'pan',
    'driving_license',
    'passport',
    'voter_id',
    'other'
);

-- Add DigiLocker-related columns to users table
ALTER TABLE users 
ADD COLUMN verification_method VARCHAR(20) DEFAULT NULL,
ADD COLUMN verified_at TIMESTAMP WITH TIME ZONE DEFAULT NULL,
ADD COLUMN digilocker_verified BOOLEAN DEFAULT FALSE,
ADD COLUMN verification_documents JSONB DEFAULT NULL;

-- Create digilocker_sessions table
CREATE TABLE digilocker_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    sandbox_session_id VARCHAR(100) UNIQUE,
    redirect_url TEXT,
    callback_url TEXT,
    status digilocker_session_status DEFAULT 'initiated',
    documents_requested TEXT[] DEFAULT ARRAY['aadhaar'],
    consent_given BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create digilocker_documents table
CREATE TABLE digilocker_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID NOT NULL REFERENCES digilocker_sessions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_type digilocker_document_type NOT NULL,
    document_name VARCHAR(255),
    document_url TEXT,
    document_data JSONB,
    file_size BIGINT,
    mime_type VARCHAR(100),
    download_url TEXT,
    downloaded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL, -- DigiLocker documents expire after 1 hour
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for digilocker_sessions
CREATE INDEX idx_digilocker_sessions_user_id ON digilocker_sessions(user_id);
CREATE INDEX idx_digilocker_sessions_status ON digilocker_sessions(status);
CREATE INDEX idx_digilocker_sessions_expires_at ON digilocker_sessions(expires_at);
CREATE INDEX idx_digilocker_sessions_sandbox_id ON digilocker_sessions(sandbox_session_id);

-- Create indexes for digilocker_documents
CREATE INDEX idx_digilocker_documents_session_id ON digilocker_documents(session_id);
CREATE INDEX idx_digilocker_documents_user_id ON digilocker_documents(user_id);
CREATE INDEX idx_digilocker_documents_type ON digilocker_documents(document_type);
CREATE INDEX idx_digilocker_documents_expires_at ON digilocker_documents(expires_at);

-- Apply updated_at triggers
CREATE TRIGGER update_digilocker_sessions_updated_at 
    BEFORE UPDATE ON digilocker_sessions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_digilocker_documents_updated_at 
    BEFORE UPDATE ON digilocker_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create function to cleanup expired DigiLocker sessions
CREATE OR REPLACE FUNCTION cleanup_expired_digilocker_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_sessions INTEGER;
    deleted_documents INTEGER;
BEGIN
    -- Clean up expired documents first
    DELETE FROM digilocker_documents 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_documents = ROW_COUNT;
    
    -- Clean up expired sessions that are not completed
    DELETE FROM digilocker_sessions 
    WHERE expires_at < NOW() 
    AND status NOT IN ('documents_fetched');
    
    GET DIAGNOSTICS deleted_sessions = ROW_COUNT;
    
    -- Return total cleaned items
    RETURN deleted_sessions + deleted_documents;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user verification status
CREATE OR REPLACE FUNCTION get_user_verification_status(p_user_id UUID)
RETURNS TABLE(
    is_verified BOOLEAN,
    verification_method VARCHAR(20),
    verified_at TIMESTAMP WITH TIME ZONE,
    documents_count INTEGER,
    latest_session_status digilocker_session_status
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.digilocker_verified as is_verified,
        u.verification_method,
        u.verified_at,
        COALESCE(doc_count.count, 0)::INTEGER as documents_count,
        latest_session.status as latest_session_status
    FROM users u
    LEFT JOIN (
        SELECT user_id, COUNT(*)::INTEGER as count
        FROM digilocker_documents 
        WHERE expires_at > NOW()
        GROUP BY user_id
    ) doc_count ON u.id = doc_count.user_id
    LEFT JOIN (
        SELECT DISTINCT ON (user_id) user_id, status
        FROM digilocker_sessions
        ORDER BY user_id, created_at DESC
    ) latest_session ON u.id = latest_session.user_id
    WHERE u.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for DigiLocker tables
ALTER TABLE digilocker_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE digilocker_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for digilocker_sessions
CREATE POLICY "Users can view their own DigiLocker sessions" 
    ON digilocker_sessions FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own DigiLocker sessions" 
    ON digilocker_sessions FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own DigiLocker sessions" 
    ON digilocker_sessions FOR UPDATE 
    USING (auth.uid() = user_id);

-- RLS policies for digilocker_documents
CREATE POLICY "Users can view their own DigiLocker documents" 
    ON digilocker_documents FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Service can manage all DigiLocker data" 
    ON digilocker_sessions FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "Service can manage all DigiLocker documents" 
    ON digilocker_documents FOR ALL 
    USING (auth.jwt() ->> 'role' = 'service_role');

-- Add comments
COMMENT ON TABLE digilocker_sessions IS 'DigiLocker KYC verification sessions';
COMMENT ON TABLE digilocker_documents IS 'Documents fetched from DigiLocker';
COMMENT ON FUNCTION cleanup_expired_digilocker_sessions() IS 'Cleanup expired DigiLocker sessions and documents';
COMMENT ON FUNCTION get_user_verification_status(UUID) IS 'Get comprehensive verification status for a user';