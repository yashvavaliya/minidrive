import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    name?: string;
    email?: string;
    password?: string;
  };

  const name = body.name?.trim();
  const email = body.email?.trim().toLowerCase();
  const password = body.password;

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are required" },
      { status: 400 }
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: name,
      },
    },
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (!data.user) {
    return NextResponse.json(
      { error: "Supabase did not return a user for this signup." },
      { status: 502 }
    );
  }

  if (data.user.identities?.length === 0) {
    return NextResponse.json(
      { error: "This email is already registered. Please sign in instead." },
      { status: 409 }
    );
  }

  const admin = createAdminClient();
  const { error: profileError } = await admin.from("profiles").upsert({
    id: data.user.id,
    display_name: name,
    email,
  });

  if (profileError) {
    return NextResponse.json(
      {
        error: `Auth user was created, but profile insert failed: ${profileError.message}`,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    userId: data.user.id,
    email,
    hasSession: Boolean(data.session),
  });
}
