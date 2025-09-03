-- Migration: Create user_locations junction table for multiple locations per user
-- Created: Multiple Location Support Implementation

-- Create user_locations table for many-to-many relationship between users and locations
CREATE TABLE user_locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  location_id UUID NOT NULL REFERENCES location(id) ON DELETE CASCADE,
  is_default BOOLEAN DEFAULT FALSE,
  label VARCHAR(50) DEFAULT 'Home',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique user_id + location_id combination
  UNIQUE(user_id, location_id)
);

-- Create indexes for performance
CREATE INDEX idx_user_locations_user_id ON user_locations(user_id);
CREATE INDEX idx_user_locations_location_id ON user_locations(location_id);
CREATE INDEX idx_user_locations_default ON user_locations(user_id, is_default);

-- Trigger function to ensure only one default location per user
CREATE OR REPLACE FUNCTION ensure_single_default_location()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a location as default, unset all other defaults for this user
  IF NEW.is_default = TRUE THEN
    UPDATE user_locations 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);
  END IF;
  
  -- Ensure at least one default exists if this is the user's first location
  IF NOT EXISTS (
    SELECT 1 FROM user_locations 
    WHERE user_id = NEW.user_id 
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
  ) THEN
    NEW.is_default = TRUE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single default location
CREATE TRIGGER trigger_ensure_single_default_location
  BEFORE INSERT OR UPDATE ON user_locations
  FOR EACH ROW EXECUTE FUNCTION ensure_single_default_location();

-- Apply updated_at trigger to user_locations table
CREATE TRIGGER update_user_locations_updated_at 
    BEFORE UPDATE ON user_locations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add RLS (Row Level Security) policies
ALTER TABLE user_locations ENABLE ROW LEVEL SECURITY;

-- Users can view their own locations
CREATE POLICY "Users can view own user_locations"
    ON user_locations FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- Users can insert their own locations
CREATE POLICY "Users can insert own user_locations"
    ON user_locations FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own locations
CREATE POLICY "Users can update own user_locations"
    ON user_locations FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own locations
CREATE POLICY "Users can delete own user_locations"
    ON user_locations FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Create function to get user's default location
CREATE OR REPLACE FUNCTION get_user_default_location(user_uuid UUID)
RETURNS TABLE(
  location_id UUID,
  address_line TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  label VARCHAR(50)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    l.id,
    l.address_line,
    l.city,
    l.state,
    l.pincode,
    l.country,
    l.latitude,
    l.longitude,
    ul.label
  FROM user_locations ul
  JOIN location l ON ul.location_id = l.id
  WHERE ul.user_id = user_uuid AND ul.is_default = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to get all user locations with details
CREATE OR REPLACE FUNCTION get_user_locations_with_details(user_uuid UUID)
RETURNS TABLE(
  id UUID,
  location_id UUID,
  address_line TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  pincode VARCHAR(20),
  country VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  label VARCHAR(50),
  is_default BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ul.id,
    l.id,
    l.address_line,
    l.city,
    l.state,
    l.pincode,
    l.country,
    l.latitude,
    l.longitude,
    ul.label,
    ul.is_default,
    ul.created_at,
    ul.updated_at
  FROM user_locations ul
  JOIN location l ON ul.location_id = l.id
  WHERE ul.user_id = user_uuid
  ORDER BY ul.is_default DESC, ul.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;