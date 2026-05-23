import type { BreadcrumbItem, Folder, FolderWithChildren } from "@/types";

export function buildFolderTree(folders: Folder[]): FolderWithChildren[] {
  const folderMap = new Map<string, FolderWithChildren>();

  folders.forEach((folder) => {
    folderMap.set(folder.id, { ...folder, children: [] });
  });

  const roots: FolderWithChildren[] = [];

  folders.forEach((folder) => {
    const folderWithChildren = folderMap.get(folder.id);

    if (!folderWithChildren) {
      return;
    }

    if (!folder.parentId) {
      roots.push(folderWithChildren);
      return;
    }

    const parent = folderMap.get(folder.parentId);
    if (parent) {
      parent.children.push(folderWithChildren);
    }
  });

  return roots;
}

export function getBreadcrumbPath(
  folders: Folder[],
  folderId: string | null
): BreadcrumbItem[] {
  const folderMap = new Map(folders.map((folder) => [folder.id, folder]));
  const path: BreadcrumbItem[] = [];
  let currentId = folderId;

  while (currentId) {
    const folder = folderMap.get(currentId);

    if (!folder) {
      break;
    }

    path.unshift({ id: folder.id, name: folder.name });
    currentId = folder.parentId;
  }

  return path;
}
