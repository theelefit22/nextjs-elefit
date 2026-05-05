#!/usr/bin/env node
/**
 * Shopify Storefront API Setup Script
 *
 * Run: node scripts/setup-shopify.js
 *
 * This script:
 * 1. Tests your existing admin tokens for both stores
 * 2. Lists or creates Storefront API access tokens
 * 3. Tests the Storefront tokens
 * 4. Detects customer accounts type (Classic vs New)
 * 5. Prints the env vars you need to add to .env.local
 */

// ──────────────────────────────────────────────────────────
// READ CONFIG FROM ENV
// ──────────────────────────────────────────────────────────
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

function parseEnv(path) {
  try {
    const content = readFileSync(path, 'utf8');
    const vars = {};
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
      vars[key] = value;
    }
    return vars;
  } catch {
    return {};
  }
}

const env = parseEnv(envPath);

const API_VERSION = '2025-01';

const STORES = {
  us: {
    label: 'US Store',
    domain: env.NEXT_PUBLIC_SHOPIFY_DOMAIN || '840a56-3.myshopify.com',
    adminToken:
      env.SHOPIFY_US_ADMIN_TOKEN ||          // preferred: non-public server key
      env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN || // fallback: old private app token
      '',
    existingStorefrontToken:
      env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ||
      env.NEXT_PUBLIC_SHOPIFY_ACCESS_TOKEN ||
      '',
  },
  india: {
    label: 'India Store',
    domain: env.NEXT_PUBLIC_SHOPIFY_INDIA_DOMAIN || 'nad691-1n.myshopify.com',
    adminToken:
      env.SHOPIFY_INDIA_ADMIN_TOKEN ||
      env.NEXT_PUBLIC_SHOPIFY_INDIA_STOREFRONT_ACCESS_TOKEN || // this was actually an admin token
      '',
    existingStorefrontToken:
      env.NEXT_PUBLIC_SHOPIFY_INDIA_STOREFRONT_TOKEN || '',
  },
};

// ──────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────
const log = {
  info:  (msg) => console.log(`\x1b[36mℹ  ${msg}\x1b[0m`),
  ok:    (msg) => console.log(`\x1b[32m✓  ${msg}\x1b[0m`),
  warn:  (msg) => console.log(`\x1b[33m⚠  ${msg}\x1b[0m`),
  error: (msg) => console.log(`\x1b[31m✗  ${msg}\x1b[0m`),
  head:  (msg) => console.log(`\n\x1b[1m${msg}\x1b[0m`),
  raw:   (msg) => console.log(msg),
};

async function adminRestGet(domain, adminToken, path) {
  const url = `https://${domain}/admin/api/${API_VERSION}${path}`;
  const res = await fetch(url, {
    headers: { 'X-Shopify-Access-Token': adminToken },
  });
  return { status: res.status, body: await res.json() };
}

async function adminRestPost(domain, adminToken, path, payload) {
  const url = `https://${domain}/admin/api/${API_VERSION}${path}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify(payload),
  });
  return { status: res.status, body: await res.json() };
}

async function adminGraphQL(domain, adminToken, query, variables = {}) {
  const url = `https://${domain}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  return { status: res.status, body: await res.json() };
}

