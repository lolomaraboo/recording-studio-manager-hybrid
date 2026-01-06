import { chromium } from 'playwright';

async function inspectRegisterPage() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  await page.goto('http://localhost:5174/register');
  await page.waitForLoadState('domcontentloaded');
  
  console.log('📋 Inspection de la page Register...\n');
  
  // Get all input fields
  const inputs = await page.$$('input');
  console.log(`Nombre d'inputs: ${inputs.length}\n`);
  
  for (let i = 0; i < inputs.length; i++) {
    const input = inputs[i];
    const type = await input.getAttribute('type');
    const name = await input.getAttribute('name');
    const placeholder = await input.getAttribute('placeholder');
    const id = await input.getAttribute('id');
    
    console.log(`Input ${i + 1}:`);
    console.log(`  type: ${type}`);
    console.log(`  name: ${name}`);
    console.log(`  placeholder: ${placeholder}`);
    console.log(`  id: ${id}`);
    console.log('');
  }
  
  // Screenshot
  await page.screenshot({ path: '.playwright-mcp/register-page-inspect.png', fullPage: true });
  console.log('Screenshot: .playwright-mcp/register-page-inspect.png');
  
  console.log('\n⏸️  Browser reste ouvert 10s...');
  await page.waitForTimeout(10000);
  
  await browser.close();
}

inspectRegisterPage();
