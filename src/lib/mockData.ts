import { getCdnUrl } from "@/config/cdn";


const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);


export interface UserProfile {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    website: string | null;
    twitter: string | null;
    instagram: string | null;
}

export interface Prompt {
    id: string;
    title: string;
    prompt_text: string;
    image_url: string;
    tool_used: string;
    view_count: number;
    copy_count: number;
    created_at: string;
    creator_id: string;
    tags: string[];
}

export interface Like {
    user_id: string;
    prompt_id: string;
}

export interface Save {
    user_id: string;
    prompt_id: string;
    created_at: string;
}

// Initial Data
const MOCK_USER_ID = "user-123";
export const MOCK_USER: UserProfile = {
    id: MOCK_USER_ID,
    username: "demo_user",
    display_name: "Demo User",
    avatar_url: "https://github.com/shadcn.png",
    bio: "Just a demo user creating prompts.",
    website: "https://example.com",
    twitter: "@demo",
    instagram: "@demo",
};

const CREATOR_ID = "creator-456";
export const MOCK_CREATOR: UserProfile = {
    id: CREATOR_ID,
    username: "artistic_soul",
    display_name: "Artistic Soul",
    avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop",
    bio: "Creating AI art since 2022.",
    website: null,
    twitter: null,
    instagram: null,
};

// Map of ID to Profile
const profiles: Record<string, UserProfile> = {
    [MOCK_USER_ID]: MOCK_USER,
    [CREATOR_ID]: MOCK_CREATOR,
};

const INITIAL_PROMPTS: Prompt[] = [
    {
        id: "1",
        title: "Brutalist Architecture",
        prompt_text: "A towering concrete structure in various geometric shapes, brutalist style, soft overcast lighting, 8k resolution.",
        image_url: getCdnUrl("HERO", "image_2-1280.webp"),
        tool_used: "Midjourney",
        view_count: 120,
        copy_count: 45,
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        creator_id: CREATOR_ID,
        tags: ["architecture", "brutalist", "concrete", "3d"],
    },
    {
        id: "2",
        title: "Cosmic Dreams",
        prompt_text: "Nebula clouds forming the shape of a sleeping cat, vibrant purple and pink colors, starry background, digital art.",
        image_url: getCdnUrl("HERO", "image_5-1280.webp"),
        tool_used: "DALL-E 3",
        view_count: 340,
        copy_count: 120,
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        creator_id: CREATOR_ID,
        tags: ["space", "animals", "digital-art", "surreal"],
    },
    {
        id: "3",
        title: "Vintage Cafe",
        prompt_text: "Interior of a cozy vintage cafe in Paris, rainy window, steam rising from coffee cup, warm ambient lighting, lo-fi aesthetic.",
        image_url: getCdnUrl("HERO", "image_6-1280.webp"),
        tool_used: "Midjourney",
        view_count: 85,
        copy_count: 12,
        created_at: new Date(Date.now() - 86400000 * 1).toISOString(),
        creator_id: MOCK_USER_ID,
        tags: ["photography", "vintage", "cozy", "interior"],
    },
    {
        id: "4",
        title: "Forest Maiden",
        prompt_text: "Ethereal portrait of a forest spirit, leaves in hair, bioluminescent mushrooms, soft bokeh, fantasy art.",
        image_url: getCdnUrl("HERO", "image_1-1280.webp"),
        tool_used: "Stable Diffusion",
        view_count: 500,
        copy_count: 210,
        created_at: new Date(Date.now() - 86400000 * 10).toISOString(),
        creator_id: CREATOR_ID,
        tags: ["fantasy", "portrait", "nature", "character"],
    },
];

// In-memory state (resets on reload, but good enough for 'alive' demo without backend)
// To make it persist, we could use localStorage, but for now let's keep it simple variables.
// Actually, let's use a class to manage state.

class MockDataService {
    private prompts: Prompt[] = [...INITIAL_PROMPTS];
    private profiles: Record<string, UserProfile> = { ...profiles };
    private likes: Like[] = []; // {user_id, prompt_id}
    private saves: Save[] = []; // {user_id, prompt_id}
    private follows: { follower_id: string, following_id: string }[] = [];

    constructor() {
        // Load from localStorage if available? 
        // For this specific request, pure in-memory or localStorage is fine.
        // Let's stick to in-memory to ensure clean state on refresh for testing, 
        // or maybe localStorage later if user complains.
    }

