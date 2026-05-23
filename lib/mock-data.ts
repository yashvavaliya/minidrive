import type { Folder, FolderWithChildren, Video, User } from "@/types";

// Mock user
export const mockUser: User = {
  id: "user-1",
  email: "demo@example.com",
  createdAt: "2024-01-01T00:00:00.000Z",
};

// Mock folders (flat structure)
export const mockFolders: Folder[] = [
  {
    id: "folder-1",
    name: "Work Projects",
    parentId: null,
    userId: "user-1",
    createdAt: "2024-01-15T00:00:00.000Z",
  },
  {
    id: "folder-2",
    name: "Personal Videos",
    parentId: null,
    userId: "user-1",
    createdAt: "2024-02-01T00:00:00.000Z",
  },
  {
    id: "folder-3",
    name: "Client A",
    parentId: "folder-1",
    userId: "user-1",
    createdAt: "2024-01-20T00:00:00.000Z",
  },
  {
    id: "folder-4",
    name: "Client B",
    parentId: "folder-1",
    userId: "user-1",
    createdAt: "2024-01-25T00:00:00.000Z",
  },
  {
    id: "folder-5",
    name: "Deliverables",
    parentId: "folder-3",
    userId: "user-1",
    createdAt: "2024-02-05T00:00:00.000Z",
  },
  {
    id: "folder-6",
    name: "Vacation 2024",
    parentId: "folder-2",
    userId: "user-1",
    createdAt: "2024-03-01T00:00:00.000Z",
  },
];

// Mock videos
export const mockVideos: Video[] = [
  {
    id: "video-1",
    name: "Project Overview.mp4",
    folderId: "folder-3",
    userId: "user-1",
    bunnyVideoId: "abc123",
    bunnyEmbedUrl: "https://iframe.mediadelivery.net/embed/123456/abc123",
    thumbnailUrl: null,
    status: "success",
    uploadProgress: 100,
    createdAt: "2024-02-10T00:00:00.000Z",
  },
  {
    id: "video-2",
    name: "Demo Recording.mp4",
    folderId: "folder-3",
    userId: "user-1",
    bunnyVideoId: "def456",
    bunnyEmbedUrl: "https://iframe.mediadelivery.net/embed/123456/def456",
    thumbnailUrl: null,
    status: "processing",
    uploadProgress: 100,
    createdAt: "2024-02-12T00:00:00.000Z",
  },
  {
    id: "video-3",
    name: "Final Presentation.mp4",
    folderId: "folder-5",
    userId: "user-1",
    bunnyVideoId: null,
    bunnyEmbedUrl: null,
    thumbnailUrl: null,
    status: "uploading",
    uploadProgress: 45,
    createdAt: "2024-02-15T00:00:00.000Z",
  },
  {
    id: "video-4",
    name: "Beach Day.mp4",
    folderId: "folder-6",
    userId: "user-1",
    bunnyVideoId: "ghi789",
    bunnyEmbedUrl: "https://iframe.mediadelivery.net/embed/123456/ghi789",
    thumbnailUrl: null,
    status: "success",
    uploadProgress: 100,
    createdAt: "2024-03-05T00:00:00.000Z",
  },
  {
    id: "video-5",
    name: "Corrupted File.mp4",
    folderId: "folder-4",
    userId: "user-1",
    bunnyVideoId: null,
    bunnyEmbedUrl: null,
    thumbnailUrl: null,
    status: "failed",
    uploadProgress: 100,
    createdAt: "2024-02-20T00:00:00.000Z",
  },
];

// Helper function to build folder tree
export function buildFolderTree(folders: Folder[]): FolderWithChildren[] {
  const folderMap = new Map<string, FolderWithChildren>();

  // Create FolderWithChildren objects
  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  const rootFolders: FolderWithChildren[] = [];

  // Build the tree
  folders.forEach((folder) => {
    const folderWithChildren = folderMap.get(folder.id)!;
    if (folder.parentId === null) {
      rootFolders.push(folderWithChildren);
    } else {
      const parent = folderMap.get(folder.parentId);
      if (parent) {
        parent.children.push(folderWithChildren);
      }
    }
  });

  return rootFolders;
}

// Get folder by ID
export function getFolderById(folderId: string): Folder | undefined {
  return mockFolders.find((f) => f.id === folderId);
}

// Get subfolders of a folder
export function getSubfolders(parentId: string | null): Folder[] {
  return mockFolders.filter((f) => f.parentId === parentId);
}

// Get videos in a folder
export function getVideosInFolder(folderId: string): Video[] {
  return mockVideos.filter((v) => v.folderId === folderId);
}

// Get breadcrumb path
export function getBreadcrumbPath(folderId: string | null): { id: string; name: string }[] {
  const path: { id: string; name: string }[] = [];
  let currentId = folderId;

  while (currentId) {
    const folder = mockFolders.find((f) => f.id === currentId);
    if (folder) {
      path.unshift({ id: folder.id, name: folder.name });
      currentId = folder.parentId;
    } else {
      break;
    }
  }

  return path;
}
