import { supabaseAdmin as centralizedSupabaseAdmin } from '../lib/supabase.js';

// Re-export the centralized client for backward compatibility
export const supabaseAdmin = centralizedSupabaseAdmin;

// Database helper functions
export const createUserProfile = async (userId: string, userData: any) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .insert({
        id: userId,
        name: userData.name,
        email: userData.email,
        avatar_url: userData.avatar_url || null,
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
      .from('profiles')
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
      .from('profiles')
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