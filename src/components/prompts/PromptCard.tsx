import { useState } from "react";
import { Link } from "react-router-dom";
import { Copy, Heart, Bookmark, Eye, Check, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { mockService } from "@/lib/mockData";
import { useToast } from "@/hooks/use-toast";

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
}: PromptCardProps) {
  const [copied, setCopied] = useState(false);
  const [localLiked, setLocalLiked] = useState(isLiked);
  const [localSaved, setLocalSaved] = useState(isSaved);
  const [localLikeCount, setLocalLikeCount] = useState(likeCount);
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

    if (!user || !profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to like prompts",
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

    if (!user || !profile) {
      toast({
        title: "Sign in required",
        description: "Please sign in to save prompts",
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

        {/* Edit button - bottom right of image, for creator's own profile */}
        {showEditButton && onEditClick && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onEditClick();
            }}
            className="absolute bottom-2 sm:bottom-3 right-2 sm:right-3 p-1.5 sm:p-2 rounded-full bg-gold text-foreground opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity z-10 touch-target flex items-center justify-center"
            title="Edit prompt"
            aria-label="Edit prompt"
          >
            <Pencil className="h-3.5 sm:h-4 w-3.5 sm:w-4" />
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

          {/* Like & Save buttons - visible on mobile/tablet only, next to title */}
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
              onClick={handleSave}
              className={cn(
                "p-1 sm:p-1.5 rounded-full bg-secondary transition-all duration-200 touch-target flex items-center justify-center",
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
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm text-muted-foreground mt-1">
          <Link
            to={`/profile/${creator.username}`}
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
            <Eye className="h-3 w-3" />
            <span className="tabular-nums">{viewCount.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Copy className="h-3 w-3" />
            <span className="tabular-nums">{copyCount.toLocaleString()}</span>
          </span>
          <span className="flex items-center gap-0.5 sm:gap-1">
            <Heart className="h-3 w-3" />
            <span className="tabular-nums">{localLikeCount.toLocaleString()}</span>
          </span>
        </div>

        {/* Tags */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 sm:gap-1.5 mt-1.5 sm:mt-2">
            {tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="px-1.5 sm:px-2 py-0.5 text-xs bg-secondary text-secondary-foreground rounded-sm"
              >
                {tag}
              </span>
            ))}
            {tags.length > 3 && (
              <span className="px-1.5 sm:px-2 py-0.5 text-xs text-muted-foreground">
                +{tags.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </article>
  );
}