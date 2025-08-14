---
title: Welcome to Docusaurus Admin Panel
description: A powerful documentation platform with integrated admin management
hide_table_of_contents: true
---

import Link from '@docusaurus/Link';

<!-- Hero Section -->
<section style={{
  background: 'var(--ifm-color-primary)',
  padding: '4rem 1rem',
  textAlign: 'center',
  borderRadius: '10px',
  color: 'var(--ifm-color-on-primary, #fff)'
}}>
  <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>� Docusaurus Admin Panel</h1>
  <p style={{ fontSize: '1.3rem' }}>
    Build beautiful documentation sites with powerful admin management capabilities.
  </p>
  <Link className="button button--lg button--success" style={{ marginTop: '2rem' }} to="/docs/intro">
    Get Started
  </Link>
</section>

---

<!-- Features Section -->
<section style={{ padding: '4rem 1rem', textAlign: 'center' }}>
  <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>✨ Why Docusaurus Admin Panel?</h2>
  
  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem' }}>
    <div style={{ maxWidth: '300px', padding: '1rem', borderRadius: '10px', background: 'var(--ifm-background-surface)', boxShadow: 'var(--ifm-global-shadow-lw)' }}>
      <h3>📝 Easy Content Management</h3>
      <p>Manage your documentation content with our intuitive admin interface.</p>
    </div>

    <div style={{ maxWidth: '300px', padding: '1rem', borderRadius: '10px', background: 'var(--ifm-background-surface)', boxShadow: 'var(--ifm-global-shadow-lw)' }}>
      <h3>🎨 Beautiful Themes</h3>
      <p>Customize your site appearance with built-in themes and styling options.</p>
    </div>

    <div style={{ maxWidth: '300px', padding: '1rem', borderRadius: '10px', background: 'var(--ifm-background-surface)', boxShadow: 'var(--ifm-global-shadow-lw)' }}>
      <h3>� Powerful Search</h3>
      <p>Built-in search functionality to help users find content quickly.</p>
    </div>

    <div style={{ maxWidth: '300px', padding: '1rem', borderRadius: '10px', background: 'var(--ifm-background-surface)', boxShadow: 'var(--ifm-global-shadow-lw)' }}>
      <h3>⚙️ Admin Dashboard</h3>
      <p>Comprehensive admin panel for managing settings, users, and content.</p>
    </div>
  </div>
</section>

---

<!-- Popular Categories Section -->
<section style={{ backgroundColor: 'var(--ifm-background-color)', padding: '4rem 1rem' }}>
  <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '3rem' }}>📚 Documentation Sections</h2>

  <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: '2rem' }}>
    <Link to="/docs/intro" style={{ textDecoration: 'none' }}>
      <div style={{ backgroundColor: 'var(--ifm-background-surface)', padding: '2rem', borderRadius: '10px', width: '260px', textAlign: 'center', boxShadow: 'var(--ifm-global-shadow-lw)' }}>
        <h3>🚀 Tutorial</h3>
        <p>Learn Docusaurus basics and create your first site.</p>
      </div>
    </Link>

    <Link to="/docs/tutorial-basics" style={{ textDecoration: 'none' }}>
      <div style={{ backgroundColor: 'var(--ifm-background-surface)', padding: '2rem', borderRadius: '10px', width: '260px', textAlign: 'center', boxShadow: 'var(--ifm-global-shadow-lw)' }}>
        <h3>📚 Tutorial Basics</h3>
        <p>Essential features and basic concepts.</p>
      </div>
    </Link>

    <Link to="/docs/tutorial-extras" style={{ textDecoration: 'none' }}>
      <div style={{ backgroundColor: 'var(--ifm-background-surface)', padding: '2rem', borderRadius: '10px', width: '260px', textAlign: 'center', boxShadow: 'var(--ifm-global-shadow-lw)' }}>
        <h3>⚡ Advanced Features</h3>
        <p>Advanced features and customization options.</p>
      </div>
    </Link>

    <Link to="/admin" style={{ textDecoration: 'none' }}>
      <div style={{ backgroundColor: 'var(--ifm-background-surface)', padding: '2rem', borderRadius: '10px', width: '260px', textAlign: 'center', boxShadow: 'var(--ifm-global-shadow-lw)' }}>
        <h3>⚙️ Admin Panel</h3>
        <p>Manage settings, content, and site configuration.</p>
      </div>
    </Link>
  </div>
</section>

---

<!-- Call To Action Section -->
<section style={{
  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  padding: '4rem 1rem',
  textAlign: 'center',
  borderRadius: '10px',
  color: '#ffffff',
  margin: '4rem auto'
}}>
  <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>Ready to Get Started?</h2>
  <p style={{ fontSize: '1.3rem', marginBottom: '2rem' }}>
    Build amazing documentation sites with Docusaurus and manage them with our admin panel.
  </p>
  <Link className="button button--lg button--success" style={{ marginTop: '1rem' }} to="/docs/intro">
    Start Building
  </Link>
</section>
