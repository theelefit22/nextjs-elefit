import {
  initializeApp,
  getApps,
  cert,
  App,
  ServiceAccount,
} from "firebase-admin/app";
import { getAuth, Auth } from "firebase-admin/auth";
import { getFirestore, Firestore } from "firebase-admin/firestore";

/**
 * Server-side Firebase Admin SDK.
 *
 * The service-account credentials are loaded from an environment variable
 * (base64-encoded JSON) — NEVER from a committed file — so the private signing
 * key stays out of the repo. Set FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 in
 * .env.local (local) and in the hosting env (e.g. Vercel) for production.
 *
 * This module must only ever be imported from server code (API routes /
 * server actions). Importing it into a client component will fail the build.
 */

let cachedApp: App | null = null;

function loadServiceAccount(): ServiceAccount {
  const b64 = process.env.FIREBASE_SERVICE_ACCOUNT_KEY_BASE64;
  if (b64) {
    const json = Buffer.from(b64, "base64").toString("utf8");
    return JSON.parse(json) as ServiceAccount;
  }
  // Fallback: raw JSON string (in case someone set the un-encoded variant).
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (raw) {
    return JSON.parse(raw) as ServiceAccount;
  }
  throw new Error(
    "Missing FIREBASE_SERVICE_ACCOUNT_KEY_BASE64 — Firebase Admin cannot initialize."
  );
}

function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  // Reuse an already-initialized app across hot reloads / multiple imports.
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }
  cachedApp = initializeApp({
    credential: cert(loadServiceAccount()),
  });
  return cachedApp;
}

export function getAdminAuth(): Auth {
  return getAuth(getAdminApp());
}

export function getAdminDb(): Firestore {
  return getFirestore(getAdminApp());
}
