import { NextRequest, NextResponse } from "next/server";
import { createVideo, uploadVideoToBunny } from "@/lib/bunny";
import { requireAuthenticatedUser } from "@/lib/auth";
import { toVideo } from "@/lib/data-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user, response } = await requireAuthenticatedUser();

  if (!user) {
    return response;
  }

  const formData = await request.formData();
  const videoId = formData.get("videoId");
  const file = formData.get("file");

  if (typeof videoId !== "string" || !(file instanceof File)) {
    return NextResponse.json(
      { error: "A videoId and video file are required" },
      { status: 400 }
    );
  }

  if (!file.type.startsWith("video/")) {
    return NextResponse.json({ error: "Only video uploads are supported" }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: existingVideo, error: existingError } = await supabase
    .from("videos")
    .select("*")
    .eq("id", videoId)
    .eq("user_id", user.id)
    .single();

  if (existingError || !existingVideo) {
    return NextResponse.json({ error: "Video record not found" }, { status: 404 });
  }

  try {
    const bunnyVideo = await createVideo(existingVideo.name);
    const fileBuffer = Buffer.from(await file.arrayBuffer());
    await uploadVideoToBunny(bunnyVideo.videoId, fileBuffer);

    const { data, error } = await supabase
      .from("videos")
      .update({
        bunny_video_id: bunnyVideo.videoId,
        bunny_embed_url: bunnyVideo.embedUrl,
        status: "processing",
      })
      .eq("id", videoId)
      .eq("user_id", user.id)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ video: toVideo(data) });
  } catch (error) {
    await supabase
      .from("videos")
      .update({ status: "failed" })
      .eq("id", videoId)
      .eq("user_id", user.id);

    const message = error instanceof Error ? error.message : "Video upload failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
