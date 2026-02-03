import { ImageFeedItem } from "@/lib/feedTypes";
import { PromptCard } from "@/components/prompts/PromptCard";

interface ImageCardProps {
  item: ImageFeedItem;
  onLikeChange?: () => void;
  onSaveChange?: () => void;
  onLoginRequired?: () => void;
}

/**
 * ImageCard wrapper for rendering image content in the feed.
 * Delegates to PromptCard for actual rendering.
 */
export function ImageCard({ item, onLikeChange, onSaveChange, onLoginRequired }: ImageCardProps) {
  const { data } = item;

  return (
    <PromptCard
      id={data.id}
      title={data.title}
      promptText={data.prompt_text}
      imageUrl={data.image_url}
      toolUsed={data.tool_used}
      viewCount={data.view_count}
      copyCount={data.copy_count}
      likeCount={data.like_count}
      creator={data.creator}
      tags={data.tags}
      isLiked={data.is_liked}
      isSaved={data.is_saved}
      onLikeChange={onLikeChange}
      onSaveChange={onSaveChange}
      onLoginRequired={onLoginRequired}
    />
  );
}
