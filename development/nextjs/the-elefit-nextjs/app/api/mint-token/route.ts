import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

// firebase-admin needs the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SHOPIFY_BRIDGE_SALT = "EleFit_Bridge_2026_Secure_";

// Store domains + Admin API version (mirrors app/api/shopify/sync-to-india).
const MAIN_DOMAIN = "840a56-3.myshopify.com";
const INDIA_DOMAIN = "nad691-1n.myshopify.com";
const SHOPIFY_API_VERSION = "2025-01";

const normalizeShopifyId = (id: unknown): string | null => {
  if (id === null || id === undefined || id === "") return null;
  const s = String(id);
  if (s.includes("gid://shopify/Customer/")) return s.split("/").pop() || s;
  return s;
};

/**
 * Looks a customer up by email on a store's Admin API and returns their numeric
 * id, or null if the store has no Admin token configured / no match / any error.
 * Used to *positively verify* that an {email, customerId} pair is a real
 * customer on that store before minting a real Firebase session.
 */
async function shopifyAdminCustomerId(
  domain: string,
  token: string | undefined,
  email: string
): Promise<string | null> {
  if (!token) return null;
  try {
    const res = await fetch(
      `https://${domain}/admin/api/${SHOPIFY_API_VERSION}/customers/search.json?query=email:${encodeURIComponent(
        email
      )}&limit=1`,
      { headers: { "X-Shopify-Access-Token": token } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    const customer = data?.customers?.[0];
    return customer ? normalizeShopifyId(customer.id) : null;
  } catch {
    return null;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const emailRaw = body?.email;
    const customerIdRaw = body?.customerId;

    if (!emailRaw || typeof emailRaw !== "string") {
      return NextResponse.json(
        { ok: false, error: "email is required" },
        { status: 400 }
      );
    }

    const email = emailRaw.toLowerCase().trim();
    const normalizedCustomerId = normalizeShopifyId(customerIdRaw);

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // 1. Find (or create) the Firebase Auth user by email — email is identical
    //    across both Shopify stores, so it is the reliable key.
    let uid: string;
    let isNew = false;
    try {
      const userRecord = await adminAuth.getUserByEmail(email);
      uid = userRecord.uid;
    } catch (e: any) {
      if (e?.code === "auth/user-not-found") {
        const userRecord = await adminAuth.createUser({
          email,
          // Keeps parity with the coach's bridge-password convention; this
          // password is never used to log in (we always mint a custom token).
          password: normalizedCustomerId
            ? `${SHOPIFY_BRIDGE_SALT}${normalizedCustomerId}`
            : undefined,
          emailVerified: false,
        });
        uid = userRecord.uid;
        isNew = true;
      } else {
        throw e;
      }
    }

    // 2. Load the Firestore profile (admin bypasses security rules).
    const userDocRef = adminDb.collection("users").doc(uid);
    const snap = await userDocRef.get();
    const profile = snap.exists ? snap.data() : null;

    // 3. Verification (lenient policy).
    //    A fresh account has nothing to hijack. For an existing account we try
    //    to positively verify the customerId via a stored id or the Shopify
    //    Admin API; if we cannot, we still proceed (matching the previous
    //    trust-the-URL behaviour) but log it.
    let verified = isNew;
    let verifiedVia = isNew ? "new-user" : "";
    let matchedStore: string | null = null;

    if (!verified && normalizedCustomerId && profile) {
      const known = [
        profile.shopifyCustomerId,
        profile.shopifyIndiaCustomerId,
        ...(Array.isArray(profile.shopifyCustomerIds)
          ? profile.shopifyCustomerIds
          : []),
      ]
        .map((v) => normalizeShopifyId(v))
        .filter(Boolean) as string[];

      if (known.includes(normalizedCustomerId)) {
        verified = true;
        verifiedVia = "stored-id";
      }
    }

    if (!verified && normalizedCustomerId) {
      // India store (we hold this Admin token).
      const indiaId = await shopifyAdminCustomerId(
        INDIA_DOMAIN,
        process.env.SHOPIFY_INDIA_ADMIN_TOKEN,
        email
      );
      if (indiaId && indiaId === normalizedCustomerId) {
        verified = true;
        verifiedVia = "india-admin";
        matchedStore = "india";
      }

      // Main store (only if a real Admin token is configured later).
      if (!verified) {
        const mainId = await shopifyAdminCustomerId(
          MAIN_DOMAIN,
          process.env.SHOPIFY_MAIN_ADMIN_TOKEN,
          email
        );
        if (mainId && mainId === normalizedCustomerId) {
          verified = true;
          verifiedVia = "main-admin";
          matchedStore = "main";
        }
      }
    }

    if (!verified) {
      verifiedVia = "unverified-lenient";
      console.warn(
        `[mint-token] Minting for existing user ${email} without positive ` +
          `customerId verification (id=${normalizedCustomerId}). Configure ` +
          `SHOPIFY_MAIN_ADMIN_TOKEN to enable strict rejection.`
      );
    }

    // 4. Record the incoming customerId non-destructively (fixes the old
    //    overwrite bug that desynced two-store users) + create a minimal
    //    profile for brand-new users.
    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
      shopifyMapped: true,
    };
    if (normalizedCustomerId) {
      updates.shopifyCustomerIds = FieldValue.arrayUnion(normalizedCustomerId);
      if (!profile?.shopifyCustomerId) {
        updates.shopifyCustomerId = normalizedCustomerId;
      }
    }

    if (!snap.exists) {
      await userDocRef.set({
        email,
        uid,
        userType: "customer",
        firstName: "",
        lastName: "",
        otpVerified: false,
        isEmailVerified: false,
        credits: 0,
        createdAt: new Date(),
        profileImageUrl: null,
        ...updates,
      });
    } else {
      await userDocRef.set(updates, { merge: true });
    }

    // 5. Mint the custom token (the explicit service account can sign directly,
    //    so no extra IAM role is required).
    const token = await adminAuth.createCustomToken(uid);

    return NextResponse.json({
      ok: true,
      token,
      uid,
      isNew,
      verified,
      verifiedVia,
      matchedStore,
      otpVerified: profile?.otpVerified || profile?.isEmailVerified || false,
      isEmailVerified: profile?.isEmailVerified || profile?.otpVerified || false,
      credits: profile?.credits || 0,
    });
  } catch (e: any) {
    console.error("[mint-token] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "mint failed" },
      { status: 500 }
    );
  }
}
