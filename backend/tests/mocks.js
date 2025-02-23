// Mock external services
export const stripeMock = {
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
};

export const supabaseMock = {
  auth: {
    signUp: async () => ({ user: { id: 'test_user' }, session: { access_token: 'test_token' } }),
    signIn: async () => ({ user: { id: 'test_user' }, session: { access_token: 'test_token' } })
  },
  from: () => ({
    insert: async () => ({ data: [{ id: 'test_id' }] }),
    select: async () => ({ data: [] }),
    delete: async () => ({ data: [] })
  })
};