    // Auth Helpers
    async signIn(email: string): Promise<{ user: UserProfile | null, error: Error | null }> {
        // Simulate network delay
        await new Promise(r => setTimeout(r, 500));
        return { user: MOCK_USER, error: null };
    }

    async signOut(): Promise<void> {
        await new Promise(r => setTimeout(r, 200));
    }

    async getProfile(userId: string): Promise<UserProfile | null> {
        return this.profiles[userId] || null;
    }

    async getProfileByUsername(username: string): Promise<UserProfile | null> {
        return Object.values(this.profiles).find(p => p.username === username) || null;
    }

    async toggleFollow(followerId: string, followingId: string): Promise<boolean> {
        const existing = this.follows.find(f => f.follower_id === followerId && f.following_id === followingId);
        if (existing) {
            this.follows = this.follows.filter(f => f !== existing);
            return false;
        } else {
            this.follows.push({ follower_id: followerId, following_id: followingId });
            return true;
        }
    }

    isFollowing(followerId: string | undefined, followingId: string): boolean {
        if (!followerId) return false;
        return this.follows.some(f => f.follower_id === followerId && f.following_id === followingId);
    }

    getFollowerCount(userId: string): number {
        return this.follows.filter(f => f.following_id === userId).length;
    }


    async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile | null> {
        if (this.profiles[userId]) {
            this.profiles[userId] = { ...this.profiles[userId], ...updates };
            return this.profiles[userId];
        }
        return null;
    }

    // Prompt Helpers
    async getPrompts(): Promise<Prompt[]> {
        await new Promise(r => setTimeout(r, 300));
        return [...this.prompts];
    }

    async getPrompt(id: string): Promise<Prompt | null> {
        return this.prompts.find(p => p.id === id) || null;
    }

    async createPrompt(prompt: Omit<Prompt, "id" | "created_at" | "view_count" | "copy_count">): Promise<Prompt> {
        const newPrompt: Prompt = {
            ...prompt,
            id: generateId(),
            created_at: new Date().toISOString(),
            view_count: 0,
            copy_count: 0,
        };
        this.prompts.unshift(newPrompt);
        return newPrompt;
    }

    async updatePrompt(id: string, updates: Partial<Prompt>): Promise<Prompt | null> {
        const prompt = this.prompts.find(p => p.id === id);
        if (prompt) {
            Object.assign(prompt, updates);
            return prompt;
        }
        return null;
    }


    // Interactions
    async toggleLike(userId: string, promptId: string): Promise<boolean> {
        const existing = this.likes.find(l => l.user_id === userId && l.prompt_id === promptId);
        if (existing) {
            this.likes = this.likes.filter(l => l !== existing);
            return false; // unliked
        } else {
            this.likes.push({ user_id: userId, prompt_id: promptId });
            return true; // liked
        }
    }

    async toggleSave(userId: string, promptId: string): Promise<boolean> {
        const existing = this.saves.find(s => s.user_id === userId && s.prompt_id === promptId);
        if (existing) {
            this.saves = this.saves.filter(s => s !== existing);
            return false; // unsaved
        } else {
            this.saves.push({ user_id: userId, prompt_id: promptId, created_at: new Date().toISOString() });
            return true; // saved
        }
    }


    async incrementCopyCount(promptId: string): Promise<void> {
        const prompt = this.prompts.find(p => p.id === promptId);
        if (prompt) {
            prompt.copy_count += 1;
        }
    }

    getLikesCount(promptId: string): number {

        return this.likes.filter(l => l.prompt_id === promptId).length;
    }

    isLiked(userId: string | undefined, promptId: string): boolean {
        if (!userId) return false;
        return this.likes.some(l => l.user_id === userId && l.prompt_id === promptId);
    }

    isSaved(userId: string | undefined, promptId: string): boolean {
        if (!userId) return false;
        return this.saves.some(l => l.user_id === userId && l.prompt_id === promptId);
    }

    // Tags
    async getTags(): Promise<string[]> {
        const allTags = new Set<string>();
        this.prompts.forEach(p => p.tags.forEach(t => allTags.add(t)));
        return Array.from(allTags).sort();
    }
}

export const mockService = new MockDataService();
