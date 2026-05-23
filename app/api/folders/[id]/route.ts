import { NextRequest, NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { toFolder } from "@/lib/data-mappers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/types/database";

type FolderRow = Database["public"]["Tables"]["folders"]["Row"];

// PATCH — Rename folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuthenticatedUser();
  if (!user) return response;

  const { id } = await params;
  const body = (await request.json()) as { name?: string };
  const name = body.name?.trim();

  if (!name) {
    return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
  }

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("folders")
    .update({ name })
    .eq("id", id)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Folder not found" }, { status: 404 });
  }

  return NextResponse.json({ folder: toFolder(data) });
}

// DELETE — Delete folder
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { user, response } = await requireAuthenticatedUser();
  if (!user) return response;

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: folders, error: foldersError } = await supabase
    .from("folders")
    .select("*")
    .eq("user_id", user.id);

  if (foldersError) {
    return NextResponse.json({ error: foldersError.message }, { status: 500 });
  }

  if (!folders.some((folder) => folder.id === id)) {
    return NextResponse.json({ error: "Folder not found" }, { status: 404 });
  }

  const folderIdsToDelete = getFolderDescendantIds(folders, id);

  const { error: videosError } = await supabase
    .from("videos")
    .delete()
    .eq("user_id", user.id)
    .in("folder_id", folderIdsToDelete);

  if (videosError) {
    return NextResponse.json({ error: videosError.message }, { status: 500 });
  }

  for (const folderId of [...folderIdsToDelete].reverse()) {
    const { error } = await supabase
      .from("folders")
      .delete()
      .eq("id", folderId)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
  }

  return NextResponse.json({ success: true, deletedFolderIds: folderIdsToDelete });
}

function getFolderDescendantIds(folders: FolderRow[], rootId: string) {
  const ids = [rootId];

  for (let index = 0; index < ids.length; index += 1) {
    const currentId = ids[index];
    const childIds = folders
      .filter((folder) => folder.parent_id === currentId)
      .map((folder) => folder.id);

    ids.push(...childIds);
  }

  return ids;
}
