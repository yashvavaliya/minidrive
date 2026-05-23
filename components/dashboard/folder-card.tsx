"use client";

import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Folder, MoreVertical, Pencil, Trash2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Folder as FolderType } from "@/types";

interface FolderCardProps {
  folder: FolderType;
  viewMode?: "grid" | "list";
  onClick: () => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string, deletedFolderIds: string[]) => void;
}

export function FolderCard({ folder, viewMode = "grid", onClick, onRename, onDelete }: FolderCardProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState(folder.name);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/folders/${folder.id}`, { method: "DELETE" });
      if (res.ok) {
        const data = (await res.json()) as { deletedFolderIds?: string[] };
        onDelete?.(folder.id, data.deletedFolderIds ?? [folder.id]);
      }
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === folder.name) {
      setShowRenameDialog(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/folders/${folder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        onRename?.(folder.id, trimmed);
      }
    } finally {
      setIsLoading(false);
      setShowRenameDialog(false);
    }
  };

  const DropdownMenuActions = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setNewName(folder.name);
            setShowRenameDialog(true);
          }}
        >
          <Pencil className="h-4 w-4 mr-2" />
          Rename
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setShowDeleteDialog(true);
          }}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <>
      {viewMode === "list" ? (
        <tr 
          onClick={onClick} 
          className="group cursor-pointer hover:bg-muted/40 transition-colors border-b last:border-0"
        >
          <td className="p-3 align-middle">
            <div className="flex items-center gap-3">
              <Folder fill="currentColor" className="h-5 w-5 text-muted-foreground/70 shrink-0" />
              <span className="font-medium text-sm">{folder.name}</span>
            </div>
          </td>
          <td className="p-3 align-middle text-sm text-muted-foreground">me</td>
          <td className="p-3 align-middle text-sm text-muted-foreground">
            {new Date(folder.createdAt).toLocaleDateString()}
          </td>
          <td className="p-3 align-middle text-sm text-muted-foreground">-</td>
          <td className="p-3 align-middle w-[50px]">
            {DropdownMenuActions}
          </td>
        </tr>
      ) : (
        <Card className="cursor-pointer transition-all hover:bg-[#c2e7ff]/50 border border-border group relative rounded-xl shadow-none">
          <CardContent className="flex items-center p-2 pl-3">
            {/* Folder icon + name — click to open */}
            <div
              className="flex items-center gap-3 flex-1 min-w-0 py-1"
              onClick={onClick}
            >
              <Folder fill="currentColor" className="h-5 w-5 text-muted-foreground/70 shrink-0" />
              <span className="font-medium text-sm truncate flex-1">{folder.name}</span>
            </div>

            {/* 3-dot menu */}
            {DropdownMenuActions}
          </CardContent>
        </Card>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{folder.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This folder and all the videos inside it will be permanently deleted.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleRename(); }}
            placeholder="Folder name"
            autoFocus
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRenameDialog(false)} disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={() => void handleRename()} disabled={isLoading}>
              {isLoading ? "Saving..." : "Rename"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
