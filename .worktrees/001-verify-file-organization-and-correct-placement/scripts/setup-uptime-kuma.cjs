#!/usr/bin/env node

/**
 * Uptime Kuma Auto-Configuration Script
 *
 * This script automatically configures Uptime Kuma monitors for Recording Studio Manager.
 *
 * Prerequisites:
 * 1. Uptime Kuma must be running on http://localhost:3001
 * 2. You must have created an admin account via the web interface first
 * 3. Install dependencies: npm install socket.io-client
 *
 * Usage:
 *   node scripts/setup-uptime-kuma.js --username admin --password YOUR_PASSWORD
 */

const io = require('socket.io-client');

// Parse command line arguments
const args = process.argv.slice(2);
const username = args[args.indexOf('--username') + 1];
const password = args[args.indexOf('--password') + 1];

if (!username || !password) {
  console.error('❌ Error: Missing credentials');
  console.error('');
  console.error('Usage:');
  console.error('  node scripts/setup-uptime-kuma.js --username admin --password YOUR_PASSWORD');
  console.error('');
  console.error('First, create an admin account by visiting http://localhost:3001');
  process.exit(1);
}

const UPTIME_KUMA_URL = 'http://localhost:3001';
const DOMAIN = 'https://recording-studio-manager.com';

const monitors = [
  {
    type: 'http',
    name: 'RSM - Basic Health',
    url: `${DOMAIN}/api/health`,
    interval: 60,
    keyword: '"status":"ok"',
    description: 'Basic server health check (uptime, status)',
  },
  {
    type: 'http',
    name: 'RSM - Redis Health',
    url: `${DOMAIN}/api/health/redis`,
    interval: 60,
    keyword: '"service":"redis"',
    description: 'Redis connectivity check',
  },
  {
    type: 'http',
    name: 'RSM - Full System Health',
    url: `${DOMAIN}/api/health/full`,
    interval: 60,
    keyword: '"server"',
    description: 'Comprehensive system health (server, database, redis)',
    acceptedStatusCodes: ['200-299', '503'], // Accept degraded status
  },
];

console.log('🚀 Connecting to Uptime Kuma...');

const socket = io(UPTIME_KUMA_URL);

socket.on('connect', () => {
  console.log('✅ Connected to Uptime Kuma');

  // Login
  console.log('🔐 Logging in...');
  socket.emit('login', { username, password, token: '' }, (res) => {
    if (res.ok) {
      console.log('✅ Logged in successfully');

      // Get existing monitors first
      socket.emit('getMonitorList', (res) => {
        const existingMonitors = res || [];
        console.log(`📊 Found ${existingMonitors.length} existing monitors`);

        // Create each monitor
        let created = 0;
        monitors.forEach((monitor, index) => {
          // Check if monitor already exists
          const exists = existingMonitors.find(m => m.name === monitor.name);

          if (exists) {
            console.log(`⏭️  Skipping "${monitor.name}" (already exists)`);
            return;
          }

          console.log(`📊 Creating monitor: ${monitor.name}...`);

          const monitorData = {
            type: monitor.type,
            name: monitor.name,
            url: monitor.url,
            interval: monitor.interval,
            keyword: monitor.keyword,
            description: monitor.description,
            maxretries: 3,
            retryInterval: 60,
            notificationIDList: [],
            active: true,
          };

          if (monitor.acceptedStatusCodes) {
            monitorData.accepted_statuscodes = monitor.acceptedStatusCodes;
          }

          socket.emit('add', monitorData, (res) => {
            if (res.ok) {
              created++;
              console.log(`✅ Created: ${monitor.name}`);

              // If this was the last monitor, disconnect
              if (index === monitors.length - 1) {
                setTimeout(() => {
                  console.log('');
                  console.log('🎉 Setup complete!');
                  console.log('');
                  console.log(`📊 Created ${created} new monitors`);
                  console.log('');
                  console.log('View your dashboard at: http://localhost:3001/dashboard');
                  socket.disconnect();
                  process.exit(0);
                }, 1000);
              }
            } else {
              console.error(`❌ Failed to create ${monitor.name}:`, res.msg);
            }
          });
        });

        if (created === 0 && existingMonitors.length === monitors.length) {
          console.log('');
          console.log('ℹ️  All monitors already configured!');
          console.log('');
          console.log('View your dashboard at: http://localhost:3001/dashboard');
          socket.disconnect();
          process.exit(0);
        }
      });
    } else {
      console.error('❌ Login failed:', res.msg);
      console.error('');
      console.error('Make sure you:');
      console.error('1. Created an admin account at http://localhost:3001');
      console.error('2. Used the correct username and password');
      socket.disconnect();
      process.exit(1);
    }
  });
});

socket.on('connect_error', (error) => {
  console.error('❌ Connection failed:', error.message);
  console.error('');
  console.error('Make sure Uptime Kuma is running:');
  console.error('  docker ps | grep uptime-kuma');
  process.exit(1);
});

socket.on('error', (error) => {
  console.error('❌ Socket error:', error);
  process.exit(1);
});

// Timeout after 30 seconds
setTimeout(() => {
  console.error('❌ Timeout: Operation took too long');
  socket.disconnect();
  process.exit(1);
}, 30000);
