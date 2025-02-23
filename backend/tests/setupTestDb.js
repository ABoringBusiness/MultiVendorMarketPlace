import { supabase } from '../database/connection.js';

// Setup test database
export const setupTestDb = async () => {
  // Clear test data
  await supabase.from('users').delete().neq('id', '');
  await supabase.from('products').delete().neq('id', '');
  await supabase.from('orders').delete().neq('id', '');
  await supabase.from('reviews').delete().neq('id', '');

  // Create test user
  const { data: userData, error: userError } = await supabase.from('users').insert([{
    id: 'test_user_id',
    email: 'test@example.com',
    role: 'seller',
    status: 'active'
  }]).select().single();

  if (userError) throw userError;

  // Create test product
  const { data: productData, error: productError } = await supabase.from('products').insert([{
    id: 'test_product_id',
    title: 'Test Product',
    description: 'Test Description',
    price: 99.99,
    seller_id: userData.id,
    status: 'active'
  }]).select().single();

  if (productError) throw productError;

  return {
    testUser: userData,
    testProduct: productData
  };
};
