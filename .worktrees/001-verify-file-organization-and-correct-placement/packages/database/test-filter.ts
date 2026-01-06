import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import { musicians } from './src/tenant/schema.js';
import { eq } from 'drizzle-orm';

const sql = postgres(`postgresql://postgres:password@localhost:5432/tenant_4`, {
  max: 1,
});

const db = drizzle(sql, { schema: { musicians } });

async function testFilter() {
  try {
    console.log('🔍 Testing filter by talentType...\n');

    // Test 1: All talents (no filter)
    console.log('Test 1: All talents');
    const all = await db.select().from(musicians);
    console.log(`Found ${all.length} talents:`, all.map(t => ({ id: t.id, name: t.name, talentType: t.talentType })));

    // Test 2: Filter by "musician"
    console.log('\nTest 2: Filter by musician');
    const musicianList = await db.select().from(musicians).where(eq(musicians.talentType, 'musician'));
    console.log(`Found ${musicianList.length} musicians:`, musicianList.map(t => ({ id: t.id, name: t.name, talentType: t.talentType })));

    // Test 3: Filter by "actor"
    console.log('\nTest 3: Filter by actor');
    const actorList = await db.select().from(musicians).where(eq(musicians.talentType, 'actor'));
    console.log(`Found ${actorList.length} actors:`, actorList.map(t => ({ id: t.id, name: t.name, talentType: t.talentType })));

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await sql.end();
  }
}

testFilter();
