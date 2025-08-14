const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

// Import admin API routes - using try/catch for graceful fallback
let adminRoutes;
try {
  adminRoutes = require('./src/api/admin');
} catch (error) {
  console.warn('Admin API routes not found, creating basic fallback...');
  adminRoutes = express.Router();
  
  // Basic fallback login route
  adminRoutes.post('/login', (req, res) => {
    const { username, password } = req.body;
    
    if (username === (process.env.ADMIN_USERNAME || 'admin') && 
        password === (process.env.ADMIN_PASSWORD || 'admin123')) {
      const jwt = require('jsonwebtoken');
      const token = jwt.sign(
        { username, role: 'admin' }, 
        process.env.JWT_SECRET || 'fallback-secret',
        { expiresIn: '24h' }
      );
      res.json({ token, user: { username, role: 'admin' } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
  
  // Basic stats route
  adminRoutes.get('/stats', (req, res) => {
    res.json({ blogs: 0, docs: 0, authors: 0, media: 0 });
  });
}

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Global request logger for debugging
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    console.log(`🌍 GLOBAL: ${req.method} ${req.path} - Body:`, req.body);
  }
  next();
});

// Admin API routes
app.use('/api/admin', adminRoutes);

// Development mode: proxy to Docusaurus
if (process.env.NODE_ENV !== 'production') {
  console.log('🚀 Starting unified development server...');
  
  // Start Docusaurus
  const docusaurusProcess = spawn('npm', ['run', 'dev', '--', '--port', '3002'], {
    stdio: 'pipe',
    shell: true
  });
  
  docusaurusProcess.stdout.on('data', (data) => {
    const output = data.toString();
    if (output.includes('Local:') || output.includes('compiled successfully')) {
      console.log('✅ Docusaurus is ready');
    }
  });

  docusaurusProcess.stderr.on('data', (data) => {
    console.error('Docusaurus error:', data.toString());
  });

  // Simple proxy for non-API requests
  const { createProxyMiddleware } = require('http-proxy-middleware');
  
  // Wait a bit, then set up proxy
  setTimeout(() => {
    try {
      const proxy = createProxyMiddleware({
        target: 'http://localhost:3002',
        changeOrigin: true,
        pathRewrite: (path, req) => {
          // Don't proxy API routes
          if (path.startsWith('/api/admin')) {
            return false;
          }
          return path;
        },
        onError: (err, req, res) => {
          console.log('Proxy error, Docusaurus may still be starting...');
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('<html><body><h1>🚀 Starting HV Docs...</h1><p>Please wait while the server starts up.</p><script>setTimeout(() => location.reload(), 3000);</script></body></html>');
        }
      });
      
      app.use('/', (req, res, next) => {
        if (req.path.startsWith('/api/admin')) {
          return next();
        }
        return proxy(req, res, next);
      });
      
    } catch (error) {
      console.error('Proxy setup failed:', error.message);
      
      // Fallback: serve a simple page
      app.get('*', (req, res) => {
        if (req.path.startsWith('/api/')) {
          return res.status(404).json({ error: 'API not available' });
        }
        
        res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>HV Docs - Starting Up</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
            .loading { animation: spin 1s linear infinite; }
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          </style>
        </head>
        <body>
          <h1>� HV Docs is Starting Up</h1>
          <p>Please wait while we initialize the server...</p>
          <div class="loading">⚙️</div>
          <script>setTimeout(() => location.reload(), 5000);</script>
        </body>
        </html>
        `);
      });
    }
    
    console.log(`📚 Unified Server: http://localhost:${PORT}`);
    console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
    console.log(`📋 API: http://localhost:${PORT}/api/admin`);
  }, 3000);

} else {
  // Production: serve built files
  console.log('🚀 Starting production server...');
  
  // Serve static files from build directory
  app.use(express.static(path.join(__dirname, 'build')));
  
  // API routes should come first
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || 'development'
    });
  });
  
  // Catch all handler for React SPA (must be last)
  app.get('*', (req, res) => {
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Check if build directory exists
    const buildPath = path.join(__dirname, 'build', 'index.html');
    const fs = require('fs');
    
    if (fs.existsSync(buildPath)) {
      res.sendFile(buildPath);
    } else {
      // Build directory doesn't exist - show helpful error
      res.status(500).send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Build Error - Docusaurus Admin Panel</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              max-width: 800px; 
              margin: 50px auto; 
              padding: 20px;
              background: #f8f9fa;
            }
            .error { 
              background: #fff3cd; 
              border: 1px solid #ffeaa7; 
              padding: 20px; 
              border-radius: 8px;
              margin: 20px 0;
            }
            .code { 
              background: #f1f3f4; 
              padding: 10px; 
              border-radius: 4px; 
              font-family: monospace;
              margin: 10px 0;
            }
          </style>
        </head>
        <body>
          <h1>🚧 Build Required</h1>
          <div class="error">
            <h3>The site hasn't been built yet!</h3>
            <p>This is a Docusaurus site that needs to be built before serving.</p>
            
            <h4>For Local Development:</h4>
            <div class="code">npm run build</div>
            
            <h4>For Heroku Deployment:</h4>
            <p>The build should happen automatically. Check your Heroku logs:</p>
            <div class="code">heroku logs --tail</div>
          </div>
          
          <h3>📊 System Status</h3>
          <ul>
            <li><strong>Environment:</strong> ${process.env.NODE_ENV || 'development'}</li>
            <li><strong>Port:</strong> ${PORT}</li>
            <li><strong>Time:</strong> ${new Date().toISOString()}</li>
            <li><strong>Build Path:</strong> ${buildPath}</li>
          </ul>
          
          <h3>🔄 Auto-refresh</h3>
          <p>This page will refresh automatically every 30 seconds...</p>
          <script>setTimeout(() => location.reload(), 30000);</script>
        </body>
        </html>
      `);
    }
  });
  
  console.log(`🚀 Production server: http://localhost:${PORT}`);
  console.log(`🔐 Admin Panel: http://localhost:${PORT}/admin`);
  console.log(`💚 Health Check: http://localhost:${PORT}/health`);
}

app.listen(PORT, () => {
  console.log(`✨ Server listening on port ${PORT}`);
  console.log(`🌐 Open: http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Server shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Server shutting down...');
  process.exit(0);
});
