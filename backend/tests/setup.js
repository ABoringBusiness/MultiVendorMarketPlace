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

// Create a query builder that maintains proper chaining
const createQueryBuilder = (tableName) => {
  console.log('Creating query builder for table:', tableName);

  const state = {
    conditions: [],
    updateData: null,
    selectedFields: '*',
    table: tableName,
    returnValue: null,
    isSingle: false
  };

  console.log('Initial state:', state);

  const executeQuery = () => {
    console.log('Executing query with state:', state);
    let result = [...products];
    console.log('Initial result:', result);

    // Apply conditions
    if (state.conditions.length > 0) {
      console.log('Applying conditions:', state.conditions);
      result = result.filter(item => {
        return state.conditions.every(condition => {
          const matches = String(item[condition.field]) === String(condition.value);
          console.log('Checking condition:', { 
            field: condition.field, 
            itemValue: item[condition.field], 
            conditionValue: condition.value,
            matches
          });
          return matches;
        });
      });
    }
    console.log('After applying conditions:', result);

    // Handle insert
    if (state.returnValue) {
      console.log('Returning inserted item:', state.returnValue);
      products.push(state.returnValue);
      return { data: state.returnValue, error: null };
    }

    // Handle update
    if (state.updateData && result.length > 0) {
      const index = products.findIndex(p => p.id === result[0].id);
      if (index !== -1) {
        const updatedItem = {
          ...products[index],
          ...state.updateData,
          updated_at: new Date().toISOString()
        };
        products[index] = updatedItem;
        console.log('Updated item:', updatedItem);
        return { data: updatedItem, error: null };
      }
      return { data: null, error: { message: 'Item not found' } };
    }

    // Return results
    if (state.isSingle) {
      console.log('Returning single result:', result[0] || null);
      return { 
        data: result[0] || null,
        error: result.length === 0 ? { message: 'Not found' } : null
      };
    }

    console.log('Returning all results:', result);
    return { data: result, error: null };
  };

  const chain = {
    select: (...fields) => {
      console.log('Selecting fields:', fields);
      state.selectedFields = fields.length ? fields.join(',') : '*';
      return chain;
    },
    insert: (data) => {
      console.log('Inserting data:', data);
      const newItem = {
        id: String(products.length + 1),
        ...data,
        status: data.status || 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      state.returnValue = newItem;
      return chain;
    },
    update: (data) => {
      console.log('Setting update data:', data);
      state.updateData = data;
      return chain;
    },
    eq: (field, value) => {
      console.log('Adding condition:', { field, value });
      state.conditions.push({ field, value: String(value) });
      return chain;
    },
    single: () => {
      console.log('Setting single mode');
      state.isSingle = true;
      return chain;
    }
  };

  // Make the chain thenable
  chain[Symbol.toStringTag] = 'Promise';
  chain.then = (callback) => {
    console.log('Executing query');
    const result = executeQuery();
    console.log('Query result:', result);
    return Promise.resolve(result).then(callback);
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
      return Promise.resolve({ 
        data: { 
          user: { 
            id: user.id, 
            role: user.role,
            email: user.email 
          } 
        }, 
        error: null 
      });
    })
  },
  from: (table) => {
    console.log('Creating query builder for table:', table);
    return createQueryBuilder(table);
  }
};

// Mock database connection
jest.mock('../database/connection.js', () => ({
  __esModule: true,
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
