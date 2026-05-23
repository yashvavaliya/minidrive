import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const { searchParams } = new URL(request.url);
  const email = searchParams.get("email") ?? `ravi_${Date.now()}@gmail.com`;

  // The browser form uses this exact same key — anon key
  const supabase = createClient(url, anonKey);

  const { data, error } = await supabase.auth.signUp({
    email,
    password: "Test1234",
    options: { data: { display_name: "Ravi Test" } },
  });

  return NextResponse.json({
    testedEmail: email,
    success: !error,
    error: error?.message ?? null,
    errorStatus: error?.status ?? null,
    userId: data?.user?.id ?? null,
    hasSession: !!data?.session,
    userCreated: !!data?.user?.id,
    identities: data?.user?.identities?.length ?? 0,
    anonKeyUsed: anonKey.substring(0, 25) + "...",
  });
}
