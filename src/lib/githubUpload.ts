// GitHub API service for uploading images
const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO;

interface UploadImageResponse {
    success: boolean;
    filename?: string;
    cdnUrl?: string;
    error?: string;
}

/**
 * Upload image to GitHub repository
 * Uploads to BOTH _source/ and hero/ folders
 */
export async function uploadImageToGitHub(
    file: File,
    filename: string
): Promise<UploadImageResponse> {
    try {
        // Convert file to base64
        const base64Content = await fileToBase64(file);

        // Remove data URL prefix
        const base64Data = base64Content.split(',')[1];

        // Upload to BOTH folders SEQUENTIALLY (not parallel) to avoid Git commit conflicts
        // First upload to _source folder (original)
        await uploadToPath(`images/_source/${filename}`, base64Data, filename);

        // Then upload to hero folder (for immediate display)
        await uploadToPath(`images/hero/${filename}`, base64Data, filename);

        // Return CDN URL pointing to hero folder
        const cdnUrl = `https://cdn.jsdelivr.net/gh/${GITHUB_OWNER}/${GITHUB_REPO}/images/hero/${filename}`;

        return {
            success: true,
            filename,
            cdnUrl,
        };
    } catch (error) {
        console.error('GitHub upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed',
        };
    }
}

/**
 * Upload file to specific path in GitHub
 */
async function uploadToPath(path: string, base64Data: string, filename: string): Promise<void> {
    const url = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

    const response = await fetch(url, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: `Upload ${filename}`,
            content: base64Data,
            branch: 'main',
        }),
    });

    if (!response.ok) {
        const error = await response.json();

        // If file already exists (422), that's okay - it means it was uploaded before
        if (response.status === 422 && error.message?.includes('already exists')) {
            console.log(`File ${filename} already exists at ${path}, skipping...`);
            return;
        }

        throw new Error(error.message || `Failed to upload to ${path}`);
    }
}

/**
 * Convert File to base64 string
 */
function fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (error) => reject(error);
    });
}

/**
 * Generate a unique filename with better randomness
 */
export function generateFilename(originalName: string): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 15); // Longer random string
    const extension = originalName.split('.').pop()?.toLowerCase() || 'jpg';
    return `upload_${timestamp}_${randomStr}.${extension}`;
}
