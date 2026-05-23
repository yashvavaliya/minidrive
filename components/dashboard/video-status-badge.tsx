"use client";

import { Badge } from "@/components/ui/badge";
import type { VideoStatus } from "@/types";
import { cn } from "@/lib/utils";

interface VideoStatusBadgeProps {
  status: VideoStatus;
}

const statusConfig: Record<
  VideoStatus,
  { label: string; className: string }
> = {
  uploading: {
    label: "Uploading",
    className: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/10",
  },
  processing: {
    label: "Processing",
    className: "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/10",
  },
  success: {
    label: "Ready",
    className: "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10",
  },
  failed: {
    label: "Failed",
    className: "bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10",
  },
};

export function VideoStatusBadge({ status }: VideoStatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <Badge variant="outline" className={cn("text-xs font-medium", config.className)}>
      {config.label}
    </Badge>
  );
}
