import { supabase } from '../../database/connection.js';
import { ROLES, ROLE_MAPPINGS } from '../../constants/roles.js';
import bcrypt from 'bcryptjs';

export const UserModel = {
  // Create a new user with Supabase Auth
  async create(userData) {
    // Create Supabase auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: userData.email,
      password: userData.password,
      options: {
        data: {
          role: ROLE_MAPPINGS[userData.role] || userData.role
        }
      }
    });
    if (authError) throw authError;

    // Hash password for database storage
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Store additional user data
    const { data, error } = await supabase
      .from('users')
      .insert([{
        id: authData.user.id,
        ...userData,
        password: hashedPassword,
        legacy_role: userData.role,
        role: ROLE_MAPPINGS[userData.role] || userData.role
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Find user by email
  async findByEmail(email) {
    const { data: authData } = await supabase.auth.admin.listUsers();
    const supabaseUser = authData?.users?.find(u => u.email === email);
    
    if (!supabaseUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Find user by ID
  async findById(id) {
    const { data: authData } = await supabase.auth.admin.getUserById(id);
    const supabaseUser = authData?.user;
    
    if (!supabaseUser) return null;

    const { data, error } = await supabase
      .from('users')
      .select()
      .eq('id', id)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // Update user
  async update(id, updateData) {
    // Update auth data if needed
    if (updateData.email || updateData.password) {
      const authUpdate = {};
      if (updateData.email) authUpdate.email = updateData.email;
      if (updateData.password) {
        authUpdate.password = updateData.password;
        // Hash password for database storage
        updateData.password = await bcrypt.hash(updateData.password, 10);
      }
      
      const { error: authError } = await supabase.auth.admin.updateUserById(
        id,
        authUpdate
      );
      if (authError) throw authError;
    }

    // Update role in auth metadata if changed
    if (updateData.role) {
      const { error: metaError } = await supabase.auth.admin.updateUserById(
        id,
        {
          user_metadata: { role: ROLE_MAPPINGS[updateData.role] || updateData.role }
        }
      );
      if (metaError) throw metaError;
    }

    // Update user data
    const { data, error } = await supabase
      .from('users')
      .update({ 
        ...updateData,
        legacy_role: updateData.role || undefined,
        role: updateData.role ? (ROLE_MAPPINGS[updateData.role] || updateData.role) : undefined,
        updated_at: new Date() 
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  // Delete user
  async delete(id) {
    // Delete from Supabase Auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id);
    if (authError) throw authError;

    // Delete from users table
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  }
};
