-- Migration: Create core tables (Users, Categories, Locations, Files)
-- Created: Initial P2P Platform Database Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Create ENUM types
CREATE TYPE user_gender AS ENUM ('male', 'female', 'other', 'prefer_not_to_say');
CREATE TYPE user_dob_visibility AS ENUM ('public', 'friends', 'private');
CREATE TYPE file_type AS ENUM ('image', 'document', 'video', 'other');
CREATE TYPE device_type AS ENUM ('web', 'mobile_ios', 'mobile_android', 'desktop');

-- 1. USERS Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone_number VARCHAR(20),
    gender user_gender,
    dob DATE,
    dob_visibility user_dob_visibility DEFAULT 'private',
    location_id UUID,
    trust_score DECIMAL(3,2) DEFAULT 0.00 CHECK (trust_score >= 0 AND trust_score <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE,
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE
);

-- 2. LOCATION Table
CREATE TABLE location (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    address_line TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. CATEGORIES Table
CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    icon_url TEXT,
    banner_url TEXT,
    parent_category_id UUID REFERENCES categories(id),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. FILE Table
CREATE TABLE file (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    url TEXT NOT NULL,
    uploaded_on TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    file_type file_type NOT NULL,
    file_size BIGINT, -- in bytes
    mime_type VARCHAR(100),
    alt_text VARCHAR(255),
    is_public BOOLEAN DEFAULT FALSE
);

-- 5. DEVICE Table  
CREATE TABLE device (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    device_type device_type NOT NULL,
    os_version VARCHAR(50),
    app_version VARCHAR(50),
    device_token TEXT, -- for push notifications
    last_login_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint for users location
ALTER TABLE users ADD CONSTRAINT fk_users_location 
    FOREIGN KEY (location_id) REFERENCES location(id);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_location ON users(location_id);
CREATE INDEX idx_users_trust_score ON users(trust_score);
CREATE INDEX idx_users_created_at ON users(created_at);

CREATE INDEX idx_location_city_state ON location(city, state);
CREATE INDEX idx_location_pincode ON location(pincode);
CREATE INDEX idx_location_coordinates ON location(latitude, longitude);

CREATE INDEX idx_categories_parent ON categories(parent_category_id);
CREATE INDEX idx_categories_active ON categories(is_active);

CREATE INDEX idx_file_user ON file(user_id);
CREATE INDEX idx_file_type ON file(file_type);
CREATE INDEX idx_file_uploaded ON file(uploaded_on);

CREATE INDEX idx_device_user ON device(user_id);
CREATE INDEX idx_device_active ON device(is_active);
CREATE INDEX idx_device_last_login ON device(last_login_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_location_updated_at 
    BEFORE UPDATE ON location 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();