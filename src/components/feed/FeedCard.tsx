import { FeedItem } from "@/lib/feedTypes";
import { ImageCard } from "./ImageCard";
import { AdCard } from "./AdCard";

interface FeedCardProps {
  item: FeedItem;
  onLikeChange?: () => void;
  onSaveChange?: () => void;
  onLoginRequired?: () => void;
  onDelete?: () => void;
}

/**
 * FeedCard - Universal card renderer for the mixed-content feed.
 * 
 * Handles conditional rendering based on item type:
 * - "image" → renders ImageCard (PromptCard wrapper)
 * - "advertisement" → renders AdCard (currently hidden)
 * 
 * This architecture allows ads to be injected into the feed
 * without modifying the grid structure or layout logic.
 */
export function FeedCard({ item, onLikeChange, onSaveChange, onLoginRequired, onDelete }: FeedCardProps) {
  switch (item.type) {
    case "image":
      return (
        <ImageCard
          item={item}
          onLikeChange={onLikeChange}
          onSaveChange={onSaveChange}
          onLoginRequired={onLoginRequired}
          onDelete={onDelete}
        />
      );

    case "advertisement":
      return <AdCard item={item} />;

    default:
      // Type guard - ensures exhaustive handling
      const _exhaustive: never = item;
      return null;
  }
}
