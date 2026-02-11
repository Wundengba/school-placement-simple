// Test simple HTTP request to backend
const https = require('https');

const options = {
  hostname: 'backend-seven-ashen-18.vercel.app',
  port: 443,
  path: '/api/health',
  method: 'GET',
  timeout: 10000,
  headers: {
    'User-Agent': 'Node.js'
  }
};

console.log('Testing:', `https://${options.hostname}${options.path}`);

const req = https.request(options, (res) => {
  console.log('Status:', res.statusCode, res.statusMessage);
  console.log('Headers:', res.headers);

  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data.substring(0, 500));
  });
});

req.on('error', (error) => {
  console.error('Error:', error.message);
  console.error('Code:', error.code);
});

req.on('timeout', () => {
  console.error('Request timeout');
  req.destroy();
});

req.end();
