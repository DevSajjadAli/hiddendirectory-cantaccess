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

// Paths configuration (relative to project root)
const PATHS = {
  docs: path.join(process.cwd(), 'docs'),
  blog: path.join(process.cwd(), 'blog'),
  static: path.join(process.cwd(), 'static'),
  uploads: path.join(process.cwd(), 'static', 'img', 'uploads'),
  authors: path.join(process.cwd(), 'blog', 'authors.yml'),
  navigation: path.join(process.cwd(), 'admin-data', 'navigation.json'),
  footer: path.join(process.cwd(), 'admin-data', 'footer.json'),
  appearance: path.join(process.cwd(), 'admin-data', 'appearance.json'),
  adminData: path.join(process.cwd(), 'admin-data'),
};

// Ensure upload directory exists
fs.ensureDirSync(PATHS.uploads);
fs.ensureDirSync(PATHS.adminData);

// Middleware for token authentication
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// File upload configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, PATHS.uploads);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Utility function to get all files recursively
const getAllFiles = async (dir, extension = '.md') => {
  try {
    const files = [];
    const items = await fs.readdir(dir, { withFileTypes: true });
    
    for (const item of items) {
      const fullPath = path.join(dir, item.name);
      if (item.isDirectory()) {
        const subFiles = await getAllFiles(fullPath, extension);
        files.push(...subFiles);
      } else if (item.name.endsWith(extension)) {
        files.push(fullPath);
      }
    }
    return files;
  } catch (error) {
    return [];
  }
};

// Navigation persistence helper functions
const getDefaultNavigation = () => ({
  items: [
    {
      id: 1,
      label: 'Documentation',
      url: '/docs',
      type: 'internal',
      position: 1,
      newTab: false
    },
    {
      id: 2,
      label: 'Blog',
      url: '/blog',
      type: 'internal',
      position: 2,
      newTab: false
    },
    {
      id: 3,
      label: 'Contact',
      url: '/contact',
      type: 'internal',
      position: 3,
      newTab: false
    },
    {
      id: 4,
      label: 'GitHub',
      url: 'https://github.com/omagaark/hvdocs',
      type: 'external',
      position: 4,
      newTab: true
    }
  ]
});const loadNavigationData = async () => {
  try {
    if (await fs.pathExists(PATHS.navigation)) {
      const data = await fs.readJson(PATHS.navigation);
      return data;
    } else {
      const defaultNav = getDefaultNavigation();
      await saveNavigationData(defaultNav);
      return defaultNav;
    }
  } catch (error) {
    console.error('Error loading navigation data:', error);
    return getDefaultNavigation();
  }
};

const saveNavigationData = async (data) => {
  try {
    await fs.writeJson(PATHS.navigation, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error saving navigation data:', error);
    return false;
  }
};

// Helper function to update Docusaurus navigation config
const updateDocusaurusNavigation = async (navigationItems) => {
  try {
    const configPath = path.join(process.cwd(), 'docusaurus.config.ts');
    
    if (!await fs.pathExists(configPath)) {
      console.error('Docusaurus config file not found:', configPath);
      return false;
    }
    
    let configContent = await fs.readFile(configPath, 'utf-8');
    
    // Convert navigation items to Docusaurus navbar format
    const navbarItemsString = navigationItems
      .sort((a, b) => a.position - b.position)
      .map(item => {
        if (item.type === 'internal' && item.url === '/docs') {
          return `        {
          type: 'docSidebar',
          sidebarId: 'tutorialSidebar',
          position: 'left',
          label: '${item.label}',
        }`;
        } else if (item.type === 'external') {
          return `        {
          href: '${item.url}',
          label: '${item.label}',
          position: '${item.position <= 2 ? 'left' : 'right'}',
        }`;
        } else {
          return `        {to: '${item.url}', label: '${item.label}', position: '${item.position <= 2 ? 'left' : 'right'}'}`;
        }
      })
      .join(',\n');
    
    // More specific regex pattern to match the navbar items array
    const itemsPattern = /(items:\s*\[)[^]*?(\],\s*}\s*,)/;
    
    if (itemsPattern.test(configContent)) {
      const replacement = `$1
${navbarItemsString}
      $2`;
      configContent = configContent.replace(itemsPattern, replacement);
      
      await fs.writeFile(configPath, configContent, 'utf-8');
      console.log('✅ Docusaurus navigation config updated successfully');
      return true;
    } else {
      console.error('❌ Could not find navbar items pattern in docusaurus.config.ts');
      console.log('Config content length:', configContent.length);
      return false;
    }
  } catch (error) {
    console.error('❌ Error updating Docusaurus navigation:', error);
    return false;
  }
};

// Footer persistence helper functions
const getDefaultFooter = () => ({
  links: [
    {
      title: 'Products',
      items: [
        {
          label: 'Web Hosting',
          to: 'https://hopevalley.cloud/index.php?rp=/store/sha',
        },
        {
          label: 'SSL Certificates',
          to: 'https://hopevalley.cloud/index.php?rp=/store/ssl-certificates',
        },
        {
          label: 'Dedicated Servers',
          to: 'https://hopevalley.cloud/index.php?rp=/store/dedicated',
        },
      ],
    },
    {
      title: 'Community',
      items: [
        {
          label: 'Stack Overflow',
          href: 'https://stackoverflow.com/questions/tagged/docusaurus',
        },
        {
          label: 'Discord',
          href: 'https://discordapp.com/invite/docusaurus',
        },
        {
          label: 'X',
          href: 'https://x.com/docusaurus',
        },
      ],
    },
    {
      title: 'More',
      items: [
        {
          label: 'Blog',
          to: '/blog',
        },
        {
          label: 'GitHub',
          href: 'https://github.com/omagaark/hvdocs',
        },
      ],
    },
  ],
  copyright: `Copyright © ${new Date().getFullYear()} HV Docs. Made with ❤️ by HopeValley.Cloud`,
});

const loadFooterData = async () => {
  try {
    if (await fs.pathExists(PATHS.footer)) {
      const data = await fs.readJson(PATHS.footer);
      return data;
    } else {
      const defaultFooter = getDefaultFooter();
      await saveFooterData(defaultFooter);
      return defaultFooter;
    }
  } catch (error) {
    console.error('Error loading footer data:', error);
    return getDefaultFooter();
  }
};

const saveFooterData = async (data) => {
  try {
    await fs.writeJson(PATHS.footer, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error saving footer data:', error);
    return false;
  }
};

// Helper function to update Docusaurus footer config
const updateDocusaurusFooter = async (footerData) => {
  try {
    const configPath = path.join(process.cwd(), 'docusaurus.config.ts');
    
    if (!await fs.pathExists(configPath)) {
      console.error('Docusaurus config file not found:', configPath);
      return false;
    }
    
    let configContent = await fs.readFile(configPath, 'utf-8');
    
    // Create footer configuration string
    const footerLinksStr = footerData.links.map(group => `        {
          title: '${group.title}',
          items: [
${group.items.map(item => {
  if (item.href) {
    return `            {
              label: '${item.label}',
              href: '${item.href}',
            }`;
  } else {
    return `            {
              label: '${item.label}',
              to: '${item.to}',
            }`;
  }
}).join(',\n')}
          ],
        }`).join(',\n');
    
    const footerConfig = `    footer: {
      style: 'dark',
      links: [
${footerLinksStr}
      ],
      copyright: \`${footerData.copyright}\`,
    }`;
    
    // Replace the footer section in the config file
    const footerRegex = /footer:\s*{[^}]*links:\s*\[[^\]]*\][^}]*copyright:[^}]*}/s;
    
    if (footerRegex.test(configContent)) {
      configContent = configContent.replace(footerRegex, footerConfig);
    } else {
      // If footer section not found, try to add it before prism
      const prismRegex = /(prism:\s*{)/;
      if (prismRegex.test(configContent)) {
        configContent = configContent.replace(prismRegex, `${footerConfig},\n    $1`);
      }
    }
    
    await fs.writeFile(configPath, configContent, 'utf-8');
    console.log('✅ Docusaurus footer config updated successfully');
    return true;
  } catch (error) {
    console.error('❌ Error updating Docusaurus footer:', error);
    return false;
  }
};

