import { NextRequest, NextResponse } from "next/server";
import { getKycMode, validIfsc, validIndianMobile, validPan } from "@/lib/kyc";

type VerifyBody = {
  step?: string;
  data?: Record<string, unknown>;
};

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as VerifyBody;
  const step = body.step;
  const data = body.data || {};
  const mode = getKycMode();

  if (mode === "live") {
    return NextResponse.json(
      {
        ok: false,
        code: "PROVIDER_REQUIRED",
        message:
          "KYC_MODE=live requires a contracted KYC/KRA/bank verification provider adapter. FinOrbit will not fabricate an approval.",
      },
      { status: 501 }
    );
  }

  if (step === "identity") {
    const mobile = text(data.mobile);
    const pan = text(data.pan).toUpperCase();
    const otp = text(data.otp);

    if (!validIndianMobile(mobile)) {
      return NextResponse.json({ ok: false, message: "Enter a valid 10-digit Indian mobile number." }, { status: 400 });
    }
    if (!validPan(pan)) {
      return NextResponse.json({ ok: false, message: "Enter a valid PAN format, for example ABCDE1234F." }, { status: 400 });
    }
    if (otp !== "123456") {
      return NextResponse.json({ ok: false, message: "Sandbox OTP is 123456." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: "verified",
      maskedPan: pan.slice(0, 2) + "***" + pan.slice(-2),
      message: "Mobile and PAN sandbox checks passed.",
    });
  }

  if (step === "aadhaar") {
    const method = text(data.method);
    const consent = Boolean(data.consent);
    const reference = text(data.reference);

    if (!consent) {
      return NextResponse.json({ ok: false, message: "Consent is required for identity verification." }, { status: 400 });
    }
    if (!["offline_xml", "digilocker"].includes(method)) {
      return NextResponse.json({ ok: false, message: "Choose Aadhaar Offline XML or DigiLocker." }, { status: 400 });
    }
    if (reference.length < 4) {
      return NextResponse.json({ ok: false, message: "Enter a sandbox document/reference identifier." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: "verified",
      message:
        method === "offline_xml"
          ? "Offline Aadhaar document accepted in sandbox. Production must validate the UIDAI digital signature."
          : "DigiLocker reference accepted in sandbox. Production must use an authorized DigiLocker integration.",
    });
  }

  if (step === "liveness") {
    const captured = Boolean(data.captured);
    if (!captured) {
      return NextResponse.json({ ok: false, message: "Capture a selfie before continuing." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: "verified",
      score: 0.98,
      message: "Sandbox liveness check passed. Production score must come from the configured provider.",
    });
  }

  if (step === "bank") {
    const accountNumber = text(data.accountNumber).replace(/\s/g, "");
    const ifsc = text(data.ifsc).toUpperCase();
    const accountName = text(data.accountName);

    if (!/^[0-9]{8,18}$/.test(accountNumber)) {
      return NextResponse.json({ ok: false, message: "Enter a valid bank account number." }, { status: 400 });
    }
    if (!validIfsc(ifsc)) {
      return NextResponse.json({ ok: false, message: "Enter a valid IFSC code." }, { status: 400 });
    }
    if (accountName.length < 3) {
      return NextResponse.json({ ok: false, message: "Enter the account holder name." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: "verified",
      maskedAccount: "••••" + accountNumber.slice(-4),
      message: "Sandbox bank verification passed.",
    });
  }

  if (step === "consent") {
    const accepted = Boolean(data.accepted);
    const declaration = Boolean(data.declaration);
    if (!accepted || !declaration) {
      return NextResponse.json({ ok: false, message: "Both consent declarations are required." }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      status: "pending_review",
      reference: "KYC-SBX-" + Date.now().toString(36).toUpperCase(),
      message: "Sandbox KYC submitted. Real activation requires the configured regulated provider/KRA response.",
    });
  }

  return NextResponse.json({ ok: false, message: "Unknown KYC step." }, { status: 400 });
}
