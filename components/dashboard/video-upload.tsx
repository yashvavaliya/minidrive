"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Upload, X, Video as VideoIcon } from "lucide-react";
import type { Video } from "@/types";

interface VideoUploadProps {
  folderId: string | null;
  onUploadComplete?: (video: Video) => void;
}

export function VideoUpload({ folderId, onUploadComplete }: VideoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFile, setUploadingFile] = useState<{
    name: string;
    progress: number;
  } | null>(null);

  const handleFileSelect = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];

    if (!file.type.startsWith("video/")) {
      alert("Please select a video file");
      return;
    }

    void uploadFile(file);
  };

  const uploadFile = async (file: File) => {
    if (!folderId) {
      return;
    }

    setUploadingFile({ name: file.name, progress: 0 });

    try {
      const createResponse = await fetch("/api/videos", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: file.name,
          folderId,
        }),
      });

      if (!createResponse.ok) {
        throw new Error(await getErrorMessage(createResponse));
      }

      const { video } = (await createResponse.json()) as { video: Video };
      const uploadedVideo = await uploadToServer(video.id, file);
      onUploadComplete?.(uploadedVideo);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Upload failed";
      alert(message);
    } finally {
      setUploadingFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const uploadToServer = (videoId: string, file: File) => {
    const formData = new FormData();
    formData.append("videoId", videoId);
    formData.append("file", file);

    return new Promise<Video>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", "/api/videos/upload");

      request.upload.onprogress = (event) => {
        if (!event.lengthComputable) {
          return;
        }

        const progress = Math.round((event.loaded / event.total) * 100);
        setUploadingFile({ name: file.name, progress });
      };

      request.onload = () => {
        try {
          const data = JSON.parse(request.responseText) as {
            video?: Video;
            error?: string;
          };

          if (request.status >= 200 && request.status < 300 && data.video) {
            resolve(data.video);
            return;
          }

          reject(new Error(data.error ?? "Upload failed"));
        } catch {
          reject(new Error("Upload failed"));
        }
      };

      request.onerror = () => reject(new Error("Upload failed"));
      request.send(formData);
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const cancelUpload = () => {
    setUploadingFile(null);
  };

  if (!folderId) {
    return null;
  }

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*"
        onChange={(e) => handleFileSelect(e.target.files)}
        className="hidden"
      />
      
      {uploadingFile ? (
        <div className="flex items-center gap-3 bg-muted/50 px-3 py-1.5 rounded-full border">
          <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <VideoIcon className="h-3 w-3 text-primary" />
          </div>
          <div className="w-24 sm:w-32">
            <Progress value={uploadingFile.progress} className="h-1.5" />
          </div>
          <span className="text-xs font-medium w-8 text-right">
            {Math.round(uploadingFile.progress)}%
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 rounded-full ml-1"
            onClick={cancelUpload}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <Button 
          onClick={() => fileInputRef.current?.click()} 
          className="gap-2 bg-[#c2e7ff] text-[#001d35] hover:bg-[#c2e7ff]/90 shadow-sm"
          size="sm"
        >
          <Upload className="h-4 w-4" />
          Upload Video
        </Button>
      )}
    </>
  );
}

async function getErrorMessage(response: Response) {
  const data = (await response.json().catch(() => null)) as { error?: string } | null;
  return data?.error ?? "Upload failed";
}
