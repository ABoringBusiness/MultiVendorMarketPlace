# Setting Up Supabase Database for MultiVendorMarketPlace

This guide will help you set up the Supabase database for the MultiVendorMarketPlace application.

## Prerequisites

- A Supabase account
- Access to the Supabase project dashboard

## Steps to Set Up the Database

1. **Log in to your Supabase dashboard**

2. **Open the SQL Editor**
   - Navigate to the SQL Editor in your Supabase dashboard

3. **Create Tables**
   - Copy the contents of `create-tables.sql` from this directory
   - Paste it into the SQL Editor
   - Run the query to create all the necessary tables

4. **Insert Sample Data (Optional)**
   - Copy the contents of `insert-sample-data.sql` from this directory
   - Paste it into the SQL Editor
   - Run the query to insert sample data

5. **Update Environment Variables**
   - Make sure your application's `.env` file has the correct Supabase connection details:
   ```
   DATABASE_URL=postgresql://postgres:[YOUR_PASSWORD]@[YOUR_PROJECT_ID].supabase.co:5432/postgres
   DB_USER=postgres
   DB_PASS=[YOUR_PASSWORD]
   DB_NAME=postgres
   DB_HOST=[YOUR_PROJECT_ID].supabase.co
   SUPABASE_URL=https://[YOUR_PROJECT_ID].supabase.co
   SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
   ```

## Table Structure

The database includes the following tables:

1. **Users** - User accounts (buyers, sellers, admins)
2. **Categories** - Product categories
3. **Products** - Items for sale
4. **Notifications** - User notifications
5. **Carts** - Shopping carts
6. **CartItems** - Items in shopping carts
7. **Orders** - User orders
8. **OrderItems** - Items in orders
9. **Auctions** - Regular auctions
10. **Bids** - Bids on regular auctions
11. **PennyAuctions** - Penny auctions
12. **PennyBids** - Bids on penny auctions
13. **BidPackages** - Packages of bids for sale
14. **UserBidBalances** - User bid balances
15. **BidTransactions** - Bid purchase transactions
16. **AutoBidConfigs** - Automatic bidding configurations
17. **ServiceUsages** - Usage of services billed by the minute
18. **ServiceBillings** - Billing records for services
19. **ServiceBillingItems** - Items in service billing records

## Default Credentials

The setup script creates the following default users:

1. **Admin User**
   - Email: admin@example.com
   - Password: admin123
   - Role: admin

2. **Buyer User** (if sample data is inserted)
   - Email: buyer@example.com
   - Password: admin123
   - Role: buyer

3. **Seller User** (if sample data is inserted)
   - Email: seller@example.com
   - Password: admin123
   - Role: seller

## Troubleshooting

If you encounter any issues:

1. Check that the UUID extension is enabled in your Supabase project
2. Verify that you have the correct database connection details in your `.env` file
3. Make sure your Supabase project has the necessary permissions set up