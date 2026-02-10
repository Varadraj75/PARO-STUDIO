import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Heart, Bookmark, Check, Pencil, Trash2, Share2, MoreHorizontal, Link as LinkIcon, UserCircle, Flag, MoreVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { mockService } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

interface PromptCardProps {
  id: string;
  title: string;
  promptText: string;
  imageUrl: string;
  toolUsed: string;
  viewCount: number;
  copyCount: number;
  likeCount: number;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  tags: string[];
  isLiked?: boolean;
  isSaved?: boolean;
  onLikeChange?: () => void;
  onSaveChange?: () => void;
  showEditButton?: boolean;
  onEditClick?: () => void;
  onLoginRequired?: () => void;
  onDelete?: () => void;
}

export function PromptCard({
  id,
  title,
  promptText,
  imageUrl,
  toolUsed,
  viewCount,
  copyCount,
  likeCount,
  creator,
  tags,
  isLiked = false,
  isSaved = false,
  onLikeChange,
  onSaveChange,
  showEditButton = false,
  onEditClick,
  onLoginRequired,
  onDelete,
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localSaved, setLocalSaved] = useState(isSaved);
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const handleCopy = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      onLoginRequired?.();
      return;
    }

    await navigator.clipboard.writeText(promptText);
    setCopied(true);

    // Increment copy count - update directly since RPC types may not be generated yet
    // Increment copy count
    await mockService.incrementCopyCount(id);

    setTimeout(() => setCopied(false), 2000);
  };

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like prompts",
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Profile loading",
        description: "Please wait for your profile to load",
      });
      return;
    }

    const newLiked = !localLiked;
    setLocalLiked(newLiked);
    setLocalLikeCount((prev) => (newLiked ? prev + 1 : prev - 1));

    await mockService.toggleLike(profile.id, id);

    onLikeChange?.();
  };

  const handleSave = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save prompts",
      });
      return;
    }

    if (!profile) {
      toast({
        title: "Profile loading",
        description: "Please wait for your profile to load",
      });
      return;
    }

    const newSaved = !localSaved;
    setLocalSaved(newSaved);

    if (newSaved) {
      await mockService.toggleSave(profile.id, id);
      toast({ title: "Saved to collection" });
    } else {
      await mockService.toggleSave(profile.id, id);
    }

    onSaveChange?.();
  };

  const handleDelete = async () => {
    if (!user) return;
    if (!profile || profile.id !== creator.id) return;

    setIsDeleting(true);

    try {
      // Note: Image deletion from storage is temporarily disabled during backend migration
      // Images will remain in storage but the prompt record will be deleted
      
      // Delete from mock service
      await mockService.deletePrompt(id);

      toast({ 
        title: "Prompt deleted successfully",
        description: "Note: Image cleanup is temporarily disabled during backend migration"
      });

      // Call parent callback
      onDelete?.();
    } catch (error) {
      console.error("Delete error:", error);
      toast({
        title: "Delete failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <article className="group masonry-item">
      <div className="relative overflow-hidden rounded-sm bg-card hover-lift">
        {/* Image */}
        <Link to={`/prompt/${id}`} className="block">
          <div className="relative aspect-auto">
            <img
              src={imageUrl}
              alt={title}
              className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              loading="lazy"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors duration-300 pointer-events-none" />
          </div>
        </Link>

        {/* Mobile three-dot menu trigger - top RIGHT, inside image */}
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute top-2 sm:top-3 right-2 sm:right-3 lg:hidden z-30 pointer-events-auto"
        >
          <Drawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} dismissible={true}>
            <DrawerTrigger asChild>
              <button
                className="p-1.5"
                aria-label="More options"
              >
                <MoreVertical className="h-5 w-5 text-black drop-shadow-md" />
              </button>
            </DrawerTrigger>
          
          <DrawerContent className="px-4 pb-8">
            {/* Accessibility - Hidden title and description for screen readers */}
            <DrawerTitle className="sr-only">Post options</DrawerTitle>
            <DrawerDescription className="sr-only">Actions for this prompt</DrawerDescription>
            
            {/* Primary Actions - Large Circular Buttons */}
            <div className="flex items-center justify-center gap-8 py-6">
              {/* Save Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave(e);
                  setTimeout(() => setMobileMenuOpen(false), 100);
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className={cn(
                  "w-16 h-16 rounded-full flex items-center justify-center border-2 transition-colors",
                  localSaved 
                    ? "bg-gold/20 border-gold" 
                    : "bg-secondary border-border"
                )}>
                  <Bookmark className={cn(
                    "h-6 w-6",
                    localSaved && "fill-gold text-gold"
                  )} />
                </div>
                <span className="text-sm font-medium text-foreground">
                  {localSaved ? "Unsave" : "Save"}
                </span>
              </button>

              {/* Copy Link Button */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMobileMenuOpen(false);
                }}
                className="flex flex-col items-center gap-2"
              >
                <div className="w-16 h-16 rounded-full bg-secondary border-2 border-border flex items-center justify-center transition-colors">
                  <LinkIcon className="h-6 w-6 text-foreground" />
                </div>
                <span className="text-sm font-medium text-foreground">Copy Link</span>
              </button>
            </div>

            {/* Separator */}
            <div className="border-t border-border my-2" />

            {/* Secondary Actions - List Items */}
            <div className="flex flex-col gap-1">
              {/* View Profile */}
              <DrawerClose asChild>
                <Link
                  to={`/profile/${creator.id}`}
                  className="flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-sm transition-colors"
                >
                  <UserCircle className="h-5 w-5 text-foreground" />
                  <span className="text-sm font-medium text-foreground">View Profile</span>
                </Link>
              </DrawerClose>

              {/* Report */}
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center gap-3 px-4 py-3 hover:bg-secondary rounded-sm transition-colors text-left"
              >
                <Flag className="h-5 w-5 text-destructive" />
                <span className="text-sm font-medium text-destructive">Report</span>
              </button>
            </div>
          </DrawerContent>
        </Drawer>
        </div>

        {/* Copy button - top LEFT on all devices, visible on hover for desktop */}
        <button
          onClick={handleCopy}
          className={cn(
            "absolute top-2 sm:top-3 left-2 sm:left-3 p-1.5 sm:p-2 rounded-full bg-background/90 backdrop-blur-sm shadow-soft transition-all duration-200 touch-target flex items-center justify-center",
            "opacity-100 lg:opacity-0 lg:group-hover:opacity-100",
            copied && "bg-gold/90"
          )}
          title="Copy prompt"
          aria-label={copied ? "Copied" : "Copy prompt"}
        >
          {copied ? (
            <Check className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          ) : (
            <Copy className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          )}
        </button>

        {/* Like & Save - top RIGHT on desktop only, visible on hover */}
        <div className="absolute top-2 sm:top-3 right-2 sm:right-3 hidden lg:flex gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={handleLike}
            className={cn(
              "p-1.5 sm:p-2 rounded-full bg-background/90 backdrop-blur-sm shadow-soft transition-all duration-200",
              localLiked && "bg-destructive/10"
            )}
            title={localLiked ? "Unlike" : "Like"}
            aria-label={localLiked ? "Unlike" : "Like"}
          >
            <Heart
              className={cn(
                "h-3.5 sm:h-4 w-3.5 sm:w-4 transition-colors",
                localLiked && "fill-destructive text-destructive"
              )}
            />
          </button>

          <button
            onClick={handleSave}
            className={cn(
              "p-1.5 sm:p-2 rounded-full bg-background/90 backdrop-blur-sm shadow-soft transition-all duration-200",
              localSaved && "bg-gold/20"
            )}
            title={localSaved ? "Unsave" : "Save"}
            aria-label={localSaved ? "Unsave" : "Save"}
          >
            <Bookmark
              className={cn(
                "h-3.5 sm:h-4 w-3.5 sm:w-4 transition-colors",
                localSaved && "fill-gold text-gold"
              )}
            />
          </button>
        </div>

        {/* Share button - bottom RIGHT on desktop only, visible on hover, stacked over watermark */}
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            // TODO: Add share functionality
          }}
          className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 hidden lg:flex p-1.5 sm:p-2 rounded-full bg-background/90 backdrop-blur-sm shadow-soft transition-all duration-200 opacity-0 group-hover:opacity-100 z-10 items-center justify-center"
          title="Share"
          aria-label="Share prompt"
        >
          <Share2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
        </button>

        {/* Edit button - bottom right of image, for creator's own profile */}
        {showEditButton && onEditClick && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEditClick();
            }}
            className="absolute bottom-2 sm:bottom-3 right-14 sm:right-16 p-1.5 sm:p-2 rounded-full bg-gold text-foreground opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10 touch-target flex items-center justify-center"
            title="Edit prompt"
            aria-label="Edit prompt"
          >
            <Pencil className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          </button>
        )}

        {/* Delete button - for creator only */}
        {user && profile && creator.id === profile.id && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setShowDeleteDialog(true);
            }}
            className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full bg-destructive/90 text-destructive-foreground opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10 touch-target flex items-center justify-center"
            title="Delete prompt"
            aria-label="Delete prompt"
          >
            <Trash2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
          </button>
        )}
      </div>

      {/* Content */}
      <div className="pt-2 sm:pt-3 pb-1">
        <div className="flex items-start justify-between gap-2">
          <Link to={`/prompt/${id}`} className="flex-1 min-w-0">
            <h3 className="font-serif text-base sm:text-lg leading-tight group-hover:text-gold transition-colors duration-300 text-truncate-2">
              {title}
            </h3>
          </Link>

          {/* Three-dot menu - Desktop only */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="hidden lg:flex items-center justify-center p-1 hover:bg-secondary rounded-sm transition-colors cursor-pointer"
                aria-label="More options"
              >
                <MoreHorizontal className="h-5 w-5 text-foreground" />
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Copy Link
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSave(e);
                }}
              >
                <Bookmark className={cn("h-4 w-4 mr-2", localSaved && "fill-gold text-gold")} />
                {localSaved ? "Unsave" : "Save"}
              </DropdownMenuItem>
              
              <DropdownMenuItem asChild>
                <Link to={`/profile/${creator.id}`} className="flex items-center cursor-pointer">
                  <UserCircle className="h-4 w-4 mr-2" />
                  View Profile
                </Link>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Flag className="h-4 w-4 mr-2" />
                Report
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Like & Share buttons - visible on mobile/tablet only, next to title */}
          <div className="flex lg:hidden gap-1 sm:gap-1.5 flex-shrink-0">
            <button
              onClick={handleLike}
              className={cn(
                "p-1 sm:p-1.5 rounded-full bg-secondary transition-all duration-200 touch-target flex items-center justify-center",
                localLiked && "bg-destructive/10"
              )}
              title={localLiked ? "Unlike" : "Like"}
              aria-label={localLiked ? "Unlike" : "Like"}
            >
              <Heart
                className={cn(
                  "h-3.5 sm:h-4 w-3.5 sm:w-4 transition-colors",
                  localLiked && "fill-destructive text-destructive"
                )}
              />
            </button>

            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                // TODO: Add share functionality
              }}
              className="p-1 sm:p-1.5 rounded-full bg-secondary transition-all duration-200 touch-target flex items-center justify-center"
              title="Share"
              aria-label="Share prompt"
            >
              <Share2 className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
          <Link
            to={`/profile/${creator.id}`}
            className="hover:text-foreground transition-colors truncate max-w-[40%]"
          >
            {creator.display_name || creator.username}
          </Link>
          <span className="text-border flex-shrink-0">•</span>
          <span className="truncate">{toolUsed}</span>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 sm:gap-4 mt-1.5 sm:mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Copy className="h-3 w-3" />
            <span className="tabular-nums">{copyCount.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Heart className="h-3 w-3" />
            <span className="tabular-nums">{localLikeCount.toLocaleString()}</span>
          </span>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowDeleteDialog(false)}>
          <div className="bg-background p-6 rounded-lg shadow-lg max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2">Delete Prompt?</h3>
            <p className="text-sm text-muted-foreground mb-4">
              This will permanently delete this prompt. Note: Image cleanup is temporarily disabled during backend migration.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteDialog(false)}
                disabled={isDeleting}
                className="px-4 py-2 text-sm border border-border rounded-sm hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 text-sm bg-destructive text-destructive-foreground rounded-sm hover:bg-destructive/90 transition-colors disabled:opacity-50"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
}