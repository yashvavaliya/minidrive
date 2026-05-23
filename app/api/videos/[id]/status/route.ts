import { NextRequest, NextResponse } from "next/server";
import { getVideoStatus } from "@/lib/bunny";
import { requireAuthenticatedUser } from "@/lib/auth";
import { toVideo } from "@/lib/data-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { user, response } = await requireAuthenticatedUser();

  if (!user) {
    return response;
  }

  const { id } = await context.params;
  const supabase = createAdminClient();
  const { data: existingVideo, error: existingError } = await supabase
    .from("videos")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existingVideo) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  if (!existingVideo.bunny_video_id || ["success", "failed"].includes(existingVideo.status)) {
    return NextResponse.json({ video: toVideo(existingVideo) });
  }

  try {
    const status = await getVideoStatus(existingVideo.bunny_video_id);
    const { data, error } = await supabase
      .from("videos")
      .update({ status })
      .eq("id", id)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ video: toVideo(data) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not refresh video status";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
