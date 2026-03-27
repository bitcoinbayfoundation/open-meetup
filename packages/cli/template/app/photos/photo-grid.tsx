"use client";

import { useState } from "react";
import Image from "next/image";
import Lightbox, { type LightboxImage } from "@/components/lightbox";

interface PhotoGridProps {
  images: LightboxImage[];
  columns?: string;
  sizes?: string;
}

export default function PhotoGrid({
  images,
  columns = "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  sizes = "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw",
}: PhotoGridProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  return (
    <>
      <div className={`grid ${columns} gap-3`}>
        {images.map((img, i) => (
          <div
            key={img.id}
            className="relative aspect-square overflow-hidden bg-t-surface/5 group cursor-pointer"
            onClick={() => setLightboxIndex(i)}
          >
            <Image
              src={img.url}
              alt={img.alt}
              fill
              sizes={sizes}
              className="object-cover transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
              unoptimized
            />
          </div>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          images={images}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
