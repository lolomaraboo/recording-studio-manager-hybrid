import { createTenantDatabase } from '../connection';

async function main() {
  console.log('Creating tenant database for organization 1...');
  await createTenantDatabase(1);
  console.log('✅ Tenant database created successfully');
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Failed:', err);
  process.exit(1);
});
