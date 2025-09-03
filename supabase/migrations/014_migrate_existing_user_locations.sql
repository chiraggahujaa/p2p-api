-- Migration: Data migration for existing user locations and cleanup
-- Created: Migrate existing single location per user to multiple locations system

-- Step 1: Migrate existing user location data to user_locations table
INSERT INTO user_locations (user_id, location_id, is_default, label, created_at, updated_at)
SELECT 
  id as user_id,
  location_id,
  TRUE as is_default,
  'Home' as label,
  created_at,
  updated_at
FROM users 
WHERE location_id IS NOT NULL;

-- Step 2: Log migration statistics
DO $$
DECLARE
  migrated_count INTEGER;
  total_users INTEGER;
BEGIN
  SELECT COUNT(*) INTO migrated_count FROM user_locations;
  SELECT COUNT(*) INTO total_users FROM users WHERE location_id IS NOT NULL;
  
  RAISE NOTICE 'Migration completed: % user locations migrated out of % users with locations', migrated_count, total_users;
  
  -- Verify that all migrated locations are marked as default
  IF EXISTS (SELECT 1 FROM user_locations WHERE NOT is_default) THEN
    RAISE WARNING 'Some migrated locations are not marked as default - this should not happen';
  ELSE
    RAISE NOTICE 'All migrated locations are correctly marked as default';
  END IF;
END $$;

-- Step 3: Verify that all users with locations have been migrated
DO $$
DECLARE
  orphaned_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO orphaned_count 
  FROM users u 
  WHERE u.location_id IS NOT NULL 
  AND NOT EXISTS (
    SELECT 1 FROM user_locations ul 
    WHERE ul.user_id = u.id AND ul.location_id = u.location_id
  );
  
  IF orphaned_count > 0 THEN
    RAISE EXCEPTION 'Found % users with location_id that have not been migrated to user_locations', orphaned_count;
  ELSE
    RAISE NOTICE 'All user locations have been successfully migrated';
  END IF;
END $$;

-- Step 4: Drop the RLS policy that depends on users.location_id
DROP POLICY IF EXISTS "Users can update their own locations" ON location;

-- Step 5: Drop the foreign key constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS fk_users_location;

-- Step 6: Drop the location_id column from users table
ALTER TABLE users DROP COLUMN IF EXISTS location_id;

-- Step 7: Recreate the location update policy using the new user_locations table
CREATE POLICY "Users can update their own locations" ON location
    FOR UPDATE TO authenticated USING (
        id IN (
            SELECT location_id FROM user_locations WHERE user_id = auth.uid()
            UNION
            SELECT location_id FROM item WHERE user_id = auth.uid()
        )
    );

-- Step 8: Update the users index (remove location index)
DROP INDEX IF EXISTS idx_users_location;

-- Step 9: Log completion
DO $$
BEGIN
  RAISE NOTICE 'Successfully removed location_id column from users table';
  RAISE NOTICE 'Users now use the user_locations junction table for multiple location support';
END $$;