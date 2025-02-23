import { ROLES } from '../constants/roles.js';

// Mock factories for external dependencies
export const sendEmail = async () => {
  // Mock email sending
  return Promise.resolve();
};

export const createMockStripe = () => ({
  paymentIntents: {
    create: async () => ({
      id: 'pi_test',
      client_secret: 'test_secret'
    })
  },
  webhooks: {
    constructEvent: () => ({
      type: 'payment_intent.succeeded',
      data: { object: { metadata: { order_id: 'test_order' } } }
    })
  }
});

// Initialize mock data store
let mockData = {
  users: new Map(),
  products: new Map(),
  orders: new Map(),
  reviews: new Map()
};

// Reset mock data
export const resetMockData = () => {
  mockData = {
    users: new Map(),
    products: new Map(),
    orders: new Map(),
    reviews: new Map()
  };
};

export const createMockSupabase = () => {
  resetMockData(); // Reset mock data for fresh instance

  const auth = {
    signUp: async ({ email, password, options }) => {
      try {
        if (!email || !password) {
          return { data: null, error: { message: 'Email and password required' } };
        }

        // Use email as part of ID for consistency
        const id = 'test_user_' + email.split('@')[0];
        const userData = {
          id,
          email,
          password,
          role: options?.data?.role || ROLES.BUYER,
          legacy_role: options?.data?.role || ROLES.BUYER,
          user_metadata: { ...options?.data, role: options?.data?.role || ROLES.BUYER },
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          status: 'active',
          name: options?.data?.name || 'Test User'
        };

        const session = {
          access_token: `test_token_auth_${options?.data?.role?.toLowerCase() || 'buyer'}_${id}`,
          user: userData,
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        };

        userData.session = session;
        mockData.users.set(id, userData);

        return {
          data: {
            user: userData,
            session
          },
          error: null
        };
      } catch (error) {
        return { data: null, error };
      }
    },

    signInWithPassword: async ({ email, password }) => {
      const users = Array.from(mockData.users.values());
      const user = users.find(u => u.email === email);
      
      if (!user) {
        return { data: null, error: { message: 'Invalid credentials' } };
      }
      
      // For testing, we'll accept any valid password format
      const session = {
        access_token: `test_token_auth_${user.role.toLowerCase()}_${user.id}`,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
          user_metadata: { role: user.role, name: user.name }
        },
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };

      return {
        data: {
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            user_metadata: { role: user.role, name: user.name }
          },
          session
        },
        error: null
      };
    },

    getUser: async (token) => {
      // For test tokens, create a mock user
      if (token.startsWith('test_token_auth_')) {
        const parts = token.split('_');
        const role = parts[3];
        const userId = parts[4];
        const mockUser = {
          id: userId,
          email: `${role}@test.com`,
          role: role.toUpperCase(),
          legacy_role: role.toUpperCase(),
          user_metadata: { 
            role: role.toUpperCase(),
            name: `Test ${role}`
          },
          status: 'active'
        };
        return { data: { user: mockUser }, error: null };
      }

      // For real tokens, check mock data
      const users = Array.from(mockData.users.values());
      const user = users.find(u => u.session?.access_token === token);
      if (!user) {
        return { data: { user: null }, error: { message: 'Invalid token' } };
      }
      return { 
        data: { 
          user: {
            id: user.id,
            email: user.email,
            role: user.role,
            legacy_role: user.role,
            user_metadata: { role: user.role, name: user.name },
            status: 'active'
          }
        }, 
        error: null 
      };
    },

    signOut: async () => {
      return { error: null };
    }
  };

  const createTableApi = (table) => {
    let filters = [];
    let selectedColumns = '*';
    let limitValue = null;
    let offsetValue = null;
    let orderByValue = null;

    const api = {
      insert: (data) => {
        const insertedData = Array.isArray(data) ? data.map(item => ({
          id: item.id || `test_${table}_${Math.random().toString(36).substring(7)}`,
          ...item,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })) : {
          id: data.id || `test_${table}_${Math.random().toString(36).substring(7)}`,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        if (!mockData[table]) {
          mockData[table] = new Map();
        }

        if (Array.isArray(insertedData)) {
          insertedData.forEach(item => mockData[table].set(item.id, item));
        } else {
          mockData[table].set(insertedData.id, insertedData);
        }

        return {
          data: Array.isArray(insertedData) ? insertedData : insertedData,
          error: null,
          select: () => ({
            data: Array.isArray(insertedData) ? insertedData : insertedData,
            error: null,
            single: () => ({
              data: Array.isArray(insertedData) ? insertedData[0] : insertedData,
              error: null
            })
          })
        };
      },

      select: (cols = '*') => {
        selectedColumns = cols;
        return api;
      },

      eq: (column, value) => {
        filters.push(record => record[column] === value);
        return api;
      },

      neq: (column, value) => {
        filters.push(record => record[column] !== value);
        return api;
      },

      gt: (column, value) => {
        filters.push(record => record[column] > value);
        return api;
      },

      lt: (column, value) => {
        filters.push(record => record[column] < value);
        return api;
      },

      gte: (column, value) => {
        filters.push(record => record[column] >= value);
        return api;
      },

      lte: (column, value) => {
        filters.push(record => record[column] <= value);
        return api;
      },

      like: (column, pattern) => {
        const regex = new RegExp(pattern.replace(/%/g, '.*'));
        filters.push(record => regex.test(record[column]));
        return api;
      },

      ilike: (column, pattern) => {
        const regex = new RegExp(pattern.replace(/%/g, '.*'), 'i');
        filters.push(record => regex.test(record[column]));
        return api;
      },

      or: (conditions) => {
        const orFilters = conditions.split(',').map(condition => {
          const [field, op, value] = condition.trim().split('.');
          if (op === 'ilike') {
            const regex = new RegExp(value.replace(/%/g, '.*'), 'i');
            return record => regex.test(record[field]);
          }
          return record => record[field] === value;
        });
        filters.push(record => orFilters.some(filter => filter(record)));
        return api;
      },

      single: () => {
        let records = Array.from(mockData[table]?.values() || []);
        records = filters.reduce((filtered, filter) => filtered.filter(filter), records);

        if (orderByValue) {
          records.sort((a, b) => {
            const modifier = orderByValue.ascending ? 1 : -1;
            return (a[orderByValue.column] > b[orderByValue.column] ? 1 : -1) * modifier;
          });
        }

        return {
          data: records[0] || null,
          error: null
        };
      },

      execute: () => {
        let records = Array.from(mockData[table]?.values() || []);
        records = filters.reduce((filtered, filter) => filtered.filter(filter), records);

        if (orderByValue) {
          records.sort((a, b) => {
            const modifier = orderByValue.ascending ? 1 : -1;
            return (a[orderByValue.column] > b[orderByValue.column] ? 1 : -1) * modifier;
          });
        }

        if (offsetValue !== null) {
          records = records.slice(offsetValue);
        }

        if (limitValue !== null) {
          records = records.slice(0, limitValue);
        }

        return {
          data: records,
          error: null
        };
      },

      update: (data) => {
        let records = Array.from(mockData[table]?.values() || []);
        records = filters.reduce((filtered, filter) => filtered.filter(filter), records);

        records.forEach(record => {
          const updatedRecord = { ...record, ...data, updated_at: new Date().toISOString() };
          mockData[table].set(record.id, updatedRecord);
        });

        return {
          data: records[0] || null,
          error: null
        };
      },

      delete: () => {
        let records = Array.from(mockData[table]?.values() || []);
        records = filters.reduce((filtered, filter) => filtered.filter(filter), records);

        records.forEach(record => {
          mockData[table].delete(record.id);
        });

        return {
          data: null,
          error: null
        };
      }
    };

    return api;
  };

  const mockClient = {
    auth,
    from: (table) => {
      if (!mockData[table]) {
        mockData[table] = new Map();
      }
      return createTableApi(table);
    },
    storage: {
      from: () => ({
        upload: async () => ({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: 'https://test.com/test-path' }, error: null })
      })
    }
  };

  return mockClient;
};