// Appearance persistence helper functions
const getDefaultAppearance = () => ({
  theme: 'light',
  enableDarkMode: true,
  primaryColor: '#2874A6',
  secondaryColor: '#F2F4F4',
  accentColor: '#27AE60',
  warningColor: '#F4D03F',
  lightBackgroundColor: '#FFFFFF',
  lightTextColor: '#2C3E50',
  darkBackgroundColor: '#2C3E50',
  darkTextColor: '#FFFFFF',
  darkPrimaryColor: '#4193C8',
  headingFont: 'system-ui',
  bodyFont: 'system-ui',
  codeFont: 'SFMono-Regular',
  logoUrl: 'https://hopevalley.cloud/wp-content/uploads/2024/12/favicong.png',
  logoAlt: 'Hope Valley Cloud Logo',
  showTitle: true,
  customCSS: ''
});

const loadAppearanceData = async () => {
  try {
    if (await fs.pathExists(PATHS.appearance)) {
      const data = await fs.readJson(PATHS.appearance);
      return { ...getDefaultAppearance(), ...data };
    } else {
      const defaultAppearance = getDefaultAppearance();
      await saveAppearanceData(defaultAppearance);
      return defaultAppearance;
    }
  } catch (error) {
    console.error('Error loading appearance data:', error);
    return getDefaultAppearance();
  }
};

const saveAppearanceData = async (data) => {
  try {
    await fs.writeJson(PATHS.appearance, data, { spaces: 2 });
    return true;
  } catch (error) {
    console.error('Error saving appearance data:', error);
    return false;
  }
};

// Helper function to update Docusaurus appearance config
const updateDocusaurusAppearance = async (appearanceData) => {
  try {
    // Update docusaurus.config.ts
    const configUpdated = await updateDocusaurusConfig(appearanceData);
    
    // Update custom CSS file
    const cssUpdated = await updateCustomCSS(appearanceData);
    
    return configUpdated && cssUpdated;
  } catch (error) {
    console.error('❌ Error updating Docusaurus appearance:', error);
    return false;
  }
};

