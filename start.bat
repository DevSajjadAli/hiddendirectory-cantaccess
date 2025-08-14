@echo off
REM Simple unified start script for Windows

echo 🚀 Starting HV Docs with Admin Panel...

REM Create .env file if it doesn't exist
if not exist .env (
    echo Creating .env file...
    (
    echo # Admin credentials
    echo ADMIN_USERNAME=admin
    echo ADMIN_PASSWORD=admin123
    echo JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
    echo.
    echo # Server settings
    echo PORT=3000
    echo NODE_ENV=development
    ) > .env
)

REM Install dependencies if needed
if not exist node_modules\express (
    echo 📦 Installing dependencies...
    npm install express cors jsonwebtoken fs-extra multer yaml moment slugify http-proxy-middleware dotenv bcryptjs
)

REM Start the unified server
echo ✨ Starting unified server on http://localhost:3000
echo 🔐 Admin Panel: http://localhost:3000/admin
node server.js
