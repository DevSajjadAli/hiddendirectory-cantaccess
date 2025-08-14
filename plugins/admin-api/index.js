// Custom Docusaurus plugin for Admin API
const path = require('path');
const express = require('express');

module.exports = function (context, options) {
  return {
    name: 'admin-api-plugin',
    async loadContent() {
      // Plugin content loading logic
      return {};
    },
    configureWebpack() {
      return {
        resolve: {
          alias: {
            '@admin': path.resolve(__dirname, '../src/admin'),
          },
        },
      };
    },
    async contentLoaded({content, actions}) {
      // Content loaded logic
    },
    getPathsToWatch() {
      return [
        path.resolve(__dirname, '../src/api'),
        path.resolve(__dirname, '../src/admin')
      ];
    },
    async postBuild() {
      // Post-build logic
    },
    async postStart() {
      // Server setup after Docusaurus starts
    },
    // Add server-side API routes
    getRoutes() {
      return [
        {
          path: '/api/admin',
          exact: false,
          // This will be handled by our Express middleware
        }
      ];
    }
  };
};
