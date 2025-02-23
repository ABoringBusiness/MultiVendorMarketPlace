import { jest } from '@jest/globals';
import dotenv from 'dotenv';
import { ROLES } from '../constants/roles.js';

// Load environment variables
dotenv.config();

// Initial test data
const initialProducts = [
  {
    id: '1',
    title: 'Digital Art 1',
    description: 'Beautiful digital art',
    price: 99.99,
    category_id: '123e4567-e89b-12d3-a456-426614174000',
    seller_id: 'seller-id',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    title: 'Photography Print',
    description: 'High quality photo print',
    price: 149.99,
    category_id: '223e4567-e89b-12d3-a456-426614174000',
    seller_id: 'seller-id',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Mock users for testing
const mockUsers = {
  'mock-seller-token': {
    id: 'seller-id',
    role: ROLES.SELLER,
    email: 'seller@test.com'
  },
  'mock-admin-token': {
    id: 'admin-id',
    role: ROLES.ADMIN,
    email: 'admin@test.com'
  }
};

// Mock database state
let products = [];

// Reset database before each test
beforeEach(() => {
  products = [...initialProducts];
  jest.clearAllMocks();
  console.log('Test data initialized:', products);
});

// Helper function to filter products based on conditions
const filterProducts = (items, conditions) => {
  console.log('Filtering products:', { items, conditions });
  let result = [...items];
  
  // Apply all conditions
  for (const condition of conditions) {
    result = result.filter(item => {
      const matches = item[condition.field] === condition.value;
      console.log('Checking condition:', { item, condition, matches });
      return matches;
    });
  }

  console.log('Filter result:', result);
  return result;
};

// Create a query builder that maintains proper chaining
const createQueryBuilder = (tableName) => {
  console.log('Creating query builder for table:', tableName);

  const state = {
    conditions: [],
    updateData: null,
    selectedFields: '*',
    table: tableName
  };

  const chain = {
    from: (tableName) => {
      state.table = tableName;
      console.log('Setting table:', tableName);
      return chain;
    },
    select: (...fields) => {
      state.selectedFields = fields.length ? fields.join(',') : '*';
      console.log('Setting fields:', state.selectedFields);
      return chain;
    },
    insert: (data) => {
      console.log('Inserting data:', data);
      const newItem = {
        id: 'new-id',
        ...data,
        status: data.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      if (state.table === 'products') {
        products.push(newItem);
        console.log('Added new product:', newItem);
      }
      return {
        select: () => ({
          single: () => {
            console.log('Returning newly inserted item:', newItem);
            return Promise.resolve({ data: newItem, error: null });
          }
        })
      };
    },
    update: (data) => {
      state.updateData = data;
      console.log('Setting update data:', data);
      return chain;
    },
    eq: (field, value) => {
      state.conditions.push({ field, value });
      console.log('Adding condition:', { field, value });
      return chain;
    },
    single: () => {
      console.log('Executing single query with state:', state);
      const items = state.table === 'products' ? products : [];
      console.log('Items before filtering:', items);
      const result = filterProducts(items, state.conditions);
      console.log('Single query result:', result);
      
      return Promise.resolve().then(() => {
        if (state.updateData && result.length > 0) {
          const index = products.findIndex(p => p.id === result[0].id);
          if (index !== -1) {
            const updatedItem = {
              ...products[index],
              ...state.updateData,
              updated_at: new Date().toISOString()
            };
            products[index] = updatedItem;
            console.log('Updated product:', updatedItem);
            return { data: updatedItem, error: null };
          }
        }
        return { 
          data: result[0] || null,
          error: result.length === 0 ? { message: 'Not found' } : null
        };
      });
    },
    then: (callback) => {
      console.log('Executing query with state:', state);
      const items = state.table === 'products' ? products : [];
      console.log('Items before filtering:', items);
      const result = filterProducts(items, state.conditions);
      console.log('Query result:', result);
      return Promise.resolve({ data: result, error: null }).then(callback);
    }
  };

  return chain;
};

// Mock Supabase client
const mockSupabase = {
  auth: {
    signUp: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
      error: null
    }),
    signInWithPassword: jest.fn().mockResolvedValue({
      data: { user: { id: 'test-user-id' }, session: { access_token: 'test-token' } },
      error: null
    }),
    getUser: jest.fn().mockImplementation((token) => {
      const user = mockUsers[token];
      if (!user) {
        return Promise.resolve({ data: null, error: { message: 'Invalid token' } });
      }
      return Promise.resolve({ data: { user: { id: user.id } }, error: null });
    })
  },
  from: jest.fn().mockImplementation((table) => {
    console.log('Creating query builder for table:', table);
    if (table === 'users') {
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockImplementation((field, value) => ({
          single: () => {
            const user = Object.values(mockUsers).find(u => u[field] === value);
            return Promise.resolve({ data: user || null, error: !user ? { message: 'Not found' } : null });
          }
        }))
      };
    }
    const builder = createQueryBuilder(table);
    console.log('Created query builder:', builder);
    return builder;
  })
};

// Mock database connection
jest.mock('../database/connection.js', () => ({
  default: mockSupabase,
  supabase: mockSupabase
}));

// Export mock data for tests
export const testData = {
  products: initialProducts,
  users: mockUsers,
  tokens: {
    seller: 'mock-seller-token',
    admin: 'mock-admin-token'
  }
};
