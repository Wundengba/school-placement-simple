(async () => {
  const endpoints = [
    'https://backend-seven-ashen-18.vercel.app/api/health',
    'https://backend-seven-ashen-18.vercel.app/api/db-status',
    'https://backend-seven-ashen-18.vercel.app/api/sync/download'
  ];

  for (const url of endpoints) {
    try {
      console.log(`Testing: ${url}`);
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      console.log('  Status:', res.status);
      if (res.ok) {
        try {
          const data = await res.json();
          console.log('  Data:', JSON.stringify(data).substring(0, 100));
        } catch (e) {
          console.log('  (no JSON response)');
        }
      }
    } catch(e) {
      console.log('  Error:', e.name === 'AbortError' ? 'TIMEOUT' : e.message);
    }
  }
})().catch(e => console.error('Fatal error:', e));