async function storefrontTest(domain, token) {
  const url = `https://${domain}/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query: '{ shop { name } }' }),
  });
  const body = await res.json();
  return { status: res.status, shopName: body?.data?.shop?.name };
}

// ──────────────────────────────────────────────────────────
// MAIN
// ──────────────────────────────────────────────────────────
async function processStore(key, cfg) {
  log.head(`━━━ ${cfg.label} (${cfg.domain}) ━━━`);

  const result = { key, domain: cfg.domain, storefrontToken: null, adminWorks: false, customerAccountsType: 'UNKNOWN' };

  // 1. Test admin token
  if (!cfg.adminToken) {
    log.error('No admin token found. Check your .env.local for SHOPIFY_US_ADMIN_TOKEN or SHOPIFY_INDIA_ADMIN_TOKEN');
    return result;
  }

  const shopRes = await adminRestGet(cfg.domain, cfg.adminToken, '/shop.json');
  if (shopRes.status !== 200) {
    log.error(`Admin token rejected (HTTP ${shopRes.status}). Token: ${cfg.adminToken.slice(0, 8)}...`);
    log.warn('Go to Shopify Admin → Settings → Apps → Develop Apps → Create app → Get Admin API token');
    return result;
  }

  result.adminWorks = true;
  log.ok(`Admin API works — store: "${shopRes.body.shop.name}"`);

  // 2. Check customer accounts type via GraphQL
  const caQuery = `{ shop { customerAccountsVersion } }`;
  const caRes = await adminGraphQL(cfg.domain, cfg.adminToken, caQuery);
  const caVersion = caRes.body?.data?.shop?.customerAccountsVersion;
  result.customerAccountsType = caVersion || 'UNKNOWN';

  if (caVersion === 'NEW_CUSTOMER_ACCOUNTS') {
    log.warn(`Customer accounts type: NEW (new-style OAuth accounts)`);
    log.warn(`Action needed: Go to Settings → Customer accounts → switch to "Classic customer accounts"`);
    log.warn(`This is required for customerAccessTokenCreate (login) to work via Storefront API`);
  } else if (caVersion === 'CLASSIC') {
    log.ok(`Customer accounts type: CLASSIC — Storefront API login mutations will work`);
  } else {
    log.warn(`Customer accounts type: ${caVersion || 'could not detect'}`);
  }

  // 3. Test existing Storefront token if we have one
  if (cfg.existingStorefrontToken) {
    log.info(`Testing existing Storefront token: ${cfg.existingStorefrontToken.slice(0, 8)}...`);
    const sfTest = await storefrontTest(cfg.domain, cfg.existingStorefrontToken);
    if (sfTest.shopName) {
      log.ok(`Existing Storefront token works — shop: "${sfTest.shopName}"`);
      result.storefrontToken = cfg.existingStorefrontToken;
    } else {
      log.warn(`Existing Storefront token failed (HTTP ${sfTest.status}). Will create a new one.`);
    }
  }

  // 4. List existing Storefront tokens
  const listRes = await adminRestGet(cfg.domain, cfg.adminToken, '/storefront_access_tokens.json');
  const existingTokens = listRes.body?.storefront_access_tokens || [];

  if (existingTokens.length > 0) {
    log.info(`Found ${existingTokens.length} existing Storefront token(s):`);
    for (const t of existingTokens) {
      log.raw(`    Title: "${t.title}"  |  Scopes: ${t.access_scope}`);
      log.raw(`    Token: ${t.access_token}`);
    }
    // Use the first one if we don't have a working token yet
    if (!result.storefrontToken) {
      result.storefrontToken = existingTokens[0].access_token;
      log.info(`Using existing token: ${result.storefrontToken.slice(0, 8)}...`);
    }
  }

  // 5. Create a new Storefront token if we still don't have one
  if (!result.storefrontToken) {
    log.info('Creating new Storefront API access token...');
    const createRes = await adminRestPost(
      cfg.domain,
      cfg.adminToken,
      '/storefront_access_tokens.json',
      {
        storefront_access_token: {
          title: 'EleFit Coach App',
        },
      }
    );

    if (createRes.status === 200 || createRes.status === 201) {
      result.storefrontToken = createRes.body.storefront_access_token.access_token;
      log.ok(`Created new Storefront token: ${result.storefrontToken.slice(0, 8)}...`);
    } else {
      log.error(`Failed to create Storefront token: ${JSON.stringify(createRes.body)}`);
    }
  }

  // 6. Final Storefront token test
  if (result.storefrontToken) {
    const finalTest = await storefrontTest(cfg.domain, result.storefrontToken);
    if (finalTest.shopName) {
      log.ok(`Storefront token verified — shop: "${finalTest.shopName}"`);
    } else {
      log.error(`Storefront token still not working (HTTP ${finalTest.status})`);
    }
  }

  return result;
}

async function main() {
  console.log('\n\x1b[1m🔧 EleFit Shopify API Setup\x1b[0m');
  console.log('━'.repeat(50));

  const results = [];
  for (const [key, cfg] of Object.entries(STORES)) {
    results.push(await processStore(key, cfg));
  }

  // ── Print env vars to add ──
  log.head('━━━ ENV VARS TO ADD/UPDATE IN .env.local ━━━');
  console.log('\n# ── Shopify API Version ──');
  console.log(`NEXT_PUBLIC_SHOPIFY_API_VERSION=2025-01`);

  for (const r of results) {
    const prefix = r.key === 'us' ? '' : '_INDIA';
    const envPrefix = r.key === 'us' ? 'US' : 'INDIA';

    console.log(`\n# ── ${r.key === 'us' ? 'US' : 'India'} Store (${r.domain}) ──`);
    console.log(`SHOPIFY_${envPrefix}_ADMIN_TOKEN=<your_admin_token>`);
    if (r.storefrontToken) {
      console.log(`NEXT_PUBLIC_SHOPIFY${prefix}_DOMAIN=${r.domain}`);
      console.log(`NEXT_PUBLIC_SHOPIFY${prefix}_STOREFRONT_TOKEN=${r.storefrontToken}`);
    } else {
      console.log(`NEXT_PUBLIC_SHOPIFY${prefix}_STOREFRONT_TOKEN=<FAILED - see errors above>`);
    }

    if (r.customerAccountsType === 'NEW_CUSTOMER_ACCOUNTS') {
      console.log(`\n⚠️  ACTION REQUIRED for ${r.domain}:`);
      console.log(`   Shopify Admin → Settings → Customer accounts → Classic customer accounts`);
    }
  }

  log.head('━━━ SUMMARY ━━━');
  for (const r of results) {
    const statusIcon = r.storefrontToken ? '✓' : '✗';
    const adminIcon = r.adminWorks ? '✓' : '✗';
    log.raw(`${r.key === 'us' ? 'US Store   ' : 'India Store'}: Admin ${adminIcon} | Storefront ${statusIcon} | Accounts: ${r.customerAccountsType}`);
  }

  console.log('\nDone. Add the env vars above to .env.local then run this script again to verify.\n');
}

main().catch((err) => {
  console.error('\nFatal error:', err.message);
  process.exit(1);
});
