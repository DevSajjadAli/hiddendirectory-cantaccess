const path = require('path');

// Admin Integration Plugin for Docusaurus
module.exports = function adminIntegrationPlugin(context, options) {
  return {
    name: 'admin-integration',
    
    async loadContent() {
      // This plugin can fetch admin configuration and apply it to Docusaurus
      // For now, it serves as a placeholder for future dynamic integration
      return {
        adminConfigApplied: true,
        timestamp: new Date().toISOString()
      };
    },
    
    async contentLoaded({ content, actions }) {
      const { createData, addRoute } = actions;
      
      // Create admin integration data
      await createData('admin-integration.json', JSON.stringify(content));
      
      // Add routes for admin integration if needed
      // This can be extended to dynamically create routes based on admin settings
    },
    
    configureWebpack(config, isServer, utils) {
      return {
        resolve: {
          alias: {
            '@admin-integration': path.resolve(__dirname)
          }
        }
      };
    }
  };
};
