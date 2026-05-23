"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Navbar } from "@/components/dashboard/navbar";
import { Sidebar } from "@/components/dashboard/sidebar";
import { FolderBreadcrumb } from "@/components/dashboard/folder-breadcrumb";
import { FolderCard } from "@/components/dashboard/folder-card";
import { VideoCard } from "@/components/dashboard/video-card";
import { VideoUpload } from "@/components/dashboard/video-upload";
import { VideoPlayerModal } from "@/components/dashboard/video-player-modal";
import { CreateFolderDialog } from "@/components/dashboard/create-folder-dialog";
import { FolderPlus, Menu, Video as VideoIcon, LayoutGrid, List } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { Folder, Video } from "@/types";
import { buildFolderTree, getBreadcrumbPath } from "@/lib/folders";
import { createClient } from "@/lib/supabase/client";

// Mobile sidebar component
function MobileSidebar({
  folders,
  currentFolderId,
  onFolderSelect,
  onCreateFolder,
}: {
  folders: Folder[];
  currentFolderId: string | null;
  onFolderSelect: (folderId: string | null) => void;
  onCreateFolder: () => void;
}) {
  const folderTree = buildFolderTree(folders);

  return (
    <div className="flex flex-col h-full">
      <div className="p-3">
        <Button onClick={onCreateFolder} className="w-full justify-start gap-2">
          <FolderPlus className="h-4 w-4" />
          New Folder
        </Button>
      </div>
      <ScrollArea className="flex-1 px-2">
        <div className="space-y-1 py-2">
          <button
            onClick={() => onFolderSelect(null)}
            className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent ${
              currentFolderId === null ? "bg-accent text-accent-foreground font-medium" : ""
            }`}
          >
            <VideoIcon className="h-4 w-4" />
            <span>My Drive</span>
          </button>
          {folderTree.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onFolderSelect(folder.id)}
              className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm hover:bg-accent ${
                currentFolderId === folder.id ? "bg-accent text-accent-foreground font-medium" : ""
              }`}
            >
              <VideoIcon className="h-4 w-4" />
              <span>{folder.name}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}

