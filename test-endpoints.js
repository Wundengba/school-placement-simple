const urls = [
  { name: 'Frontend App', url: 'https://school-placement-fresh-202602092227.vercel.app/', expectJSON: false },
  { name: 'Backend Health', url: 'https://backend-seven-ashen-18.vercel.app/api/health', expectJSON: true },
];

async function testEndpoints() {
  for (const endpoint of urls) {
    try {
      console.log(`\nTesting ${endpoint.name}: ${endpoint.url}`);
      const response = await fetch(endpoint.url, { timeout: 10000 });
      console.log(`Status: ${response.status} ${response.statusText}`);
      
      if (endpoint.expectJSON) {
        const data = await response.json();
        console.log(`Response: ${JSON.stringify(data).substring(0, 200)}`);
      } else {
        const text = await response.text();
        console.log(`Response length: ${text.length} bytes`);
        console.log(`Sample: ${text.substring(0, 100)}`);
      }
    } catch (error) {
      console.log(`✗ Error: ${error.message}`);
    }
  }
}

testEndpoints();
