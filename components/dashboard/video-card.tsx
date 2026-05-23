"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { VideoStatusBadge } from "./video-status-badge";
import { Play, Video as VideoIcon, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Video } from "@/types";

const BUNNY_THUMBNAIL_BASE_URL = "https://vz-56743aba-073.b-cdn.net";

interface VideoCardProps {
  video: Video;
  viewMode?: "grid" | "list";
  onClick: (video: Video) => void;
  onStatusChange?: (video: Video) => void;
  onRename?: (id: string, newName: string) => void;
  onDelete?: (id: string) => void;
}

export function VideoCard({ video, viewMode = "grid", onClick, onStatusChange, onRename, onDelete }: VideoCardProps) {
  const [currentVideo, setCurrentVideo] = useState(video);
  const [imageError, setImageError] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newName, setNewName] = useState(video.name);
  const [isLoading, setIsLoading] = useState(false);
  const isPlayable = currentVideo.status === "success";
  const thumbnailUrl = getBunnyThumbnailUrl(currentVideo);

  useEffect(() => {
    setCurrentVideo(video);
    setImageError(false);
  }, [video]);

  useEffect(() => {
    if (!["uploading", "processing"].includes(currentVideo.status)) {
      return;
    }

    const intervalId = window.setInterval(async () => {
      const response = await fetch(`/api/videos/${currentVideo.id}/status`, {
        cache: "no-store",
      });

      if (!response.ok) {
        return;
      }

      const data = (await response.json()) as { video: Video };
      setCurrentVideo(data.video);
      onStatusChange?.(data.video);
    }, 5000);

    return () => window.clearInterval(intervalId);
  }, [currentVideo.id, currentVideo.status, onStatusChange]);

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`, { method: "DELETE" });
      if (res.ok) {
        onDelete?.(video.id);
      }
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleRename = async () => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === video.name) {
      setShowRenameDialog(false);
      return;
    }
    setIsLoading(true);
    try {
      const res = await fetch(`/api/videos/${video.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (res.ok) {
        onRename?.(video.id, trimmed);
        setCurrentVideo({ ...currentVideo, name: trimmed });
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
          onClick={(e) => { e.stopPropagation(); }}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={(e) => {
            e.stopPropagation();
            setNewName(currentVideo.name);
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

  if (viewMode === "list") {
    return (
      <>
        <tr
          onClick={isPlayable ? () => onClick(currentVideo) : undefined}
          className={`group border-b last:border-0 transition-colors ${isPlayable ? "cursor-pointer hover:bg-muted/40" : "cursor-default opacity-80"
            }`}
        >
          <td className="p-3 align-middle">
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-16 bg-muted rounded flex items-center justify-center shrink-0 overflow-hidden group-hover:shadow-sm transition-all">
                {thumbnailUrl && !imageError ? (
                  <img
                    src={thumbnailUrl}
                    alt={currentVideo.name}
                    className="object-cover w-full h-full"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <VideoIcon className="h-4 w-4 text-muted-foreground" />
                )}
                {isPlayable && (
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Play className="h-4 w-4 text-white ml-0.5" />
                  </div>
                )}
                {currentVideo.status === "uploading" && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <span className="text-white text-[10px] font-medium">
                      {currentVideo.uploadProgress}%
                    </span>
                  </div>
                )}
                {currentVideo.status === "processing" && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="animate-spin h-3 w-3 border border-white border-t-transparent rounded-full" />
                  </div>
                )}
              </div>

              <div className="flex items-center">
                <p className="font-medium text-sm">{currentVideo.name}</p>
              </div>
            </div>
          </td>
          <td className="p-3 align-middle text-sm text-muted-foreground">me</td>
          <td className="p-3 align-middle text-sm text-muted-foreground">
            {new Date(currentVideo.createdAt).toLocaleDateString()}
          </td>
          <td className="p-3 align-middle text-sm text-muted-foreground">{getConsistentSize(currentVideo.id)}</td>
          <td className="p-3 align-middle w-[100px]">
            <div className="flex items-center gap-2">
              <VideoStatusBadge status={currentVideo.status} />
              {DropdownMenuActions}
            </div>
          </td>
        </tr>
      </>
    );
  }

  return (
    <>
      <Card
        onClick={isPlayable ? () => onClick(currentVideo) : undefined}
        className={`overflow-hidden transition-all group relative ${isPlayable
            ? "cursor-pointer hover:shadow-md hover:border-primary/50"
            : "cursor-default opacity-80"
          }`}
      >
        {/* Thumbnail */}
        <div className="relative aspect-video bg-muted flex items-center justify-center group/thumb">
          {thumbnailUrl && !imageError ? (
            <img
              src={thumbnailUrl}
              alt={currentVideo.name}
              className="object-cover w-full h-full"
              onError={() => setImageError(true)}
            />
          ) : (
            <VideoIcon className="h-12 w-12 text-muted-foreground" />
          )}

          {/* Play overlay for ready videos */}
          {isPlayable && (
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center">
              <div className="h-14 w-14 rounded-full bg-white/90 flex items-center justify-center">
                <Play className="h-6 w-6 text-primary ml-1" />
              </div>
            </div>
          )}

          {/* Upload progress overlay */}
          {currentVideo.status === "uploading" && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-2 p-4">
              <span className="text-white text-sm font-medium">
                Uploading... {currentVideo.uploadProgress}%
              </span>
              <Progress value={currentVideo.uploadProgress} className="w-full max-w-32 h-2" />
            </div>
          )}

          {/* Processing overlay */}
          {currentVideo.status === "processing" && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="flex items-center gap-2 text-white">
                <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                <span className="text-sm font-medium">Processing...</span>
              </div>
            </div>
          )}
        </div>

        {/* Video info */}
        <CardContent className="p-1">
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <p className="font-medium text-sm truncate" title={currentVideo.name}>
                {currentVideo.name}
              </p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-xs text-muted-foreground">
                  {new Date(currentVideo.createdAt).toLocaleDateString()}
                </p>
                <VideoStatusBadge status={currentVideo.status} />
              </div>
            </div>
            <div className="shrink-0 -mt-1 -mr-1">
              {DropdownMenuActions}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &quot;{currentVideo.name}&quot;?</AlertDialogTitle>
            <AlertDialogDescription>
              This video will be permanently deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive text-white hover:bg-destructive/90"
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
            <DialogTitle>Rename Video</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") void handleRename(); }}
            placeholder="Video name"
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

function getBunnyThumbnailUrl(video: Video) {
  if (video.bunnyVideoId) {
    return `${BUNNY_THUMBNAIL_BASE_URL}/${video.bunnyVideoId}/thumbnail.jpg`;
  }

  return video.thumbnailUrl;
}

function getConsistentSize(id: string) {
  // Generate a consistent pseudo-random size between 5MB and 500MB based on ID
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const sizeMb = (Math.abs(hash) % 495) + 5;
  
  if (sizeMb >= 1000) {
    return `${(sizeMb / 1024).toFixed(1)} GB`;
  }
  return `${sizeMb} MB`;
}
