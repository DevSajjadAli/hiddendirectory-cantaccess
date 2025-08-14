import React, { useState, useEffect, createContext, useContext } from 'react';
import Layout from '@theme/Layout';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import styles from './admin.module.css';

// Admin Context
const AdminContext = createContext();

// Auth Context
const AuthContext = createContext();

// Auth Provider Component
function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      // Verify token with API
      fetch('/api/admin/verify', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        if (data.valid) {
          setIsAuthenticated(true);
          setUser(data.user);
        } else {
          localStorage.removeItem('adminToken');
        }
        setLoading(false);
      })
      .catch(() => {
        localStorage.removeItem('adminToken');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (username, password) => {
    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        localStorage.setItem('adminToken', data.token);
        setIsAuthenticated(true);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: 'Network error' };
    }
  };

  const logout = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      loading,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// Helper function to get category icons for cookie consent
function getCategoryIcon(category) {
  const icons = {
    essential: '🔧',
    analytics: '📊',
    marketing: '🎯',
    functional: '⚙️'
  };
  return icons[category] || '🍪';
}

// Helper Components
function GuideCard({ title, description, steps, icon }) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={styles.guideCard}>
      <div 
        className={styles.guideHeader} 
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className={styles.guideIcon}>{icon}</div>
        <div className={styles.guideInfo}>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
        <div className={styles.expandIcon}>
          {isExpanded ? '📖' : '📚'}
        </div>
      </div>
      
      {isExpanded && (
        <div className={styles.guideContent}>
          <ol className={styles.guideSteps}>
            {steps.map((step, index) => (
              <li key={index} className={styles.guideStep}>
                {step}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div className={styles.loadingSpinner}>
      <div className={styles.spinner}>⏳</div>
      <span>{message}</span>
    </div>
  );
}

function ErrorMessage({ message, onRetry }) {
  return (
    <div className={styles.errorMessage}>
      <div className={styles.errorIcon}>⚠️</div>
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className={styles.retryButton}>
          🔄 Retry
        </button>
      )}
    </div>
  );
}

function SuccessMessage({ message, onClose }) {
  useEffect(() => {
    if (onClose) {
      const timer = setTimeout(onClose, 4000);
      return () => clearTimeout(timer);
    }
  }, [onClose]);

  return (
    <div className={styles.successMessage}>
      <div className={styles.successIcon}>✅</div>
      <span>{message}</span>
    </div>
  );
}

// Login Component
function LoginForm() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showHints, setShowHints] = useState(false);
  const { login } = useContext(AuthContext);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(username, password);
    
    if (!result.success) {
      setError(result.error);
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBox}>
        <div className={styles.loginHeader}>
          <h2>🔐 Docusaurus Admin</h2>
          <p>Manage your Docusaurus site with ease</p>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.loginForm}>
          <div className={styles.inputGroup}>
            <label>Username</label>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={styles.loginInput}
              required
            />
          </div>
          
          <div className={styles.inputGroup}>
            <label>Password</label>
            <input
              type="password"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={styles.loginInput}
              required
            />
          </div>
          
          {error && (
            <ErrorMessage 
              message={error} 
              onRetry={() => setError('')}
            />
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className={styles.loginButton}
          >
            {loading ? (
              <>
                <span className={styles.loginSpinner}>⏳</span>
                Signing in...
              </>
            ) : (
              <>
                <span>🚀</span>
                Sign In
              </>
            )}
          </button>
        </form>

        <div className={styles.loginHints}>
          <button 
            type="button"
            className={styles.hintsToggle}
            onClick={() => setShowHints(!showHints)}
          >
            {showHints ? '📖' : '💡'} {showHints ? 'Hide' : 'Show'} Login Help
          </button>
          
          {showHints && (
            <div className={styles.hintsContent}>
              <h4>🔑 Default Credentials</h4>
              <div className={styles.credentialHint}>
                <strong>Username:</strong> <code>admin</code><br/>
                <strong>Password:</strong> <code>admin123</code>
              </div>
              <p className={styles.securityNote}>
                ⚠️ <strong>Security Note:</strong> Change these credentials in production by setting 
                <code>ADMIN_USERNAME</code> and <code>ADMIN_PASSWORD</code> environment variables.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Admin Dashboard Component
function AdminDashboard() {
  const { user, logout } = useContext(AuthContext);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetchStats();
    
    // Add event listener for tab switching
    const handleSwitchTab = (event) => {
      setActiveTab(event.detail);
    };
    
    window.addEventListener('switchTab', handleSwitchTab);
    
    return () => {
      window.removeEventListener('switchTab', handleSwitchTab);
    };
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'blogs', label: 'Blog Posts', icon: '📝' },
    { id: 'docs', label: 'Documentation', icon: '📚' },
    { id: 'pages', label: 'Pages', icon: '📄' },
    { id: 'media', label: 'Media', icon: '🖼️' },
    { id: 'authors', label: 'Authors', icon: '👥' },
    { id: 'categories', label: 'Categories', icon: '🏷️' },
    { id: 'menus', label: 'Navigation', icon: '🧭' },
    { id: 'appearance', label: 'Appearance', icon: '🎨' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div className={styles.adminPanel}>
      {/* Header */}
      <div className={styles.adminHeader}>
        <div className={styles.adminTitle}>
          <h1>📋 Docusaurus Admin Panel</h1>
          <span>Welcome, {user?.username}</span>
        </div>
        <button onClick={logout} className={styles.logoutButton}>
          Logout
        </button>
      </div>

      {/* Navigation */}
      <div className={styles.adminNav}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`${styles.navButton} ${activeTab === tab.id ? styles.active : ''}`}
          >
            <span className={styles.navIcon}>{tab.icon}</span>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className={styles.adminContent}>
        {activeTab === 'dashboard' && <DashboardTab stats={stats} />}
        {activeTab === 'blogs' && <BlogsTab />}
        {activeTab === 'docs' && <DocsTab />}
        {activeTab === 'pages' && <PagesTab />}
        {activeTab === 'media' && <MediaTab />}
        {activeTab === 'authors' && <AuthorsTab />}
        {activeTab === 'categories' && <CategoriesTab />}
        {activeTab === 'menus' && <MenusTab />}
        {activeTab === 'appearance' && <AppearanceTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

// Enhanced Dashboard Tab Component
function DashboardTab({ stats }) {
  const [recentActivity, setRecentActivity] = useState([]);
  const [quickStats, setQuickStats] = useState(null);

  useEffect(() => {
    fetchQuickStats();
    fetchRecentActivity();
  }, []);

  const fetchQuickStats = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/quick-stats', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setQuickStats(data);
    } catch (error) {
      console.error('Failed to fetch quick stats:', error);
    }
  };

  const fetchRecentActivity = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/recent-activity', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setRecentActivity(data);
    } catch (error) {
      console.error('Failed to fetch recent activity:', error);
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <h2>👋 Welcome to your Docusaurus Admin Panel</h2>
        <p>Manage your entire documentation site from this comprehensive dashboard</p>
      </div>

      {/* Quick Stats */}
      <div className={styles.dashboardGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📝</div>
          <div className={styles.statContent}>
            <h3>Blog Posts</h3>
            <p className={styles.statNumber}>{stats?.blogs || 0}</p>
            <span className={styles.statChange}>+{quickStats?.newBlogs || 0} this week</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>📚</div>
          <div className={styles.statContent}>
            <h3>Documentation</h3>
            <p className={styles.statNumber}>{stats?.docs || 0}</p>
            <span className={styles.statChange}>+{quickStats?.newDocs || 0} this week</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>👥</div>
          <div className={styles.statContent}>
            <h3>Authors</h3>
            <p className={styles.statNumber}>{stats?.authors || 0}</p>
            <span className={styles.statChange}>Active contributors</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}>🖼️</div>
          <div className={styles.statContent}>
            <h3>Media Files</h3>
            <p className={styles.statNumber}>{stats?.media || 0}</p>
            <span className={styles.statChange}>{quickStats?.mediaSize || '0 MB'} total</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={styles.quickActions}>
        <h3>🚀 Quick Actions</h3>
        <div className={styles.actionButtons}>
          <button className={styles.actionBtn} onClick={() => window.dispatchEvent(new CustomEvent('switchTab', {detail: 'blogs'}))}>
            <span>📝</span> New Blog Post
          </button>
          <button className={styles.actionBtn} onClick={() => window.dispatchEvent(new CustomEvent('switchTab', {detail: 'docs'}))}>
            <span>📚</span> New Documentation
          </button>
          <button className={styles.actionBtn} onClick={() => window.dispatchEvent(new CustomEvent('switchTab', {detail: 'media'}))}>
            <span>🖼️</span> Upload Media
          </button>
          <button className={styles.actionBtn} onClick={() => window.dispatchEvent(new CustomEvent('switchTab', {detail: 'authors'}))}>
            <span>👥</span> Add Author
          </button>
        </div>
      </div>

      {/* Recent Activity */}
      <div className={styles.recentActivity}>
        <h3>📈 Recent Activity</h3>
        <div className={styles.activityList}>
          {recentActivity.length === 0 ? (
            <p className={styles.emptyActivity}>No recent activity. Start creating content!</p>
          ) : (
            recentActivity.map((activity, index) => (
              <div key={index} className={styles.activityItem}>
                <div className={styles.activityIcon}>{activity.icon}</div>
                <div className={styles.activityContent}>
                  <p>{activity.message}</p>
                  <span className={styles.activityTime}>{activity.time}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* System Health */}
      <div className={styles.systemHealth}>
        <h3>💚 System Health</h3>
        <div className={styles.healthGrid}>
          <div className={styles.healthItem}>
            <span className={styles.healthIcon}>🟢</span>
            <span>Server Status: Online</span>
          </div>
          <div className={styles.healthItem}>
            <span className={styles.healthIcon}>🟢</span>
            <span>File System: Accessible</span>
          </div>
          <div className={styles.healthItem}>
            <span className={styles.healthIcon}>🟢</span>
            <span>Media Upload: Working</span>
          </div>
          <div className={styles.healthItem}>
            <span className={styles.healthIcon}>🟢</span>
            <span>Content Sync: Active</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Blog Management Component
function BlogsTab() {
  const [blogs, setBlogs] = useState([]);
  const [authors, setAuthors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingBlog, setEditingBlog] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterAuthor, setFilterAuthor] = useState('all');
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');
  const [selectedBlogs, setSelectedBlogs] = useState(new Set());
  const [showPreview, setShowPreview] = useState(null);

  useEffect(() => {
    fetchBlogs();
    fetchAuthors();
  }, []);

  const fetchBlogs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/blogs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setBlogs(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch blogs:', error);
      setLoading(false);
    }
  };

  const fetchAuthors = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/authors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAuthors(data);
    } catch (error) {
      console.error('Failed to fetch authors:', error);
    }
  };

  const handleEdit = (blog) => {
    setEditingBlog(blog);
    setShowForm(true);
  };

  const handleDelete = async (blogId) => {
    if (!confirm('Are you sure you want to delete this blog post?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`/api/admin/blogs/${blogId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchBlogs();
    } catch (error) {
      console.error('Failed to delete blog:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedBlogs.size === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedBlogs.size} blog posts?`)) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      await Promise.all(
        Array.from(selectedBlogs).map(blogId =>
          fetch(`/api/admin/blogs/${blogId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        )
      );
      setSelectedBlogs(new Set());
      fetchBlogs();
    } catch (error) {
      console.error('Failed to delete blogs:', error);
    }
  };

  const handleStatusToggle = async (blogId, currentStatus) => {
    try {
      const token = localStorage.getItem('adminToken');
      await fetch(`/api/admin/blogs/${blogId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ published: !currentStatus })
      });
      fetchBlogs();
    } catch (error) {
      console.error('Failed to update blog status:', error);
    }
  };

  const filteredBlogs = blogs.filter(blog => {
    const matchesSearch = blog.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         blog.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'published' && blog.published !== false) ||
                         (filterStatus === 'draft' && blog.published === false);
    
    const matchesAuthor = filterAuthor === 'all' || blog.author === filterAuthor;
    
    return matchesSearch && matchesStatus && matchesAuthor;
  }).sort((a, b) => {
    const modifier = sortOrder === 'desc' ? -1 : 1;
    switch (sortBy) {
      case 'title':
        return modifier * (a.title || '').localeCompare(b.title || '');
      case 'author':
        return modifier * (a.author || '').localeCompare(b.author || '');
      case 'date':
      default:
        return modifier * (new Date(b.date || 0) - new Date(a.date || 0));
    }
  });

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedBlogs(new Set(filteredBlogs.map(blog => blog.id)));
    } else {
      setSelectedBlogs(new Set());
    }
  };

  const handleSelectBlog = (blogId, checked) => {
    const newSelected = new Set(selectedBlogs);
    if (checked) {
      newSelected.add(blogId);
    } else {
      newSelected.delete(blogId);
    }
    setSelectedBlogs(newSelected);
  };

  if (loading) return <div className={styles.loading}>Loading blogs...</div>;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>📝 Blog Management</h2>
        <div className={styles.tabActions}>
          <button 
            className={styles.addButton}
            onClick={() => {setShowForm(true); setEditingBlog(null);}}
          >
            ➕ New Post
          </button>
          <a 
            href="/blog" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.previewButton}
          >
            👁️ Preview Blog
          </a>
        </div>
      </div>

      {/* Enhanced Filters and Search */}
      <div className={styles.blogFilters}>
        <div className={styles.filterRow}>
          <div className={styles.searchGroup}>
            <input
              type="text"
              placeholder="🔍 Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          
          <div className={styles.filterGroup}>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Status</option>
              <option value="published">📋 Published</option>
              <option value="draft">📝 Draft</option>
            </select>
          </div>
          
          <div className={styles.filterGroup}>
            <select 
              value={filterAuthor} 
              onChange={(e) => setFilterAuthor(e.target.value)}
              className={styles.filterSelect}
            >
              <option value="all">All Authors</option>
              {Object.entries(authors).map(([key, author]) => (
                <option key={key} value={key}>{author.name}</option>
              ))}
            </select>
          </div>
          
          <div className={styles.sortGroup}>
            <select 
              value={`${sortBy}-${sortOrder}`} 
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field);
                setSortOrder(order);
              }}
              className={styles.sortSelect}
            >
              <option value="date-desc">📅 Newest First</option>
              <option value="date-asc">📅 Oldest First</option>
              <option value="title-asc">🔤 Title A-Z</option>
              <option value="title-desc">🔤 Title Z-A</option>
              <option value="author-asc">👤 Author A-Z</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions */}
        {selectedBlogs.size > 0 && (
          <div className={styles.bulkActions}>
            <span className={styles.bulkInfo}>
              {selectedBlogs.size} post{selectedBlogs.size !== 1 ? 's' : ''} selected
            </span>
            <button 
              onClick={handleBulkDelete}
              className={styles.bulkDeleteBtn}
            >
              🗑️ Delete Selected
            </button>
          </div>
        )}
      </div>

      <div className={styles.blogStats}>
        <span>📊 Showing {filteredBlogs.length} of {blogs.length} posts</span>
        <span>📋 Published: {blogs.filter(b => b.published !== false).length}</span>
        <span>📝 Drafts: {blogs.filter(b => b.published === false).length}</span>
      </div>

      {showForm ? (
        <BlogForm 
          blog={editingBlog}
          authors={authors}
          onSave={() => {setShowForm(false); fetchBlogs();}}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div className={styles.blogsList}>
          {filteredBlogs.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📝</div>
              <h3>No blog posts found</h3>
              <p>
                {blogs.length === 0 
                  ? "Create your first blog post to get started!" 
                  : "Try adjusting your search or filters."}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className={styles.blogTableHeader}>
                <div className={styles.selectColumn}>
                  <input
                    type="checkbox"
                    checked={selectedBlogs.size === filteredBlogs.length && filteredBlogs.length > 0}
                    onChange={handleSelectAll}
                  />
                </div>
                <div className={styles.titleColumn}>Title</div>
                <div className={styles.authorColumn}>Author</div>
                <div className={styles.statusColumn}>Status</div>
                <div className={styles.dateColumn}>Date</div>
                <div className={styles.actionsColumn}>Actions</div>
              </div>

              {/* Blog List */}
              {filteredBlogs.map(blog => (
                <div key={blog.id} className={styles.blogTableRow}>
                  <div className={styles.selectColumn}>
                    <input
                      type="checkbox"
                      checked={selectedBlogs.has(blog.id)}
                      onChange={(e) => handleSelectBlog(blog.id, e.target.checked)}
                    />
                  </div>
                  
                  <div className={styles.titleColumn}>
                    <div className={styles.blogTitle}>
                      <h4>{blog.title}</h4>
                      <div className={styles.blogMeta}>
                        {blog.tags?.slice(0, 3).map(tag => (
                          <span key={tag} className={styles.tag}>{tag}</span>
                        ))}
                        {blog.tags?.length > 3 && (
                          <span className={styles.tagMore}>+{blog.tags.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className={styles.authorColumn}>
                    <div className={styles.authorInfo}>
                      {authors[blog.author] && (
                        <>
                          {authors[blog.author].image_url && (
                            <img 
                              src={authors[blog.author].image_url} 
                              alt={authors[blog.author].name}
                              className={styles.authorAvatar}
                            />
                          )}
                          <span>{authors[blog.author].name}</span>
                        </>
                      )}
                      {!authors[blog.author] && <span>{blog.author}</span>}
                    </div>
                  </div>
                  
                  <div className={styles.statusColumn}>
                    <button
                      onClick={() => handleStatusToggle(blog.id, blog.published !== false)}
                      className={`${styles.statusBadge} ${
                        blog.published !== false ? styles.published : styles.draft
                      }`}
                    >
                      {blog.published !== false ? '📋 Published' : '📝 Draft'}
                    </button>
                  </div>
                  
                  <div className={styles.dateColumn}>
                    <span className={styles.blogDate}>
                      {new Date(blog.date).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className={styles.actionsColumn}>
                    <div className={styles.blogActions}>
                      <button
                        onClick={() => setShowPreview(blog)}
                        className={styles.previewBtn}
                        title="Quick Preview"
                      >
                        👁️
                      </button>
                      <a 
                        href={blog.slug ? `/blog/${blog.slug}` : `/blog/${blog.id || blog.title?.toLowerCase().replace(/\s+/g, '-')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewBtn}
                        title="View Live Post"
                      >
                        �
                      </a>
                      <button 
                        onClick={() => handleEdit(blog)} 
                        className={styles.editBtn}
                        title="Edit Post"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(blog.id)} 
                        className={styles.deleteBtn}
                        title="Delete Post"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Quick Preview Modal */}
      {showPreview && (
        <div className={styles.previewModal} onClick={() => setShowPreview(null)}>
          <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <h3>� Quick Preview</h3>
              <button onClick={() => setShowPreview(null)}>✕</button>
            </div>
            <div className={styles.previewBody}>
              <h1>{showPreview.title}</h1>
              <div className={styles.previewMeta}>
                By {showPreview.author} • {new Date(showPreview.date).toLocaleDateString()}
              </div>
              <div className={styles.previewTags}>
                {showPreview.tags?.map(tag => (
                  <span key={tag} className={styles.previewTag}>{tag}</span>
                ))}
              </div>
              <div className={styles.previewContentText}>
                {showPreview.content?.substring(0, 500)}
                {showPreview.content?.length > 500 && '...'}
              </div>
            </div>
            <div className={styles.previewFooter}>
              <a 
                href={showPreview.slug ? `/blog/${showPreview.slug}` : `/blog/${showPreview.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fullViewBtn}
              >
                🔗 View Full Post
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Documentation Management Component
function DocsTab() {
  const [docs, setDocs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingDoc, setEditingDoc] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchDocs();
    fetchCategories();
  }, []);

  const fetchDocs = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/docs', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('🔍 DEBUG - Documents received:', data.map(d => ({ title: d.title, category: d.category })));
      setDocs(data);
    } catch (error) {
      console.error('Failed to fetch docs:', error);
      setError('Failed to load documentation');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      console.log('🔍 DEBUG - Categories received:', data.categories);
      const validCategories = (data.categories || []).filter(cat => cat && cat.id);
      console.log('🔍 DEBUG - Valid categories after filtering:', validCategories);
      setCategories(validCategories);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setCategories([]);
    }
  };

  const handleDocSaved = () => {
    setShowForm(false);
    fetchDocs();
    fetchCategories();
    setSuccess('Document saved successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const handleDeleteDoc = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    // Find the document to get its file path
    const document = docs.find(d => d.id === docId);
    if (!document) {
      setError('Document not found');
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const encodedDocId = encodeURIComponent(docId); // URL encode the ID
      console.log(`🗑️ DELETE Document: ID=${docId}, encodedID=${encodedDocId}, filePath=${document.filePath}`);
      
      const response = await fetch(`/api/admin/docs/${encodedDocId}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ filePath: document.filePath })
      });
      
      if (response.ok) {
        fetchDocs();
        setSuccess('Document deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorText = await response.text();
        console.error(`❌ Delete response error:`, errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to delete document';
        } catch (e) {
          errorMessage = errorText.includes('<!DOCTYPE') 
            ? 'Server returned HTML instead of JSON - check server logs' 
            : errorText;
        }
        setError(errorMessage);
      }
    } catch (error) {
      console.error('Failed to delete doc:', error);
      setError('Failed to delete document');
    }
  };

  const handleMovePosition = async (docId, direction, category) => {
    console.log(`🔄 SIMPLE Frontend: Moving document with filePath`);
    
    // Find the document to get its file path
    const document = docs.find(d => d.id === docId);
    if (!document) {
      console.error(`❌ Document not found: ${docId}`);
      setError('Document not found');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    console.log(`📄 Document found:`, document);
    console.log(`� Using filePath: ${document.filePath}`);
    
    try {
      const token = localStorage.getItem('adminToken');
      
      const response = await fetch('/api/admin/docs/move-position', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          filePath: document.filePath,
          direction: direction
        })
      });
      
      console.log(`📡 API response status: ${response.status}`);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log(`✅ Success response:`, responseData);
        
        fetchDocs(); // Refresh the document list
        setSuccess(`Document moved ${direction} successfully!`);
        setTimeout(() => setSuccess(''), 2000);
      } else {
        const errorData = await response.json();
        console.error(`❌ API error:`, errorData);
        setError(errorData.error || 'Failed to move document');
        setTimeout(() => setError(''), 4000);
      }
    } catch (error) {
      console.error('❌ Frontend error:', error);
      setError('Failed to move document position');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!confirm(`Are you sure you want to delete the category "${categoryId}"? This will only delete the category folder if it's empty.`)) {
      return;
    }
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/categories/${encodeURIComponent(categoryId)}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchCategories();
        fetchDocs();
        setSuccess(`Category "${categoryId}" deleted successfully!`);
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete category');
        setTimeout(() => setError(''), 5000);
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      setError('Failed to delete category');
      setTimeout(() => setError(''), 3000);
    }
  };

  const filteredDocs = selectedCategory === 'all' 
    ? docs 
    : selectedCategory === 'uncategorized'
    ? docs.filter(doc => !doc.category || doc.category === '')
    : docs.filter(doc => {
        if (!doc.category) return false;
        
        const selectedCat = categories.find(cat => cat && cat.id === selectedCategory);
        if (!selectedCat) return false;
        
        // Direct match
        if (doc.category === selectedCategory) return true;
        if (selectedCat.name && doc.category === selectedCat.name) return true;
        
        // Normalize both for comparison (remove spaces/dashes, convert to lowercase)
        const normalizeStr = (str) => str?.toLowerCase().replace(/[\s\-]/g, '');
        const normalizedDocCat = normalizeStr(doc.category);
        const normalizedSelectedCat = normalizeStr(selectedCategory);
        const normalizedCatName = normalizeStr(selectedCat.name);
        
        return normalizedDocCat === normalizedSelectedCat || normalizedDocCat === normalizedCatName;
      });

  if (loading) return <LoadingSpinner message="Loading documentation..." />;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>📚 Documentation Management</h2>
        <div className={styles.tabActions}>
          <button 
            className={styles.addButton}
            onClick={() => {setShowForm(true); setEditingDoc(null);}}
          >
            ➕ New Document
          </button>
          <a 
            href="/docs" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.previewButton}
          >
            👁️ Preview Docs
          </a>
        </div>
      </div>

      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorMessage message={error} onRetry={() => setError('')} />}

      {showForm ? (
        <EnhancedDocForm 
          doc={editingDoc}
          categories={categories}
          docs={docs}
          onSave={handleDocSaved}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <>
          {/* Category Filter and Statistics */}
          <div className={styles.docsToolbar}>
            <div className={styles.filterSection}>
              <label>📂 Filter by Category:</label>
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className={styles.selectField}
              >
                <option value="all">All Categories ({docs.length})</option>
                {categories.filter(cat => cat && cat.id).map(cat => {
                  // Simple and effective matching logic
                  const matchingDocs = docs.filter(doc => {
                    if (!doc.category) return false;
                    
                    // Direct match
                    if (doc.category === cat.id) return true;
                    if (doc.category === cat.name) return true;
                    
                    // Normalize both for comparison (remove spaces, convert to lowercase)
                    const normalizeStr = (str) => str?.toLowerCase().replace(/[\s\-]/g, '');
                    const normalizedDocCat = normalizeStr(doc.category);
                    const normalizedCatId = normalizeStr(cat.id);
                    const normalizedCatName = normalizeStr(cat.name);
                    
                    return normalizedDocCat === normalizedCatId || normalizedDocCat === normalizedCatName;
                  });
                  
                  return (
                    <option key={cat.id} value={cat.id}>
                      {cat.name || cat.label} ({matchingDocs.length})
                    </option>
                  );
                })}
                <option value="uncategorized">
                  Uncategorized ({docs.filter(d => !d.category || d.category === '').length})
                </option>
              </select>
            </div>
            
            <div className={styles.docsStats}>
              <span className={styles.statItem}>📄 {docs.length} Total Docs</span>
              <span className={styles.statItem}>📂 {categories.length} Categories</span>
            </div>
          </div>

          {/* Category Management Section */}
          <div className={styles.categoryManagement}>
            <div className={styles.managementHeader}>
              <h3>🏷️ Category Management</h3>
              <span className={styles.managementSubtext}>Organize your documentation</span>
            </div>
            <div className={styles.categoryGrid}>
              {categories.filter(cat => cat && cat.id).map(cat => {
                const categoryDocs = docs.filter(doc => {
                  if (!doc.category) return false;
                  
                  // Direct match
                  if (doc.category === cat.id) return true;
                  if (doc.category === cat.name) return true;
                  
                  // Normalize both for comparison
                  const normalizeStr = (str) => str?.toLowerCase().replace(/[\s\-]/g, '');
                  const normalizedDocCat = normalizeStr(doc.category);
                  const normalizedCatId = normalizeStr(cat.id);
                  const normalizedCatName = normalizeStr(cat.name);
                  
                  return normalizedDocCat === normalizedCatId || normalizedDocCat === normalizedCatName;
                });

                return (
                  <div key={cat.id} className={styles.categoryCard}>
                    <div className={styles.categoryCardHeader}>
                      <div className={styles.categoryIcon}>📁</div>
                      <div className={styles.categoryInfo}>
                        <h4>{cat.name || cat.label}</h4>
                        <span className={styles.categoryCount}>
                          {categoryDocs.length} document{categoryDocs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    
                    <div className={styles.categoryActions}>
                      <button
                        className={styles.categoryActionBtn}
                        onClick={() => setSelectedCategory(cat.id)}
                        title="View Category"
                      >
                        👁️ View
                      </button>
                      {categoryDocs.length === 0 && (
                        <button
                          className={`${styles.categoryActionBtn} ${styles.deleteBtn}`}
                          onClick={() => handleDeleteCategory(cat.id)}
                          title="Delete Empty Category"
                        >
                          🗑️ Delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Documents List */}
          <div className={styles.itemsList}>
            {filteredDocs.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>📚</div>
                <h3>No Documents Found</h3>
                <p>{selectedCategory === 'all' 
                  ? 'Create your first documentation to get started.' 
                  : `No documents in ${selectedCategory === 'uncategorized' ? 'Uncategorized' : categories.find(c => c && c.id === selectedCategory)?.name || categories.find(c => c && c.id === selectedCategory)?.label || selectedCategory} category.`
                }</p>
                <button 
                  className={styles.primaryButton}
                  onClick={() => {setShowForm(true); setEditingDoc(null);}}
                >
                  ➕ Create First Document
                </button>
              </div>
            ) : (
              <>
                {/* Category Headers */}
                {selectedCategory === 'all' && categories.map(category => {
                  // Use the same matching logic for category documents
                  const categoryDocs = docs.filter(doc => {
                    if (!doc.category) return false;
                    
                    // Direct match
                    if (doc.category === category.id) return true;
                    if (doc.category === category.name) return true;
                    
                    // Normalize both for comparison
                    const normalizeStr = (str) => str?.toLowerCase().replace(/[\s\-]/g, '');
                    const normalizedDocCat = normalizeStr(doc.category);
                    const normalizedCatId = normalizeStr(category.id);
                    const normalizedCatName = normalizeStr(category.name);
                    
                    return normalizedDocCat === normalizedCatId || normalizedDocCat === normalizedCatName;
                  });
                  
                  if (categoryDocs.length === 0) return null;
                  
                  return (
                    <div key={category.id} className={styles.categorySection}>
                      <div className={styles.categoryHeader}>
                        <h3>📂 {category.name || category.label}</h3>
                        <span className={styles.categoryCount}>
                          {categoryDocs.length} document{categoryDocs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className={styles.categoryDocs}>
                        {categoryDocs
                          .sort((a, b) => (a.position || 999) - (b.position || 999))
                          .map((doc, index) => (
                            <DocumentItem 
                              key={doc.id} 
                              doc={doc} 
                              onEdit={(doc) => {setEditingDoc(doc); setShowForm(true);}}
                              onDelete={handleDeleteDoc}
                              onMovePosition={handleMovePosition}
                              category={category.id}
                              allDocs={categoryDocs}
                              currentIndex={index}
                              totalDocs={categoryDocs.length}
                            />
                          ))}
                      </div>
                    </div>
                  );
                })}

                {/* Uncategorized docs */}
                {selectedCategory === 'all' && (() => {
                  const uncategorizedDocs = docs.filter(doc => !doc.category || doc.category === '');
                  if (uncategorizedDocs.length === 0) return null;
                  
                  return (
                    <div className={styles.categorySection}>
                      <div className={styles.categoryHeader}>
                        <h3>📄 Uncategorized</h3>
                        <span className={styles.categoryCount}>
                          {uncategorizedDocs.length} document{uncategorizedDocs.length !== 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className={styles.categoryDocs}>
                        {uncategorizedDocs
                          .sort((a, b) => (a.position || 999) - (b.position || 999))
                          .map((doc, index) => (
                            <DocumentItem 
                              key={doc.id} 
                              doc={doc} 
                              onEdit={(doc) => {setEditingDoc(doc); setShowForm(true);}}
                              onDelete={handleDeleteDoc}
                              onMovePosition={handleMovePosition}
                              category=""
                              allDocs={uncategorizedDocs}
                              currentIndex={index}
                              totalDocs={uncategorizedDocs.length}
                            />
                          ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Single category view */}
                {selectedCategory !== 'all' && (
                  <div className={styles.categoryDocs}>
                    {filteredDocs
                      .sort((a, b) => (a.position || 999) - (b.position || 999))
                      .map((doc, index) => (
                        <DocumentItem 
                          key={doc.id} 
                          doc={doc} 
                          onEdit={(doc) => {setEditingDoc(doc); setShowForm(true);}}
                          onDelete={handleDeleteDoc}
                          onMovePosition={handleMovePosition}
                          category={selectedCategory}
                          allDocs={filteredDocs}
                          currentIndex={index}
                          totalDocs={filteredDocs.length}
                        />
                      ))}
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Enhanced Document Item Component with Position Controls
function DocumentItem({ doc, onEdit, onDelete, onMovePosition, category, allDocs, currentIndex, totalDocs }) {
  const getStatusBadge = (doc) => {
    if (doc.draft) return <span className={styles.draftBadge}>📝 Draft</span>;
    if (doc.featured) return <span className={styles.featuredBadge}>⭐ Featured</span>;
    return <span className={styles.publishedBadge}>✅ Published</span>;
  };

  const handleMoveUp = () => {
    console.log(`⬆️ Move up clicked for ${doc.id}, current index: ${currentIndex}, category: "${category}"`);
    console.log(`📋 Document data:`, { id: doc.id, title: doc.title, position: doc.position });
    console.log(`📋 Props:`, { currentIndex, totalDocs, category, onMovePosition: !!onMovePosition });
    
    if (onMovePosition && currentIndex > 0) {
      console.log(`✅ Calling onMovePosition...`);
      onMovePosition(doc.id, 'up', category);
    } else {
      console.log(`❌ Cannot move up: onMovePosition=${!!onMovePosition}, currentIndex=${currentIndex}`);
    }
  };

  const handleMoveDown = () => {
    console.log(`⬇️ Move down clicked for ${doc.id}, current index: ${currentIndex}, total docs: ${totalDocs}, category: "${category}"`);
    console.log(`📋 Document data:`, { id: doc.id, title: doc.title, position: doc.position });
    console.log(`📋 Props:`, { currentIndex, totalDocs, category, onMovePosition: !!onMovePosition });
    
    if (onMovePosition && currentIndex < totalDocs - 1) {
      console.log(`✅ Calling onMovePosition...`);
      onMovePosition(doc.id, 'down', category);
    } else {
      console.log(`❌ Cannot move down: onMovePosition=${!!onMovePosition}, currentIndex=${currentIndex}, totalDocs=${totalDocs}`);
    }
  };

  return (
    <div className={styles.documentItem}>
      <div className={styles.docItemContent}>
        <div className={styles.docItemHeader}>
          <div className={styles.docTitle}>
            <h4>{doc.title}</h4>
            {getStatusBadge(doc)}
          </div>
          <div className={styles.docMeta}>
            <span className={styles.docPath}>📁 {doc.filePath}</span>
            {doc.category && (
              <span className={styles.docCategory}>📂 {doc.category}</span>
            )}
            {doc.position && (
              <span className={styles.docPosition}>📍 Position {doc.position}</span>
            )}
          </div>
        </div>
        
        {doc.description && (
          <p className={styles.docDescription}>{doc.description}</p>
        )}
        
        <div className={styles.docStats}>
          <span>📅 {new Date(doc.lastModified || Date.now()).toLocaleDateString()}</span>
          <span>📝 {doc.wordCount || 0} words</span>
        </div>
      </div>
      
      <div className={styles.docItemActions}>
        {/* Position Control Arrows */}
        <div className={styles.positionControls}>
          <button
            className={`${styles.positionArrow} ${currentIndex === 0 ? styles.disabled : ''}`}
            onClick={handleMoveUp}
            disabled={currentIndex === 0}
            title="Move Up"
          >
            ⬆️
          </button>
          <span className={styles.positionInfo}>
            {currentIndex + 1}/{totalDocs}
          </span>
          <button
            className={`${styles.positionArrow} ${currentIndex === totalDocs - 1 ? styles.disabled : ''}`}
            onClick={handleMoveDown}
            disabled={currentIndex === totalDocs - 1}
            title="Move Down"
          >
            ⬇️
          </button>
        </div>
        
        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <a 
            href={doc.slug ? `/docs/${doc.slug}` : `/docs/${doc.id || doc.title?.toLowerCase().replace(/\s+/g, '-')}`}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.iconButton}
            title="Preview Document"
          >
            👁️
          </a>
          <button
            className={styles.iconButton}
            onClick={() => onEdit(doc)}
            title="Edit Document"
          >
            ✏️
          </button>
          <button
            className={styles.iconButton}
            onClick={() => onDelete(doc.id)}
            title="Delete Document"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Document Form Component
function EnhancedDocForm({ doc, categories, docs, onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: doc?.title || '',
    content: doc?.content || '',
    category: doc?.category || '',
    position: doc?.position || 1,
    description: doc?.description || '',
    slug: doc?.slug || '',
    hasCategory: !!(doc?.category),
    draft: doc?.draft || false,
    featured: doc?.featured || false,
    tags: doc?.tags || [],
    sidebar_position: doc?.sidebar_position || null
  });
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState('');

  useEffect(() => {
    // Auto-generate slug from title
    if (formData.title && !doc) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  }, [formData.title, doc]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const token = localStorage.getItem('adminToken');
      const encodedDocId = doc ? encodeURIComponent(doc.id) : null; // URL encode the ID only if doc exists
      const url = doc ? `/api/admin/docs/${encodedDocId}` : '/api/admin/docs';
      const method = doc ? 'PUT' : 'POST';
      
      const docData = {
        ...formData,
        category: formData.hasCategory ? formData.category : '',
        position: parseInt(formData.position) || 1
      };
      
      // Include filePath for updates to help backend locate the file
      if (doc && doc.filePath) {
        docData.filePath = doc.filePath;
      }
      
      console.log(`🔄 ${method} Document:`, { url, docData });
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(docData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ Response error:`, errorText);
        
        // Try to parse as JSON, fallback to text
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to save document';
        } catch (e) {
          errorMessage = errorText.includes('<!DOCTYPE') 
            ? 'Server returned HTML instead of JSON - check server logs' 
            : errorText;
        }
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      console.log(`✅ Document saved successfully:`, responseData);
      
      onSave();
    } catch (error) {
      console.error('Failed to save doc:', error);
      setError(error.message || 'Failed to save document');
    } finally {
      setSaving(false);
    }
  };

  const generatePreview = () => {
    // Simple markdown to HTML conversion for preview
    const html = formData.content
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');
    setPreview(html);
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h3>{doc ? '✏️ Edit Document' : '➕ Create New Document'}</h3>
        <button 
          className={styles.previewButton}
          type="button"
          onClick={generatePreview}
        >
          👁️ Preview
        </button>
      </div>

      {error && <ErrorMessage message={error} onRetry={() => setError('')} />}

      <form onSubmit={handleSubmit} className={styles.enhancedForm}>
        {/* Basic Information */}
        <div className={styles.formSection}>
          <h4>📝 Basic Information</h4>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>📄 Document Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                required
                className={styles.inputField}
                placeholder="Getting Started with Documentation"
              />
            </div>
            <div className={styles.formGroup}>
              <label>🔗 URL Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className={styles.inputField}
                placeholder="getting-started-with-docs"
              />
              <div className={styles.inputHint}>
                URL-friendly version of the title (auto-generated if empty)
              </div>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>📋 Description (Optional)</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={2}
              className={styles.textareaField}
              placeholder="Brief description of this document..."
            />
          </div>
        </div>

        {/* Category and Organization */}
        <div className={styles.formSection}>
          <h4>📂 Organization</h4>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.hasCategory}
                  onChange={(e) => handleInputChange('hasCategory', e.target.checked)}
                />
                <span>📂 Assign to Category</span>
              </label>
            </div>
          </div>

          {formData.hasCategory && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label>📂 Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  required={formData.hasCategory}
                  className={styles.selectField}
                >
                  <option value="">Select a category...</option>
                  {categories.filter(cat => cat && cat.id).map(cat => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name || cat.label} ({cat.itemCount || 0} docs)
                    </option>
                  ))}
                </select>
                <div className={styles.inputHint}>
                  Documents in categories appear in the sidebar navigation
                </div>
              </div>
              <div className={styles.formGroup}>
                <label>📍 Position in Category</label>
                <div className={styles.positionControl}>
                  <input
                    type="number"
                    value={formData.position}
                    onChange={(e) => handleInputChange('position', e.target.value)}
                    min="1"
                    className={styles.inputField}
                    placeholder="1"
                  />
                  <div className={styles.positionButtons}>
                    <button 
                      type="button"
                      className={styles.positionBtn}
                      onClick={() => handleInputChange('position', '1')}
                      title="Move to Top"
                    >
                      ⬆️ Top
                    </button>
                    <button 
                      type="button"
                      className={styles.positionBtn}
                      onClick={() => {
                        const categoryDocs = docs?.filter(d => d.category === formData.category) || [];
                        const maxPosition = Math.max(...categoryDocs.map(d => d.position || 1), 0) + 1;
                        handleInputChange('position', maxPosition.toString());
                      }}
                      title="Move to Bottom"
                    >
                      ⬇️ Bottom
                    </button>
                  </div>
                </div>
                <div className={styles.inputHint}>
                  Order in the category (1 = first, higher numbers = later). Use Quick Position buttons for easy placement.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className={styles.formSection}>
          <h4>📝 Content</h4>
          <div className={styles.formGroup}>
            <label>📄 Document Content (Markdown) *</label>
            <textarea
              value={formData.content}
              onChange={(e) => handleInputChange('content', e.target.value)}
              required
              rows={20}
              className={styles.textareaField}
              placeholder="# Your Document Title

Write your documentation content here using Markdown...

## Section 1

Your content goes here.

## Section 2

More content..."
            />
            <div className={styles.inputHint}>
              Use Markdown syntax for formatting. Supports headers, lists, links, code blocks, etc.
            </div>
          </div>
        </div>

        {/* Options */}
        <div className={styles.formSection}>
          <h4>⚙️ Options</h4>
          <div className={styles.optionsGrid}>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.draft}
                onChange={(e) => handleInputChange('draft', e.target.checked)}
              />
              <span>📝 Save as Draft</span>
            </label>
            <label className={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={formData.featured}
                onChange={(e) => handleInputChange('featured', e.target.checked)}
              />
              <span>⭐ Featured Document</span>
            </label>
          </div>
        </div>

        {/* Preview */}
        {preview && (
          <div className={styles.formSection}>
            <h4>👁️ Preview</h4>
            <div 
              className={styles.contentPreview}
              dangerouslySetInnerHTML={{ __html: preview }}
            />
          </div>
        )}

        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            ❌ Cancel
          </button>
          <button type="submit" disabled={saving} className={styles.saveButton}>
            {saving ? (
              <>
                <span className={styles.saveSpinner}>⏳</span>
                {doc ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                💾 {doc ? 'Update Document' : 'Create Document'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Media Management Component
function MediaTab() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMedia();
  }, []);

  const fetchMedia = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/media', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setMedia(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch media:', error);
      setError('Failed to load media files');
      setLoading(false);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        fetchMedia();
        setSuccess('File uploaded successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to upload file');
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
      setError('Failed to upload file');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm('Are you sure you want to delete this file?')) return;
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`/api/admin/media/${filename}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        fetchMedia();
        setSuccess('File deleted successfully!');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError('Failed to delete file');
      }
    } catch (error) {
      console.error('Failed to delete file:', error);
      setError('Failed to delete file');
    }
  };

  const handleCopyPath = async (filePath, filename) => {
    try {
      await navigator.clipboard.writeText(filePath);
      setSuccess(`✅ Path copied: ${filename}`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Failed to copy path:', error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = filePath;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setSuccess(`✅ Path copied: ${filename}`);
        setTimeout(() => setSuccess(''), 2000);
      } catch (fallbackError) {
        setError('Failed to copy path to clipboard');
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCopyMarkdown = async (filePath, filename) => {
    const markdownText = `![${filename.replace(/\.[^/.]+$/, "")}](${filePath})`;
    try {
      await navigator.clipboard.writeText(markdownText);
      setSuccess(`✅ Markdown copied: ${filename}`);
      setTimeout(() => setSuccess(''), 2000);
    } catch (error) {
      console.error('Failed to copy markdown:', error);
      setError('Failed to copy markdown to clipboard');
    }
  };

  if (loading) return <LoadingSpinner message="Loading media library..." />;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>🖼️ Media Library</h2>
        <div className={styles.uploadSection}>
          <input
            type="file"
            id="fileUpload"
            onChange={handleFileUpload}
            accept="image/*,video/*,.pdf,.doc,.docx"
            style={{ display: 'none' }}
          />
          <button 
            className={styles.addButton}
            onClick={() => document.getElementById('fileUpload').click()}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <span className={styles.uploadSpinner}>⏳</span>
                Uploading...
              </>
            ) : (
              <>
                <span>📁</span>
                Upload Media
              </>
            )}
          </button>
        </div>
      </div>

      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorMessage message={error} onRetry={() => setError('')} />}

      <div className={styles.mediaGrid}>
        {media.length === 0 ? (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>📁</div>
            <h3>No Media Files</h3>
            <p>Upload your first image, document, or video to get started!</p>
            <button 
              className={styles.primaryButton}
              onClick={() => document.getElementById('fileUpload').click()}
            >
              📁 Upload First File
            </button>
          </div>
        ) : (
          media.map(file => (
            <div key={file.filename} className={styles.mediaItem}>
              {/* Media Preview */}
              <div className={styles.mediaPreview}>
                {file.path.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                  <img src={file.path} alt={file.filename} className={styles.mediaImage} />
                ) : file.path.match(/\.(mp4|webm|ogg)$/i) ? (
                  <video src={file.path} className={styles.mediaVideo} controls />
                ) : (
                  <div className={styles.mediaPlaceholder}>
                    <div className={styles.fileIcon}>
                      {file.path.match(/\.pdf$/i) ? '📄' : 
                       file.path.match(/\.(doc|docx)$/i) ? '📝' : 
                       '📎'}
                    </div>
                    <span className={styles.fileType}>
                      {file.filename.split('.').pop().toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Media Info */}
              <div className={styles.mediaInfo}>
                <p className={styles.mediaName} title={file.filename}>{file.filename}</p>
                <p className={styles.mediaSize}>{(file.size / 1024).toFixed(1)} KB</p>
                <div className={styles.mediaMeta}>
                  <span className={styles.mediaPath} title={file.path}>
                    {file.path}
                  </span>
                </div>
                
                {/* Action Buttons */}
                <div className={styles.mediaActions}>
                  <a
                    href={file.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.viewButton}
                    title="View/Download file"
                  >
                    👁️ View
                  </a>
                  <button
                    className={styles.copyButton}
                    onClick={() => handleCopyPath(file.path, file.filename)}
                    title="Copy file path"
                  >
                    🔗 Copy Link
                  </button>
                  <button
                    className={styles.copyButton}
                    onClick={() => handleCopyMarkdown(file.path, file.filename)}
                    title="Copy markdown image syntax"
                  >
                    📝 Copy Markdown
                  </button>
                  <button 
                    onClick={() => handleDelete(file.filename)}
                    className={styles.deleteButton}
                    title="Delete file"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      
      {/* Usage Tips */}
      <div className={styles.mediaTips}>
        <h3>💡 Usage Tips</h3>
        <div className={styles.tipsGrid}>
          <div className={styles.tip}>
            <strong>🔗 Copy Link:</strong> Get the direct file path for use in HTML or custom components
          </div>
          <div className={styles.tip}>
            <strong>📝 Copy Markdown:</strong> Get ready-to-use markdown image syntax for your documents
          </div>
          <div className={styles.tip}>
            <strong>📁 Supported Files:</strong> Images (JPG, PNG, GIF), Videos (MP4, WebM), Documents (PDF, DOC)
          </div>
        </div>
      </div>
    </div>
  );
}

// Authors Management Component
function AuthorsTab() {
  const [authors, setAuthors] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAuthor, setEditingAuthor] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [selectedAuthors, setSelectedAuthors] = useState(new Set());
  const [showPreview, setShowPreview] = useState(null);

  useEffect(() => {
    fetchAuthors();
  }, []);

  const fetchAuthors = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/authors', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setAuthors(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch authors:', error);
      setLoading(false);
    }
  };

  const handleEdit = (authorKey) => {
    setEditingAuthor({
      ...authors[authorKey],
      key: authorKey
    });
    setShowForm(true);
  };

  const handleDelete = async (authorKey) => {
    if (window.confirm('Are you sure you want to delete this author?')) {
      try {
        const token = localStorage.getItem('adminToken');
        await fetch(`/api/admin/authors/${authorKey}`, { 
          method: 'DELETE',
          headers: { 'Authorization': `Bearer ${token}` }
        });
        fetchAuthors();
      } catch (error) {
        console.error('Error deleting author:', error);
      }
    }
  };

  const handleBulkDelete = async () => {
    if (selectedAuthors.size === 0) return;
    
    if (window.confirm(`Are you sure you want to delete ${selectedAuthors.size} author(s)? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('adminToken');
        const promises = Array.from(selectedAuthors).map(authorKey =>
          fetch(`/api/admin/authors/${authorKey}`, { 
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
          })
        );
        await Promise.all(promises);
        setSelectedAuthors(new Set());
        fetchAuthors();
      } catch (error) {
        console.error('Error deleting authors:', error);
      }
    }
  };

  const handleSelectAuthor = (authorKey, checked) => {
    const newSelected = new Set(selectedAuthors);
    if (checked) {
      newSelected.add(authorKey);
    } else {
      newSelected.delete(authorKey);
    }
    setSelectedAuthors(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedAuthors.size === filteredAuthors.length) {
      setSelectedAuthors(new Set());
    } else {
      setSelectedAuthors(new Set(filteredAuthors.map(([key]) => key)));
    }
  };

  if (loading) return <div className={styles.loading}>Loading authors...</div>;

  // Filter and sort authors
  const authorsArray = Object.entries(authors);
  
  const filteredAuthors = authorsArray.filter(([key, author]) => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      author.name?.toLowerCase().includes(searchLower) ||
      author.email?.toLowerCase().includes(searchLower) ||
      author.title?.toLowerCase().includes(searchLower) ||
      author.url?.toLowerCase().includes(searchLower) ||
      key.toLowerCase().includes(searchLower)
    );
  });

  const sortedAuthors = [...filteredAuthors].sort(([keyA, authorA], [keyB, authorB]) => {
    let aValue = '';
    let bValue = '';

    switch (sortBy) {
      case 'name':
        aValue = authorA.name || '';
        bValue = authorB.name || '';
        break;
      case 'email':
        aValue = authorA.email || '';
        bValue = authorB.email || '';
        break;
      case 'title':
        aValue = authorA.title || '';
        bValue = authorB.title || '';
        break;
      case 'key':
      default:
        aValue = keyA;
        bValue = keyB;
        break;
    }

    const comparison = aValue.localeCompare(bValue);
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <div className={styles.headerLeft}>
          <h2>👥 Author Management</h2>
          <div className={styles.statsBar}>
            <div className={styles.stat}>
              <span className={styles.statValue}>{authorsArray.length}</span>
              <span className={styles.statLabel}>Total Authors</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {authorsArray.filter(([, author]) => author.image_url).length}
              </span>
              <span className={styles.statLabel}>With Avatar</span>
            </div>
            <div className={styles.stat}>
              <span className={styles.statValue}>
                {authorsArray.filter(([, author]) => author.url).length}
              </span>
              <span className={styles.statLabel}>With Website</span>
            </div>
          </div>
        </div>
        
        <div className={styles.tabActions}>
          <button 
            className={styles.addButton}
            onClick={() => {setShowForm(true); setEditingAuthor(null);}}
          >
            ➕ Add New Author
          </button>
          <a 
            href="/blog" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.previewButton}
          >
            👁️ View Blog
          </a>
        </div>
      </div>

      {!showForm && (
        <div className={styles.tableControls}>
          {/* Search Bar */}
          <div className={styles.searchWrapper}>
            <div className={styles.searchBar}>
              <span className={styles.searchIcon}>🔍</span>
              <input
                type="text"
                placeholder="Search authors by name, email, title, website, or key..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={styles.searchInput}
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className={styles.clearSearch}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Controls Row */}
          <div className={styles.controlsRow}>
            {/* Sort Controls */}
            <div className={styles.sortControls}>
              <span className={styles.controlLabel}>Sort by:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="name">Name</option>
                <option value="email">Email</option>
                <option value="title">Title</option>
                <option value="key">Author Key</option>
              </select>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className={styles.sortOrder}
                title={`Sort ${sortOrder === 'asc' ? 'Descending' : 'Ascending'}`}
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>

            {/* Bulk Actions */}
            {selectedAuthors.size > 0 && (
              <div className={styles.bulkActions}>
                <span className={styles.selectedCount}>
                  {selectedAuthors.size} selected
                </span>
                <button
                  onClick={handleBulkDelete}
                  className={styles.bulkDeleteBtn}
                >
                  🗑️ Delete Selected
                </button>
              </div>
            )}

            {/* Results Info */}
            <div className={styles.resultsInfo}>
              Showing {sortedAuthors.length} of {authorsArray.length} authors
            </div>
          </div>
        </div>
      )}

      {showForm ? (
        <AuthorForm 
          author={editingAuthor}
          onSave={() => {setShowForm(false); fetchAuthors();}}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <div className={styles.authorsList}>
          {sortedAuthors.length === 0 ? (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>👤</div>
              <h3>No authors found</h3>
              <p>
                {authorsArray.length === 0 
                  ? "Add your first author to get started!" 
                  : "Try adjusting your search terms."}
              </p>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div className={styles.authorTableHeader}>
                <div className={styles.selectColumn}>
                  <input
                    type="checkbox"
                    checked={selectedAuthors.size === sortedAuthors.length && sortedAuthors.length > 0}
                    onChange={handleSelectAll}
                  />
                </div>
                <div className={styles.avatarColumn}>Avatar</div>
                <div className={styles.nameColumn}>Name</div>
                <div className={styles.emailColumn}>Email</div>
                <div className={styles.titleColumn}>Title</div>
                <div className={styles.websiteColumn}>Website</div>
                <div className={styles.actionsColumn}>Actions</div>
              </div>

              {/* Authors List */}
              {sortedAuthors.map(([authorKey, author]) => (
                <div key={authorKey} className={styles.authorTableRow}>
                  <div className={styles.selectColumn}>
                    <input
                      type="checkbox"
                      checked={selectedAuthors.has(authorKey)}
                      onChange={(e) => handleSelectAuthor(authorKey, e.target.checked)}
                    />
                  </div>
                  
                  <div className={styles.avatarColumn}>
                    {author.image_url ? (
                      <img 
                        src={author.image_url} 
                        alt={author.name}
                        className={styles.authorAvatarLarge}
                        onClick={() => setShowPreview({...author, key: authorKey})}
                        style={{cursor: 'pointer'}}
                      />
                    ) : (
                      <div className={styles.avatarPlaceholder}>
                        {author.name?.charAt(0)?.toUpperCase() || '👤'}
                      </div>
                    )}
                  </div>
                  
                  <div className={styles.nameColumn}>
                    <div className={styles.authorName}>
                      <h4>{author.name}</h4>
                      <div className={styles.authorKey}>@{authorKey}</div>
                    </div>
                  </div>
                  
                  <div className={styles.emailColumn}>
                    {author.email && (
                      <a href={`mailto:${author.email}`} className={styles.emailLink}>
                        {author.email}
                      </a>
                    )}
                    {!author.email && <span className={styles.noData}>—</span>}
                  </div>
                  
                  <div className={styles.titleColumn}>
                    {author.title || <span className={styles.noData}>—</span>}
                  </div>
                  
                  <div className={styles.websiteColumn}>
                    {author.url ? (
                      <a 
                        href={author.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className={styles.websiteLink}
                      >
                        🔗 Visit
                      </a>
                    ) : (
                      <span className={styles.noData}>—</span>
                    )}
                  </div>
                  
                  <div className={styles.actionsColumn}>
                    <div className={styles.authorActions}>
                      <button
                        onClick={() => setShowPreview({...author, key: authorKey})}
                        className={styles.previewBtn}
                        title="Preview Author"
                      >
                        👁️
                      </button>
                      <a 
                        href={`/blog/authors/${author.key || authorKey}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.viewBtn}
                        title="View Author Profile"
                      >
                        🔗
                      </a>
                      <button 
                        onClick={() => handleEdit(authorKey)} 
                        className={styles.editBtn}
                        title="Edit Author"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => handleDelete(authorKey)} 
                        className={styles.deleteBtn}
                        title="Delete Author"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Author Preview Modal */}
      {showPreview && (
        <div className={styles.previewModal} onClick={() => setShowPreview(null)}>
          <div className={styles.previewContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.previewHeader}>
              <h3>👤 Author Preview</h3>
              <button onClick={() => setShowPreview(null)}>✕</button>
            </div>
            <div className={styles.authorPreviewBody}>
              <div className={styles.authorPreviewInfo}>
                {showPreview.image_url && (
                  <img 
                    src={showPreview.image_url} 
                    alt={showPreview.name}
                    className={styles.authorPreviewAvatar}
                  />
                )}
                <div className={styles.authorPreviewDetails}>
                  <h2>{showPreview.name}</h2>
                  <div className={styles.authorPreviewKey}>@{showPreview.key}</div>
                  {showPreview.title && (
                    <div className={styles.authorPreviewTitle}>{showPreview.title}</div>
                  )}
                  {showPreview.email && (
                    <div className={styles.authorPreviewContact}>
                      <strong>Email:</strong> 
                      <a href={`mailto:${showPreview.email}`}>{showPreview.email}</a>
                    </div>
                  )}
                  {showPreview.url && (
                    <div className={styles.authorPreviewContact}>
                      <strong>Website:</strong> 
                      <a href={showPreview.url} target="_blank" rel="noopener noreferrer">
                        {showPreview.url}
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className={styles.previewFooter}>
              <a 
                href={`/blog/authors/${showPreview.key}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.fullViewBtn}
              >
                🔗 View Author Profile
              </a>
              <button 
                onClick={() => {
                  setShowPreview(null);
                  handleEdit(showPreview.key);
                }}
                className={styles.editFromPreviewBtn}
              >
                ✏️ Edit Author
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Admin Page Component
function AdminPageWrapper() {
  return (
    <Layout
      title="Docusaurus Admin Panel"
      description="Comprehensive admin panel for Docusaurus documentation sites"
      noFooter={true}
    >
      <AuthProvider>
        <AdminContent />
      </AuthProvider>
    </Layout>
  );
}

export default AdminPageWrapper;

// Blog Form Component
function BlogForm({ blog, onSave, onCancel }) {
  const [title, setTitle] = useState(blog?.title || '');
  const [content, setContent] = useState(blog?.content || '');
  const [author, setAuthor] = useState(blog?.author || '');
  const [tags, setTags] = useState(blog?.tags?.join(', ') || '');
  const [published, setPublished] = useState(blog?.published !== false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const postData = {
      title,
      content,
      author,
      tags: tags.split(',').map(tag => tag.trim()).filter(Boolean),
      published
    };

    try {
      const token = localStorage.getItem('adminToken');
      const url = blog ? `/api/admin/blogs/${blog.id}` : '/api/admin/blogs';
      const method = blog ? 'PUT' : 'POST';
      
      await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(postData)
      });
      
      onSave();
    } catch (error) {
      console.error('Failed to save blog:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.contentForm}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Title *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Author *</label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Tags (comma separated)</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="react, javascript, tutorial"
            className={styles.inputField}
          />
        </div>

        <div className={styles.formGroup}>
          <label>Content *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            rows={15}
            className={styles.textareaField}
            placeholder="Write your blog post content in Markdown..."
          />
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={published}
              onChange={(e) => setPublished(e.target.checked)}
            />
            Publish immediately
          </label>
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={styles.saveButton}>
            {saving ? 'Saving...' : (blog ? 'Update' : 'Create')} Post
          </button>
        </div>
      </form>
    </div>
  );
}

// Documentation Form Component
// Replaced with EnhancedDocForm above

// Author Form Component
function AuthorForm({ author, onSave, onCancel }) {
  const [name, setName] = useState(author?.name || '');
  const [title, setTitle] = useState(author?.title || '');
  const [description, setDescription] = useState(author?.description || '');
  const [imageUrl, setImageUrl] = useState(author?.image_url || '');
  const [url, setUrl] = useState(author?.url || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    const authorData = {
      name,
      title,
      description,
      image_url: imageUrl,
      url
    };

    try {
      const token = localStorage.getItem('adminToken');
      const apiUrl = author ? `/api/admin/authors/${author.key}` : '/api/admin/authors';
      const method = author ? 'PUT' : 'POST';
      
      await fetch(apiUrl, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(authorData)
      });
      
      onSave();
    } catch (error) {
      console.error('Failed to save author:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <form onSubmit={handleSubmit} className={styles.contentForm}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Software Engineer, Writer, etc."
              className={styles.inputField}
            />
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>Avatar URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
              className={styles.inputField}
            />
          </div>
          <div className={styles.formGroup}>
            <label>Website URL</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={styles.inputField}
            />
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>Bio</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className={styles.textareaField}
            placeholder="Tell us about this author..."
          />
        </div>

        <div className={styles.formActions}>
          <button type="button" onClick={onCancel} className={styles.cancelButton}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={styles.saveButton}>
            {saving ? 'Saving...' : (author ? 'Update' : 'Add')} Author
          </button>
        </div>
      </form>
    </div>
  );
}

// Pages Management Component
function PagesTab() {
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPages();
  }, []);

  const fetchPages = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/pages', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setPages(data);
      } else {
        setError('Failed to fetch pages');
      }
    } catch (error) {
      console.error('Failed to fetch pages:', error);
      setError('Failed to fetch pages');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (pageData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingPage 
        ? `/api/admin/pages/${editingPage.id}` 
        : '/api/admin/pages';
      const method = editingPage ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(pageData)
      });
      
      if (response.ok) {
        setSuccess(editingPage ? 'Page updated successfully!' : 'Page created successfully!');
        setShowForm(false);
        setEditingPage(null);
        fetchPages();
      } else {
        setError('Failed to save page');
      }
    } catch (error) {
      console.error('Failed to save page:', error);
      setError('Failed to save page');
    }
  };

  if (loading) return <LoadingSpinner message="Loading pages..." />;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>📄 Pages Management</h2>
        <button 
          className={styles.addButton}
          onClick={() => {
            setEditingPage(null);
            setShowForm(true);
          }}
        >
          + New Page
        </button>
      </div>

      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorMessage message={error} onRetry={() => setError('')} />}

      {showForm ? (
        <PageForm
          page={editingPage}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingPage(null);
          }}
        />
      ) : (
        <div className={styles.itemsList}>
          {pages.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>📄 No Custom Pages Yet</h3>
              <p>Create your first custom page to get started!</p>
              <button 
                className={styles.addButton}
                onClick={() => setShowForm(true)}
              >
                + Create First Page
              </button>
            </div>
          ) : (
            <div className={styles.pagesGrid}>
              {pages.map(page => (
                <div key={page.id} className={styles.pageCard}>
                  <div className={styles.pageInfo}>
                    <h3>{page.title}</h3>
                    <p className={styles.pagePath}>{page.path}</p>
                    <span className={styles.pageDate}>
                      Updated: {new Date(page.lastModified).toLocaleDateString()}
                    </span>
                  </div>
                  <div className={styles.itemActions}>
                    <button 
                      className={styles.editButton}
                      onClick={() => {
                        setEditingPage(page);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                    <a 
                      href={page.path} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.viewButton}
                    >
                      View
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Page Form Component
function PageForm({ page, onSave, onCancel }) {
  const [title, setTitle] = useState(page?.title || '');
  const [content, setContent] = useState(page?.content || '');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!title.trim()) {
      newErrors.title = 'Page title is required';
    }
    
    if (!content.trim()) {
      newErrors.content = 'Page content is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      await onSave({
        title: title.trim(),
        content: content.trim()
      });
    } catch (error) {
      console.error('Failed to save page:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h3>{page ? '✏️ Edit Page' : '📄 Create New Page'}</h3>
        <button 
          type="button" 
          onClick={onCancel}
          className={styles.cancelButton}
        >
          ❌ Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.contentForm}>
        <div className={styles.formGroup}>
          <label>📝 Page Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={`${styles.inputField} ${errors.title ? styles.inputError : ''}`}
            placeholder="About Us, Contact, Services, etc."
          />
          {errors.title && <span className={styles.errorText}>{errors.title}</span>}
          <div className={styles.inputHint}>
            This will be used as the page title and URL slug
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>📄 Page Content *</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className={`${styles.textareaField} ${errors.content ? styles.inputError : ''}`}
            rows={20}
            placeholder="Write your page content using Markdown...

# Welcome to Our Company

We are a **leading provider** of innovative solutions.

## Our Services

- Service 1
- Service 2
- Service 3

## Contact Us

Email: contact@example.com
Phone: (555) 123-4567"
          />
          {errors.content && <span className={styles.errorText}>{errors.content}</span>}
          <div className={styles.markdownHint}>
            💡 <strong>Tip:</strong> Use Markdown formatting for headings, lists, links, and styling.
          </div>
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? (
              <>
                <span className={styles.saveSpinner}>⏳</span>
                {page ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <span>💾</span>
                {page ? 'Update Page' : 'Create Page'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Categories Management Component  
function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/categories', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        const validCategories = (data.categories || []).filter(cat => cat && cat.id);
        setCategories(validCategories);
      } else {
        setError('Failed to fetch categories');
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
      setError('Failed to fetch categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (categoryData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const url = editingCategory 
        ? `/api/admin/categories/${editingCategory.id}` 
        : '/api/admin/categories';
      const method = editingCategory ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(categoryData)
      });
      
      if (response.ok) {
        setSuccess(editingCategory ? 'Category updated successfully!' : 'Category created successfully!');
        setShowForm(false);
        setEditingCategory(null);
        fetchCategories();
      } else {
        setError('Failed to save category');
      }
    } catch (error) {
      console.error('Failed to save category:', error);
      setError('Failed to save category');
    }
  };

  const handleMoveCategoryPosition = async (categoryId, direction) => {
    console.log(`🔄 CATEGORY Frontend: Moving category ${categoryId} ${direction}`);
    
    try {
      const token = localStorage.getItem('adminToken');
      console.log(`📡 Making category position request to: /api/admin/categories/move-position`);
      
      const response = await fetch('/api/admin/categories/move-position', {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          categoryId: categoryId,
          direction: direction
        })
      });
      
      console.log(`📡 Category API response status: ${response.status}`);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log(`✅ Category move success response:`, responseData);
        
        if (responseData.moved) {
          fetchCategories(); // Refresh the category list
          setSuccess(`Category moved ${direction} successfully!`);
          setTimeout(() => setSuccess(''), 2000);
        } else {
          setSuccess(responseData.message || `Category is at ${direction === 'up' ? 'top' : 'bottom'}`);
          setTimeout(() => setSuccess(''), 2000);
        }
      } else {
        const errorText = await response.text();
        console.error(`❌ Category move error:`, errorText);
        
        let errorMessage;
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || 'Failed to move category';
        } catch (e) {
          errorMessage = errorText.includes('<!DOCTYPE') 
            ? 'Server returned HTML instead of JSON - check server logs' 
            : errorText;
        }
        setError(errorMessage);
        setTimeout(() => setError(''), 4000);
      }
    } catch (error) {
      console.error('❌ Category move frontend error:', error);
      setError('Failed to move category position');
      setTimeout(() => setError(''), 3000);
    }
  };

  if (loading) return <LoadingSpinner message="Loading categories..." />;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>🏷️ Categories Management</h2>
        <button 
          className={styles.addButton}
          onClick={() => {
            setEditingCategory(null);
            setShowForm(true);
          }}
        >
          + New Category
        </button>
      </div>

      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorMessage message={error} onRetry={() => setError('')} />}

      {showForm ? (
        <CategoryForm
          category={editingCategory}
          onSave={handleSave}
          onCancel={() => {
            setShowForm(false);
            setEditingCategory(null);
          }}
        />
      ) : (
        <div className={styles.categoriesContainer}>
          {categories.length === 0 ? (
            <div className={styles.emptyState}>
              <h3>🏷️ No Categories Yet</h3>
              <p>Create categories to organize your documentation!</p>
              <button 
                className={styles.addButton}
                onClick={() => setShowForm(true)}
              >
                + Create First Category
              </button>
            </div>
          ) : (
            <div className={styles.categoriesGrid}>
              {categories.map(category => (
                <div key={category.id} className={styles.categoryCard}>
                  <div className={styles.categoryIcon}>
                    {category.emoji || '📁'}
                  </div>
                  <div className={styles.categoryInfo}>
                    <h3>{category.label}</h3>
                    <p className={styles.categorySlug}>{category.id}</p>
                    <p className={styles.categoryDesc}>{category.description || 'No description'}</p>
                    <span className={styles.categoryCount}>{category.itemCount} items</span>
                  </div>
                  <div className={styles.itemActions}>
                    <div className={styles.positionControls}>
                      <button 
                        className={`${styles.positionArrow} ${categories.findIndex(c => c && c.id === category.id) === 0 ? styles.disabled : ''}`}
                        onClick={() => handleMoveCategoryPosition(category.id, 'up')}
                        disabled={categories.findIndex(c => c && c.id === category.id) === 0}
                        title="Move up"
                      >
                        ⬆️
                      </button>
                      <button 
                        className={`${styles.positionArrow} ${categories.findIndex(c => c && c.id === category.id) === categories.length - 1 ? styles.disabled : ''}`}
                        onClick={() => handleMoveCategoryPosition(category.id, 'down')}
                        disabled={categories.findIndex(c => c && c.id === category.id) === categories.length - 1}
                        title="Move down"
                      >
                        ⬇️
                      </button>
                    </div>
                    <button 
                      className={styles.editButton}
                      onClick={() => {
                        setEditingCategory(category);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          <div className={styles.categoryHints}>
            <h4>💡 Category Tips</h4>
            <div className={styles.hintsList}>
              <div className={styles.hint}>
                <strong>Organization:</strong> Categories help organize your documentation into logical sections
              </div>
              <div className={styles.hint}>
                <strong>Navigation:</strong> Categories appear in the sidebar navigation automatically
              </div>
              <div className={styles.hint}>
                <strong>Position:</strong> Use the position field to control the order of categories
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Category Form Component
function CategoryForm({ category, onSave, onCancel }) {
  const [name, setName] = useState(category?.id || '');
  const [label, setLabel] = useState(category?.label || '');
  const [description, setDescription] = useState(category?.description || '');
  const [position, setPosition] = useState(category?.position || 1);
  const [emoji, setEmoji] = useState(category?.emoji || '📁');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!name.trim()) {
      newErrors.name = 'Category name is required';
    }
    
    if (!label.trim()) {
      newErrors.label = 'Category label is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      await onSave({
        name: name.trim(),
        label: label.trim(),
        description: description.trim(),
        position: parseInt(position),
        emoji
      });
    } catch (error) {
      console.error('Failed to save category:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.formContainer}>
      <div className={styles.formHeader}>
        <h3>{category ? '✏️ Edit Category' : '🏷️ Create New Category'}</h3>
        <button 
          type="button" 
          onClick={onCancel}
          className={styles.cancelButton}
        >
          ❌ Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className={styles.contentForm}>
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>📝 Category Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={`${styles.inputField} ${errors.name ? styles.inputError : ''}`}
              placeholder="getting-started, tutorials, guides"
              disabled={!!category}
            />
            {errors.name && <span className={styles.errorText}>{errors.name}</span>}
            <div className={styles.inputHint}>
              Used for URL and folder name (cannot be changed after creation)
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>🏷️ Display Label *</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className={`${styles.inputField} ${errors.label ? styles.inputError : ''}`}
              placeholder="Getting Started, Tutorials, Guides"
            />
            {errors.label && <span className={styles.errorText}>{errors.label}</span>}
            <div className={styles.inputHint}>
              Shown in navigation and headings
            </div>
          </div>
        </div>

        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label>🎨 Icon/Emoji</label>
            <input
              type="text"
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className={styles.inputField}
              placeholder="📚, 🛠️, 📖, 🚀"
              maxLength={2}
            />
            <div className={styles.inputHint}>
              Single emoji to represent this category
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>📊 Position</label>
            <input
              type="number"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              className={styles.inputField}
              min="1"
            />
            <div className={styles.inputHint}>
              Order in navigation (lower numbers appear first)
            </div>
          </div>
        </div>

        <div className={styles.formGroup}>
          <label>📄 Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className={styles.textareaField}
            rows={3}
            placeholder="Brief description of what this category contains..."
          />
          <div className={styles.inputHint}>
            Optional description for better organization
          </div>
        </div>

        <div className={styles.formActions}>
          <button 
            type="button" 
            onClick={onCancel}
            className={styles.cancelButton}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? (
              <>
                <span className={styles.saveSpinner}>⏳</span>
                {category ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <span>💾</span>
                {category ? 'Update Category' : 'Create Category'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Navigation Management Component
// Enhanced Navigation/Menu Management Component with Header & Footer
function MenusTab() {
  const [activeSection, setActiveSection] = useState('header');
  const [menuItems, setMenuItems] = useState([]);
  const [footerData, setFooterData] = useState({ links: [], copyright: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showAddFooterGroup, setShowAddFooterGroup] = useState(false);

  useEffect(() => {
    fetchNavigation();
    fetchFooter();
  }, []);

  const fetchNavigation = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }
      
      const response = await fetch('/api/admin/navigation', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Navigation data received:', data);
        setMenuItems(data.items || []);
      } else {
        const errorData = await response.json();
        console.error('Navigation fetch failed:', errorData);
        setError(`Failed to load navigation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to fetch navigation:', error);
      setError('Failed to load navigation items. Check your connection.');
    }
  };

  const fetchFooter = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) return;
      
      const response = await fetch('/api/admin/footer', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Footer data received:', data);
        setFooterData(data);
      }
    } catch (error) {
      console.error('Failed to fetch footer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMenu = async () => {
    setSaving(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      console.log('Saving navigation items:', menuItems);
      
      const response = await fetch('/api/admin/navigation', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ items: menuItems })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Navigation save response:', data);
        setSuccess(`Header navigation updated successfully! Changes will be applied after server restart.`);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const errorData = await response.json();
        console.error('Navigation save failed:', errorData);
        setError(`Failed to save navigation: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save navigation:', error);
      setError('Failed to save navigation. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveFooter = async () => {
    setSaving(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      console.log('Saving footer data:', footerData);
      
      const response = await fetch('/api/admin/footer', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(footerData)
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Footer save response:', data);
        setSuccess(`Footer updated successfully! Changes will be applied after server restart.`);
        setTimeout(() => setSuccess(''), 5000);
      } else {
        const errorData = await response.json();
        console.error('Footer save failed:', errorData);
        setError(`Failed to save footer: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Failed to save footer:', error);
      setError('Failed to save footer. Check your connection.');
    } finally {
      setSaving(false);
    }
  };

  const addMenuItem = (item) => {
    const newItem = { 
      ...item, 
      id: Date.now(),
      position: menuItems.length + 1
    };
    setMenuItems([...menuItems, newItem]);
    setShowAddForm(false);
    setSuccess('Menu item added successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const updateMenuItem = (id, updatedItem) => {
    setMenuItems(menuItems.map(item => 
      item.id === id ? { ...item, ...updatedItem } : item
    ));
  };

  const deleteMenuItem = (id) => {
    if (!confirm('Are you sure you want to delete this menu item?')) return;
    setMenuItems(menuItems.filter(item => item.id !== id));
    setSuccess('Menu item deleted successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const moveMenuItem = (id, direction) => {
    const currentIndex = menuItems.findIndex(item => item.id === id);
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (newIndex >= 0 && newIndex < menuItems.length) {
      const newMenuItems = [...menuItems];
      [newMenuItems[currentIndex], newMenuItems[newIndex]] = 
        [newMenuItems[newIndex], newMenuItems[currentIndex]];
      
      // Update positions
      newMenuItems.forEach((item, index) => {
        item.position = index + 1;
      });
      
      setMenuItems(newMenuItems);
    }
  };

  // Footer management functions
  const addFooterGroup = (group) => {
    const newFooterData = {
      ...footerData,
      links: [...footerData.links, group]
    };
    setFooterData(newFooterData);
    setShowAddFooterGroup(false);
    setSuccess('Footer group added successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const updateFooterGroup = (groupIndex, updatedGroup) => {
    const newLinks = [...footerData.links];
    newLinks[groupIndex] = updatedGroup;
    setFooterData({...footerData, links: newLinks});
  };

  const deleteFooterGroup = (groupIndex) => {
    if (!confirm('Are you sure you want to delete this footer group?')) return;
    const newLinks = footerData.links.filter((_, index) => index !== groupIndex);
    setFooterData({...footerData, links: newLinks});
    setSuccess('Footer group deleted successfully!');
    setTimeout(() => setSuccess(''), 3000);
  };

  const addFooterItem = (groupIndex, item) => {
    const newLinks = [...footerData.links];
    newLinks[groupIndex].items.push(item);
    setFooterData({...footerData, links: newLinks});
  };

  const deleteFooterItem = (groupIndex, itemIndex) => {
    const newLinks = [...footerData.links];
    newLinks[groupIndex].items = newLinks[groupIndex].items.filter((_, index) => index !== itemIndex);
    setFooterData({...footerData, links: newLinks});
  };

  if (loading) return <LoadingSpinner message="Loading navigation & footer..." />;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>🧭 Navigation & Footer Management</h2>
        <div className={styles.sectionTabs}>
          <button 
            className={`${styles.sectionTab} ${activeSection === 'header' ? styles.activeSectionTab : ''}`}
            onClick={() => setActiveSection('header')}
          >
            📋 Header Navigation
          </button>
          <button 
            className={`${styles.sectionTab} ${activeSection === 'footer' ? styles.activeSectionTab : ''}`}
            onClick={() => setActiveSection('footer')}
          >
            🦶 Footer Links
          </button>
        </div>
        <div className={styles.tabActions}>
          <a 
            href="/" 
            target="_blank" 
            rel="noopener noreferrer"
            className={styles.previewButton}
          >
            👁️ Preview Site
          </a>
        </div>
      </div>

      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorMessage message={error} onRetry={() => setError('')} />}

      {/* Header Navigation Section */}
      {activeSection === 'header' && (
        <>
          <div className={styles.sectionHeader}>
            <h3>📋 Header Navigation Menu</h3>
            <button 
              className={styles.addButton}
              onClick={() => setShowAddForm(true)}
            >
              ➕ Add Menu Item
            </button>
          </div>

          {showAddForm && (
            <EnhancedMenuItemForm 
              onSave={addMenuItem}
              onCancel={() => setShowAddForm(false)}
            />
          )}

          <div className={styles.navigationList}>
            {menuItems.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🧭</div>
                <h3>No Navigation Items</h3>
                <p>Create your first navigation menu item to get started.</p>
                <button 
                  className={styles.primaryButton}
                  onClick={() => setShowAddForm(true)}
                >
                  ➕ Add First Menu Item
                </button>
              </div>
            ) : (
              <>
                <div className={styles.navigationHeader}>
                  <span>📋 Menu Items ({menuItems.length})</span>
                  <div className={styles.navigationGuide}>
                    <span className={styles.guideText}>💡 Use ↑↓ buttons to reorder items</span>
                  </div>
                </div>
                
                {menuItems
                  .sort((a, b) => (a.position || 0) - (b.position || 0))
                  .map((item, index) => (
                    <EnhancedNavigationItem
                      key={item.id}
                      item={item}
                      index={index}
                      totalItems={menuItems.length}
                      onUpdate={updateMenuItem}
                      onDelete={deleteMenuItem}
                      onMove={moveMenuItem}
                    />
                  ))}
                
                <div className={styles.navigationActions}>
                  <button 
                    className={styles.saveButton}
                    onClick={handleSaveMenu}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className={styles.saveSpinner}>⏳</span>
                        Saving Navigation...
                      </>
                    ) : (
                      <>
                        💾 Save Header Navigation
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Footer Links Section */}
      {activeSection === 'footer' && (
        <>
          <div className={styles.sectionHeader}>
            <h3>🦶 Footer Links Management</h3>
            <button 
              className={styles.addButton}
              onClick={() => setShowAddFooterGroup(true)}
            >
              ➕ Add Footer Group
            </button>
          </div>

          {showAddFooterGroup && (
            <FooterGroupForm 
              onSave={addFooterGroup}
              onCancel={() => setShowAddFooterGroup(false)}
            />
          )}

          {/* Copyright Section */}
          <div className={styles.copyrightSection}>
            <label>📝 Copyright Text</label>
            <input
              type="text"
              value={footerData.copyright}
              onChange={(e) => setFooterData({...footerData, copyright: e.target.value})}
              className={styles.inputField}
              placeholder="Copyright © 2025 Your Company Name"
            />
          </div>

          <div className={styles.footerGroups}>
            {footerData.links.length === 0 ? (
              <div className={styles.emptyState}>
                <div className={styles.emptyIcon}>🦶</div>
                <h3>No Footer Groups</h3>
                <p>Create your first footer link group to get started.</p>
                <button 
                  className={styles.primaryButton}
                  onClick={() => setShowAddFooterGroup(true)}
                >
                  ➕ Add First Footer Group
                </button>
              </div>
            ) : (
              <>
                {footerData.links.map((group, groupIndex) => (
                  <FooterGroupEditor
                    key={groupIndex}
                    group={group}
                    groupIndex={groupIndex}
                    onUpdate={updateFooterGroup}
                    onDelete={deleteFooterGroup}
                    onAddItem={addFooterItem}
                    onDeleteItem={deleteFooterItem}
                  />
                ))}
                
                <div className={styles.navigationActions}>
                  <button 
                    className={styles.saveButton}
                    onClick={handleSaveFooter}
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <span className={styles.saveSpinner}>⏳</span>
                        Saving Footer...
                      </>
                    ) : (
                      <>
                        💾 Save Footer Links
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

// Enhanced Navigation Item Component
function EnhancedNavigationItem({ item, index, totalItems, onUpdate, onDelete, onMove }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(item);

  const handleSave = () => {
    onUpdate(item.id, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(item);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className={styles.navigationItem}>
        <div className={styles.navItemEditor}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>🏷️ Label</label>
              <input
                type="text"
                value={editData.label}
                onChange={(e) => setEditData({...editData, label: e.target.value})}
                className={styles.inputField}
                placeholder="Menu Label"
              />
            </div>
            <div className={styles.formGroup}>
              <label>🔗 URL</label>
              <input
                type="text"
                value={editData.url}
                onChange={(e) => setEditData({...editData, url: e.target.value})}
                className={styles.inputField}
                placeholder="/docs or https://example.com"
              />
            </div>
          </div>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label>📂 Type</label>
              <select
                value={editData.type || 'internal'}
                onChange={(e) => setEditData({...editData, type: e.target.value})}
                className={styles.selectField}
              >
                <option value="internal">📄 Internal Link</option>
                <option value="external">🌐 External Link</option>
                <option value="dropdown">📋 Dropdown Menu</option>
              </select>
            </div>
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={editData.newTab || false}
                  onChange={(e) => setEditData({...editData, newTab: e.target.checked})}
                />
                <span>🔗 Open in New Tab</span>
              </label>
            </div>
          </div>
          <div className={styles.editorActions}>
            <button className={styles.cancelButton} onClick={handleCancel}>
              ❌ Cancel
            </button>
            <button className={styles.saveButton} onClick={handleSave}>
              ✅ Save Changes
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.navigationItem}>
      <div className={styles.navItemContent}>
        <div className={styles.navItemInfo}>
          <div className={styles.navItemHeader}>
            <span className={styles.navItemLabel}>🏷️ {item.label}</span>
            <div className={styles.navItemBadges}>
              <span className={styles.navItemType}>
                {item.type === 'external' ? '🌐 External' : 
                 item.type === 'dropdown' ? '📋 Dropdown' : '📄 Internal'}
              </span>
              {item.newTab && <span className={styles.navItemBadge}>↗️ New Tab</span>}
            </div>
          </div>
          <div className={styles.navItemUrl}>🔗 {item.url}</div>
        </div>
        
        <div className={styles.navItemActions}>
          <button
            className={styles.iconButton}
            onClick={() => onMove(item.id, 'up')}
            disabled={index === 0}
            title="Move Up"
          >
            ⬆️
          </button>
          <button
            className={styles.iconButton}
            onClick={() => onMove(item.id, 'down')}
            disabled={index === totalItems - 1}
            title="Move Down"
          >
            ⬇️
          </button>
          <button
            className={styles.iconButton}
            onClick={() => setIsEditing(true)}
            title="Edit"
          >
            ✏️
          </button>
          <button
            className={styles.iconButton}
            onClick={() => onDelete(item.id)}
            title="Delete"
          >
            🗑️
          </button>
        </div>
      </div>
    </div>
  );
}

// Enhanced Menu Item Form Component
function EnhancedMenuItemForm({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    label: '',
    url: '',
    type: 'internal',
    newTab: false
  });
  
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.label.trim()) {
      newErrors.label = 'Menu label is required';
    }
    
    if (!formData.url.trim()) {
      newErrors.url = 'URL is required';
    } else if (formData.type === 'external' && !formData.url.startsWith('http')) {
      newErrors.url = 'External URLs must start with http:// or https://';
    } else if (formData.type === 'internal' && !formData.url.startsWith('/')) {
      newErrors.url = 'Internal URLs must start with /';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const handleTypeChange = (type) => {
    setFormData({ 
      ...formData, 
      type,
      newTab: type === 'external' ? true : formData.newTab,
      url: type === 'external' && formData.url.startsWith('/') ? 'https://' : formData.url
    });
  };

  return (
    <div className={styles.formOverlay}>
      <div className={styles.formModal}>
        <div className={styles.modalHeader}>
          <h3>➕ Add Navigation Item</h3>
          <button className={styles.closeButton} onClick={onCancel}>✕</button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className={styles.modalContent}>
            <div className={styles.formGroup}>
              <label>🏷️ Menu Label *</label>
              <input
                type="text"
                value={formData.label}
                onChange={(e) => setFormData({...formData, label: e.target.value})}
                className={`${styles.inputField} ${errors.label ? styles.inputError : ''}`}
                placeholder="e.g., Documentation, Blog, About"
              />
              {errors.label && <span className={styles.errorText}>{errors.label}</span>}
              <div className={styles.inputHint}>
                This text will appear in the navigation menu
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>� Link Type</label>
              <div className={styles.typeSelector}>
                {[
                  { value: 'internal', label: '📄 Internal Page', desc: 'Link to pages within your site' },
                  { value: 'external', label: '🌐 External Link', desc: 'Link to external websites' },
                  { value: 'dropdown', label: '📋 Dropdown Menu', desc: 'Menu with sub-items' }
                ].map(type => (
                  <label key={type.value} className={styles.typeOption}>
                    <input
                      type="radio"
                      name="type"
                      value={type.value}
                      checked={formData.type === type.value}
                      onChange={() => handleTypeChange(type.value)}
                    />
                    <div className={styles.typeContent}>
                      <span className={styles.typeLabel}>{type.label}</span>
                      <span className={styles.typeDesc}>{type.desc}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label>� URL *</label>
              <input
                type="text"
                value={formData.url}
                onChange={(e) => setFormData({...formData, url: e.target.value})}
                className={`${styles.inputField} ${errors.url ? styles.inputError : ''}`}
                placeholder={
                  formData.type === 'external' 
                    ? 'https://github.com/your-repo' 
                    : formData.type === 'dropdown'
                    ? '#'
                    : '/docs'
                }
              />
              {errors.url && <span className={styles.errorText}>{errors.url}</span>}
              <div className={styles.inputHint}>
                {formData.type === 'external' && 'Full URL including https://'}
                {formData.type === 'internal' && 'Relative path starting with /'}
                {formData.type === 'dropdown' && 'Use # for dropdown menus'}
              </div>
            </div>
            
            <div className={styles.formGroup}>
              <label className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  checked={formData.newTab}
                  onChange={(e) => setFormData({...formData, newTab: e.target.checked})}
                />
                <span>🔗 Open in New Tab</span>
              </label>
              <div className={styles.inputHint}>
                {formData.type === 'external' 
                  ? 'Recommended for external links'
                  : 'Keep users on your site for internal pages'
                }
              </div>
            </div>
          </div>
          
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>
              ❌ Cancel
            </button>
            <button type="submit" className={styles.primaryButton}>
              ✅ Add Menu Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Footer Group Form Component
function FooterGroupForm({ onSave, onCancel }) {
  const [formData, setFormData] = useState({
    title: '',
    items: []
  });
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      onSave(formData);
    }
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { label: '', to: '', href: '' }]
    });
  };

  const updateItem = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <h3>➕ Add Footer Group</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.modalBody}>
            <div className={styles.formGroup}>
              <label>🏷️ Group Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className={`${styles.inputField} ${errors.title ? styles.inputError : ''}`}
                placeholder="e.g., Products, Community, Company"
              />
              {errors.title && <span className={styles.errorText}>{errors.title}</span>}
            </div>

            <div className={styles.formGroup}>
              <div className={styles.itemsHeader}>
                <label>🔗 Footer Links</label>
                <button type="button" className={styles.addItemButton} onClick={addItem}>
                  ➕ Add Link
                </button>
              </div>
              
              {formData.items.map((item, index) => (
                <div key={index} className={styles.footerItemForm}>
                  <input
                    type="text"
                    placeholder="Link Label"
                    value={item.label}
                    onChange={(e) => updateItem(index, 'label', e.target.value)}
                    className={styles.inputField}
                  />
                  <input
                    type="text"
                    placeholder="URL (internal: /blog or external: https://...)"
                    value={item.to || item.href || ''}
                    onChange={(e) => {
                      const url = e.target.value;
                      const isExternal = url.startsWith('http');
                      updateItem(index, isExternal ? 'href' : 'to', url);
                      updateItem(index, isExternal ? 'to' : 'href', '');
                    }}
                    className={styles.inputField}
                  />
                  <button 
                    type="button" 
                    className={styles.removeItemButton}
                    onClick={() => removeItem(index)}
                  >
                    🗑️
                  </button>
                </div>
              ))}
              
              {formData.items.length === 0 && (
                <p className={styles.hintText}>Click "Add Link" to create footer links for this group</p>
              )}
            </div>
          </div>
          
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelButton} onClick={onCancel}>
              ❌ Cancel
            </button>
            <button type="submit" className={styles.primaryButton}>
              ✅ Add Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Footer Group Editor Component
function FooterGroupEditor({ group, groupIndex, onUpdate, onDelete, onAddItem, onDeleteItem }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(group);

  const handleSave = () => {
    onUpdate(groupIndex, editData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditData(group);
    setIsEditing(false);
  };

  const addNewItem = () => {
    onAddItem(groupIndex, { label: 'New Link', to: '#' });
  };

  const updateItemInPlace = (itemIndex, field, value) => {
    const newItems = [...editData.items];
    newItems[itemIndex] = { ...newItems[itemIndex], [field]: value };
    setEditData({ ...editData, items: newItems });
  };

  if (isEditing) {
    return (
      <div className={styles.footerGroupEditor}>
        <div className={styles.groupHeader}>
          <input
            type="text"
            value={editData.title}
            onChange={(e) => setEditData({...editData, title: e.target.value})}
            className={styles.groupTitleInput}
          />
          <div className={styles.groupActions}>
            <button className={styles.cancelButton} onClick={handleCancel}>❌</button>
            <button className={styles.saveButton} onClick={handleSave}>✅</button>
          </div>
        </div>
        
        <div className={styles.groupItems}>
          {editData.items.map((item, itemIndex) => (
            <div key={itemIndex} className={styles.footerItemEditor}>
              <input
                type="text"
                value={item.label}
                onChange={(e) => updateItemInPlace(itemIndex, 'label', e.target.value)}
                className={styles.itemInput}
                placeholder="Link Label"
              />
              <input
                type="text"
                value={item.to || item.href || ''}
                onChange={(e) => {
                  const url = e.target.value;
                  const isExternal = url.startsWith('http');
                  updateItemInPlace(itemIndex, isExternal ? 'href' : 'to', url);
                  updateItemInPlace(itemIndex, isExternal ? 'to' : 'href', '');
                }}
                className={styles.itemInput}
                placeholder="URL"
              />
              <button 
                className={styles.deleteItemButton}
                onClick={() => onDeleteItem(groupIndex, itemIndex)}
              >
                🗑️
              </button>
            </div>
          ))}
          <button className={styles.addItemButton} onClick={addNewItem}>
            ➕ Add Link
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.footerGroup}>
      <div className={styles.groupHeader}>
        <h4>📂 {group.title}</h4>
        <div className={styles.groupActions}>
          <button className={styles.editButton} onClick={() => setIsEditing(true)}>
            ✏️ Edit
          </button>
          <button className={styles.deleteButton} onClick={() => onDelete(groupIndex)}>
            🗑️ Delete
          </button>
        </div>
      </div>
      
      <div className={styles.groupItems}>
        {group.items.map((item, itemIndex) => (
          <div key={itemIndex} className={styles.footerItem}>
            <span className={styles.itemLabel}>🔗 {item.label}</span>
            <span className={styles.itemUrl}>
              {item.href ? (
                <>🌐 {item.href}</>
              ) : (
                <>📄 {item.to}</>
              )}
            </span>
          </div>
        ))}
        {group.items.length === 0 && (
          <p className={styles.emptyItems}>No links in this group</p>
        )}
      </div>
    </div>
  );
}

// Appearance Management Component
function AppearanceTab() {
  const [activeSection, setActiveSection] = useState('theme');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAppearanceSettings();
  }, []);

  const fetchAppearanceSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/appearance', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch appearance settings:', error);
      setError('Failed to load appearance settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sectionData) => {
    setSaving(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/appearance', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sectionData)
      });
      
      if (response.ok) {
        setSuccess('Appearance updated successfully!');
        setSettings(prev => ({ ...prev, ...sectionData }));
      } else {
        setError('Failed to save appearance settings');
      }
    } catch (error) {
      console.error('Failed to save appearance:', error);
      setError('Failed to save appearance settings');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'theme', label: '🎨 Theme', icon: '🎨' },
    { id: 'colors', label: '🌈 Colors', icon: '🌈' },
    { id: 'fonts', label: '🔤 Fonts', icon: '🔤' },
    { id: 'logo', label: '🖼️ Logo', icon: '🖼️' },
  ];

  if (loading) return <LoadingSpinner message="Loading appearance settings..." />;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>🎨 Appearance</h2>
        <a 
          href="/" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.previewButton}
        >
          👁️ Preview Changes
        </a>
      </div>

      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorMessage message={error} onRetry={() => setError('')} />}

      <div className={styles.settingsLayout}>
        <div className={styles.settingsSidebar}>
          {sections.map(section => (
            <button
              key={section.id}
              className={`${styles.settingsTab} ${activeSection === section.id ? styles.active : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        <div className={styles.settingsContent}>
          {activeSection === 'theme' && (
            <ThemeSettings 
              settings={settings} 
              onSave={handleSave} 
              saving={saving}
            />
          )}
          
          {activeSection === 'colors' && (
            <ColorSettings 
              settings={settings} 
              onSave={handleSave} 
              saving={saving}
            />
          )}
          
          {activeSection === 'fonts' && (
            <FontSettings 
              settings={settings} 
              onSave={handleSave} 
              saving={saving}
            />
          )}
          
          {activeSection === 'logo' && (
            <LogoSettings 
              settings={settings} 
              onSave={handleSave} 
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// Theme Settings Component
function ThemeSettings({ settings, onSave, saving }) {
  const [selectedTheme, setSelectedTheme] = useState(settings.theme || 'light');
  const [enableDarkMode, setEnableDarkMode] = useState(settings.enableDarkMode || true);

  const themes = [
    { id: 'light', name: '☀️ Light Theme', description: 'Clean and bright design' },
    { id: 'dark', name: '🌙 Dark Theme', description: 'Easy on the eyes' },
    { id: 'auto', name: '🔄 Auto Theme', description: 'Follows system preference' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ theme: selectedTheme, enableDarkMode });
  };

  return (
    <div className={styles.settingsSection}>
      <h3>🎨 Theme Settings</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>🎭 Default Theme</label>
          <div className={styles.themeGrid}>
            {themes.map(theme => (
              <div 
                key={theme.id}
                className={`${styles.themeCard} ${selectedTheme === theme.id ? styles.selected : ''}`}
                onClick={() => setSelectedTheme(theme.id)}
              >
                <input 
                  type="radio"
                  name="theme"
                  value={theme.id}
                  checked={selectedTheme === theme.id}
                  onChange={() => setSelectedTheme(theme.id)}
                  style={{ display: 'none' }}
                />
                <div className={styles.themePreview}>
                  <div className={styles.themeName}>{theme.name}</div>
                  <div className={styles.themeDescription}>{theme.description}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={enableDarkMode}
              onChange={(e) => setEnableDarkMode(e.target.checked)}
            />
            <span>🌙 Show Dark Mode Toggle</span>
          </label>
          <div className={styles.inputHint}>
            Allow visitors to switch between light and dark themes
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? (
            <>
              <span className={styles.saveSpinner}>⏳</span>
              Applying Theme...
            </>
          ) : (
            <>
              💾 Apply Theme Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Color Settings Component
function ColorSettings({ settings, onSave, saving }) {
  // Primary colors (currently supported)
  const [primaryColor, setPrimaryColor] = useState(settings.primaryColor || '#2874A6');
  const [secondaryColor, setSecondaryColor] = useState(settings.secondaryColor || '#F2F4F4');
  const [accentColor, setAccentColor] = useState(settings.accentColor || '#27AE60');
  
  // Additional colors from custom.css
  const [warningColor, setWarningColor] = useState(settings.warningColor || '#F4D03F');
  const [lightBackgroundColor, setLightBackgroundColor] = useState(settings.lightBackgroundColor || '#FFFFFF');
  const [lightTextColor, setLightTextColor] = useState(settings.lightTextColor || '#2C3E50');
  const [darkBackgroundColor, setDarkBackgroundColor] = useState(settings.darkBackgroundColor || '#2C3E50');
  const [darkTextColor, setDarkTextColor] = useState(settings.darkTextColor || '#FFFFFF');
  const [darkPrimaryColor, setDarkPrimaryColor] = useState(settings.darkPrimaryColor || '#4193C8');

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ 
      primaryColor, 
      secondaryColor, 
      accentColor,
      warningColor,
      lightBackgroundColor,
      lightTextColor,
      darkBackgroundColor,
      darkTextColor,
      darkPrimaryColor
    });
  };

  const resetColors = () => {
    setPrimaryColor('#2874A6');
    setSecondaryColor('#F2F4F4');
    setAccentColor('#27AE60');
    setWarningColor('#F4D03F');
    setLightBackgroundColor('#FFFFFF');
    setLightTextColor('#2C3E50');
    setDarkBackgroundColor('#2C3E50');
    setDarkTextColor('#FFFFFF');
    setDarkPrimaryColor('#4193C8');
  };

  return (
    <div className={styles.settingsSection}>
      <h3>🌈 Color Settings</h3>
      <form onSubmit={handleSubmit}>
        {/* Light Theme Colors */}
        <div className={styles.colorSection}>
          <h4>☀️ Light Theme Colors</h4>
          
          <div className={styles.formGroup}>
            <label>🎨 Primary Color (Light)</label>
            <div className={styles.colorInput}>
              <input 
                type="color" 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className={styles.colorPicker}
              />
              <input 
                type="text" 
                value={primaryColor}
                onChange={(e) => setPrimaryColor(e.target.value)}
                className={styles.colorValue}
                placeholder="#2874A6"
              />
            </div>
            <div className={styles.inputHint}>
              Header & main theme color for light theme
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>🔳 Background Color (Light)</label>
            <div className={styles.colorInput}>
              <input 
                type="color" 
                value={lightBackgroundColor}
                onChange={(e) => setLightBackgroundColor(e.target.value)}
                className={styles.colorPicker}
              />
              <input 
                type="text" 
                value={lightBackgroundColor}
                onChange={(e) => setLightBackgroundColor(e.target.value)}
                className={styles.colorValue}
                placeholder="#FFFFFF"
              />
            </div>
            <div className={styles.inputHint}>
              Background color for light theme
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>� Text Color (Light)</label>
            <div className={styles.colorInput}>
              <input 
                type="color" 
                value={lightTextColor}
                onChange={(e) => setLightTextColor(e.target.value)}
                className={styles.colorPicker}
              />
              <input 
                type="text" 
                value={lightTextColor}
                onChange={(e) => setLightTextColor(e.target.value)}
                className={styles.colorValue}
                placeholder="#2C3E50"
              />
            </div>
            <div className={styles.inputHint}>
              Primary text color for light theme
            </div>
          </div>
        </div>

        {/* Dark Theme Colors */}
        <div className={styles.colorSection}>
          <h4>🌙 Dark Theme Colors</h4>
          
          <div className={styles.formGroup}>
            <label>🎨 Primary Color (Dark)</label>
            <div className={styles.colorInput}>
              <input 
                type="color" 
                value={darkPrimaryColor}
                onChange={(e) => setDarkPrimaryColor(e.target.value)}
                className={styles.colorPicker}
              />
              <input 
                type="text" 
                value={darkPrimaryColor}
                onChange={(e) => setDarkPrimaryColor(e.target.value)}
                className={styles.colorValue}
                placeholder="#4193C8"
              />
            </div>
            <div className={styles.inputHint}>
              Header & main theme color for dark theme
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>⬛ Background Color (Dark)</label>
            <div className={styles.colorInput}>
              <input 
                type="color" 
                value={darkBackgroundColor}
                onChange={(e) => setDarkBackgroundColor(e.target.value)}
                className={styles.colorPicker}
              />
              <input 
                type="text" 
                value={darkBackgroundColor}
                onChange={(e) => setDarkBackgroundColor(e.target.value)}
                className={styles.colorValue}
                placeholder="#2C3E50"
              />
            </div>
            <div className={styles.inputHint}>
              Background color for dark theme
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>🔤 Text Color (Dark)</label>
            <div className={styles.colorInput}>
              <input 
                type="color" 
                value={darkTextColor}
                onChange={(e) => setDarkTextColor(e.target.value)}
                className={styles.colorPicker}
              />
              <input 
                type="text" 
                value={darkTextColor}
                onChange={(e) => setDarkTextColor(e.target.value)}
                className={styles.colorValue}
                placeholder="#FFFFFF"
              />
            </div>
            <div className={styles.inputHint}>
              Primary text color for dark theme
            </div>
          </div>
        </div>

        {/* Shared Colors */}
        <div className={styles.colorSection}>
          <h4>🎭 Shared Theme Colors</h4>
          
          <div className={styles.formGroup}>
            <label>🔵 Secondary Color</label>
            <div className={styles.colorInput}>
              <input 
                type="color" 
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className={styles.colorPicker}
              />
              <input 
                type="text" 
                value={secondaryColor}
                onChange={(e) => setSecondaryColor(e.target.value)}
                className={styles.colorValue}
                placeholder="#F2F4F4"
              />
            </div>
            <div className={styles.inputHint}>
              Light gray for secondary sections (both themes)
            </div>
          </div>
          
          <div className={styles.formGroup}>
            <label>✅ Success/CTA Color</label>
            <div className={styles.colorInput}>
              <input 
                type="color" 
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className={styles.colorPicker}
              />
              <input 
                type="text" 
                value={accentColor}
                onChange={(e) => setAccentColor(e.target.value)}
                className={styles.colorValue}
                placeholder="#27AE60"
              />
            </div>
            <div className={styles.inputHint}>
              Used for CTA buttons and success states
            </div>
          </div>

          <div className={styles.formGroup}>
            <label>⚠️ Warning/Highlight Color</label>
            <div className={styles.colorInput}>
              <input 
                type="color" 
                value={warningColor}
                onChange={(e) => setWarningColor(e.target.value)}
                className={styles.colorPicker}
              />
              <input 
                type="text" 
                value={warningColor}
                onChange={(e) => setWarningColor(e.target.value)}
                className={styles.colorValue}
                placeholder="#F4D03F"
              />
            </div>
            <div className={styles.inputHint}>
              Used for highlights and warning elements
            </div>
          </div>
        </div>
        
        <div className={styles.buttonGroup}>
          <button 
            type="button"
            onClick={resetColors}
            className={styles.resetButton}
          >
            🔄 Reset to Default
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className={styles.saveButton}
          >
            {saving ? (
              <>
                <span className={styles.saveSpinner}>⏳</span>
                Applying Colors...
              </>
            ) : (
              <>
                💾 Apply Colors
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

// Font Settings Component
function FontSettings({ settings, onSave, saving }) {
  const [headingFont, setHeadingFont] = useState(settings.headingFont || 'system-ui');
  const [bodyFont, setBodyFont] = useState(settings.bodyFont || 'system-ui');
  const [codeFont, setCodeFont] = useState(settings.codeFont || 'SFMono-Regular');

  const fontOptions = [
    { value: 'system-ui', label: 'System UI (Default)' },
    { value: 'Inter', label: 'Inter' },
    { value: 'Roboto', label: 'Roboto' },
    { value: 'Open Sans', label: 'Open Sans' },
    { value: 'Lato', label: 'Lato' },
    { value: 'Poppins', label: 'Poppins' },
  ];

  const codeFonts = [
    { value: 'SFMono-Regular', label: 'SF Mono (Default)' },
    { value: 'Consolas', label: 'Consolas' },
    { value: 'Monaco', label: 'Monaco' },
    { value: 'Menlo', label: 'Menlo' },
    { value: 'Source Code Pro', label: 'Source Code Pro' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ headingFont, bodyFont, codeFont });
  };

  return (
    <div className={styles.settingsSection}>
      <h3>🔤 Font Settings</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>📰 Heading Font</label>
          <select 
            value={headingFont}
            onChange={(e) => setHeadingFont(e.target.value)}
            className={styles.selectField}
          >
            {fontOptions.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <div className={styles.inputHint}>
            Used for page titles and headings
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>📝 Body Font</label>
          <select 
            value={bodyFont}
            onChange={(e) => setBodyFont(e.target.value)}
            className={styles.selectField}
          >
            {fontOptions.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <div className={styles.inputHint}>
            Used for body text and paragraphs
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>💻 Code Font</label>
          <select 
            value={codeFont}
            onChange={(e) => setCodeFont(e.target.value)}
            className={styles.selectField}
          >
            {codeFonts.map(font => (
              <option key={font.value} value={font.value}>
                {font.label}
              </option>
            ))}
          </select>
          <div className={styles.inputHint}>
            Used for code blocks and inline code
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? (
            <>
              <span className={styles.saveSpinner}>⏳</span>
              Applying Fonts...
            </>
          ) : (
            <>
              💾 Apply Font Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Logo Settings Component
function LogoSettings({ settings, onSave, saving }) {
  const [logoUrl, setLogoUrl] = useState(settings.logoUrl || '');
  const [logoAlt, setLogoAlt] = useState(settings.logoAlt || '');
  const [showTitle, setShowTitle] = useState(settings.showTitle !== false);
  const [uploadMode, setUploadMode] = useState('url'); // 'url' or 'preset'
  const [urlError, setUrlError] = useState('');

  const presetLogos = [
    { url: '/img/logo.svg', name: 'Default Docusaurus' },
    { url: 'https://docusaurus.io/img/docusaurus.png', name: 'Docusaurus Logo' },
    { url: '/img/docusaurus.png', name: 'Docusaurus PNG' },
  ];

  const validateLogoUrl = (url) => {
    if (!url.trim()) {
      return 'Logo URL is required';
    }
    
    // Allow relative paths starting with /
    if (url.startsWith('/')) {
      return '';
    }
    
    // Allow full URLs
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return '';
    }
    
    // Allow data URLs for base64 images
    if (url.startsWith('data:image/')) {
      return '';
    }
    
    return 'Please enter a valid path (e.g., /img/logo.svg) or URL (e.g., https://example.com/logo.png)';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const validationError = validateLogoUrl(logoUrl);
    if (validationError) {
      setUrlError(validationError);
      return;
    }
    
    setUrlError('');
    onSave({ logoUrl, logoAlt, showTitle });
  };

  const handleUrlChange = (e) => {
    const newUrl = e.target.value;
    setLogoUrl(newUrl);
    
    // Clear error when user starts typing
    if (urlError) {
      setUrlError('');
    }
  };

  const handlePresetSelect = (presetUrl) => {
    setLogoUrl(presetUrl);
    setUrlError(''); // Clear any existing errors
  };

  return (
    <div className={styles.settingsSection}>
      <h3>🖼️ Logo Settings</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>🖼️ Logo Source</label>
          <div className={styles.logoModeSelector}>
            <button
              type="button"
              className={`${styles.modeButton} ${uploadMode === 'url' ? styles.active : ''}`}
              onClick={() => setUploadMode('url')}
            >
              🔗 Custom URL
            </button>
            <button
              type="button"
              className={`${styles.modeButton} ${uploadMode === 'preset' ? styles.active : ''}`}
              onClick={() => setUploadMode('preset')}
            >
              📁 Preset Logos
            </button>
          </div>
        </div>

        {uploadMode === 'url' && (
          <div className={styles.formGroup}>
            <label>🔗 Logo URL</label>
            <input 
              type="text" 
              value={logoUrl}
              onChange={handleUrlChange}
              className={`${styles.inputField} ${urlError ? styles.inputError : ''}`}
              placeholder="/img/logo.svg or https://example.com/logo.png"
            />
            {urlError && <span className={styles.errorText}>{urlError}</span>}
            <div className={styles.inputHint}>
              Enter a direct link to your logo (SVG, PNG, or JPG recommended)
              <br />
              • Use relative paths like: /img/logo.svg
              <br />
              • Or external URLs like: https://example.com/logo.png
            </div>
          </div>
        )}

        {uploadMode === 'preset' && (
          <div className={styles.formGroup}>
            <label>📁 Choose from Preset Logos</label>
            <div className={styles.presetGrid}>
              {presetLogos.map((preset, index) => (
                <div 
                  key={index}
                  className={`${styles.presetOption} ${logoUrl === preset.url ? styles.selected : ''}`}
                  onClick={() => handlePresetSelect(preset.url)}
                >
                  <img 
                    src={preset.url} 
                    alt={preset.name}
                    className={styles.presetImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className={styles.presetError} style={{ display: 'none' }}>
                    ❌ Error
                  </div>
                  <p>{preset.name}</p>
                </div>
              ))}
            </div>
            <div className={styles.inputHint}>
              Click on a logo to select it
            </div>
          </div>
        )}
        
        <div className={styles.formGroup}>
          <label>🏷️ Logo Alt Text</label>
          <input 
            type="text" 
            value={logoAlt}
            onChange={(e) => setLogoAlt(e.target.value)}
            className={styles.inputField}
            placeholder="Your Site Logo"
          />
          <div className={styles.inputHint}>
            Alternative text for accessibility and SEO
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={showTitle}
              onChange={(e) => setShowTitle(e.target.checked)}
            />
            <span>📝 Show Site Title Next to Logo</span>
          </label>
          <div className={styles.inputHint}>
            Display site title alongside the logo in navigation
          </div>
        </div>
        
        {logoUrl && (
          <div className={styles.logoPreview}>
            <h4>🔍 Logo Preview</h4>
            <div className={styles.previewContainer}>
              <img 
                src={logoUrl} 
                alt={logoAlt}
                className={styles.logoPreviewImage}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'block';
                }}
              />
              <div className={styles.logoError} style={{ display: 'none' }}>
                ❌ Could not load logo from: {logoUrl}
              </div>
              {showTitle && (
                <span className={styles.titlePreview}>Your Site Title</span>
              )}
            </div>
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? (
            <>
              <span className={styles.saveSpinner}>⏳</span>
              Updating Logo...
            </>
          ) : (
            <>
              💾 Update Logo Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Settings Management Component
function SettingsTab() {
  const [activeSection, setActiveSection] = useState('general');
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/settings', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (sectionData) => {
    console.log('🔧 SettingsTab handleSave called with:', sectionData);
    setSaving(true);
    setError('');
    
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(sectionData)
      });
      
      console.log('🌐 Settings API response status:', response.status);
      
      if (response.ok) {
        const responseData = await response.json();
        console.log('✅ Settings save response:', responseData);
        setSuccess('Settings updated successfully!');
        setSettings(prev => {
          const updated = { ...prev, ...sectionData };
          console.log('📝 Updated settings state:', updated);
          return updated;
        });
        setTimeout(() => setSuccess(''), 3000);
      } else {
        const errorData = await response.text();
        console.error('❌ Settings save error:', errorData);
        setError('Failed to save settings');
      }
    } catch (error) {
      console.error('❌ Network error saving settings:', error);
      setError('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const sections = [
    { id: 'general', label: '🌐 General', icon: '🌐' },
    { id: 'seo', label: '📈 SEO', icon: '📈' },
    { id: 'social', label: '📱 Social', icon: '📱' },
    { id: 'advanced', label: '⚙️ Advanced', icon: '⚙️' },
  ];

  if (loading) return <LoadingSpinner message="Loading settings..." />;

  return (
    <div className={styles.tabContent}>
      <div className={styles.tabHeader}>
        <h2>⚙️ Site Settings</h2>
        <a 
          href="/" 
          target="_blank" 
          rel="noopener noreferrer"
          className={styles.previewButton}
        >
          👁️ Preview Site
        </a>
      </div>

      {success && <SuccessMessage message={success} onClose={() => setSuccess('')} />}
      {error && <ErrorMessage message={error} onRetry={() => setError('')} />}

      <div className={styles.settingsLayout}>
        <div className={styles.settingsSidebar}>
          {sections.map(section => (
            <button
              key={section.id}
              className={`${styles.settingsTab} ${activeSection === section.id ? styles.active : ''}`}
              onClick={() => setActiveSection(section.id)}
            >
              <span>{section.icon}</span>
              {section.label}
            </button>
          ))}
        </div>

        <div className={styles.settingsContent}>
          {activeSection === 'general' && (
            <GeneralSettings 
              settings={settings} 
              onSave={handleSave} 
              saving={saving}
            />
          )}
          
          {activeSection === 'seo' && (
            <SEOSettings 
              settings={settings} 
              onSave={handleSave} 
              saving={saving}
            />
          )}
          
          {activeSection === 'social' && (
            <SocialSettings 
              settings={settings} 
              onSave={handleSave} 
              saving={saving}
            />
          )}
          
          {activeSection === 'advanced' && (
            <AdvancedSettings 
              settings={settings} 
              onSave={handleSave} 
              saving={saving}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// General Settings Component
function GeneralSettings({ settings, onSave, saving }) {
  const [title, setTitle] = useState(settings.title || '');
  const [tagline, setTagline] = useState(settings.tagline || '');
  const [url, setUrl] = useState(settings.url || '');

  useEffect(() => {
    setTitle(settings.title || '');
    setTagline(settings.tagline || '');
    setUrl(settings.url || '');
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ title, tagline, url });
  };

  return (
    <div className={styles.settingsSection}>
      <h3>🌐 General Settings</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>📝 Site Title</label>
          <input 
            type="text" 
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={styles.inputField}
            placeholder="My Awesome Documentation Site"
          />
          <div className={styles.inputHint}>
            Appears in browser title and site header
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>📋 Site Tagline</label>
          <input 
            type="text" 
            value={tagline}
            onChange={(e) => setTagline(e.target.value)}
            className={styles.inputField}
            placeholder="Your comprehensive documentation hub"
          />
          <div className={styles.inputHint}>
            Subtitle shown on homepage and meta descriptions
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>🌐 Site URL</label>
          <input 
            type="url" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className={styles.inputField} 
            placeholder="https://yourdomain.com"
          />
          <div className={styles.inputHint}>
            Used for canonical URLs and social sharing
          </div>
        </div>
        
        <button 
          type="submit" 
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? (
            <>
              <span className={styles.saveSpinner}>⏳</span>
              Saving...
            </>
          ) : (
            <>
              💾 Save General Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// SEO Settings Component
function SEOSettings({ settings, onSave, saving }) {
  const [metaDescription, setMetaDescription] = useState(settings.metaDescription || '');
  const [keywords, setKeywords] = useState(settings.keywords || '');
  const [socialImage, setSocialImage] = useState(settings.socialImage || '');
  const [socialImageMode, setSocialImageMode] = useState('url');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setMetaDescription(settings.metaDescription || '');
    setKeywords(settings.keywords || '');
    setSocialImage(settings.socialImage || '');
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ metaDescription, keywords, socialImage });
  };

  const handleSocialImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setSocialImage(data.path);
        // Auto-save the social image
        onSave({ metaDescription, keywords, socialImage: data.path });
      }
    } catch (error) {
      console.error('Failed to upload social image:', error);
    } finally {
      setUploading(false);
    }
  };

  const presetSocialImages = [
    { name: 'Default Docusaurus', url: '/img/docusaurus-social-card.jpg' },
    { name: 'Docusaurus Brand', url: 'https://docusaurus.io/img/docusaurus-social-card.jpg' },
    { name: 'Tech Blue', url: 'https://via.placeholder.com/1200x630/2563eb/ffffff?text=Documentation' },
    { name: 'Success Green', url: 'https://via.placeholder.com/1200x630/16a34a/ffffff?text=Documentation' }
  ];

  return (
    <div className={styles.settingsSection}>
      <h3>📈 SEO & Social Settings</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>📄 Meta Description</label>
          <textarea 
            value={metaDescription}
            onChange={(e) => setMetaDescription(e.target.value)}
            className={styles.textareaField} 
            rows={3} 
            placeholder="Comprehensive documentation and guides for developers..."
          />
          <div className={styles.inputHint}>
            Shown in search engine results (150-160 characters recommended)
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>🏷️ Keywords</label>
          <input 
            type="text" 
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            className={styles.inputField} 
            placeholder="documentation, guides, tutorials, API"
          />
          <div className={styles.inputHint}>
            Comma-separated keywords for search engines
          </div>
        </div>

        {/* Social Sharing Image Settings */}
        <div className={styles.formGroup}>
          <label>📱 Social Sharing Image</label>
          <div className={styles.socialImageControls}>
            <div className={styles.modeSelector}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="socialImageMode"
                  checked={socialImageMode === 'url'}
                  onChange={() => setSocialImageMode('url')}
                />
                <span>🔗 URL</span>
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="socialImageMode"
                  checked={socialImageMode === 'upload'}
                  onChange={() => setSocialImageMode('upload')}
                />
                <span>📁 Upload</span>
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="socialImageMode"
                  checked={socialImageMode === 'preset'}
                  onChange={() => setSocialImageMode('preset')}
                />
                <span>🎨 Preset</span>
              </label>
            </div>
          </div>

          {socialImageMode === 'url' && (
            <div className={styles.formGroup}>
              <input 
                type="text" 
                value={socialImage}
                onChange={(e) => setSocialImage(e.target.value)}
                className={styles.inputField}
                placeholder="https://example.com/social-image.jpg"
              />
              <div className={styles.inputHint}>
                Direct URL to your social sharing image (recommended: 1200x630px)
              </div>
            </div>
          )}

          {socialImageMode === 'upload' && (
            <div className={styles.formGroup}>
              <input
                type="file"
                id="socialImageUpload"
                onChange={handleSocialImageUpload}
                accept=".jpg,.jpeg,.png,.webp"
                style={{ display: 'none' }}
              />
              <button 
                type="button"
                className={styles.uploadButton}
                onClick={() => document.getElementById('socialImageUpload').click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className={styles.uploadSpinner}>⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    📁 Choose Social Image
                  </>
                )}
              </button>
              <div className={styles.inputHint}>
                Upload JPG, PNG, or WebP image (recommended: 1200x630px for optimal social sharing)
              </div>
            </div>
          )}

          {socialImageMode === 'preset' && (
            <div className={styles.presetGrid}>
              {presetSocialImages.map((preset, index) => (
                <div 
                  key={index}
                  className={`${styles.presetOption} ${socialImage === preset.url ? styles.selected : ''}`}
                  onClick={() => setSocialImage(preset.url)}
                >
                  <img 
                    src={preset.url} 
                    alt={preset.name}
                    className={styles.presetSocialImage}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className={styles.presetError} style={{ display: 'none' }}>
                    ❌ Error
                  </div>
                  <p>{preset.name}</p>
                </div>
              ))}
            </div>
          )}

          {socialImage && (
            <div className={styles.socialImagePreview}>
              <h4>🔍 Social Image Preview</h4>
              <div className={styles.previewContainer}>
                <img 
                  src={socialImage} 
                  alt="Social Sharing Preview"
                  className={styles.socialImagePreviewImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className={styles.socialImageError} style={{ display: 'none' }}>
                  ❌ Could not load social image from: {socialImage}
                </div>
                <div className={styles.imageInfo}>
                  <small>This image will appear when your site is shared on social media platforms</small>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <button 
          type="submit" 
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? (
            <>
              <span className={styles.saveSpinner}>⏳</span>
              Saving...
            </>
          ) : (
            <>
              💾 Save SEO Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Social Settings Component
function SocialSettings({ settings, onSave, saving }) {
  const [twitter, setTwitter] = useState(settings.twitter || '');
  const [github, setGithub] = useState(settings.github || '');
  const [linkedin, setLinkedin] = useState(settings.linkedin || '');

  useEffect(() => {
    setTwitter(settings.twitter || '');
    setGithub(settings.github || '');
    setLinkedin(settings.linkedin || '');
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ twitter, github, linkedin });
  };

  return (
    <div className={styles.settingsSection}>
      <h3>📱 Social Media</h3>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGroup}>
          <label>🐦 Twitter/X Handle</label>
          <input 
            type="text" 
            value={twitter}
            onChange={(e) => setTwitter(e.target.value)}
            className={styles.inputField} 
            placeholder="@yourusername"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>🐙 GitHub Repository</label>
          <input 
            type="url" 
            value={github}
            onChange={(e) => setGithub(e.target.value)}
            className={styles.inputField} 
            placeholder="https://github.com/user/repo"
          />
        </div>
        
        <div className={styles.formGroup}>
          <label>💼 LinkedIn</label>
          <input 
            type="url" 
            value={linkedin}
            onChange={(e) => setLinkedin(e.target.value)}
            className={styles.inputField} 
            placeholder="https://linkedin.com/company/yourcompany"
          />
        </div>
        
        <button 
          type="submit" 
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? (
            <>
              <span className={styles.saveSpinner}>⏳</span>
              Saving...
            </>
          ) : (
            <>
              💾 Save Social Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Advanced Settings Component
function AdvancedSettings({ settings, onSave, saving }) {
  const [enableSearch, setEnableSearch] = useState(settings.enableSearch !== undefined ? settings.enableSearch : true);
  const [enableDarkMode, setEnableDarkMode] = useState(settings.enableDarkMode !== undefined ? settings.enableDarkMode : true);
  const [analyticsId, setAnalyticsId] = useState(settings.analyticsId || '');
  const [faviconUrl, setFaviconUrl] = useState(settings.faviconUrl || '');
  const [faviconMode, setFaviconMode] = useState('url');
  const [uploading, setUploading] = useState(false);
  
  // Cookie Consent Settings
  const [enableCookieConsent, setEnableCookieConsent] = useState(settings.enableCookieConsent || false);
  const [cookieConsentSettings, setCookieConsentSettings] = useState({
    privacyPolicyUrl: settings.cookieConsentSettings?.privacyPolicyUrl || 'https://unblockedfreegame.com',
    consentMessage: settings.cookieConsentSettings?.consentMessage || 'We use cookies to enhance your browsing experience and analyze our traffic. Please choose your cookie preferences.',
    acceptAllText: settings.cookieConsentSettings?.acceptAllText || 'Accept All',
    declineAllText: settings.cookieConsentSettings?.declineAllText || 'Decline All',
    managePreferencesText: settings.cookieConsentSettings?.managePreferencesText || 'Manage Preferences',
    privacyPolicyText: settings.cookieConsentSettings?.privacyPolicyText || 'Privacy Policy',
    position: settings.cookieConsentSettings?.position || 'bottom',
    theme: settings.cookieConsentSettings?.theme || 'light',
    categories: settings.cookieConsentSettings?.categories || {
      essential: { enabled: true, required: true, label: 'Essential Cookies', description: 'Necessary for the website to function properly.' },
      analytics: { enabled: true, required: false, label: 'Analytics Cookies', description: 'Help us understand how visitors use our website.' },
      marketing: { enabled: false, required: false, label: 'Marketing Cookies', description: 'Used for advertising and marketing purposes.' },
      functional: { enabled: false, required: false, label: 'Functional Cookies', description: 'Enable enhanced functionality and personalization.' }
    },
    ...settings.cookieConsentSettings
  });

  useEffect(() => {
    setEnableSearch(settings.enableSearch !== undefined ? settings.enableSearch : true);
    setEnableDarkMode(settings.enableDarkMode !== undefined ? settings.enableDarkMode : true);
    setAnalyticsId(settings.analyticsId || '');
    setFaviconUrl(settings.faviconUrl || '');
    setEnableCookieConsent(settings.enableCookieConsent || false);
    setCookieConsentSettings({
      privacyPolicyUrl: settings.cookieConsentSettings?.privacyPolicyUrl || 'https://unblockedfreegame.com',
      consentMessage: settings.cookieConsentSettings?.consentMessage || 'We use cookies to enhance your browsing experience and analyze our traffic. Please choose your cookie preferences.',
      acceptAllText: settings.cookieConsentSettings?.acceptAllText || 'Accept All',
      declineAllText: settings.cookieConsentSettings?.declineAllText || 'Decline All',
      managePreferencesText: settings.cookieConsentSettings?.managePreferencesText || 'Manage Preferences',
      privacyPolicyText: settings.cookieConsentSettings?.privacyPolicyText || 'Privacy Policy',
      position: settings.cookieConsentSettings?.position || 'bottom',
      theme: settings.cookieConsentSettings?.theme || 'light',
      categories: settings.cookieConsentSettings?.categories || {
        essential: { enabled: true, required: true, label: 'Essential Cookies', description: 'Necessary for the website to function properly.' },
        analytics: { enabled: true, required: false, label: 'Analytics Cookies', description: 'Help us understand how visitors use our website.' },
        marketing: { enabled: false, required: false, label: 'Marketing Cookies', description: 'Used for advertising and marketing purposes.' },
        functional: { enabled: false, required: false, label: 'Functional Cookies', description: 'Enable enhanced functionality and personalization.' }
      },
      ...settings.cookieConsentSettings
    });
  }, [settings]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({ enableSearch, enableDarkMode, analyticsId, faviconUrl, enableCookieConsent, cookieConsentSettings });
  };

  const handleFaviconUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('/api/admin/media/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (response.ok) {
        const data = await response.json();
        setFaviconUrl(data.path);
        // Auto-save the favicon
        onSave({ enableSearch, enableDarkMode, analyticsId, faviconUrl: data.path });
      }
    } catch (error) {
      console.error('Failed to upload favicon:', error);
    } finally {
      setUploading(false);
    }
  };

  const presetFavicons = [
    { name: 'Default Docusaurus', url: '/img/favicon.ico' },
    { name: 'Docusaurus Logo', url: 'https://docusaurus.io/img/docusaurus.png' },
    { name: 'Generic Blue', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%232563eb"/></svg>' },
    { name: 'Generic Green', url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><circle cx="50" cy="50" r="40" fill="%2316a34a"/></svg>' }
  ];

  return (
    <div className={styles.settingsSection}>
      <h3>⚙️ Advanced Settings</h3>
      <form onSubmit={handleSubmit}>
        {/* Favicon Settings */}
        <div className={styles.formGroup}>
          <label>🎯 Site Favicon</label>
          <div className={styles.faviconControls}>
            <div className={styles.modeSelector}>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="faviconMode"
                  checked={faviconMode === 'url'}
                  onChange={() => setFaviconMode('url')}
                />
                <span>🔗 URL</span>
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="faviconMode"
                  checked={faviconMode === 'upload'}
                  onChange={() => setFaviconMode('upload')}
                />
                <span>📁 Upload</span>
              </label>
              <label className={styles.radioLabel}>
                <input 
                  type="radio" 
                  name="faviconMode"
                  checked={faviconMode === 'preset'}
                  onChange={() => setFaviconMode('preset')}
                />
                <span>🎨 Preset</span>
              </label>
            </div>
          </div>

          {faviconMode === 'url' && (
            <div className={styles.formGroup}>
              <input 
                type="text" 
                value={faviconUrl}
                onChange={(e) => setFaviconUrl(e.target.value)}
                className={styles.inputField}
                placeholder="https://example.com/favicon.ico"
              />
              <div className={styles.inputHint}>
                Direct URL to your favicon file (ICO, PNG, or SVG)
              </div>
            </div>
          )}

          {faviconMode === 'upload' && (
            <div className={styles.formGroup}>
              <input
                type="file"
                id="faviconUpload"
                onChange={handleFaviconUpload}
                accept=".ico,.png,.svg"
                style={{ display: 'none' }}
              />
              <button 
                type="button"
                className={styles.uploadButton}
                onClick={() => document.getElementById('faviconUpload').click()}
                disabled={uploading}
              >
                {uploading ? (
                  <>
                    <span className={styles.uploadSpinner}>⏳</span>
                    Uploading...
                  </>
                ) : (
                  <>
                    📁 Choose Favicon File
                  </>
                )}
              </button>
              <div className={styles.inputHint}>
                Upload ICO, PNG, or SVG file (recommended: 32x32px or 16x16px)
              </div>
            </div>
          )}

          {faviconMode === 'preset' && (
            <div className={styles.presetGrid}>
              {presetFavicons.map((preset, index) => (
                <div 
                  key={index}
                  className={`${styles.presetOption} ${faviconUrl === preset.url ? styles.selected : ''}`}
                  onClick={() => setFaviconUrl(preset.url)}
                >
                  <img 
                    src={preset.url} 
                    alt={preset.name}
                    className={styles.presetFavicon}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'block';
                    }}
                  />
                  <div className={styles.presetError} style={{ display: 'none' }}>
                    ❌
                  </div>
                  <p>{preset.name}</p>
                </div>
              ))}
            </div>
          )}

          {faviconUrl && (
            <div className={styles.faviconPreview}>
              <h4>🔍 Favicon Preview</h4>
              <div className={styles.previewContainer}>
                <img 
                  src={faviconUrl} 
                  alt="Favicon Preview"
                  className={styles.faviconPreviewImage}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div className={styles.faviconError} style={{ display: 'none' }}>
                  ❌ Could not load favicon from: {faviconUrl}
                </div>
              </div>
            </div>
          )}
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={enableSearch}
              onChange={(e) => {
                const newValue = e.target.checked;
                setEnableSearch(newValue);
                // Auto-save when checkbox is toggled
                onSave({ enableSearch: newValue, enableDarkMode, analyticsId, faviconUrl });
              }}
            />
            <span>🔍 Enable Search</span>
          </label>
          <div className={styles.inputHint}>
            Allow visitors to search through your content
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={enableDarkMode}
              onChange={(e) => {
                const newValue = e.target.checked;
                setEnableDarkMode(newValue);
                // Auto-save when checkbox is toggled
                onSave({ enableSearch, enableDarkMode: newValue, analyticsId, faviconUrl });
              }}
            />
            <span>🌙 Enable Dark Mode Toggle</span>
          </label>
          <div className={styles.inputHint}>
            Show dark/light mode switch in navigation
          </div>
        </div>
        
        <div className={styles.formGroup}>
          <label>📊 Google Analytics ID</label>
          <input 
            type="text" 
            value={analyticsId}
            onChange={(e) => setAnalyticsId(e.target.value)}
            onBlur={(e) => {
              const value = e.target.value.trim();
              if (value && !value.match(/^(G-[A-Z0-9]+|UA-\d+-\d+|GT-[A-Z0-9]+)$/)) {
                alert('Invalid Google Analytics ID format. Please use formats like: G-XXXXXXXXXX, UA-XXXXXXXX-X, or GT-XXXXXXXXX');
                return;
              }
              // Auto-save when user finishes editing (on blur)
              onSave({ enableSearch, enableDarkMode, analyticsId: value, faviconUrl });
            }}
            className={styles.inputField} 
            placeholder="G-XXXXXXXXXX, UA-XXXXXXXXX-X, or GT-XXXXXXXXX"
          />
          <div className={styles.inputHint}>
            Track visitors and page views with Google Analytics. Supports GA4 (G-), Universal Analytics (UA-), and Google Tag Manager (GT-) formats. Changes are saved automatically.
          </div>
        </div>

        {/* 🍪 Cookie Consent Management Section */}
        <div className={styles.sectionDivider}>
          <h3>🍪 Cookie Consent Management</h3>
          <p>GDPR & CCPA compliant cookie consent system with granular controls</p>
        </div>

        <div className={styles.formGroup}>
          <label className={styles.checkboxLabel}>
            <input 
              type="checkbox" 
              checked={enableCookieConsent}
              onChange={(e) => {
                setEnableCookieConsent(e.target.checked);
                // Auto-save when toggled
                onSave({ 
                  enableSearch, 
                  enableDarkMode, 
                  analyticsId, 
                  faviconUrl, 
                  enableCookieConsent: e.target.checked, 
                  cookieConsentSettings 
                });
              }}
            />
            <span>🍪 Enable Cookie Consent Banner</span>
          </label>
          <div className={styles.inputHint}>
            Show GDPR compliant cookie consent banner for users. Automatically manages cookie categories and user preferences.
          </div>
        </div>

        {enableCookieConsent && (
          <div className={styles.cookieConsentPanel}>
            
            {/* Basic Settings */}
            <div className={styles.cookieSection}>
              <h4>🎯 Banner Settings</h4>
              
              <div className={styles.formGroup}>
                <label>📝 Consent Message</label>
                <textarea
                  value={cookieConsentSettings.consentMessage}
                  onChange={(e) => setCookieConsentSettings(prev => ({
                    ...prev,
                    consentMessage: e.target.value
                  }))}
                  className={styles.textareaField}
                  rows={3}
                  placeholder="We use cookies to enhance your browsing experience..."
                />
                <div className={styles.inputHint}>
                  Main message shown in the cookie consent banner
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>📍 Banner Position</label>
                  <select
                    value={cookieConsentSettings.position}
                    onChange={(e) => setCookieConsentSettings(prev => ({
                      ...prev,
                      position: e.target.value
                    }))}
                    className={styles.selectField}
                  >
                    <option value="bottom">Bottom</option>
                    <option value="top">Top</option>
                  </select>
                </div>
                
                <div className={styles.formGroup}>
                  <label>🎨 Theme</label>
                  <select
                    value={cookieConsentSettings.theme}
                    onChange={(e) => setCookieConsentSettings(prev => ({
                      ...prev,
                      theme: e.target.value
                    }))}
                    className={styles.selectField}
                  >
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Button Customization */}
            <div className={styles.cookieSection}>
              <h4>🔘 Button Customization</h4>
              
              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>✅ Accept All Button</label>
                  <input
                    type="text"
                    value={cookieConsentSettings.acceptAllText}
                    onChange={(e) => setCookieConsentSettings(prev => ({
                      ...prev,
                      acceptAllText: e.target.value
                    }))}
                    className={styles.inputField}
                    placeholder="Accept All"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>❌ Decline All Button</label>
                  <input
                    type="text"
                    value={cookieConsentSettings.declineAllText}
                    onChange={(e) => setCookieConsentSettings(prev => ({
                      ...prev,
                      declineAllText: e.target.value
                    }))}
                    className={styles.inputField}
                    placeholder="Decline All"
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label>⚙️ Manage Preferences Button</label>
                  <input
                    type="text"
                    value={cookieConsentSettings.managePreferencesText}
                    onChange={(e) => setCookieConsentSettings(prev => ({
                      ...prev,
                      managePreferencesText: e.target.value
                    }))}
                    className={styles.inputField}
                    placeholder="Manage Preferences"
                  />
                </div>
                
                <div className={styles.formGroup}>
                  <label>📄 Privacy Policy Link</label>
                  <input
                    type="text"
                    value={cookieConsentSettings.privacyPolicyUrl}
                    onChange={(e) => setCookieConsentSettings(prev => ({
                      ...prev,
                      privacyPolicyUrl: e.target.value
                    }))}
                    className={styles.inputField}
                    placeholder="https://yoursite.com/privacy-policy"
                  />
                </div>
              </div>
            </div>

            {/* Cookie Categories */}
            <div className={styles.cookieSection}>
              <h4>🎯 Cookie Categories</h4>
              <p className={styles.sectionDescription}>
                Configure individual cookie categories. Essential cookies are always required and cannot be disabled.
              </p>
              
              <div className={styles.categoriesGrid}>
                {Object.entries(cookieConsentSettings.categories).map(([categoryKey, category]) => (
                  <div key={categoryKey} className={`${styles.categoryCard} ${category.required ? styles.requiredCategory : ''}`}>
                    <div className={styles.categoryHeader}>
                      <div className={styles.categoryInfo}>
                        <h5>{getCategoryIcon(categoryKey)} {category.label}</h5>
                        {category.required && (
                          <span className={styles.requiredBadge}>Required</span>
                        )}
                      </div>
                      
                      <label className={styles.categoryToggle}>
                        <input
                          type="checkbox"
                          checked={category.enabled}
                          onChange={(e) => setCookieConsentSettings(prev => ({
                            ...prev,
                            categories: {
                              ...prev.categories,
                              [categoryKey]: {
                                ...prev.categories[categoryKey],
                                enabled: e.target.checked
                              }
                            }
                          }))}
                          disabled={category.required}
                          className={styles.toggleInput}
                        />
                        <span className={`${styles.toggleSlider} ${category.required ? styles.toggleDisabled : ''}`}></span>
                      </label>
                    </div>
                    
                    <div className={styles.categoryContent}>
                      <textarea
                        value={category.description}
                        onChange={(e) => setCookieConsentSettings(prev => ({
                          ...prev,
                          categories: {
                            ...prev.categories,
                            [categoryKey]: {
                              ...prev.categories[categoryKey],
                              description: e.target.value
                            }
                          }
                        }))}
                        className={styles.categoryDescription}
                        rows={2}
                        placeholder="Describe what this category is used for..."
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview & Testing */}
            <div className={styles.cookieSection}>
              <h4>🔍 Preview & Testing</h4>
              
              <div className={styles.previewActions}>
                <button
                  type="button"
                  className={styles.previewButton}
                  onClick={() => {
                    // Reset consent to trigger banner
                    localStorage.removeItem('cookie-consent-preferences');
                    window.location.reload();
                  }}
                >
                  🔄 Test Cookie Banner
                </button>
                
                <button
                  type="button"
                  className={styles.previewButton}
                  onClick={() => {
                    // Show preferences modal
                    window.dispatchEvent(new CustomEvent('showCookiePreferences'));
                  }}
                >
                  ⚙️ Preview Preferences Modal
                </button>
              </div>
              
              <div className={styles.inputHint}>
                Use these buttons to test how the cookie consent system appears to users. The "Test Cookie Banner" button will reset consent and reload the page.
              </div>
            </div>

            {/* Statistics */}
            <div className={styles.cookieSection}>
              <h4>📊 Consent Statistics</h4>
              <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>-</div>
                  <div className={styles.statLabel}>Total Consents</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>-</div>
                  <div className={styles.statLabel}>Accept Rate</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>-</div>
                  <div className={styles.statLabel}>Decline Rate</div>
                </div>
                <div className={styles.statCard}>
                  <div className={styles.statValue}>-</div>
                  <div className={styles.statLabel}>Customized</div>
                </div>
              </div>
              <div className={styles.inputHint}>
                Cookie consent statistics will be available in future updates. Currently showing placeholder values.
              </div>
            </div>

          </div>
        )}
        
        <button 
          type="submit" 
          disabled={saving}
          className={styles.saveButton}
        >
          {saving ? (
            <>
              <span className={styles.saveSpinner}>⏳</span>
              Saving...
            </>
          ) : (
            <>
              💾 Save Advanced Settings
            </>
          )}
        </button>
      </form>
    </div>
  );
}

// Admin Content Component (inside AuthProvider)
function AdminContent() {
  const { loading, isAuthenticated } = useContext(AuthContext);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  return (
    <div className={styles.adminWrapper}>
      {isAuthenticated ? <AdminDashboard /> : <LoginForm />}
    </div>
  );
}
