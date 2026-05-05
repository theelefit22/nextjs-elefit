/**
 * India Store Shopify Setup
 * Run: node scripts/setup-india-store.mjs
 */

const INDIA_DOMAIN = 'nad691-1n.myshopify.com';
const INDIA_ADMIN_TOKEN = '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';
const API_VERSION = '2025-01';

const log = {
  ok:    (m) => console.log(`\x1b[32m✓  ${m}\x1b[0m`),
  warn:  (m) => console.log(`\x1b[33m⚠  ${m}\x1b[0m`),
  error: (m) => console.log(`\x1b[31m✗  ${m}\x1b[0m`),
  info:  (m) => console.log(`\x1b[36mℹ  ${m}\x1b[0m`),
};

async function adminGet(path) {
  const res = await fetch(`https://${INDIA_DOMAIN}/admin/api/${API_VERSION}${path}`, {
    headers: { 'X-Shopify-Access-Token': INDIA_ADMIN_TOKEN },
  });
  return { status: res.status, body: await res.json() };
}

async function adminPost(path, payload) {
  const res = await fetch(`https://${INDIA_DOMAIN}/admin/api/${API_VERSION}${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': INDIA_ADMIN_TOKEN,
    },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

async function adminGraphQL(query) {
  const res = await fetch(`https://${INDIA_DOMAIN}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': INDIA_ADMIN_TOKEN,
    },
    body: JSON.stringify({ query }),
  });
  return { status: res.status, body: await res.json() };
}

async function testStorefront(token) {
  const res = await fetch(`https://${INDIA_DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query: '{ shop { name } }' }),
  });
  const body = await res.json();
  return body?.data?.shop?.name;
}

async function main() {
  console.log('\n\x1b[1m🇮🇳  India Store Shopify Setup\x1b[0m');
  console.log('━'.repeat(45));

  // 1. Test admin token
  log.info(`Testing admin token for ${INDIA_DOMAIN}...`);
  const shopRes = await adminGet('/shop.json');
  if (shopRes.status !== 200) {
    log.error(`Admin token rejected (HTTP ${shopRes.status})`);
    console.log('\nResponse:', JSON.stringify(shopRes.body, null, 2));
    process.exit(1);
  }
  log.ok(`Admin API works — store: "${shopRes.body.shop.name}"`);

  // 2. Check customer accounts type
  const caRes = await adminGraphQL('{ shop { customerAccountsVersion } }');
  const caVersion = caRes.body?.data?.shop?.customerAccountsVersion;
  if (caVersion === 'NEW_CUSTOMER_ACCOUNTS') {
    log.warn('Customer accounts type: NEW (OAuth-based)');
    log.warn('For Storefront API login to work, go to:');
    log.warn('Shopify Admin → Settings → Customer accounts → Classic customer accounts');
  } else {
    log.ok(`Customer accounts type: ${caVersion || 'CLASSIC'}`);
  }

  // 3. List existing Storefront tokens
  const listRes = await adminGet('/storefront_access_tokens.json');
  const existing = listRes.body?.storefront_access_tokens || [];
  let storefrontToken = null;

  if (existing.length > 0) {
    log.info(`Found ${existing.length} existing Storefront token(s):`);
    for (const t of existing) {
      console.log(`   Title: "${t.title}"  Token: ${t.access_token}`);
    }
    // test the first one
    const shopName = await testStorefront(existing[0].access_token);
    if (shopName) {
      storefrontToken = existing[0].access_token;
      log.ok(`Existing token works — using it`);
    } else {
      log.warn('Existing token failed Storefront test — creating a new one');
    }
  }

  // 4. Create new token if needed
  if (!storefrontToken) {
    log.info('Creating new Storefront API access token...');
    const createRes = await adminPost('/storefront_access_tokens.json', {
      storefront_access_token: { title: 'EleFit Coach App India' },
    });
    if (createRes.status === 200 || createRes.status === 201) {
      storefrontToken = createRes.body.storefront_access_token.access_token;
      log.ok(`Created: ${storefrontToken}`);
    } else {
      log.error(`Failed: ${JSON.stringify(createRes.body)}`);
      process.exit(1);
    }
  }

  // 5. Final test
  const shopName = await testStorefront(storefrontToken);
  if (shopName) {
    log.ok(`Storefront token verified — shop: "${shopName}"`);
  } else {
    log.error('Storefront token not working after creation');
    process.exit(1);
  }

  // 6. Print result
  console.log('\n\x1b[1m━━━ ADD THIS TO .env.local ━━━\x1b[0m');
  console.log(`\nNEXT_PUBLIC_SHOPIFY_INDIA_DOMAIN=${INDIA_DOMAIN}`);
  console.log(`NEXT_PUBLIC_SHOPIFY_INDIA_STOREFRONT_TOKEN=${storefrontToken}`);
  console.log(`SHOPIFY_INDIA_ADMIN_TOKEN=${INDIA_ADMIN_TOKEN}`);
  console.log(`\nNOTE: Customer accounts type = ${caVersion}`);
  if (caVersion === 'NEW_CUSTOMER_ACCOUNTS') {
    console.log('⚠️  Switch to Classic accounts in Shopify Admin for login to work\n');
  } else {
    console.log('✓  Classic accounts — all login mutations will work\n');
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
