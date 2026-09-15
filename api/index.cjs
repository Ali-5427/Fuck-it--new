const handler = require('../dist/vercel-backend.cjs').default;
module.exports = function(req, res) {
  return handler(req, res);
};
