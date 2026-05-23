import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { toVideo } from "@/lib/data-mappers";
import { createAdminClient } from "@/lib/supabase/admin";

// PATCH — Rename video
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (!user) {
      return response;
    }
    const { id } = await params;

    const { name } = await request.json();
    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Invalid name" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Verify ownership
    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found or access denied" }, { status: 404 });
    }

    // Update name
    const { data: updated, error: updateError } = await supabase
      .from("videos")
      .update({ name })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      console.error("Video rename error:", updateError);
      return NextResponse.json({ error: "Failed to rename video" }, { status: 500 });
    }

    return NextResponse.json({ video: toVideo(updated) });
  } catch (error) {
    console.error("Video PATCH error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Delete video
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { user, response } = await requireAuthenticatedUser();
    if (!user) {
      return response;
    }
    const { id } = await params;

    const supabase = createAdminClient();

    // Verify ownership
    const { data: video, error: fetchError } = await supabase
      .from("videos")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !video) {
      return NextResponse.json({ error: "Video not found or access denied" }, { status: 404 });
    }

    // Delete the video from DB (In a real app we'd also delete from Bunny Stream)
    const { error: deleteError } = await supabase
      .from("videos")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (deleteError) {
      console.error("Video delete error:", deleteError);
      return NextResponse.json({ error: "Failed to delete video" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Video DELETE error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
