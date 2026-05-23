// User types
export interface User {
  id: string;
  email: string;
  createdAt: string;
}

// Folder types
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  userId: string;
  createdAt: string;
}

export interface FolderWithChildren extends Folder {
  children: FolderWithChildren[];
}

// Video status types
export type VideoStatus = "uploading" | "processing" | "success" | "failed";

// Video types
export interface Video {
  id: string;
  name: string;
  folderId: string;
  userId: string;
  bunnyVideoId: string | null;
  bunnyEmbedUrl: string | null;
  thumbnailUrl: string | null;
  status: VideoStatus;
  uploadProgress: number;
  createdAt: string;
}

// Breadcrumb types
export interface BreadcrumbItem {
  id: string;
  name: string;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
