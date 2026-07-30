import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { Resend } from "resend";

// Runs with the Admin SDK so it can write the `otps` collection, which the
// Firestore security rules block for all client sessions.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    let uid: string | undefined = body?.uid;
    let email: string = body?.email ? String(body.email).toLowerCase().trim() : "";

    if (!uid && !email) {
      return NextResponse.json(
        { ok: false, error: "email or uid is required" },
        { status: 400 }
      );
    }

    const adminAuth = getAdminAuth();
    const adminDb = getAdminDb();

    // Resolve whichever of uid/email is missing.
    if (!uid) {
      const rec = await adminAuth.getUserByEmail(email);
      uid = rec.uid;
      email = email || (rec.email ?? "");
    } else if (!email) {
      const rec = await adminAuth.getUser(uid);
      email = rec.email ?? "";
    }

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "No email on file for this account" },
        { status: 400 }
      );
    }

    // Generate + store the code server-side (10-minute expiry).
    const code = generateOTP();
    const expiresAtMillis = Date.now() + 10 * 60 * 1000;
    await adminDb.collection("otps").doc(uid).set({
      uid,
      email,
      code,
      expiresAtMillis,
      createdAt: new Date(),
    });

    // Email it (same sender/template as the existing /api/send-otp route).
    const resendKey =
      process.env.NEXT_PUBLIC_RESEND_KEY || process.env.RESEND_API_KEY;
    if (!resendKey) {
      console.error("[send-otp-code] Missing Resend key");
      return NextResponse.json(
        { ok: false, error: "Email configuration missing on server" },
        { status: 500 }
      );
    }
    const resend = new Resend(resendKey);
    const { error } = await resend.emails.send({
      from: "EleFit <verify@mail.theelefit.com>",
      to: [email],
      subject: `${code} is your EleFit verification code`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #000;">Verify your email</h2>
          <p>Your verification code for EleFit is:</p>
          <div style="background: #f4f4f4; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #000;">${code}</span>
          </div>
          <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #999;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
      `,
    });
    if (error) {
      console.error("[send-otp-code] Resend error:", error);
      return NextResponse.json(
        { ok: false, error: "Failed to send verification email" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("[send-otp-code] error:", e);
    // Don't leak whether an email exists — generic message.
    return NextResponse.json(
      { ok: false, error: e?.message || "Failed to send verification code" },
      { status: 500 }
    );
  }
}
