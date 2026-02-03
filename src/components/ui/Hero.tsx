import { getCdnUrl, CDN_CONFIG } from "@/config/cdn";

interface HeroProps {
    filename: string;
    title: string;
    subtitle?: string;
    alt: string;
}

/**
 * Hero Component
 * Implements caching strategies and responsive image loading suitable for LCP.
 * Uses eager loading and async decoding.
 */
export function Hero({ filename, title, subtitle, alt }: HeroProps) {
    const baseUrl = `${CDN_CONFIG.BASE_URL}${CDN_CONFIG.PATHS.HERO}`;

    // Construct srcset assuming standard naming convention
    // e.g. hero.jpg -> hero-480w.jpg 480w, etc.
    // We need to handle the extension correctly.
    const extensionIndex = filename.lastIndexOf(".");
    const name = extensionIndex > 0 ? filename.substring(0, extensionIndex) : filename;
    const ext = extensionIndex > 0 ? filename.substring(extensionIndex) : ""; // includes dot

    const srcSet = `
    ${baseUrl}${name}-480w${ext} 480w,
    ${baseUrl}${name}-768w${ext} 768w,
    ${baseUrl}${name}-1280w${ext} 1280w
  `.trim();

    const mainSrc = `${baseUrl}${filename}`;

    return (
        <div className="relative w-full h-[50vh] min-h-[400px] md:h-[60vh] overflow-hidden bg-muted">
            {/* 
         Hero Image:
         - loading="eager" because it's above the fold (LCP candidate)
         - decoding="async" to avoid blocking main thread
         - srcset for responsive selection
       */}
            <img
                src={mainSrc}
                srcSet={srcSet}
                sizes="100vw"
                alt={alt}
                className="absolute inset-0 w-full h-full object-cover"
                loading="eager"
                decoding="async"
            />
            <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-center text-center p-6 bg-gradient-to-t from-black/60 to-transparent">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-serif text-white mb-4 drop-shadow-lg tracking-tight">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-base sm:text-lg md:text-xl text-white/90 max-w-2xl drop-shadow-md font-light">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    );
}
