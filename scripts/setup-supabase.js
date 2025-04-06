const supabase = require('../src/config/supabase');

async function setupDatabase() {
  console.log('Setting up Supabase database...');

  try {
    // Create Users table
    const { error: usersError } = await supabase
      .from('Users')
      .insert([
        {
          name: 'Admin User',
          email: 'admin@example.com',
          password: '$2a$10$rrCvCmZfK6JK6jkxJFyOAOu2lnJ5h4NXPDQpEMstkgFu.9CLnQOAe', // hashed 'admin123'
          role: 'admin',
          isVerified: true
        }
      ])
      .select()
      .single();

    if (usersError) {
      if (usersError.code === '23505') { // Duplicate key error
        console.log('Admin user already exists');
      } else {
        console.error('Error creating admin user:', usersError);
      }
    } else {
      console.log('Admin user created successfully');
    }

    // Create a test category
    const { error: categoryError } = await supabase
      .from('Categories')
      .insert([
        {
          name: 'Electronics',
          description: 'Electronic devices and gadgets'
        }
      ])
      .select()
      .single();

    if (categoryError) {
      if (categoryError.code === '23505') { // Duplicate key error
        console.log('Electronics category already exists');
      } else {
        console.error('Error creating category:', categoryError);
      }
    } else {
      console.log('Electronics category created successfully');
    }

    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

setupDatabase();