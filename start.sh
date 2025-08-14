#!/bin/bash
# Simple unified start script

echo "🚀 Starting HV Docs with Admin Panel..."

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "Creating .env file..."
    cat > .env << EOL
# Admin credentials
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin123
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server settings
PORT=3000
NODE_ENV=development
EOL
fi

# Install dependencies if needed
if [ ! -d "node_modules/express" ]; then
    echo "📦 Installing dependencies..."
    npm install express cors jsonwebtoken fs-extra multer yaml moment slugify http-proxy-middleware dotenv bcryptjs
fi

# Start the unified server
echo "✨ Starting unified server on http://localhost:3000"
echo "🔐 Admin Panel: http://localhost:3000/admin"
node server.js
