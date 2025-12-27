#!/usr/bin/env node

import https from 'https';

const data = JSON.stringify({
  email: 'test-direct-' + Date.now() + '@example.com',
  password: 'TestPass123!',
  name: 'Direct Test',
  organizationName: 'Direct Test Studio'
});

const options = {
  hostname: 'recording-studio-manager.com',
  port: 443,
  path: '/api/trpc/auth.register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length,
  },
};

const req = https.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers, null, 2)}`);

  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });

  res.on('end', () => {
    console.log(`\nResponse body:`);
    console.log(body);
    try {
      const parsed = JSON.parse(body);
      console.log('\nParsed JSON:');
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log('Not JSON');
    }
  });
});

req.on('error', (error) => {
  console.error(`Error: ${error.message}`);
});

req.write(data);
req.end();