export default function DashboardPage() {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isVideoPlayerOpen, setIsVideoPlayerOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [userEmail, setUserEmail] = useState("Account");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const currentFolder = currentFolderId
    ? folders.find((folder) => folder.id === currentFolderId)
    : null;
  const subfolders = useMemo(
    () => folders.filter((folder) => folder.parentId === currentFolderId),
    [folders, currentFolderId]
  );
  const breadcrumbPath = useMemo(
    () => getBreadcrumbPath(folders, currentFolderId),
    [folders, currentFolderId]
  );

  const fetchFolders = useCallback(async () => {
    const response = await fetch("/api/folders", { cache: "no-store" });
    const data = (await response.json()) as { folders?: Folder[]; error?: string };

    if (!response.ok || !data.folders) {
      throw new Error(data.error ?? "Could not load folders");
    }

    setFolders(data.folders);
  }, []);

  const fetchVideos = useCallback(async (folderId: string | null) => {
    if (!folderId) {
      setVideos([]);
      return;
    }

    const response = await fetch(`/api/videos?folderId=${folderId}`, {
      cache: "no-store",
    });
    const data = (await response.json()) as { videos?: Video[]; error?: string };

    if (!response.ok || !data.videos) {
      throw new Error(data.error ?? "Could not load videos");
    }

    setVideos(data.videos);
  }, []);

  useEffect(() => {
    const supabase = createClient();
    void supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? "Account");
    });
  }, []);

  useEffect(() => {
    let isMounted = true;

    void fetchFolders()
      .catch((loadError) => {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Could not load folders");
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [fetchFolders]);

  useEffect(() => {
    void fetchVideos(currentFolderId).catch((loadError) => {
      setError(loadError instanceof Error ? loadError.message : "Could not load videos");
    });
  }, [currentFolderId, fetchVideos]);

  const handleFolderSelect = (folderId: string | null) => {
    setCurrentFolderId(folderId);
    setIsMobileSidebarOpen(false);
  };

  const handleCreateFolder = async (name: string) => {
    const response = await fetch("/api/folders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name,
        parentId: currentFolderId,
      }),
    });
    const data = (await response.json()) as { folder?: Folder; error?: string };

    if (!response.ok || !data.folder) {
      throw new Error(data.error ?? "Could not create folder");
    }

    setFolders((previousFolders) => [...previousFolders, data.folder as Folder]);
  };

  const handleVideoClick = (video: Video) => {
    if (video.status === "success") {
      setSelectedVideo(video);
      setIsVideoPlayerOpen(true);
    }
  };

  const handleUploadComplete = (video: Video) => {
    setVideos((previousVideos) => [video, ...previousVideos.filter((item) => item.id !== video.id)]);
  };

  const handleVideoStatusChange = useCallback((updatedVideo: Video) => {
    setVideos((previousVideos) =>
      previousVideos.map((video) => (video.id === updatedVideo.id ? updatedVideo : video))
    );
  }, []);

  const handleFolderRename = (id: string, newName: string) => {
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, name: newName } : f))
    );
  };

  const handleFolderDelete = (id: string, deletedFolderIds: string[]) => {
    const deletedIds = new Set(deletedFolderIds.length > 0 ? deletedFolderIds : [id]);

    setFolders((prev) => prev.filter((folder) => !deletedIds.has(folder.id)));
    setVideos((prev) => prev.filter((video) => !deletedIds.has(video.folderId)));

    if (currentFolderId && deletedIds.has(currentFolderId)) {
      setCurrentFolderId(null);
    }
  };

  const handleVideoRename = useCallback((id: string, newName: string) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, name: newName } : v))
    );
  }, []);

  const handleVideoDelete = useCallback((id: string) => {
    setVideos((prev) => prev.filter((v) => v.id !== id));
    if (selectedVideo?.id === id) {
      setSelectedVideo(null);
      setIsVideoPlayerOpen(false);
    }
  }, [selectedVideo]);

  return (
    <div className="flex h-screen flex-col bg-[#f8fafd]">
      <Navbar userEmail={userEmail} />

      <div className="flex flex-1 overflow-hidden pt-2">
        {/* Desktop Sidebar */}
        <Sidebar
          folders={folders}
          currentFolderId={currentFolderId}
          onFolderSelect={handleFolderSelect}
          onCreateFolder={() => setIsCreateFolderOpen(true)}
        />

        {/* Main Content */}
        <main className="flex-1 overflow-hidden mr-4 mb-4 bg-white rounded-2xl border border-border/40 shadow-sm">
          <div className="h-full flex flex-col">
            {/* Top Bar */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/40">
              <div className="flex items-center gap-3">
                {/* Mobile menu button */}
                <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
                  <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="md:hidden">
                      <Menu className="h-5 w-5" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-64 p-0">
                    <MobileSidebar
                      folders={folders}
                      currentFolderId={currentFolderId}
                      onFolderSelect={handleFolderSelect}
                      onCreateFolder={() => {
                        setIsMobileSidebarOpen(false);
                        setIsCreateFolderOpen(true);
                      }}
                    />
                  </SheetContent>
                </Sheet>

                <FolderBreadcrumb
                  path={breadcrumbPath}
                  onNavigate={handleFolderSelect}
                />
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center border rounded-md p-0.5 bg-muted/30">
                  <Button 
                    variant={viewMode === "grid" ? "secondary" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setViewMode("grid")}
                  >
                    <LayoutGrid className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button 
                    variant={viewMode === "list" ? "secondary" : "ghost"} 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateFolderOpen(true)}
                  className="hidden sm:flex gap-2"
                >
                  <FolderPlus className="h-4 w-4" />
                  New Folder
                </Button>
                {currentFolderId && (
                  <VideoUpload
                    folderId={currentFolderId}
                    onUploadComplete={handleUploadComplete}
                  />
                )}
              </div>
            </div>

            {/* Content Area */}
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {error && (
                  <div className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                    {error}
                  </div>
                )}

                {isLoading && (
                  <div className="rounded-lg border p-4 text-sm text-muted-foreground">
                    Loading your drive...
                  </div>
                )}

                {/* List View - Single Table */}
                {viewMode === "list" && (subfolders.length > 0 || videos.length > 0) && (
                  <div className="rounded-xl border bg-card text-card-foreground shadow-sm overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="hover:bg-transparent">
                          <TableHead>Name</TableHead>
                          <TableHead>Owner</TableHead>
                          <TableHead>Date modified</TableHead>
                          <TableHead>File size</TableHead>
                          <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {subfolders.map((folder) => (
                          <FolderCard
                            key={folder.id}
                            folder={folder}
                            viewMode="list"
                            onClick={() => handleFolderSelect(folder.id)}
                            onRename={handleFolderRename}
                            onDelete={handleFolderDelete}
                          />
                        ))}
                        {videos.map((video) => (
                          <VideoCard
                            key={video.id}
                            video={video}
                            viewMode="list"
                            onClick={handleVideoClick}
                            onStatusChange={handleVideoStatusChange}
                            onRename={handleVideoRename}
                            onDelete={handleVideoDelete}
                          />
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}

                {/* Grid View - Folders */}
                {viewMode === "grid" && subfolders.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3">
                      Folders
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                      {subfolders.map((folder) => (
                        <FolderCard
                          key={folder.id}
                          folder={folder}
                          viewMode="grid"
                          onClick={() => handleFolderSelect(folder.id)}
                          onRename={handleFolderRename}
                          onDelete={handleFolderDelete}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Grid View - Videos */}
                {viewMode === "grid" && videos.length > 0 && (
                  <div>
                    <h2 className="text-sm font-medium text-muted-foreground mb-3">
                      Videos
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
                      {videos.map((video) => (
                        <VideoCard
                          key={video.id}
                          video={video}
                          viewMode="grid"
                          onClick={handleVideoClick}
                          onStatusChange={handleVideoStatusChange}
                          onRename={handleVideoRename}
                          onDelete={handleVideoDelete}
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Empty State */}
                {!isLoading && subfolders.length === 0 && videos.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                      {currentFolderId ? (
                        <VideoIcon className="h-8 w-8 text-muted-foreground" />
                      ) : (
                        <FolderPlus className="h-8 w-8 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="text-lg font-medium">
                      {currentFolderId ? "This folder is empty" : "Welcome to MiniDrive"}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-sm">
                      {currentFolderId
                        ? "Upload videos or create subfolders to get started"
                        : "Create your first folder to start organizing your videos"}
                    </p>
                    {!currentFolderId && (
                      <Button
                        onClick={() => setIsCreateFolderOpen(true)}
                        className="mt-4 gap-2"
                      >
                        <FolderPlus className="h-4 w-4" />
                        Create Folder
                      </Button>
                    )}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </main>
      </div>

      {/* Dialogs */}
      <CreateFolderDialog
        open={isCreateFolderOpen}
        onOpenChange={setIsCreateFolderOpen}
        onCreateFolder={handleCreateFolder}
        parentFolderName={currentFolder?.name}
      />

      <VideoPlayerModal
        video={selectedVideo}
        open={isVideoPlayerOpen}
        onOpenChange={setIsVideoPlayerOpen}
      />
    </div>
  );
}
