const express = require('express');
const jwt = require('jsonwebtoken');
const fs = require('fs-extra');
const path = require('path');
const cors = require('cors');
const multer = require('multer');
const yaml = require('yaml');

// API Router
const router = express.Router();

// Debug middleware - log ALL requests to admin API
router.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl} - Body:`, req.body);
  next();
});

// Environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// File paths
const PATHS = {
  docs: path.join(process.cwd(), 'docs'),
  blog: path.join(process.cwd(), 'blog'),
  src: path.join(process.cwd(), 'src'),
  static: path.join(process.cwd(), 'static'),
  config: path.join(process.cwd(), 'docusaurus.config.ts'),
  sidebar: path.join(process.cwd(), 'sidebars.ts')
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// Utility function to get all files recursively
async function getAllFiles(dir) {
  const files = [];
  
  async function scanDirectory(currentPath) {
    try {
      const items = await fs.readdir(currentPath);
      
      for (const item of items) {
        const itemPath = path.join(currentPath, item);
        const stats = await fs.stat(itemPath);
        
        if (stats.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
          await scanDirectory(itemPath);
        } else if (stats.isFile() && (item.endsWith('.md') || item.endsWith('.mdx'))) {
          files.push(itemPath);
        }
      }
    } catch (error) {
      console.error(`Error scanning directory ${currentPath}:`, error.message);
    }
  }
  
  await scanDirectory(dir);
  return files;
}

// Login endpoint
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { username, role: 'admin' }, 
        JWT_SECRET, 
        { expiresIn: '24h' }
      );
      res.json({ token, user: { username, role: 'admin' } });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token endpoint
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ user: req.user });
});

// SIMPLE TEST ENDPOINT
router.get('/test', (req, res) => {
  res.json({ message: 'Admin API is working!' });
});

// Documents endpoints
router.get('/docs', authenticateToken, async (req, res) => {
  try {
    const docs = [];
    const docFiles = await getAllFiles(PATHS.docs);
    
    for (const filePath of docFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(PATHS.docs, filePath);
      
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);
      let frontmatter = {};
      
      if (frontmatterMatch) {
        try {
          frontmatter = yaml.parse(frontmatterMatch[1]);
        } catch (e) {
          console.error('Error parsing frontmatter:', e);
        }
      }
      
      const stats = await fs.stat(filePath);
      
      docs.push({
        id: relativePath.replace(/\\/g, '/').replace(/\.mdx?$/, ''),
        title: frontmatter.title || path.basename(filePath, path.extname(filePath)),
        category: path.dirname(relativePath) !== '.' ? path.dirname(relativePath) : '',
        position: frontmatter.position || frontmatter.sidebar_position || 1,
        filePath: relativePath,
        lastModified: stats.mtime,
        content: content.replace(/^---\n.*?\n---\s*/s, '')
      });
    }
    
    // Sort by category and position
    docs.sort((a, b) => {
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return a.position - b.position;
    });
    
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Simple document update endpoint - handle any path format
router.put('/docs/update', authenticateToken, async (req, res) => {
  try {
    const { docId, title, content, position, filePath } = req.body;
    
    console.log(`🔄 SIMPLE PUT Document Update: ID=${docId}`);
    console.log(`📁 Request data:`, { title, position, filePath });
    
    let docFile = null;
    
    // Try to find using filePath first (most reliable)
    if (filePath) {
      docFile = path.join(PATHS.docs, filePath);
      console.log(`📁 Trying filePath: ${docFile}`);
      
      try {
        await fs.access(docFile);
        console.log(`✅ Found document using filePath: ${docFile}`);
      } catch (error) {
        console.log(`❌ FilePath not found: ${filePath}`);
        docFile = null;
      }
    }
    
    if (!docFile) {
      console.error(`❌ Document not found for ID: ${docId}`);
      return res.status(404).json({ error: 'Documentation not found' });
    }
    
    console.log(`📄 Updating document: ${docFile}`);
    
    const frontmatter = {
      title,
      position: position || 1,
      sidebar_position: position || 1
    };
    
    const fileContent = `---
${yaml.stringify(frontmatter).trim()}
---

