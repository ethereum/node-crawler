const createProxyMiddleware = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    '/v1',
    createProxyMiddleware({
      target: process.env.CRAWLER_API_URL,
      changeOrigin: true,
    })
  );
};
