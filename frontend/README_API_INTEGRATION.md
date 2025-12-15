# Laravel API Integration Guide

This application is configured to work with a Laravel backend API. Follow these steps to connect your Laravel API:

## Environment Setup

1. Copy `.env.local.example` to `.env.local`:
   \`\`\`bash
   cp .env.local.example .env.local
   \`\`\`

2. Update `NEXT_PUBLIC_API_URL` with your Laravel API URL:
   \`\`\`
   NEXT_PUBLIC_API_URL=http://localhost:8000/api
   \`\`\`

## API Structure

The application expects the following Laravel API endpoints:

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/register` - User registration
- `POST /api/auth/refresh` - Refresh token
- `GET /api/users/me` - Get current user

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/revenue?period=7days` - Get revenue data
- `GET /api/dashboard/top-products?limit=5` - Get top products
- `GET /api/dashboard/recent-sales?limit=5` - Get recent sales
- `GET /api/dashboard/low-stock?limit=5` - Get low stock items

### Products
- `GET /api/products` - List all products (supports pagination, search, filters)
- `GET /api/products/{id}` - Get single product
- `POST /api/products` - Create product
- `PUT /api/products/{id}` - Update product
- `DELETE /api/products/{id}` - Delete product

### Categories
- `GET /api/categories` - List all categories
- `GET /api/categories/{id}` - Get single category
- `POST /api/categories` - Create category
- `PUT /api/categories/{id}` - Update category
- `DELETE /api/categories/{id}` - Delete category

### Sales
- `GET /api/sales` - List all sales
- `GET /api/sales/{id}` - Get single sale
- `POST /api/sales` - Create sale
- `PUT /api/sales/{id}` - Update sale
- `DELETE /api/sales/{id}` - Delete sale

### Customers
- `GET /api/customers` - List all customers
- `GET /api/customers/{id}` - Get single customer
- `POST /api/customers` - Create customer
- `PUT /api/customers/{id}` - Update customer
- `DELETE /api/customers/{id}` - Delete customer

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `GET /api/suppliers/{id}` - Get single supplier
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/{id}` - Update supplier
- `DELETE /api/suppliers/{id}` - Delete supplier

### Users
- `GET /api/users` - List all users
- `GET /api/users/{id}` - Get single user
- `POST /api/users` - Create user
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Analytics
- `GET /api/analytics/sales` - Get sales analytics
- `GET /api/analytics/revenue` - Get revenue analytics
- `GET /api/analytics/customers` - Get customer analytics
- `GET /api/analytics/products` - Get product analytics

### Reports
- `GET /api/reports` - List all reports
- `POST /api/reports/generate` - Generate new report
- `GET /api/reports/{id}/download` - Download report

### Activity
- `GET /api/activity` - List activity logs
- `POST /api/activity` - Log new activity

## Using the API

The application includes a centralized API utility in `lib/api.js`. Use it like this:

\`\`\`javascript
import { api } from '@/lib/api'

// Get all products
const products = await api.products.getAll({ page: 1, limit: 10 })

// Create a new product
const newProduct = await api.products.create({
  name: 'Product Name',
  price: 99.99,
  category_id: 1
})

// Get dashboard stats
const stats = await api.dashboard.getStats()
\`\`\`

## Authentication

The API utility automatically includes the Bearer token from localStorage in all requests. After login, store the token:

\`\`\`javascript
const response = await api.auth.login({ email, password })
localStorage.setItem('auth_token', response.token)
\`\`\`

## Error Handling

All API calls throw an `ApiError` with status and data:

\`\`\`javascript
try {
  const data = await api.products.getAll()
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, error.status)
  }
}
\`\`\`

## CORS Configuration

Make sure your Laravel API has CORS configured to accept requests from your Next.js app. In Laravel, update `config/cors.php`:

\`\`\`php
'paths' => ['api/*'],
'allowed_origins' => ['http://localhost:3000'],
'allowed_methods' => ['*'],
'allowed_headers' => ['*'],
'supports_credentials' => true,
