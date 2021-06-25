const createProxyMiddleware = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/rest',
    createProxyMiddleware({
      target: 'https://crawler.tmio.io',
      changeOrigin: true,
    })
  );
};