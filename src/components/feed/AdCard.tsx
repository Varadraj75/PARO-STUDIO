import { AdvertisementFeedItem } from "@/lib/feedTypes";

interface AdCardProps {
  item: AdvertisementFeedItem;
}

/**
 * AdCard component for rendering advertisements in the feed.
 * 
 * Currently hidden/inactive - will be implemented when ads are ready.
 * When activated, ads will render identically to image cards in terms of:
 * - Grid placement (masonry item)
 * - Spacing and margins
 * - Responsive behavior
 * 
 * This ensures ads flow naturally within the content stream.
 */
export function AdCard({ item }: AdCardProps) {
  // Ad rendering disabled - return null to render nothing
  // When ads are ready, this will render actual ad content
  return null;
}
