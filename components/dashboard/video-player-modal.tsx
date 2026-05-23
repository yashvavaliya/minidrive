"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Video } from "@/types";

interface VideoPlayerModalProps {
  video: Video | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VideoPlayerModal({
  video,
  open,
  onOpenChange,
}: VideoPlayerModalProps) {
  if (!video) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl w-[195vw] p-0 overflow-hidden">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle className="truncate pr-8">{video.name}</DialogTitle>
        </DialogHeader>
        <div className="aspect-video w-full bg-black">
          {video.bunnyEmbedUrl ? (
            <iframe
              src={video.bunnyEmbedUrl}
              className="w-full h-full"
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title={video.name}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-white">
              <p className="text-muted-foreground">Video not available</p>
            </div>
          )}
        </div>
        <div className="p-4 pt-2">
          <p className="text-sm text-muted-foreground">
            Uploaded on {new Date(video.createdAt).toLocaleDateString()}
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
