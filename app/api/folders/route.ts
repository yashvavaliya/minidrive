import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { toFolder } from "@/lib/data-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const { user, response } = await requireAuthenticatedUser();

  if (!user) {
    return response;
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ folders: data.map(toFolder) });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser();

  if (!user) {
    return response;
  }

  const body = (await request.json()) as {
    name?: string;
    parentId?: string | null;
  };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (body.parentId) {
    const { data: parent, error: parentError } = await supabase
      .from("folders")
      .select("id")
      .eq("id", body.parentId)
      .eq("user_id", user.id)
      .single();

    if (parentError || !parent) {
      return NextResponse.json({ error: "Parent folder not found" }, { status: 404 });
    }
  }

  const { data, error } = await supabase
    .from("folders")
    .insert({
      name,
      parent_id: body.parentId ?? null,
      user_id: user.id,
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ folder: toFolder(data) }, { status: 201 });
}
