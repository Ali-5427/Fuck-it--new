// api/index.js - overwritten by npm run build
export default function handler(_req, res) {
  res.statusCode = 503;
  res.end('API not built');
}
