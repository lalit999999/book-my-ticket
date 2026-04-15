#!/bin/bash
# Quick Start Script for Login API

echo "=========================================="
echo "Book My Ticket - Login API Setup"
echo "=========================================="
echo ""

# Check Node.js installation
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed"
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found"
    echo "   Run this script from the project root directory"
    exit 1
fi

echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install failed"
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check .env file
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found"
    echo "   Creating .env from .env.example..."
    cp config/.env.example .env
    echo "   Created! Update with your database credentials:"
    echo "   - DB_HOST, DB_PORT, DB_USER, DB_PASSWORD"
fi

echo ""
echo "=========================================="
echo "Setup Complete! 🎉"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure database:"
echo "   └─ Edit .env with your MySQL credentials"
echo ""
echo "2. Create database tables:"
echo "   └─ Copy SQL from LOGIN_API_GUIDE.md"
echo ""
echo "3. Start the server:"
echo "   └─ npm run dev"
echo ""
echo "4. Test the API:"
echo "   └─ See API_TESTING_GUIDE.md for examples"
echo ""
echo "=========================================="
