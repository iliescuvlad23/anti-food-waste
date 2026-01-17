# Anti Food Waste

A full-stack application to help users track food inventory, manage expiry dates, and reduce food waste.

## Tech Stack

- **Frontend**: React (SPA) with Vite
- **Backend**: Node.js with Express
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based auth

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

## Setup Instructions

### 1. Database Setup

Create a PostgreSQL database:

```bash
createdb foodwaste
```

Or using psql:

```sql
CREATE DATABASE foodwaste;
```

### 2. Backend Setup

Navigate to the server directory:

```bash
cd server
```

Install dependencies:

```bash
npm install
```

Create a `.env` file. Create it manually with the following content:

Edit `.env` and set your database URL and JWT secret:

```
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/foodwaste?schema=public"
JWT_SECRET=your-secret-key-change-in-production
```

Generate Prisma client and run migrations:

```bash
npm run prisma:generate
npm run prisma:migrate
```

(Optional) Seed the database with sample data:

```bash
npm run seed
```

This creates a demo user (demo@example.com / password123) with sample categories and items.

Start the server:

```bash
npm run dev
```

The server will run on `http://localhost:3001`

### 3. Frontend Setup

Navigate to the client directory (in a new terminal):

```bash
cd client
```

Install dependencies:

```bash
npm install
```

Create a `.env` file manually with the following content:

```
VITE_API_URL=http://localhost:3001
```

This should work if the backend is running on port 3001.

Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Usage

1. Open `http://localhost:3000` in your browser
2. Register a new account or login
3. Create categories for your food items
4. Add items with expiry dates
5. View expiring and expired items in the notification panel
6. Toggle items as "available to share"

## API Documentation

### Authentication

- `POST /auth/register` - Register a new user
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "token": "...", "user": { "id": "...", "email": "..." } }`

- `POST /auth/login` - Login
  - Body: `{ "email": "user@example.com", "password": "password123" }`
  - Returns: `{ "token": "...", "user": { "id": "...", "email": "..." } }`

### Categories

- `GET /categories` - Get all user categories (requires auth)
- `POST /categories` - Create a category (requires auth)
  - Body: `{ "name": "Fruits" }`

### Items

- `GET /items` - Get all user items (requires auth)
  - Query params: `?categoryId=xxx` (optional)
- `GET /items/expiring?days=3` - Get expiring items (requires auth)
  - Returns: `{ "expiring": [...], "expired": [...] }`
- `POST /items` - Create an item (requires auth)
  - Body: `{ "name": "Milk", "categoryId": "...", "quantity": "1L", "expiryDate": "2024-01-15", "isShareable": false }`
- `PATCH /items/:id` - Update an item (requires auth)
- `PATCH /items/:id/shareable` - Toggle shareable status (requires auth)
- `DELETE /items/:id` - Delete an item (requires auth)

All protected routes require an `Authorization: Bearer <token>` header.

## Project Structure

```
.
├── server/              # Backend API
│   ├── src/
│   │   ├── routes/     # API routes
│   │   ├── middleware/ # Auth middleware
│   │   └── index.js    # Server entry point
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── client/              # Frontend React app
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── api/        # API client
│   │   └── utils/      # Utilities
│   └── package.json
└── README.md
```

## Development Commands

### Backend

- `npm run dev` - Start development server with watch mode
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- `npm run seed` - Seed database with sample data

### Frontend

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build

## Troubleshooting

### Common Issues

**"Cannot find module '@prisma/client'"**
- Run: `cd server && npm run prisma:generate`

**"Database connection error"**
- Make sure PostgreSQL is running
- Check your `DATABASE_URL` in `server/.env` matches your PostgreSQL setup
- Ensure the database `foodwaste` exists: `createdb foodwaste`

**"Migration failed"**
- Make sure PostgreSQL is running and accessible
- Check your `DATABASE_URL` is correct
- Try: `cd server && npm run prisma:migrate`

**"Module not found" errors in client**
- Run: `cd client && npm install`

**"Port already in use"**
- Change `PORT` in `server/.env` or `VITE_API_URL` in `client/.env`
- Or stop the process using the port

**Frontend can't connect to backend**
- Make sure backend is running on port 3001
- Check `VITE_API_URL` in `client/.env` matches backend URL
- Check CORS is enabled (it should be by default)

### Quick Setup Checklist

- [ ] PostgreSQL is installed and running
- [ ] Database `foodwaste` exists
- [ ] `server/.env` file exists with correct `DATABASE_URL`
- [ ] `server/node_modules` exists (run `npm install` in server)
- [ ] Prisma client generated (run `npm run prisma:generate` in server)
- [ ] Migrations run (run `npm run prisma:migrate` in server)
- [ ] `client/.env` file exists with `VITE_API_URL`
- [ ] `client/node_modules` exists (run `npm install` in client)

## Notes

- All user data is scoped to the authenticated user
- Categories are user-specific
- Items are automatically filtered by the authenticated user
- Expiry notifications show items expiring within 3 days by default
