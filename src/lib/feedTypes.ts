// Feed item type definitions for mixed-content architecture
// Supports images now, advertisements in future

export type FeedItemType = "image" | "advertisement";

export interface ImageFeedItem {
  type: "image";
  data: {
    id: string;
    title: string;
    prompt_text: string;
    image_url: string;
    tool_used: string;
    view_count: number;
    copy_count: number;
    like_count: number;
    created_at: string;
    creator: {
      id: string;
      username: string;
      display_name: string | null;
      avatar_url: string | null;
    };
    tags: string[];
    is_liked: boolean;
    is_saved: boolean;
  };
}

export interface AdvertisementFeedItem {
  type: "advertisement";
  data: {
    id: string;
    // Future ad properties will be added here
    // e.g., advertiser, creative_url, click_url, etc.
  };
}

export type FeedItem = ImageFeedItem | AdvertisementFeedItem;

/**
 * Utility to inject advertisements into a content stream
 * Can be used when ads are ready to be displayed
 * 
 * @param items - Array of image feed items
 * @param adInterval - Insert ad after every N items (default: 8)
 * @param getAd - Function to generate ad items
 * @returns Mixed array with ads injected
 */
export function injectAdvertisements(
  items: ImageFeedItem[],
  adInterval: number = 8,
  getAd?: (index: number) => AdvertisementFeedItem
): FeedItem[] {
  if (!getAd) {
    // No ad provider configured, return items as-is
    return items;
  }

  const result: FeedItem[] = [];
  let adIndex = 0;

  items.forEach((item, index) => {
    result.push(item);

    // Insert ad after every adInterval items
    if ((index + 1) % adInterval === 0 && index < items.length - 1) {
      result.push(getAd(adIndex));
      adIndex++;
    }
  });

  return result;
}

/**
 * Convert raw prompt data to ImageFeedItem format
 */
export function toImageFeedItem(prompt: {
  id: string;
  title: string;
  prompt_text: string;
  image_url: string;
  tool_used: string;
  view_count: number;
  copy_count: number;
  like_count: number;
  created_at: string;
  creator: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  };
  tags: string[];
  is_liked: boolean;
  is_saved: boolean;
}): ImageFeedItem {
  return {
    type: "image",
    data: prompt,
  };
}
