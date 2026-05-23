import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { toVideo } from "@/lib/data-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser();

  if (!user) {
    return response;
  }

  const folderId = request.nextUrl.searchParams.get("folderId");

  if (!folderId) {
    return NextResponse.json({ videos: [] });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("videos")
    .select("*")
    .eq("user_id", user.id)
    .eq("folder_id", folderId)
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ videos: data.map(toVideo) });
}

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser();

  if (!user) {
    return response;
  }

  const body = (await request.json()) as {
    name?: string;
    folderId?: string;
  };
  const name = body.name?.trim();

  if (!name || !body.folderId) {
    return NextResponse.json(
      { error: "Video name and folderId are required" },
      { status: 400 }
    );
  }

  const supabase = createAdminClient();
  const { data: folder, error: folderError } = await supabase
    .from("folders")
    .select("id")
    .eq("id", body.folderId)
    .eq("user_id", user.id)
    .single();

  if (folderError || !folder) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("videos")
    .insert({
      name,
      folder_id: body.folderId,
      user_id: user.id,
      status: "uploading",
    })
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ video: toVideo(data) }, { status: 201 });
}
