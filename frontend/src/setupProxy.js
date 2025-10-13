const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/api',
    createProxyMiddleware({
      target: process.env.REACT_APP_API_URL || 'http://backend:5000',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api/v1'
      }
    })
  );
};
