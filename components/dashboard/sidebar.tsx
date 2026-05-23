"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FolderPlus,
  ChevronRight,
  ChevronDown,
  Folder,
  Home,
  HardDrive as DriveIcon,
  Laptop,
  Users,
  Clock,
  Star,
  Trash,
  Plus
} from "lucide-react";
import type { Folder as FolderType, FolderWithChildren } from "@/types";
import { buildFolderTree } from "@/lib/folders";

interface SidebarProps {
  folders: FolderType[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
}

interface FolderTreeItemProps {
  folder: FolderWithChildren;
  level: number;
  currentFolderId: string | null;
  onFolderSelect: (folderId: string) => void;
}

function FolderTreeItem({
  folder,
  level,
  currentFolderId,
  onFolderSelect,
}: FolderTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = folder.children.length > 0;
  const isSelected = currentFolderId === folder.id;

  return (
    <div>
      <button
        onClick={() => onFolderSelect(folder.id)}
        className={cn(
          "flex w-full items-center gap-1 rounded-r-full px-2 py-1.5 text-sm transition-colors hover:bg-accent",
          isSelected ? "bg-[#c2e7ff] text-[#001d35] font-medium" : "text-foreground/80"
        )}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
      >
        {hasChildren ? (
          <div
            role="button"
            tabIndex={0}
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                setIsExpanded(!isExpanded);
              }
            }}
            className="p-0.5 hover:bg-muted rounded"
          >
            {isExpanded ? (
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
            )}
          </div>
        ) : (
          <span className="w-4" />
        )}
        <Folder className="h-4 w-4 text-muted-foreground shrink-0" />
        <span className="truncate">{folder.name}</span>
      </button>
      {hasChildren && isExpanded && (
        <div>
          {folder.children.map((child) => (
            <FolderTreeItem
              key={child.id}
              folder={child}
              level={level + 1}
              currentFolderId={currentFolderId}
              onFolderSelect={onFolderSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({
  folders,
  currentFolderId,
  onFolderSelect,
  onCreateFolder,
}: SidebarProps) {
  const folderTree = buildFolderTree(folders);

  return (
    <aside className="hidden md:flex w-[280px] flex-col bg-transparent shrink-0">
      <div className="p-4 pt-3 pb-4">
        <Button 
          onClick={onCreateFolder} 
          variant="outline"
          className="w-fit gap-3 rounded-[16px] h-14 px-5 bg-white shadow-sm hover:bg-accent/50 hover:shadow-md border-border/60 transition-all font-medium"
        >
          <Plus className="h-6 w-6" />
          <span className="text-sm">New Folder</span>
        </Button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="space-y-0.5">
          {/* Main Navigation */}
          <button
            onClick={() => onFolderSelect(null)}
            className={cn(
              "flex w-full items-center gap-3 rounded-full px-4 py-2 text-sm transition-colors hover:bg-accent text-foreground/80"
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            <span>Home</span>
          </button>
          
          <div className="pt-2">
            <button
              onClick={() => onFolderSelect(null)}
              className={cn(
                "flex w-full items-center gap-3 rounded-full px-4 py-2 text-sm transition-colors hover:bg-accent",
                currentFolderId === null ? "bg-[#c2e7ff] text-[#001d35] font-medium" : "text-foreground/80"
              )}
            >
              <DriveIcon className="h-4 w-4 shrink-0" />
              <span>My Drive</span>
            </button>
            
            {/* Folder Tree under My Drive */}
            <div className="pl-6 pr-2 space-y-0.5 mt-0.5">
              {folderTree.map((folder) => (
                <FolderTreeItem
                  key={folder.id}
                  folder={folder}
                  level={0}
                  currentFolderId={currentFolderId}
                  onFolderSelect={onFolderSelect}
                />
              ))}
            </div>
          </div>

        </div>
      </ScrollArea>
    </aside>
  );
}
