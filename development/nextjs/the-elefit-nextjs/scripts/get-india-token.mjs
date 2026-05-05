/**
 * Shopify OAuth token fetcher — India store
 *
 * SETUP (one-time, in Dev Dashboard):
 *   App URL      → http://localhost:3456
 *   Redirect URL → http://localhost:3456/callback
 *   Release new version, then run: node scripts/get-india-token.mjs
 *
 * THEN open the app from your India store admin:
 *   https://nad691-1n.myshopify.com/admin/apps
 *   click "elefit india 2"
 */

import http from 'http';
import { exec } from 'child_process';

const CLIENT_ID     = '33c7d469e8a5d7461cce38e3a3b8358d';
const CLIENT_SECRET = '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';
const SHOP          = 'nad691-1n.myshopify.com';
const REDIRECT_URI  = 'http://localhost:3456/callback';
const SCOPES        = 'read_customers,write_customers';
const API_VERSION   = '2025-01';

const STATE = Math.random().toString(36).slice(2);

function buildAuthUrl() {
  return (
    `https://${SHOP}/admin/oauth/authorize` +
    `?client_id=${CLIENT_ID}` +
    `&scope=${SCOPES}` +
    `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
    `&state=${STATE}` +
    `&grant_options[]=offline`
  );
}

async function exchangeCode(code) {
  const res = await fetch(`https://${SHOP}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: CLIENT_ID, client_secret: CLIENT_SECRET, code }),
  });
  return res.json();
}

async function getOrCreateStorefrontToken(adminToken) {
  // List existing first
  const listRes = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/storefront_access_tokens.json`,
    { headers: { 'X-Shopify-Access-Token': adminToken } }
  );
  const listData = await listRes.json();
  const existing = listData?.storefront_access_tokens?.[0]?.access_token;
  if (existing) return { token: existing, created: false };

  // Create new
  const createRes = await fetch(
    `https://${SHOP}/admin/api/${API_VERSION}/storefront_access_tokens.json`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': adminToken },
      body: JSON.stringify({ storefront_access_token: { title: 'EleFit Coach App India' } }),
    }
  );
  const createData = await createRes.json();
  return { token: createData?.storefront_access_token?.access_token, created: true };
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost:3456');

  // ── Shopify loads the app at / (App URL) → we redirect to OAuth ──
  if (url.pathname === '/') {
    const shop = url.searchParams.get('shop');
    if (shop) {
      console.log(`\n✓ App loaded from Shopify (shop: ${shop}) — redirecting to OAuth...`);
      const authUrl = buildAuthUrl();
      res.writeHead(302, { Location: authUrl });
      res.end();
    } else {
      // Direct browser hit — send them to the store to install/open the app
      const installUrl = `https://${SHOP}/admin/apps`;
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`<h2 style="font-family:sans-serif">
        Waiting for Shopify to load the app...<br><br>
        <a href="${installUrl}" target="_blank">Click here to open your app in Shopify Admin</a>
      </h2>`);
    }
    return;
  }

  // ── OAuth callback at /callback ──
  if (url.pathname === '/callback') {
    const code  = url.searchParams.get('code');
    const state = url.searchParams.get('state');

    if (!code) {
      res.end('No code received. Check Dev Dashboard settings and try again.');
      return;
    }

    if (state !== STATE) {
      res.end('State mismatch. Run the script again.');
      server.close();
      return;
    }

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end('<h2 style="font-family:sans-serif;padding:40px">✓ Authorized! Check your terminal.</h2>');
    server.close();

    console.log('\n✓ Got authorization code — exchanging for access token...');
    const tokenData = await exchangeCode(code);

    if (!tokenData.access_token) {
      console.error('✗ Token exchange failed:', JSON.stringify(tokenData));
      process.exit(1);
    }

    const ADMIN_TOKEN = tokenData.access_token;
    console.log('\x1b[32m✓ Admin API token:\x1b[0m', ADMIN_TOKEN);
    console.log('  Scopes:', tokenData.scope);

    const { token: storefrontToken, created } = await getOrCreateStorefrontToken(ADMIN_TOKEN);

    if (storefrontToken) {
      console.log(`\x1b[32m✓ Storefront token (${created ? 'created' : 'existing'}):\x1b[0m`, storefrontToken);
    } else {
      console.error('✗ Could not get Storefront token');
    }

    console.log('\n\x1b[1m━━━ ADD THESE TO .env.local ━━━\x1b[0m');
    console.log(`\nSHOPIFY_INDIA_ADMIN_TOKEN=${ADMIN_TOKEN}`);
    if (storefrontToken) {
      console.log(`NEXT_PUBLIC_SHOPIFY_INDIA_STOREFRONT_TOKEN=${storefrontToken}`);
    }
    console.log('');
    return;
  }
});

server.listen(3456, () => {
  console.log('\n\x1b[1m🇮🇳  India Store Token Fetcher — listening on http://localhost:3456\x1b[0m');
  console.log('━'.repeat(60));
  console.log('\nMake sure Dev Dashboard has:');
  console.log('  App URL      → http://localhost:3456');
  console.log('  Redirect URL → http://localhost:3456/callback');
  console.log('\nThen open your app from Shopify Admin:');
  console.log('  https://nad691-1n.myshopify.com/admin/apps\n');
  exec('open "https://nad691-1n.myshopify.com/admin/apps"');
});
