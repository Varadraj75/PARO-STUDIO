export const CDN_CONFIG = {
    BASE_URL: "https://cdn.jsdelivr.net/gh/varadraj75/paro-assets/",
    PATHS: {
        HERO: "images/hero/",
        GALLERY: "images/gallery/",
        LOGOS: "images/logos/",
        PLACEHOLDERS: "images/placeholders/",
    },
};

export const getCdnUrl = (category: keyof typeof CDN_CONFIG.PATHS, filename: string) => {
    return `${CDN_CONFIG.BASE_URL}${CDN_CONFIG.PATHS[category]}${filename}`;
};

export const getHeroSrcSet = (filename: string) => {
    const basePath = `${CDN_CONFIG.BASE_URL}${CDN_CONFIG.PATHS.HERO}`;
    // Assuming naming convention like image-480w.jpg, image-768w.jpg
    // If extension is .jpg
    const [name, ext] = filename.split('.');
    return `
    ${basePath}${name}-480w.${ext} 480w,
    ${basePath}${name}-768w.${ext} 768w,
    ${basePath}${name}-1280w.${ext} 1280w
  `.trim();
};
