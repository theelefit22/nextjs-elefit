import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

// Runs with the Admin SDK so it can read the `otps` collection (blocked for all
// client sessions by the Firestore rules) and grant credits.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let uid: string | undefined = body?.uid;
    const email: string | undefined = body?.email
      ? String(body.email).toLowerCase().trim()
      : undefined;
    const code = body?.code ? String(body.code).trim() : "";

    if (!code) {
      return NextResponse.json(
        { ok: false, error: "Verification code is required" },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    if (!uid) {
      if (!email) {
        return NextResponse.json(
          { ok: false, error: "uid or email is required" },
          { status: 400 }
        );
      }
      uid = (await adminAuth.getUserByEmail(email)).uid;
    }

    const otpRef = adminDb.collection("otps").doc(uid);
    const otpSnap = await otpRef.get();
    if (!otpSnap.exists) {
      return NextResponse.json(
        { ok: false, error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    const data = otpSnap.data() as any;
    if (String(data.code) !== code) {
      return NextResponse.json(
        { ok: false, error: "Incorrect verification code" },
        { status: 400 }
      );
    }

    // Support both the new numeric expiry and any legacy Timestamp expiry.
    const expiresAt =
      typeof data.expiresAtMillis === "number"
        ? data.expiresAtMillis
        : data.expiresAt?.toMillis
        ? data.expiresAt.toMillis()
        : 0;
    if (expiresAt && Date.now() > expiresAt) {
      await otpRef.delete().catch(() => {});
      return NextResponse.json(
        { ok: false, error: "Verification code has expired" },
        { status: 400 }
      );
    }

    // Mark verified + grant 10 starting credits if they have none.
    const userRef = adminDb.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.exists ? (userSnap.data() as any) : {};

    const update: Record<string, unknown> = {
      otpVerified: true,
      isEmailVerified: true,
      updatedAt: new Date(),
    };
    let credits = userData?.credits || 0;
    if (!credits) {
      credits = 10;
      update.credits = 10;
    }

    await userRef.set(update, { merge: true });
    await otpRef.delete().catch(() => {});

    return NextResponse.json({ ok: true, credits });
  } catch (e: any) {
    console.error("[verify-otp] error:", e);
    return NextResponse.json(
      { ok: false, error: e?.message || "Verification failed" },
      { status: 500 }
    );
  }
}