// Update docusaurus.config.ts with appearance settings
const updateDocusaurusConfig = async (appearance) => {
  try {
    const configPath = path.join(process.cwd(), 'docusaurus.config.ts');
    
    if (!await fs.pathExists(configPath)) {
      console.error('Docusaurus config file not found:', configPath);
      return false;
    }
    
    let configContent = await fs.readFile(configPath, 'utf-8');
    
    // Update navbar logo - use default if empty
    const logoSrc = appearance.logoUrl || '/img/logo.svg';
    const logoPattern = /(logo:\s*{[^}]*src:\s*')[^']*(')/;
    if (logoPattern.test(configContent)) {
      configContent = configContent.replace(logoPattern, `$1${logoSrc}$2`);
    }
    
    // Update logo alt text
    const altPattern = /(alt:\s*')[^']*(')/;
    if (altPattern.test(configContent)) {
      configContent = configContent.replace(altPattern, `$1${appearance.logoAlt}$2`);
    }
    
    // Update site title - keep default if showTitle is false
    // Note: We don't change the title here as it's still needed for meta tags
    // The CSS will handle hiding the title display if needed
    
    // Update color mode settings
    const colorModePattern = /colorMode:\s*{[^}]*}/;
    
    // Handle auto theme - use light as default but respect system preference
    const defaultMode = appearance.theme === 'auto' ? 'light' : appearance.theme;
    const respectPrefersColorScheme = appearance.theme === 'auto';
    
    const newColorModeConfig = `colorMode: {
      defaultMode: '${defaultMode}',
      disableSwitch: ${!appearance.enableDarkMode},
      respectPrefersColorScheme: ${respectPrefersColorScheme},
    }`;
    
    if (colorModePattern.test(configContent)) {
      // Update existing colorMode configuration
      configContent = configContent.replace(colorModePattern, newColorModeConfig);
    } else {
      // Add colorMode configuration if it doesn't exist
      const themeConfigPattern = /(themeConfig:\s*{)/;
      const colorModeConfig = `$1
    ${newColorModeConfig},`;
      configContent = configContent.replace(themeConfigPattern, colorModeConfig);
    }
    
    await fs.writeFile(configPath, configContent, 'utf-8');
    console.log('✅ Docusaurus config updated with appearance settings');
    return true;
  } catch (error) {
    console.error('❌ Error updating Docusaurus config for appearance:', error);
    return false;
  }
};

// Update custom CSS file
const updateCustomCSS = async (appearance) => {
  try {
    const cssPath = path.join(process.cwd(), 'src', 'css', 'custom.css');
    
    // Generate custom CSS based on appearance settings
    const customCSS = `
/* Auto-generated appearance settings */
:root {
  --ifm-background-color: ${appearance.lightBackgroundColor || '#FFFFFF'};
  --ifm-font-color-base: ${appearance.lightTextColor || '#2C3E50'};

  --ifm-color-primary: ${appearance.primaryColor || '#2874A6'};
  --ifm-color-primary-dark: ${adjustColor(appearance.primaryColor || '#2874A6', -10)};
  --ifm-color-primary-darker: ${adjustColor(appearance.primaryColor || '#2874A6', -15)};
  --ifm-color-primary-darkest: ${adjustColor(appearance.primaryColor || '#2874A6', -25)};
  --ifm-color-primary-light: ${adjustColor(appearance.primaryColor || '#2874A6', 10)};
  --ifm-color-primary-lighter: ${adjustColor(appearance.primaryColor || '#2874A6', 15)};
  --ifm-color-primary-lightest: ${adjustColor(appearance.primaryColor || '#2874A6', 25)};
  
  --ifm-color-secondary: ${appearance.secondaryColor || '#F2F4F4'};
  --ifm-color-success: ${appearance.accentColor || '#27AE60'};
  --ifm-color-warning: ${appearance.warningColor || '#F4D03F'};
  
  --ifm-font-family-base: ${getFontFamily(appearance.bodyFont)};
  --ifm-heading-font-family: ${getFontFamily(appearance.headingFont)};
  --ifm-font-family-monospace: ${getFontFamily(appearance.codeFont)};
}

[data-theme='dark'] {
  --ifm-background-color: ${appearance.darkBackgroundColor || '#2C3E50'};
  --ifm-font-color-base: ${appearance.darkTextColor || '#FFFFFF'};

  --ifm-color-primary: ${appearance.darkPrimaryColor || '#4193C8'};
  --ifm-color-primary-dark: ${adjustColor(appearance.darkPrimaryColor || '#4193C8', -10)};
  --ifm-color-primary-darker: ${adjustColor(appearance.darkPrimaryColor || '#4193C8', -15)};
  --ifm-color-primary-darkest: ${adjustColor(appearance.darkPrimaryColor || '#4193C8', -25)};
  --ifm-color-primary-light: ${adjustColor(appearance.darkPrimaryColor || '#4193C8', 10)};
  --ifm-color-primary-lighter: ${adjustColor(appearance.darkPrimaryColor || '#4193C8', 15)};
  --ifm-color-primary-lightest: ${adjustColor(appearance.darkPrimaryColor || '#4193C8', 25)};
  
  --ifm-color-secondary: ${appearance.secondaryColor || '#F2F4F4'};
  --ifm-color-success: ${appearance.accentColor || '#27AE60'};
  --ifm-color-warning: ${appearance.warningColor || '#F4D03F'};
}

/* Logo and title adjustments */
${!appearance.showTitle ? '.navbar__title { display: none; }' : ''}

/* Custom user CSS */
${appearance.customCSS || ''}
`;
    
    // Read existing CSS and preserve user content
    let existingCSS = '';
    if (await fs.pathExists(cssPath)) {
      existingCSS = await fs.readFile(cssPath, 'utf-8');
      // Remove previous auto-generated section
      existingCSS = existingCSS.replace(/\/\* Auto-generated appearance settings \*\/[\s\S]*?\/\* End auto-generated \*\/\n?/g, '');
    }
    
    const finalCSS = existingCSS + customCSS + '\n/* End auto-generated */\n';
    await fs.writeFile(cssPath, finalCSS, 'utf-8');
    
    console.log('✅ Custom CSS updated with appearance settings');
    return true;
  } catch (error) {
    console.error('❌ Error updating custom CSS:', error);
    return false;
  }
};

// Helper function to adjust color brightness
const adjustColor = (color, percent) => {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);
  
  const adjustedR = Math.max(0, Math.min(255, r + (r * percent / 100)));
  const adjustedG = Math.max(0, Math.min(255, g + (g * percent / 100)));
  const adjustedB = Math.max(0, Math.min(255, b + (b * percent / 100)));
  
  return `#${Math.round(adjustedR).toString(16).padStart(2, '0')}${Math.round(adjustedG).toString(16).padStart(2, '0')}${Math.round(adjustedB).toString(16).padStart(2, '0')}`;
};

// Helper function to get proper font family
const getFontFamily = (fontName) => {
  const fontMap = {
    'system-ui': '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    'Inter': '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Roboto': '"Roboto", -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    'Open Sans': '"Open Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Lato': '"Lato", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'Poppins': '"Poppins", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    'SFMono-Regular': '"SFMono-Regular", Consolas, "Liberation Mono", Menlo, monospace',
    'Consolas': '"Consolas", "SFMono-Regular", "Liberation Mono", Menlo, monospace',
    'Monaco': '"Monaco", "SFMono-Regular", Consolas, "Liberation Mono", monospace',
    'Menlo': '"Menlo", "Monaco", "SFMono-Regular", Consolas, monospace',
    'Source Code Pro': '"Source Code Pro", "SFMono-Regular", Consolas, monospace'
  };
  
  return fontMap[fontName] || fontMap['system-ui'];
};

// Routes

// Authentication
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { username, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({ 
      token, 
      user: { username, role: 'admin' } 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Verify token
router.get('/verify', authenticateToken, (req, res) => {
  res.json({ 
    valid: true, 
    user: req.user 
  });
});

// Get dashboard stats
router.get('/stats', authenticateToken, async (req, res) => {
  try {
    const blogFiles = await getAllFiles(PATHS.blog);
    const docFiles = await getAllFiles(PATHS.docs);
    const mediaFiles = await fs.readdir(PATHS.uploads);
    
    let authorsCount = 0;
    try {
      const authorsContent = await fs.readFile(PATHS.authors, 'utf-8');
      const authors = yaml.parse(authorsContent);
      authorsCount = Object.keys(authors).length;
    } catch (error) {
      // Authors file doesn't exist
    }
    
    res.json({
      blogs: blogFiles.length,
      docs: docFiles.length,
      authors: authorsCount,
      media: mediaFiles.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Blog routes
router.get('/blogs', authenticateToken, async (req, res) => {
  try {
    const blogFiles = await getAllFiles(PATHS.blog);
    const blogs = [];
    
    for (const filePath of blogFiles) {
      const content = await fs.readFile(filePath, 'utf-8');
      const relativePath = path.relative(PATHS.blog, filePath);
      
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
      
      blogs.push({
        id: relativePath.replace(/\//g, '-').replace(/\.mdx?$/, ''),
        title: frontmatter.title || 'Untitled',
        slug: frontmatter.slug || path.basename(filePath, path.extname(filePath)),
        author: frontmatter.author || 'Unknown',
        date: frontmatter.date || stats.birthtime,
        tags: frontmatter.tags || [],
        published: frontmatter.draft !== true,
        filePath: relativePath,
        lastModified: stats.mtime,
        content: content.replace(/^---\n.*?\n---\s*/s, '')
      });
    }
    
    // Sort by date (newest first)
    blogs.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Media routes
router.get('/media', authenticateToken, async (req, res) => {
  try {
    const files = await fs.readdir(PATHS.uploads);
    const media = [];
    
    for (const file of files) {
      const filePath = path.join(PATHS.uploads, file);
      const stats = await fs.stat(filePath);
      
      media.push({
        filename: file,
        path: `/img/uploads/${file}`,
        size: stats.size,
        created: stats.birthtime,
        modified: stats.mtime
      });
    }
    
    res.json(media);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Upload media
router.post('/media/upload', authenticateToken, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    filename: req.file.filename,
    path: `/img/uploads/${req.file.filename}`,
    size: req.file.size
  });
});

// Delete media
router.delete('/media/:filename', authenticateToken, async (req, res) => {
  try {
    const filePath = path.join(PATHS.uploads, req.params.filename);
    await fs.remove(filePath);
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Blog CRUD operations
router.post('/blogs', authenticateToken, async (req, res) => {
  try {
    const { title, content, author, tags, published } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    const date = new Date().toISOString().split('T')[0];
    
    const frontmatter = {
      title,
      slug,
      author,
      date,
      tags: tags || [],
      draft: !published
    };
    
    const fileContent = `---
${yaml.stringify(frontmatter).trim()}
---

${content}`;
    
    const filename = `${date}-${slug}.md`;
    const filePath = path.join(PATHS.blog, filename);
    
    await fs.writeFile(filePath, fileContent, 'utf-8');
    
    res.json({ message: 'Blog post created successfully', filename });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/blogs/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, author, tags, published } = req.body;
    const blogId = req.params.id;
    
    // Find the blog file
    const blogFiles = await getAllFiles(PATHS.blog);
    const blogFile = blogFiles.find(file => {
      const relativePath = path.relative(PATHS.blog, file);
      return relativePath.replace(/\//g, '-').replace(/\.mdx?$/, '') === blogId;
    });
    
    if (!blogFile) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    const frontmatter = {
      title,
      author,
      tags: tags || [],
      draft: !published
    };
    
    const fileContent = `---
${yaml.stringify(frontmatter).trim()}
---

${content}`;
    
    await fs.writeFile(blogFile, fileContent, 'utf-8');
    
    res.json({ message: 'Blog post updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/blogs/:id', authenticateToken, async (req, res) => {
  try {
    const blogId = req.params.id;
    
    const blogFiles = await getAllFiles(PATHS.blog);
    const blogFile = blogFiles.find(file => {
      const relativePath = path.relative(PATHS.blog, file);
      return relativePath.replace(/\//g, '-').replace(/\.mdx?$/, '') === blogId;
    });
    
    if (!blogFile) {
      return res.status(404).json({ error: 'Blog post not found' });
    }
    
    await fs.remove(blogFile);
    res.json({ message: 'Blog post deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Documentation CRUD operations
router.get('/docs', authenticateToken, async (req, res) => {
  try {
    const docFiles = await getAllFiles(PATHS.docs);
    const docs = [];
    
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
        id: relativePath.replace(/\//g, '-').replace(/\.mdx?$/, ''),
        title: frontmatter.title || path.basename(filePath, path.extname(filePath)),
        category: path.dirname(relativePath) !== '.' ? path.dirname(relativePath) : '',
        position: frontmatter.position || frontmatter.sidebar_position || 1,
        filePath: relativePath,
        lastModified: stats.mtime,
        content: content.replace(/^---\n.*?\n---\s*/s, '')
      });
      
      // Debug logging
      console.log('📄 Document loaded:', {
        title: frontmatter.title || path.basename(filePath, path.extname(filePath)),
        category: path.dirname(relativePath) !== '.' ? path.dirname(relativePath) : '',
        filePath: relativePath
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

router.post('/docs', authenticateToken, async (req, res) => {
  try {
    console.log('📝 CREATE Document request received:', req.body);
    const { title, content, category, position } = req.body;
    
    if (!title) {
      console.error('❌ Document creation failed: title is required');
      return res.status(400).json({ error: 'Title is required' });
    }
    
    if (!content) {
      console.error('❌ Document creation failed: content is required');
      return res.status(400).json({ error: 'Content is required' });
    }
    
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    console.log(`📝 Generated slug: "${slug}" from title: "${title}"`);
    
    const frontmatter = {
      title,
      sidebar_position: position || 1
    };
    
    const fileContent = `---
${yaml.stringify(frontmatter).trim()}
---

${content}`;

    let filePath;
    if (category && category.trim()) {
      const categoryPath = path.join(PATHS.docs, category.trim());
      console.log(`📁 Creating category directory: ${categoryPath}`);
      await fs.ensureDir(categoryPath);
      filePath = path.join(categoryPath, `${slug}.md`);
    } else {
      filePath = path.join(PATHS.docs, `${slug}.md`);
    }
    
    console.log(`💾 Writing document to: ${filePath}`);
    await fs.writeFile(filePath, fileContent, 'utf-8');
    console.log('✅ Document created successfully');
    
    res.json({ message: 'Documentation created successfully' });
  } catch (error) {
    console.error('❌ Document creation error:', error);
    console.error('❌ Error stack:', error.stack);
    res.status(500).json({ error: error.message });
  }
});router.put('/docs/:id', authenticateToken, async (req, res) => {
  try {
    const { title, content, category, position, filePath } = req.body;
    const docId = decodeURIComponent(req.params.id); // Decode URL-encoded ID
    
    console.log(`🔄 PUT Document Update: ID=${docId}`);
    console.log(`📁 Request data:`, { title, category, position, filePath });
    
    let docFile = null;
    
    // Try to find using filePath first (more reliable)
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
    
    // Fallback: try to find using docId transformation
    if (!docFile) {
      console.log(`🔍 Searching for document with ID: ${docId}`);
      const docFiles = await getAllFiles(PATHS.docs);
      docFile = docFiles.find(file => {
        const relativePath = path.relative(PATHS.docs, file);
        const transformedId = relativePath.replace(/\\/g, '/').replace(/\.mdx?$/, '');
        console.log(`🔍 Comparing: "${transformedId}" === "${docId}"`);
        return transformedId === docId;
      });
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

// Delete document
router.delete('/docs/:id', authenticateToken, async (req, res) => {
  try {
    const docId = decodeURIComponent(req.params.id); // Decode URL-encoded ID
    const { filePath } = req.body;
    
    console.log(`🗑️ DELETE Document: ID=${docId}, filePath=${filePath}`);
    
    let docFile = null;
    
    // Try to find using filePath first (more reliable)
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
    
    // Fallback: try to find using docId transformation
    if (!docFile) {
      console.log(`🔍 Searching for document with ID: ${docId}`);
      const docFiles = await getAllFiles(PATHS.docs);
      docFile = docFiles.find(file => {
        const relativePath = path.relative(PATHS.docs, file);
        const transformedId = relativePath.replace(/\\/g, '/').replace(/\.mdx?$/, '');
        console.log(`🔍 Comparing: "${transformedId}" === "${docId}"`);
        return transformedId === docId;
      });
    }
    
    if (!docFile) {
      console.error(`❌ Document not found for ID: ${docId}`);
      return res.status(404).json({ error: 'Documentation not found' });
    }
    
    console.log(`🗑️ Deleting document: ${docFile}`);
    
    // Delete the file
    await fs.unlink(docFile);
    
    console.log(`✅ Document deleted successfully: ${docFile}`);
    res.json({ message: 'Documentation deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// SIMPLE Document position management - using file paths directly
router.post('/docs/move-position', authenticateToken, async (req, res) => {
  try {
    const { filePath, direction } = req.body; // filePath: exact file path, direction: 'up' or 'down'
    
    console.log(`🔄 SIMPLE Move request: "${filePath}" -> ${direction}`);
    
    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid direction. Use "up" or "down"' });
    }

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Build full file path
    const fullFilePath = path.join(PATHS.docs, filePath);
    
    console.log(`📁 Full file path: ${fullFilePath}`);
    
    if (!(await fs.pathExists(fullFilePath))) {
      console.log(`❌ File does not exist: ${fullFilePath}`);
      return res.status(404).json({ error: 'Document file not found' });
    }

    // Get the category directory
    const categoryDir = path.dirname(fullFilePath);
    console.log(`📁 Category directory: ${categoryDir}`);

    // Get all documents in the same directory
    const files = await fs.readdir(categoryDir);
    const docFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    
    console.log(`📄 Found ${docFiles.length} documents in directory:`, docFiles);
    
    // Load document metadata and sort by position
    const documents = [];
    for (const file of docFiles) {
      const docFilePath = path.join(categoryDir, file);
      const content = await fs.readFile(docFilePath, 'utf-8');
      
      // Extract frontmatter
      const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);
      let frontmatter = { position: 999, sidebar_position: 999 }; 
      
      if (frontmatterMatch) {
        try {
          frontmatter = yaml.parse(frontmatterMatch[1]) || {};
          // Use existing position or default to 999
          const existingPosition = frontmatter.position || frontmatter.sidebar_position || 999;
          frontmatter.position = existingPosition;
          frontmatter.sidebar_position = existingPosition;
        } catch (e) {
          console.error('Error parsing frontmatter:', e);
        }
      }
      
      documents.push({
        fileName: file,
        filePath: docFilePath,
        content,
        position: frontmatter.position,
        frontmatter,
        isTarget: docFilePath === fullFilePath
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
    
    // Find the target document
    const currentIndex = documents.findIndex(doc => doc.isTarget);
    if (currentIndex === -1) {
      console.log(`❌ Target document not found in sorted list`);
      return res.status(404).json({ error: 'Document not found in directory' });
    }
    
    console.log(`📍 Current document index: ${currentIndex} (${direction})`);
    
    // Calculate new position
    let newIndex = currentIndex;
    if (direction === 'up' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'down' && currentIndex < documents.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      console.log(`⚠️ Cannot move document ${direction} - at boundary`);
      return res.status(400).json({ error: `Cannot move document ${direction} - already at ${direction === 'up' ? 'top' : 'bottom'}` });
    }
    
    console.log(`📍 New index: ${newIndex}`);
    
    // Swap positions
    const currentDoc = documents[currentIndex];
    const targetDoc = documents[newIndex];
    
    console.log(`🔄 Swapping positions: ${currentDoc.fileName} (${currentDoc.position}) <-> ${targetDoc.fileName} (${targetDoc.position})`);
    
    // Update positions in frontmatter
    const updateDocPosition = async (doc, newPosition) => {
      let content = doc.content;
      
      // Update both position fields
      doc.frontmatter.position = newPosition;
      doc.frontmatter.sidebar_position = newPosition;
      
      console.log(`💾 Updating ${doc.fileName} to position ${newPosition}`);
      
      // Update or add frontmatter
      if (content.startsWith('---\n')) {
        // Replace existing frontmatter
        content = content.replace(/^---\n(.*?)\n---/s, `---\n${yaml.stringify(doc.frontmatter).trim()}\n---`);
      } else {
        // Add new frontmatter
        content = `---\n${yaml.stringify(doc.frontmatter).trim()}\n---\n\n${content}`;
      }
      
      await fs.writeFile(doc.filePath, content, 'utf-8');
    };
    
    // Swap the positions
    const tempPosition = currentDoc.position;
    await updateDocPosition(currentDoc, targetDoc.position);
    await updateDocPosition(targetDoc, tempPosition);
    
    console.log(`✅ SIMPLE Position swap completed successfully!`);
    
    res.json({ 
      message: `Document moved ${direction} successfully`,
      from: currentDoc.fileName,
      to: targetDoc.fileName,
      newPosition: targetDoc.position
    });
  } catch (error) {
    console.error('🚨 SIMPLE Position error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for position API debugging
router.get('/test-position', authenticateToken, async (req, res) => {
  try {
    const docsDir = PATHS.docs;
    const categoryPath = path.join(docsDir, 'tutorial-basics');
    
    console.log(`🧪 Test: Checking category path: ${categoryPath}`);
    
    const files = await fs.readdir(categoryPath);
    const docFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    
    console.log(`🧪 Test: Found files:`, docFiles);
    
    const documents = [];
    for (const file of docFiles) {
      const filePath = path.join(categoryPath, file);
      const content = await fs.readFile(filePath, 'utf-8');
      
      const frontmatterMatch = content.match(/^---\n(.*?)\n---/s);
      let frontmatter = { position: 999 };
      
      if (frontmatterMatch) {
        try {
          frontmatter = yaml.parse(frontmatterMatch[1]) || {};
          frontmatter.position = frontmatter.position || frontmatter.sidebar_position || 999;
        } catch (e) {
          console.error('Error parsing frontmatter:', e);
        }
      }
      
      const relativePath = path.relative(docsDir, filePath);
      const docId = relativePath.replace(/\//g, '-').replace(/\.mdx?$/, '');
      
      documents.push({
        id: docId,
        fileName: file,
        position: frontmatter.position,
        frontmatter
      });
    }
    
    console.log(`🧪 Test: Documents found:`, documents.map(d => ({ id: d.id, position: d.position })));
    
    res.json({ documents, message: 'Test successful' });
  } catch (error) {
    console.error('🧪 Test error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Authors CRUD operations
router.get('/authors', authenticateToken, async (req, res) => {
  try {
    let authors = {};
    try {
      const authorsContent = await fs.readFile(PATHS.authors, 'utf-8');
      authors = yaml.parse(authorsContent) || {};
    } catch (error) {
      // Authors file doesn't exist, return empty object
    }
    
    res.json(authors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/authors', authenticateToken, async (req, res) => {
  try {
    const { name, title, description, image_url, url } = req.body;
    const key = name.toLowerCase().replace(/[^a-z0-9]+/g, '_');
    
    let authors = {};
    try {
      const authorsContent = await fs.readFile(PATHS.authors, 'utf-8');
      authors = yaml.parse(authorsContent) || {};
    } catch (error) {
      // Authors file doesn't exist, start with empty object
    }
    
    authors[key] = {
      name,
      title: title || '',
      description: description || '',
      image_url: image_url || '',
      url: url || ''
    };
    
    await fs.writeFile(PATHS.authors, yaml.stringify(authors), 'utf-8');
    
    res.json({ message: 'Author created successfully', key });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/authors/:key', authenticateToken, async (req, res) => {
  try {
    const { name, title, description, image_url, url } = req.body;
    const authorKey = req.params.key;
    
    let authors = {};
    try {
      const authorsContent = await fs.readFile(PATHS.authors, 'utf-8');
      authors = yaml.parse(authorsContent) || {};
    } catch (error) {
      return res.status(404).json({ error: 'Authors file not found' });
    }
    
    if (!authors[authorKey]) {
      return res.status(404).json({ error: 'Author not found' });
    }
    
    authors[authorKey] = {
      name,
      title: title || '',
      description: description || '',
      image_url: image_url || '',
      url: url || ''
    };
    
    await fs.writeFile(PATHS.authors, yaml.stringify(authors), 'utf-8');
    
    res.json({ message: 'Author updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Pages CRUD operations
router.get('/pages', authenticateToken, async (req, res) => {
  try {
    const pagesDir = path.join(process.cwd(), 'src', 'pages');
    const pages = [];
    
    if (await fs.pathExists(pagesDir)) {
      const files = await fs.readdir(pagesDir, { withFileTypes: true });
      
      for (const file of files) {
        if (file.isFile() && (file.name.endsWith('.md') || file.name.endsWith('.mdx'))) {
          const filePath = path.join(pagesDir, file.name);
          const content = await fs.readFile(filePath, 'utf-8');
          const stats = await fs.stat(filePath);
          
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
          
          pages.push({
            id: file.name.replace(/\.mdx?$/, ''),
            title: frontmatter.title || file.name.replace(/\.mdx?$/, ''),
            path: `/${file.name.replace(/\.mdx?$/, '')}`,
            lastModified: stats.mtime,
            content: content.replace(/^---\n.*?\n---\s*/s, '')
          });
        }
      }
    }
    
    res.json(pages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/pages', authenticateToken, async (req, res) => {
  try {
    const { title, content } = req.body;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    
    const frontmatter = { title };
    const fileContent = `---
${yaml.stringify(frontmatter).trim()}
---

${content}`;
    
    const pagesDir = path.join(process.cwd(), 'src', 'pages');
    await fs.ensureDir(pagesDir);
    
    const filePath = path.join(pagesDir, `${slug}.md`);
    await fs.writeFile(filePath, fileContent, 'utf-8');
    
    res.json({ message: 'Page created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Settings management
router.get('/settings', authenticateToken, async (req, res) => {
  try {
    const configPath = path.join(process.cwd(), 'docusaurus.config.ts');
    const settingsPath = path.join(process.cwd(), 'admin-data', 'settings.json');
    let config = {};
    
    // Load basic config from docusaurus.config.ts
    if (await fs.pathExists(configPath)) {
      const configContent = await fs.readFile(configPath, 'utf-8');
      // Extract basic settings from config (simplified parsing)
      const titleMatch = configContent.match(/title:\s*['"](.*?)['"]/);
      const taglineMatch = configContent.match(/tagline:\s*['"](.*?)['"]/);
      const urlMatch = configContent.match(/url:\s*['"](.*?)['"]/);
      const faviconMatch = configContent.match(/favicon:\s*['"](.*?)['"]/);
      const imageMatch = configContent.match(/image:\s*['"](.*?)['"]/);
      
      config = {
        title: titleMatch ? titleMatch[1] : 'My Site',
        tagline: taglineMatch ? taglineMatch[1] : 'My Site Description',
        url: urlMatch ? urlMatch[1] : 'https://your-docusaurus-test-site.com',
        faviconUrl: faviconMatch ? faviconMatch[1] : '/img/favicon.ico',
        socialImage: imageMatch ? imageMatch[1] : '/img/docusaurus-social-card.jpg'
      };
    }
    
    // Load additional settings from admin settings file
    if (await fs.pathExists(settingsPath)) {
      try {
        const additionalSettings = await fs.readJSON(settingsPath);
        config = { ...config, ...additionalSettings };
      } catch (error) {
        console.warn('Could not load additional settings:', error.message);
      }
    }
    
    res.json(config);
  } catch (error) {
    console.error('Settings GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const settingsData = req.body;
    console.log('⚙️ Settings PUT request received:', settingsData);
    
    const configPath = path.join(process.cwd(), 'docusaurus.config.ts');
    const settingsPath = path.join(process.cwd(), 'admin-data', 'settings.json');
    
    // Ensure admin-data directory exists
    const adminDataDir = path.join(process.cwd(), 'admin-data');
    if (!(await fs.pathExists(adminDataDir))) {
      await fs.ensureDir(adminDataDir);
      console.log('📁 Created admin-data directory');
    }
    
    // Update docusaurus.config.ts for basic settings
    if (await fs.pathExists(configPath)) {
      let configContent = await fs.readFile(configPath, 'utf-8');
      
      // Update the config (simplified - in production, use proper AST parsing)
      if (settingsData.title) {
        configContent = configContent.replace(
          /(title:\s*['"]).+?(['"])/,
          `$1${settingsData.title}$2`
        );
        console.log('✏️ Updated title in docusaurus.config.ts');
      }
      
      if (settingsData.tagline) {
        configContent = configContent.replace(
          /(tagline:\s*['"]).+?(['"])/,
          `$1${settingsData.tagline}$2`
        );
        console.log('✏️ Updated tagline in docusaurus.config.ts');
      }
      
      if (settingsData.url) {
        configContent = configContent.replace(
          /(url:\s*['"]).+?(['"])/,
          `$1${settingsData.url}$2`
        );
        console.log('✏️ Updated url in docusaurus.config.ts');
      }
      
      // Update favicon if provided
      if (settingsData.faviconUrl) {
        configContent = configContent.replace(
          /(favicon:\s*['"]).+?(['"])/,
          `$1${settingsData.faviconUrl}$2`
        );
        console.log('✏️ Updated favicon in docusaurus.config.ts');
      }
      
      // Update social image if provided
      if (settingsData.socialImage) {
        configContent = configContent.replace(
          /(image:\s*['"]).+?(['"])/,
          `$1${settingsData.socialImage}$2`
        );
        console.log('✏️ Updated social image in docusaurus.config.ts');
      }
      
      // Update search plugin settings
      if (settingsData.hasOwnProperty('enableSearch')) {
        if (settingsData.enableSearch === false) {
          // Disable search plugin
          configContent = configContent.replace(
            /\[\s*require\.resolve\("@easyops-cn\/docusaurus-search-local"\),[\s\S]*?\],/,
            '// Search disabled by admin'
          );
          console.log('✏️ Disabled search plugin in docusaurus.config.ts');
        } else {
          // Ensure search plugin is enabled (restore if disabled)
          if (configContent.includes('// Search disabled by admin')) {
            configContent = configContent.replace(
              /\/\/ Search disabled by admin/,
              `[
      require.resolve("@easyops-cn/docusaurus-search-local"),
      {
        hashed: true,
      },
    ],`
            );
            console.log('✏️ Enabled search plugin in docusaurus.config.ts');
          }
        }
      }
      
      // Update dark mode settings
      if (settingsData.hasOwnProperty('enableDarkMode')) {
        if (settingsData.enableDarkMode === false) {
          // Disable dark mode toggle
          configContent = configContent.replace(
            /(colorMode:\s*\{[\s\S]*?disableSwitch:\s*)false/,
            '$1true'
          );
          console.log('✏️ Disabled dark mode toggle in docusaurus.config.ts');
        } else {
          // Enable dark mode toggle
          configContent = configContent.replace(
            /(colorMode:\s*\{[\s\S]*?disableSwitch:\s*)true/,
            '$1false'
          );
          console.log('✏️ Enabled dark mode toggle in docusaurus.config.ts');
        }
      }
      
      // Update Google Analytics
      if (settingsData.analyticsId && settingsData.analyticsId.trim()) {
        const analyticsId = settingsData.analyticsId.trim();
        
        // Determine which plugin to use based on the ID format
        let pluginName = '@docusaurus/plugin-google-gtag';
        let pluginConfig = {
          trackingID: analyticsId,
          anonymizeIP: true,
        };
        
        // Use GA4 gtag for G- and GT- prefixes, gtag for UA- prefix as well
        if (analyticsId.startsWith('UA-')) {
          // Universal Analytics - use gtag plugin but configure differently
          pluginConfig = {
            trackingID: analyticsId,
            anonymizeIP: true,
          };
        }
        
        // Check if Google Analytics plugin already exists
        const hasAnalytics = configContent.includes('@docusaurus/plugin-google-gtag') || 
                           configContent.includes('@docusaurus/plugin-google-analytics');
        
        if (!hasAnalytics) {
          // Add Google Analytics plugin
          const pluginMatch = configContent.match(/(\s*plugins:\s*\[)([\s\S]*?)(\s*\],)/);
          if (pluginMatch) {
            const newPluginContent = pluginMatch[2] + `
    [
      '${pluginName}',
      {
        trackingID: '${analyticsId}',
        anonymizeIP: true,
      },
    ],`;
            configContent = configContent.replace(
              /(plugins:\s*\[)([\s\S]*?)(\s*\],)/,
              `$1${newPluginContent}$3`
            );
          }
          console.log(`✏️ Added ${pluginName} plugin in docusaurus.config.ts`);
        } else {
          // Update existing Google Analytics tracking ID
          configContent = configContent.replace(
            /(trackingID:\s*['"]).+?(['"])/,
            `$1${analyticsId}$2`
          );
          console.log('✏️ Updated Google Analytics ID in docusaurus.config.ts');
        }
      } else if (settingsData.hasOwnProperty('analyticsId') && !settingsData.analyticsId.trim()) {
        // Remove Google Analytics plugin if ID is empty
        configContent = configContent.replace(
          /,?\s*\[\s*'@docusaurus\/plugin-google-gtag',[\s\S]*?\],/g,
          ''
        );
        configContent = configContent.replace(
          /,?\s*\[\s*'@docusaurus\/plugin-google-analytics',[\s\S]*?\],/g,
          ''
        );
        console.log('✏️ Removed Google Analytics plugin from docusaurus.config.ts');
      }
      
      await fs.writeFile(configPath, configContent, 'utf-8');
      console.log('✅ Updated docusaurus.config.ts with settings');
    }
    
    // Save all settings to admin settings file
    let existingSettings = {};
    if (await fs.pathExists(settingsPath)) {
      try {
        existingSettings = await fs.readJSON(settingsPath);
      } catch (error) {
        console.warn('Could not load existing settings:', error.message);
      }
    }
    
    const updatedSettings = { ...existingSettings, ...settingsData };
    await fs.writeJSON(settingsPath, updatedSettings, { spaces: 2 });
    console.log('💾 Saved settings to admin-data/settings.json:', Object.keys(updatedSettings));
    
    console.log('✅ Settings updated successfully:', Object.keys(settingsData));
    res.json({ 
      message: 'Settings updated successfully',
      settings: updatedSettings
    });
  } catch (error) {
    console.error('❌ Settings PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Quick Stats endpoint
router.get('/quick-stats', authenticateToken, async (req, res) => {
  try {
    const stats = {
      newBlogs: 0,
      newDocs: 0,
      mediaSize: '0 MB'
    };
    
    // Count recent blogs (last 7 days)
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    try {
      const blogFiles = await getAllFiles(PATHS.blog);
      for (const filePath of blogFiles) {
        const fileStat = await fs.stat(filePath);
        if (fileStat.mtime > weekAgo) {
          stats.newBlogs++;
        }
      }
    } catch (error) {
      console.error('Error counting recent blogs:', error);
    }
    
    // Count recent docs (last 7 days)
    try {
      const docFiles = await getAllFiles(PATHS.docs);
      for (const filePath of docFiles) {
        const fileStat = await fs.stat(filePath);
        if (fileStat.mtime > weekAgo) {
          stats.newDocs++;
        }
      }
    } catch (error) {
      console.error('Error counting recent docs:', error);
    }
    
    // Calculate media size
    try {
      const staticImgPath = path.join(process.cwd(), 'static', 'img');
      if (await fs.pathExists(staticImgPath)) {
        const mediaFiles = await fs.readdir(staticImgPath);
        let totalSize = 0;
        
        for (const file of mediaFiles) {
          const filePath = path.join(staticImgPath, file);
          const stat = await fs.stat(filePath);
          if (stat.isFile()) {
            totalSize += stat.size;
          }
        }
        
        stats.mediaSize = `${(totalSize / (1024 * 1024)).toFixed(1)} MB`;
      }
    } catch (error) {
      console.error('Error calculating media size:', error);
    }
    
    res.json(stats);
  } catch (error) {
    console.error('Quick stats error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Recent Activity endpoint
router.get('/recent-activity', authenticateToken, async (req, res) => {
  try {
    const activity = [];
    
    // Get recent blog posts
    const blogFiles = await getAllFiles(PATHS.blog);
    const recentBlogs = await Promise.all(
      blogFiles.slice(0, 3).map(async (filePath) => {
        const stats = await fs.stat(filePath);
        const relativePath = path.relative(PATHS.blog, filePath);
        return {
          type: 'blog',
          file: relativePath,
          time: stats.mtime
        };
      })
    );
    
    // Get recent docs
    const docFiles = await getAllFiles(PATHS.docs);
    const recentDocs = await Promise.all(
      docFiles.slice(0, 3).map(async (filePath) => {
        const stats = await fs.stat(filePath);
        const relativePath = path.relative(PATHS.docs, filePath);
        return {
          type: 'doc',
          file: relativePath,
          time: stats.mtime
        };
      })
    );
    
    // Combine and sort by time
    const allActivity = [...recentBlogs, ...recentDocs]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 5)
      .map(item => ({
        icon: item.type === 'blog' ? '📝' : '📚',
        message: `${item.type === 'blog' ? 'Blog post' : 'Documentation'} "${item.file}" was updated`,
        time: new Date(item.time).toLocaleString()
      }));
    
    res.json(allActivity);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Navigation/Menu management
router.get('/navigation', authenticateToken, async (req, res) => {
  try {
    const navigationData = await loadNavigationData();
    console.log('Navigation data loaded:', navigationData.items.length, 'items');
    res.json(navigationData);
  } catch (error) {
    console.error('Navigation GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT navigation with Docusaurus integration
router.put('/navigation', authenticateToken, async (req, res) => {
  try {
    const { items } = req.body;
    
    // Validate input
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'Invalid navigation items' });
    }
    
    // Ensure each item has required fields and assign IDs if missing
    const processedItems = items.map((item, index) => ({
      id: item.id || Date.now() + index,
      label: item.label || 'Untitled',
      url: item.url || '#',
      type: item.type || 'internal',
      position: item.position || (index + 1),
      newTab: Boolean(item.newTab)
    }));
    
    // Save to admin navigation data file
    const navigationData = { items: processedItems };
    const saved = await saveNavigationData(navigationData);
    
    // Update Docusaurus config file
    const docusaurusConfigUpdated = await updateDocusaurusNavigation(processedItems);
    
    if (saved && docusaurusConfigUpdated) {
      console.log('✅ Navigation updated successfully with', processedItems.length, 'items:');
      processedItems.forEach(item => {
        console.log(`  - ${item.label} (${item.type}) -> ${item.url}`);
      });
      
      // Trigger Docusaurus restart for configuration changes to take effect
      setTimeout(() => {
        console.log('🔄 Navigation updated - Docusaurus will restart automatically on next request');
      }, 1000);
      
      res.json({ 
        message: 'Navigation updated successfully! Changes will be visible after the next page refresh.',
        itemsCount: processedItems.length,
        timestamp: new Date().toISOString(),
        items: processedItems,
        docusaurusUpdated: docusaurusConfigUpdated,
        restartRequired: true
      });
    } else {
      res.status(500).json({ error: 'Failed to save navigation data or update Docusaurus config' });
    }
  } catch (error) {
    console.error('Navigation PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Public navigation endpoint for Docusaurus integration (no auth required)
router.get('/public/navigation', async (req, res) => {
  try {
    // This endpoint provides navigation data for Docusaurus without authentication
    // This is used by the Docusaurus frontend to dynamically update navigation
    res.json({
      navbar: {
        items: [
          {
            type: 'docSidebar',
            sidebarId: 'tutorialSidebar',
            position: 'left',
            label: 'Documentation',
          },
          {
            to: '/blog',
            label: 'Blog',
            position: 'left'
          },
          {
            to: '/contact',
            label: 'Contact',
            position: 'left'
          },
          {
            href: 'https://github.com/omagaark/hvdocs',
            label: 'GitHub',
            position: 'right',
          },
        ]
      },
      sidebar: {
        tutorialSidebar: [
          'intro',
          {
            type: 'category',
            label: 'Getting Started',
            items: [
              'Getting Started/Why Hope Valley Cloud',
              'Getting Started/Domain'
            ],
          },
          {
            type: 'category',
            label: 'Tutorial - Basics',
            items: [
              'tutorial-basics/create-a-document',
              'tutorial-basics/create-a-blog-post',
              'tutorial-basics/markdown-features',
              'tutorial-basics/create-a-page',
              'tutorial-basics/deploy-your-site',
              'tutorial-basics/congratulations'
            ],
          },
          {
            type: 'category',
            label: 'Tutorial - Extras',
            items: [
              'tutorial-extras/manage-docs-versions',
              'tutorial-extras/translate-your-site'
            ],
          }
        ]
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Footer management endpoints
router.get('/footer', authenticateToken, async (req, res) => {
  try {
    const footerData = await loadFooterData();
    console.log('Footer data loaded:', footerData.links.length, 'link groups');
    res.json(footerData);
  } catch (error) {
    console.error('Footer GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/footer', authenticateToken, async (req, res) => {
  try {
    const { links, copyright } = req.body;
    
    // Validate input
    if (!links || !Array.isArray(links)) {
      return res.status(400).json({ error: 'Invalid footer links structure' });
    }
    
    // Process footer data
    const processedLinks = links.map((group, groupIndex) => ({
      title: group.title || 'Untitled Group',
      items: (group.items || []).map((item, itemIndex) => ({
        label: item.label || 'Untitled Link',
        to: item.to || item.href || '#',
        href: item.href || null
      }))
    }));
    
    const footerData = {
      links: processedLinks,
      copyright: copyright || `Copyright © ${new Date().getFullYear()} HV Docs. Made with ❤️ by HopeValley.Cloud`
    };
    
    // Save footer data
    const saved = await saveFooterData(footerData);
    const docusaurusUpdated = await updateDocusaurusFooter(footerData);
    
    if (saved && docusaurusUpdated) {
      console.log('✅ Footer updated successfully with', processedLinks.length, 'link groups');
      res.json({
        message: 'Footer updated successfully in both admin and Docusaurus config',
        linksCount: processedLinks.length,
        timestamp: new Date().toISOString(),
        footerData: footerData
      });
    } else {
      res.status(500).json({ error: 'Failed to save footer data or update Docusaurus config' });
    }
  } catch (error) {
    console.error('Footer PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enhanced categories endpoint
router.get('/categories', authenticateToken, async (req, res) => {
  try {
    const categories = [
      { id: 'tutorial-basics', name: 'Tutorial - Basics', description: 'Core functionality tutorials' },
      { id: 'tutorial-extras', name: 'Tutorial - Extras', description: 'Advanced features and customization' }
    ];

    // Also get categories from docs structure
    const docsDir = PATHS.docs;
    const existingCategories = [];
    
    if (await fs.pathExists(docsDir)) {
      const items = await fs.readdir(docsDir, { withFileTypes: true });
      
      for (const item of items) {
        if (item.isDirectory()) {
          const categoryPath = path.join(docsDir, item.name);
          const categoryJsonPath = path.join(categoryPath, '_category_.json');
          
          let categoryInfo = {
            id: item.name,
            name: item.name,
            description: ''
          };
          
          // Read _category_.json if exists
          if (await fs.pathExists(categoryJsonPath)) {
            const categoryJson = await fs.readJson(categoryJsonPath);
            categoryInfo.name = categoryJson.label || item.name;
            categoryInfo.description = categoryJson.description || '';
            categoryInfo.position = categoryJson.position; // Fix: Include position from _category_.json
          }
          
          // Count files in category
          const files = await fs.readdir(categoryPath);
          const itemCount = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx')).length;
          
          existingCategories.push({
            ...categoryInfo,
            itemCount
          });
        }
      }
    }

    // Merge categories prioritizing filesystem-based ones
    const categoryMap = new Map();
    const normalizeStr = (str) => str?.toLowerCase().replace(/[\s\-]/g, '');
    
    // First add predefined categories
    categories.forEach(cat => {
      const normalizedId = normalizeStr(cat.id);
      console.log(`🔄 Processing predefined category: id="${cat.id}", normalizedId="${normalizedId}"`);
      categoryMap.set(normalizedId, cat);
    });
    
    // Override/add with existing categories from filesystem (these are more accurate)
    existingCategories.forEach(existing => {
      const normalizedId = normalizeStr(existing.id);
      const normalizedName = normalizeStr(existing.name);
      
      console.log(`🔄 Processing existing category: id="${existing.id}", normalizedId="${normalizedId}"`);
      
      // Use the existing category info, but keep directory name as ID for consistent API calls
      categoryMap.set(normalizedId, {
        ...existing,
        id: existing.id, // Use actual directory name as ID for consistent API matching
        name: existing.name || existing.id // Keep display name separate
      });
    });
    
    const allCategories = Array.from(categoryMap.values());
    
    // Sort categories by position to match sidebar order
    allCategories.sort((a, b) => {
      const posA = a.position || 999;
      const posB = b.position || 999;
      return posA - posB;
    });
    
    // Debug logging
    console.log('📂 Categories loaded:', allCategories.map(cat => ({ id: cat.id, name: cat.name, position: cat.position })));
    
    res.json({ categories: allCategories });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new category
router.post('/categories', authenticateToken, async (req, res) => {
  try {
    const { name, description } = req.body;
    
    console.log(`➕ CREATE Category: name=${name}`);
    
    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }
    
    // Create safe directory name (replace spaces with dashes, remove special chars)
    const safeName = name.toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
    
    console.log(`📁 Safe directory name: ${safeName}`);
    
    const categoryPath = path.join(PATHS.docs, safeName);
    
    // Check if category already exists
    if (await fs.pathExists(categoryPath)) {
      return res.status(400).json({ error: 'Category already exists' });
    }
    
    // Create the category directory
    await fs.ensureDir(categoryPath);
    
    // Create _category_.json file for Docusaurus
    const categoryConfig = {
      label: name,
      position: 1
    };
    
    if (description) {
      categoryConfig.description = description;
    }
    
    await fs.writeJSON(path.join(categoryPath, '_category_.json'), categoryConfig, { spaces: 2 });
    
    console.log(`✅ Category created: ${name} -> ${safeName}`);
    res.json({ 
      message: 'Category created successfully',
      category: { id: safeName, name, path: safeName }
    });
  } catch (error) {
    console.error('❌ Error creating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update category
router.put('/categories/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const { name, description } = req.body;
    
    console.log(`🔄 UPDATE Category: ${categoryId} -> name=${name}`);
    
    const categoryPath = path.join(PATHS.docs, categoryId);
    const categoryConfigPath = path.join(categoryPath, '_category_.json');
    
    // Check if category exists
    if (!(await fs.pathExists(categoryPath))) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Update _category_.json
    let categoryConfig = {};
    if (await fs.pathExists(categoryConfigPath)) {
      categoryConfig = await fs.readJSON(categoryConfigPath);
    }
    
    if (name) categoryConfig.label = name;
    if (description) categoryConfig.description = description;
    if (!categoryConfig.position) categoryConfig.position = 1;
    
    await fs.writeJSON(categoryConfigPath, categoryConfig, { spaces: 2 });
    
    console.log(`✅ Category updated: ${categoryId}`);
    res.json({ 
      message: 'Category updated successfully',
      category: { id: categoryId, name: name || categoryConfig.label }
    });
  } catch (error) {
    console.error('❌ Error updating category:', error);
    res.status(500).json({ error: error.message });
  }
});

// Category position management - similar to document position management
router.post('/categories/move-position', authenticateToken, async (req, res) => {
  try {
    const { categoryId, direction } = req.body; // categoryId: category folder name, direction: 'up' or 'down'
    
    console.log(`🔄 CATEGORY Move request: "${categoryId}" -> ${direction}`);
    
    if (!direction || !['up', 'down'].includes(direction)) {
      return res.status(400).json({ error: 'Invalid direction. Use "up" or "down"' });
    }

    if (!categoryId) {
      return res.status(400).json({ error: 'Category ID is required' });
    }

    // Get all categories with their positions
    const docsDir = PATHS.docs;
    const entries = await fs.readdir(docsDir, { withFileTypes: true });
    const categoryDirs = entries.filter(entry => entry.isDirectory());
    
    console.log(`📁 Found ${categoryDirs.length} category directories:`, categoryDirs.map(d => d.name));
    
    // Load category metadata and positions
    const categories = [];
    for (const dir of categoryDirs) {
      const categoryPath = path.join(docsDir, dir.name);
      const categoryConfigPath = path.join(categoryPath, '_category_.json');
      
      let categoryConfig = { 
        position: 999,  // Default high position
        label: dir.name 
      };
      
      // Try to load _category_.json
      if (await fs.pathExists(categoryConfigPath)) {
        try {
          const existingConfig = await fs.readJSON(categoryConfigPath);
          categoryConfig = { ...categoryConfig, ...existingConfig };
        } catch (error) {
          console.warn(`⚠️ Could not parse _category_.json for ${dir.name}:`, error.message);
        }
      }
      
      categories.push({
        id: dir.name,
        name: categoryConfig.label || dir.name,
        position: categoryConfig.position || 999,
        path: categoryPath,
        configPath: categoryConfigPath,
        isTarget: dir.name === categoryId || (categoryConfig.label || dir.name) === categoryId
      });
    }
    
    console.log(`📊 Categories loaded:`, categories.map(c => ({ 
      id: c.id, 
      position: c.position, 
      isTarget: c.isTarget 
    })));
    
    // Sort categories by position
    categories.sort((a, b) => a.position - b.position);
    
    console.log(`📊 Categories after sorting:`, categories.map(c => ({ 
      id: c.id, 
      position: c.position, 
      isTarget: c.isTarget 
    })));
    
    // Find current category index
    const currentIndex = categories.findIndex(c => c.isTarget);
    
    if (currentIndex === -1) {
      return res.status(404).json({ error: 'Category not found' });
    }
    
    // Calculate new index
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    console.log(`📍 Current category index: ${currentIndex} (${direction})`);
    console.log(`📍 New index: ${newIndex}`);
    
    // Check boundaries
    if (newIndex < 0 || newIndex >= categories.length) {
      console.log(`⚠️ Cannot move category ${direction} - at boundary`);
      return res.json({ 
        message: `Category is already at the ${direction === 'up' ? 'top' : 'bottom'}`,
        moved: false
      });
    }
    
    // Swap positions
    const currentCategory = categories[currentIndex];
    const targetCategory = categories[newIndex];
    
    console.log(`🔄 Swapping positions: ${currentCategory.id} (${currentCategory.position}) <-> ${targetCategory.id} (${targetCategory.position})`);
    
    const tempPosition = currentCategory.position;
    currentCategory.position = targetCategory.position;
    targetCategory.position = tempPosition;
    
    // Update _category_.json files
    await updateCategoryPosition(currentCategory);
    await updateCategoryPosition(targetCategory);
    
    console.log(`✅ CATEGORY Position swap completed successfully!`);
    res.json({ 
      message: 'Category position updated successfully',
      moved: true,
      categories: [
        { id: currentCategory.id, newPosition: currentCategory.position },
        { id: targetCategory.id, newPosition: targetCategory.position }
      ]
    });
    
  } catch (error) {
    console.error('❌ Error moving category position:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to update category position
async function updateCategoryPosition(category) {
  try {
    console.log(`💾 Updating category ${category.id} to position ${category.position}`);
    
    // Load existing config or create new one
    let categoryConfig = { 
      label: category.name,
      position: category.position
    };
    
    if (await fs.pathExists(category.configPath)) {
      const existingConfig = await fs.readJSON(category.configPath);
      categoryConfig = { ...existingConfig, position: category.position };
    }
    
    // Write updated config
    await fs.writeJSON(category.configPath, categoryConfig, { spaces: 2 });
    
  } catch (error) {
    console.error(`❌ Error updating category ${category.id}:`, error);
    throw error;
  }
}

// Delete category endpoint
router.delete('/categories/:categoryId', authenticateToken, async (req, res) => {
  try {
    const { categoryId } = req.params;
    const docsDir = PATHS.docs;
    const categoryPath = path.join(docsDir, categoryId);

    // Check if category exists and is a directory
    if (!(await fs.pathExists(categoryPath))) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const stat = await fs.stat(categoryPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Invalid category' });
    }

    // Check if category has documents
    const files = await fs.readdir(categoryPath);
    const documentFiles = files.filter(f => f.endsWith('.md') || f.endsWith('.mdx'));
    
    if (documentFiles.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete category "${categoryId}". It contains ${documentFiles.length} document(s). Please move or delete all documents first.`,
        documentCount: documentFiles.length
      });
    }

    // Remove the category directory
    await fs.remove(categoryPath);
    
    console.log(`🗑️ Category deleted: ${categoryId}`);
    res.json({ 
      message: `Category "${categoryId}" deleted successfully`,
      categoryId 
    });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Appearance management
router.get('/appearance', authenticateToken, async (req, res) => {
  try {
    const appearanceData = await loadAppearanceData();
    console.log('Appearance data loaded:', Object.keys(appearanceData));
    res.json(appearanceData);
  } catch (error) {
    console.error('Appearance GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT appearance
router.put('/appearance', authenticateToken, async (req, res) => {
  try {
    const appearanceData = req.body;
    
    // Validate required fields
    if (!appearanceData || typeof appearanceData !== 'object') {
      return res.status(400).json({ error: 'Invalid appearance data' });
    }
    
    // Merge with existing data to preserve other settings
    const currentData = await loadAppearanceData();
    const updatedData = { ...currentData, ...appearanceData };
    
    // Save appearance data
    const saved = await saveAppearanceData(updatedData);
    const docusaurusUpdated = await updateDocusaurusAppearance(updatedData);
    
    if (saved) {
      console.log('✅ Appearance updated successfully:', Object.keys(updatedData));
      res.json({ 
        message: 'Appearance updated successfully! Changes will be visible after page refresh.',
        timestamp: new Date().toISOString(),
        settings: updatedData,
        docusaurusUpdated: docusaurusUpdated
      });
    } else {
      res.status(500).json({ error: 'Failed to save appearance data' });
    }
  } catch (error) {
    console.error('Appearance PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT settings
router.put('/settings', authenticateToken, async (req, res) => {
  try {
    const settingsData = req.body;
    // In production, this would update docusaurus.config.ts
    // For now, we'll simulate success
    res.json({ message: 'Settings updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Footer management endpoints
router.get('/footer', authenticateToken, async (req, res) => {
  try {
    const footerData = await loadFooterData();
    console.log('Footer data loaded:', footerData.sections?.length || 0, 'sections');
    res.json(footerData);
  } catch (error) {
    console.error('Footer GET error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/footer', authenticateToken, async (req, res) => {
  try {
    const footerData = req.body;
    
    // Validate footer data
    if (!footerData || typeof footerData !== 'object') {
      return res.status(400).json({ error: 'Invalid footer data' });
    }
    
    // Save footer data
    const saved = await saveFooterData(footerData);
    const docusaurusUpdated = await updateDocusaurusFooter(footerData);
    
    if (saved) {
      console.log('✅ Footer updated successfully with', footerData.sections?.length || 0, 'sections');
      res.json({ 
        message: 'Footer updated successfully! Changes will be visible after page refresh.',
        timestamp: new Date().toISOString(),
        settings: footerData,
        docusaurusUpdated: docusaurusUpdated
      });
    } else {
      res.status(500).json({ error: 'Failed to save footer data' });
    }
  } catch (error) {
    console.error('Footer PUT error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
