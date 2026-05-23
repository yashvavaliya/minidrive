import type { Folder, Video, VideoStatus } from "@/types";
import type { Database } from "@/types/database";

type FolderRow = Database["public"]["Tables"]["folders"]["Row"];
type VideoRow = Database["public"]["Tables"]["videos"]["Row"];

export function toFolder(row: FolderRow): Folder {
  return {
    id: row.id,
    name: row.name,
    parentId: row.parent_id,
    userId: row.user_id,
    createdAt: row.created_at,
  };
}

export function toVideo(row: VideoRow): Video {
  return {
    id: row.id,
    name: row.name,
    folderId: row.folder_id,
    userId: row.user_id,
    bunnyVideoId: row.bunny_video_id,
    bunnyEmbedUrl: row.bunny_embed_url,
    thumbnailUrl: row.bunny_video_id ? getBunnyThumbnailUrl(row.bunny_video_id) : null,
    status: row.status,
    uploadProgress: row.status === "uploading" ? 0 : 100,
    createdAt: row.created_at,
  };
}

export function isVideoStatus(value: string): value is VideoStatus {
  return ["uploading", "processing", "success", "failed"].includes(value);
}

function getBunnyThumbnailUrl(videoId: string): string | null {
  const libraryId = process.env.BUNNY_LIBRARY_ID;

  if (!libraryId) {
    return null;
  }

  return `https://vz-${libraryId}.b-cdn.net/${videoId}/thumbnail.jpg`;
}