${content}`;
    
    await fs.writeFile(docFile, fileContent, 'utf-8');
    
    console.log(`✅ Document updated successfully: ${docFile}`);
    res.json({ message: 'Documentation updated successfully' });
  } catch (error) {
    console.error('❌ Error updating document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Position management
router.post('/docs/move-position', authenticateToken, async (req, res) => {
  try {
    const { filePath, direction } = req.body;
    console.log(`🔄 SIMPLE Move request: "${filePath}" -> ${direction}`);
    
    const fullFilePath = path.join(PATHS.docs, filePath);
    console.log(`📁 Full file path: ${fullFilePath}`);
    
    // Check if file exists
    try {
      await fs.access(fullFilePath);
    } catch (error) {
      return res.status(404).json({ error: 'Document file not found' });
    }
    
    // Get category directory
    const categoryDir = path.dirname(fullFilePath);
    console.log(`📁 Category directory: ${categoryDir}`);
    
    // Get all documents in the same directory
    const docFiles = await fs.readdir(categoryDir);
    const mdFiles = docFiles.filter(file => file.endsWith('.md') || file.endsWith('.mdx'));
    console.log(`📄 Found ${mdFiles.length} documents in directory:`, mdFiles);
    
    // Load document metadata and sort by position
    const documents = [];
    for (const fileName of mdFiles) {
      const docPath = path.join(categoryDir, fileName);
      const content = await fs.readFile(docPath, 'utf-8');
      
      const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);
      let frontmatter = {};
      
      if (frontmatterMatch) {
        try {
          frontmatter = yaml.parse(frontmatterMatch[1]);
        } catch (e) {
          console.error('Error parsing frontmatter:', e);
        }
      }
      
      documents.push({
        fileName,
        filePath: docPath,
        position: frontmatter.position || frontmatter.sidebar_position || 999,
        isTarget: fileName === path.basename(filePath),
        content,
        frontmatter
      });
    }
    
    console.log(`📊 Documents loaded:`, documents.map(d => ({ 
      fileName: d.fileName, 
      position: d.position, 
      isTarget: d.isTarget 
    })));
    
    // Sort by position
    documents.sort((a, b) => a.position - b.position);
    
    console.log(`📊 Documents after sorting:`, documents.map(d => ({ 
      fileName: d.fileName, 
      position: d.position, 
      isTarget: d.isTarget 
    })));
    
    // Find current document index
    const currentIndex = documents.findIndex(d => d.isTarget);
    
    if (currentIndex === -1) {
      return res.status(404).json({ error: 'Document not found in directory' });
    }
    
    console.log(`📍 Current document index: ${currentIndex} (${direction})`);
    
    // Calculate new index
    let newIndex;
    if (direction === 'up') {
      newIndex = currentIndex - 1;
    } else {
      newIndex = currentIndex + 1;
    }
    
    if (newIndex < 0 || newIndex >= documents.length) {
      return res.status(400).json({ error: `Cannot move ${direction}, already at ${direction === 'up' ? 'top' : 'bottom'}` });
    }
    
    console.log(`📍 New index: ${newIndex}`);
    
    // Swap positions
    const currentDoc = documents[currentIndex];
    const swapDoc = documents[newIndex];
    
    console.log(`🔄 Swapping positions: ${currentDoc.fileName} (${currentDoc.position}) <-> ${swapDoc.fileName} (${swapDoc.position})`);
    
    // Update positions in frontmatter and write files
    const updateDoc = async (doc, newPosition) => {
      const newFrontmatter = {
        ...doc.frontmatter,
        position: newPosition,
        sidebar_position: newPosition
      };
      
      const newContent = `---
${yaml.stringify(newFrontmatter).trim()}
---

${doc.content.replace(/^---\n.*?\n---\s*/s, '')}`;
      
      console.log(`💾 Updating ${doc.fileName} to position ${newPosition}`);
      await fs.writeFile(doc.filePath, newContent, 'utf-8');
    };
    
    await updateDoc(currentDoc, swapDoc.position);
    await updateDoc(swapDoc, currentDoc.position);
    
    console.log(`✅ SIMPLE Position swap completed successfully!`);
    res.json({ message: 'Document position updated successfully' });
  } catch (error) {
    console.error('❌ Error moving document position:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
