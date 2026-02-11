const urls = [
  'https://backend-seven-ashen-18.vercel.app/api/health',
  'https://backend-seven-ashen-18.vercel.app/api/migration-status',
  'https://backend-seven-ashen-18.vercel.app/api/sync/download'
];

async function testEndpoints() {
  for (const url of urls) {
    try {
      console.log(`\nTesting: ${url}`);
      const response = await fetch(url, { timeout: 10000 });
      console.log(`Status: ${response.status} ${response.statusText}`);
      const data = await response.json();
      console.log('Response:', JSON.stringify(data, null, 2).substring(0, 500));
    } catch (error) {
      console.error(`Error: ${error.message}`);
    }
  }
}

testEndpoints();
