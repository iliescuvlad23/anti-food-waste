#!/bin/bash

echo "🚀 Setting up Anti Food Waste App..."
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✓ Node.js found: $(node --version)"
echo ""

# Setup Backend
echo "📦 Setting up backend..."
cd server

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOF
PORT=3001
DATABASE_URL="postgresql://user:password@localhost:5432/foodwaste?schema=public"
JWT_SECRET=your-secret-key-change-in-production-$(openssl rand -hex 16)
EOF
    echo "⚠️  Please edit server/.env and update DATABASE_URL with your PostgreSQL credentials"
fi

echo "Installing backend dependencies..."
npm install

echo "Generating Prisma client..."
npm run prisma:generate

echo "⚠️  IMPORTANT: Make sure PostgreSQL is running and the database 'foodwaste' exists"
echo "   Then run: cd server && npm run prisma:migrate"
echo ""

# Setup Frontend
echo "📦 Setting up frontend..."
cd ../client

if [ ! -f .env ]; then
    echo "Creating .env file..."
    echo "VITE_API_URL=http://localhost:3001" > .env
fi

echo "Installing frontend dependencies..."
npm install

echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Make sure PostgreSQL is running"
echo "2. Create database: createdb foodwaste (or use psql)"
echo "3. Update server/.env with your DATABASE_URL"
echo "4. Run migrations: cd server && npm run prisma:migrate"
echo "5. Start backend: cd server && npm run dev"
echo "6. Start frontend: cd client && npm run dev"
