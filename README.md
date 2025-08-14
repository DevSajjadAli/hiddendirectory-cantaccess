# Docusaurus Admin Panel

A comprehensive documentation platform built with [Docusaurus](https://docusaurus.io/) featuring an integrated admin panel for content management.

## Features

- 📚 **Docusaurus-powered** documentation site
- ⚙️ **Admin Panel** for content management
- 🍪 **Cookie Consent** system with GDPR/CCPA compliance
- 🔍 **Built-in Search** functionality
- 🎨 **Customizable Themes** and styling
- 📱 **Mobile Responsive** design
- 🔐 **Admin Authentication** system

## Installation

```bash
npm install
```

## Local Development

```bash
npm start
```

This command starts the unified development server with both the Docusaurus site and admin panel available at:
- Documentation: http://localhost:3000
- Admin Panel: http://localhost:3000/admin

Most changes are reflected live without having to restart the server.

## Build

```bash
npm run build
```

This command generates static content into the `build` directory and can be served using any static contents hosting service.

## Admin Panel

The admin panel provides a WordPress-like interface for managing:
- Site settings and configuration
- Documentation categories and content
- Blog posts and authors
- Media uploads
- Cookie consent settings
- Analytics configuration

Access the admin panel at `/admin` and use the following default credentials:
- Username: `admin`
- Password: `admin123`

## Deployment

Using SSH:

```bash
USE_SSH=true npm run deploy
```

Not using SSH:

```bash
GIT_USER=<Your GitHub username> npm run deploy
```

If you are using GitHub pages for hosting, this command is a convenient way to build the website and push to the `gh-pages` branch.
