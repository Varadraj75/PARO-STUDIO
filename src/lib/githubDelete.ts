// GitHub API service for deleting images
const GITHUB_API = 'https://api.github.com';
const GITHUB_TOKEN = import.meta.env.VITE_GITHUB_TOKEN;
const GITHUB_OWNER = import.meta.env.VITE_GITHUB_OWNER;
const GITHUB_REPO = import.meta.env.VITE_GITHUB_REPO;

interface DeleteImageResponse {
    success: boolean;
    error?: string;
}

/**
 * Delete image from GitHub repository
 * Deletes from BOTH _source/ and hero/ folders
 */
export async function deleteImageFromGitHub(filename: string): Promise<DeleteImageResponse> {
    try {
        // Delete from both folders sequentially
        await deleteFromPath(`images/_source/${filename}`);
        await deleteFromPath(`images/hero/${filename}`);

        return {
            success: true,
        };
    } catch (error) {
        console.error('GitHub delete error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Delete failed',
        };
    }
}

/**
 * Delete file from specific path in GitHub
 */
async function deleteFromPath(path: string): Promise<void> {
    const url = `${GITHUB_API}/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;

    // First, get the file to retrieve its SHA
    const getResponse = await fetch(url, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
        },
    });

    if (!getResponse.ok) {
        // If file doesn't exist (404), that's okay - it's already deleted
        if (getResponse.status === 404) {
            console.log(`File ${path} not found, skipping...`);
            return;
        }
        const error = await getResponse.json();
        throw new Error(error.message || `Failed to get file info for ${path}`);
    }

    const fileData = await getResponse.json();
    const sha = fileData.sha;

    // Now delete the file using its SHA
    const deleteResponse = await fetch(url, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${GITHUB_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message: `Delete ${path}`,
            sha: sha,
            branch: 'main',
        }),
    });

    if (!deleteResponse.ok) {
        const error = await deleteResponse.json();
        throw new Error(error.message || `Failed to delete ${path}`);
    }
}

/**
 * Extract filename from CDN URL
 */
export function extractFilenameFromUrl(url: string): string | null {
    // Extract filename from CDN URL like:
    // https://cdn.jsdelivr.net/gh/Varadraj75/paro-assets/images/hero/upload_123_abc.jpg
    const match = url.match(/\/([^\/]+)$/);
    return match ? match[1] : null;
}
