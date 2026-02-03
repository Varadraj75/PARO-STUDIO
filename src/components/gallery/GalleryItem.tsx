import { useState } from "react";
import { cn } from "@/lib/utils";
import { getCdnUrl, CDN_CONFIG } from "@/config/cdn";

interface GalleryItemProps {
    filename: string;
    title: string;
    alt: string;
    className?: string;
}

export function GalleryItem({ filename, title, alt, className }: GalleryItemProps) {
    const [isLoaded, setIsLoaded] = useState(false);
    const src = getCdnUrl("GALLERY", filename);

    // Construct srcset
    // We assume the existence of resized variants for performance
    const extensionIndex = filename.lastIndexOf(".");
    const name = extensionIndex > 0 ? filename.substring(0, extensionIndex) : filename;
    const ext = extensionIndex > 0 ? filename.substring(extensionIndex) : "";

    const baseUrl = `${CDN_CONFIG.BASE_URL}${CDN_CONFIG.PATHS.GALLERY}`;
    const srcSet = `
    ${baseUrl}${name}-480w${ext} 480w,
    ${baseUrl}${name}-800w${ext} 800w
  `.trim();

    return (
        <div className={cn("relative overflow-hidden group rounded-md bg-muted aspect-[3/4]", className)}>
            {/* 
        Blur placeholder:
        We use a simple background color here, but could use a tiny base64 image if available.
        The opacity transition creates the smooth fade-in effect.
      */}
            <div
                className={cn(
                    "absolute inset-0 bg-secondary/30 transition-opacity duration-700 z-10",
                    isLoaded ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
            />

            <img
                src={src}
                srcSet={srcSet}
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                alt={alt}
                className={cn(
                    "w-full h-full object-cover transition-all duration-700 ease-out",
                    isLoaded ? "opacity-100 scale-100 blur-0" : "opacity-0 scale-105 blur-sm"
                )}
                loading="lazy"
                decoding="async"
                onLoad={() => setIsLoaded(true)}
            />

            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                <h3 className="text-white font-serif text-lg leading-tight">{title}</h3>
            </div>
        </div>
    );
}
