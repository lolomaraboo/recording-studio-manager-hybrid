import { createTenantDatabase } from '../services/tenant-provisioning';

console.log('Fixing tenant_7...');
createTenantDatabase(7).then(result => {
  console.log('Result:', result);
  process.exit(result.success ? 0 : 1);
}).catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
