import { supabaseAdmin as centralizedSupabaseAdmin } from '../lib/supabase.js';

// Re-export the centralized client for backward compatibility
export const supabaseAdmin = centralizedSupabaseAdmin;

// Database helper functions
export const createUserProfile = async (userId: string, userData: any) => {
  try {
    const existingProfile = await getUserProfile(userId);
    if (existingProfile.data) {
      console.log('User profile already exists for:', userId);
      return { data: existingProfile.data, error: null };
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: userId,
        full_name: userData.name,
        email: userData.email || null,
        phone_number: userData.phone || null,
        avatar_url: userData.avatar_url || null,
        is_verified: userData.email_confirmed_at ? true : false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Create user profile error:', error);
    return { data: null, error };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    return { data, error };
  } catch (error) {
    console.error('Get user profile error:', error);
    return { data: null, error };
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  } catch (error) {
    console.error('Update user profile error:', error);
    return { data: null, error };
  }
};

export const userProfileExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('id', userId)
      .single();
    
    return !error && !!data;
  } catch (error) {
    return false;
  }
};

// Lookups for uniqueness checks
export const findUserByEmail = async (email: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const findUserByPhone = async (phoneNumber: string) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
};

export const isEmailTaken = async (email: string): Promise<boolean> => {
  const { data } = await findUserByEmail(email);
  return !!data;
};

export const isPhoneTaken = async (phoneNumber: string, excludeUserId?: string): Promise<boolean> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('phone_number', phoneNumber)
      .maybeSingle();
    if (error) return false;
    if (!data) return false;
    if (excludeUserId && data.id === excludeUserId) return false;
    return true;
  } catch (error) {
    return false;
  }
};