#!/usr/bin/env node
/**
 * End-to-end test for the coach webapp auto-login (Shopify -> Firebase custom
 * token) flow. It calls the new /api/mint-token endpoint the same way the
 * `/auth` session-transfer page does, then proves each minted token actually
 * establishes a real Firebase session.
 *
 * PREREQUISITE — start the webapp locally first (so /api/mint-token exists):
 *     npm run dev            # serves http://localhost:3000
 *
 * RUN:
 *     node test_coach_autologin.mjs
 *
 * OPTIONAL env overrides:
 *     BASE_URL=http://localhost:3000
 *     EXISTING_EMAIL=someone@who.exists         # a real coach/Shopify user
 *     MAIN_CUSTOMER_ID=8154997817563            # their main-store Shopify id
 *     INDIA_CUSTOMER_ID=1234567890              # their india-store Shopify id
 *
 * Fill in the real customer IDs to exercise the positive-verification paths
 * (verifiedVia = "stored-id" / "india-admin"). Left at the defaults, they
 * exercise the lenient path (verifiedVia = "unverified-lenient") — both should
 * still mint a working token for an existing user.
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";
// Public Firebase Web API key for getfit-with-elefit (safe to include).
const FIREBASE_API_KEY =
  process.env.FIREBASE_API_KEY || "AIzaSyA2zu144EAVw0j7lC9uTyjPfBmSW7jHEbU";

const EXISTING_EMAIL = process.env.EXISTING_EMAIL || "vanam.abhinav005@gmail.com";
const MAIN_CUSTOMER_ID = process.env.MAIN_CUSTOMER_ID || "0000000000000";
const INDIA_CUSTOMER_ID = process.env.INDIA_CUSTOMER_ID || "1111111111111";

// A fresh, clearly-marked email + id for the "new account" test.
const NEW_EMAIL = `autologin-test-${Date.now()}@elefit-test.dev`;
const NEW_CUSTOMER_ID = String(9000000000000 + Math.floor(Math.random() * 1e12));

async function mint(email, customerId) {
  let res, body;
  try {
    res = await fetch(`${BASE_URL}/api/mint-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, customerId }),
    });
  } catch (e) {
    console.error(
      `\n❌ Could not reach ${BASE_URL}/api/mint-token — is the webapp running (npm run dev)?\n   ${e.message}\n`
    );
    process.exit(2);
  }
  try {
    body = await res.json();
  } catch {
    body = null;
  }
  return { status: res.status, body };
}

// Proves the minted custom token really signs the user into Firebase Auth.
async function verifyCustomToken(token) {
  const res = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, returnSecureToken: true }),
    }
  );
  const body = await res.json();
  return { ok: res.ok && !!body.idToken, uid: body.localId, error: body.error?.message };
}

let pass = 0;
let fail = 0;
function check(name, cond, detail = "") {
  if (cond) {
    pass++;
    console.log(`  ✅ ${name}`);
  } else {
    fail++;
    console.log(`  ❌ ${name}${detail ? "  — " + detail : ""}`);
  }
}

console.log(`\n▶ Coach auto-login tests against ${BASE_URL}\n`);

// ── 1. NEW account ────────────────────────────────────────────────────────
{
  console.log(`1) New account  (${NEW_EMAIL})`);
  const { status, body } = await mint(NEW_EMAIL, NEW_CUSTOMER_ID);
  check("mint returns 200 ok", status === 200 && body?.ok === true, JSON.stringify(body));
  check("flagged isNew=true", body?.isNew === true);
  check("verifiedVia=new-user", body?.verifiedVia === "new-user");
  check("token present", typeof body?.token === "string" && body.token.length > 0);
  if (body?.token) {
    const v = await verifyCustomToken(body.token);
    check("custom token establishes a Firebase session", v.ok, v.error || "");
    check("session uid matches minted uid", v.uid === body.uid, `${v.uid} vs ${body.uid}`);
  }
  console.log(
    `   ⚠️  clean up the test user (${NEW_EMAIL}, uid ${body?.uid}) from the Firebase console after.\n`
  );
}

// ── 2. EXISTING account, MAIN store id ────────────────────────────────────
{
  console.log(`2) Existing account, MAIN store id  (${EXISTING_EMAIL})`);
  const { status, body } = await mint(EXISTING_EMAIL, MAIN_CUSTOMER_ID);
  check("mint returns 200 ok", status === 200 && body?.ok === true, JSON.stringify(body));
  check("existing user (isNew=false)", body?.isNew === false);
  check("token present", typeof body?.token === "string" && body.token.length > 0);
  console.log(`   verifiedVia = ${body?.verifiedVia}`);
  if (body?.token) {
    const v = await verifyCustomToken(body.token);
    check("custom token establishes a Firebase session", v.ok, v.error || "");
  }
  console.log("");
}

// ── 3. EXISTING account, INDIA store id (same email → other store) ────────
{
  console.log(`3) Existing account, INDIA store id  (${EXISTING_EMAIL})`);
  const { status, body } = await mint(EXISTING_EMAIL, INDIA_CUSTOMER_ID);
  check("mint returns 200 ok", status === 200 && body?.ok === true, JSON.stringify(body));
  check("token present", typeof body?.token === "string" && body.token.length > 0);
  console.log(
    `   verifiedVia = ${body?.verifiedVia}  → same email mints from BOTH stores (cross-store works)`
  );
  if (body?.token) {
    const v = await verifyCustomToken(body.token);
    check("custom token establishes a Firebase session", v.ok, v.error || "");
  }
  console.log("");
}

// ── 4. Bad request — missing email is rejected ────────────────────────────
{
  console.log("4) Rejects a request with no email");
  const { status, body } = await mint("", "123");
  check("returns HTTP 400", status === 400, `got ${status}`);
  check("ok=false", body?.ok === false);
  console.log("");
}

console.log(`──────────  ${pass} passed, ${fail} failed  ──────────\n`);
process.exit(fail > 0 ? 1 : 0);
