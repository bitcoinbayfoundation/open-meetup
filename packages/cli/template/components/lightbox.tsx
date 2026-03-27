"use client";

import {
  useState,
  useEffect,
  useCallback,
  useRef,
  type TouchEvent as ReactTouchEvent,
} from "react";
import { createPortal } from "react-dom";
import Image from "next/image";

export interface LightboxImage {
  id: string;
  url: string;
  alt: string;
}

interface LightboxProps {
  images: LightboxImage[];
  initialIndex: number;
  onClose: () => void;
}

export default function Lightbox({ images, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [visible, setVisible] = useState(false);
  const touchStartX = useRef(0);
  const touchDeltaX = useRef(0);
  const stripRef = useRef<HTMLDivElement>(null);

  const current = images[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i < images.length - 1 ? i + 1 : i));
  }, [images.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i > 0 ? i - 1 : i));
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 200);
  }, [onClose]);

  // Animate in
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
      if (e.key === "ArrowRight") goNext();
      if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose, goNext, goPrev]);

  // Scroll thumbnail strip to keep active thumb visible
  useEffect(() => {
    if (!stripRef.current) return;
    const activeThumb = stripRef.current.children[currentIndex] as HTMLElement | undefined;
    if (activeThumb) {
      activeThumb.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
    }
  }, [currentIndex]);

  // Touch swipe handlers
  function handleTouchStart(e: ReactTouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchDeltaX.current = 0;
  }

  function handleTouchMove(e: ReactTouchEvent) {
    touchDeltaX.current = e.touches[0].clientX - touchStartX.current;
  }

  function handleTouchEnd() {
    if (touchDeltaX.current > 60) goPrev();
    else if (touchDeltaX.current < -60) goNext();
    touchDeltaX.current = 0;
  }

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Image lightbox"
      className={`fixed inset-0 z-[9999] flex flex-col transition-opacity duration-200 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/90 scanlines"
        onClick={handleClose}
      />

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3">
        <span className="font-mono text-[0.7rem] text-t-surface/60">
          {currentIndex + 1} / {images.length}
        </span>
        <button
          onClick={handleClose}
          aria-label="Close lightbox"
          className="text-t-surface/60 hover:text-t-surface transition-colors font-mono text-xl leading-none cursor-pointer"
        >
          &times;
        </button>
      </div>

      {/* Main image area */}
      <div
        className="relative z-10 flex-1 flex items-center justify-center px-12 min-h-0"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Previous arrow */}
        {currentIndex > 0 && (
          <button
            onClick={goPrev}
            aria-label="Previous image"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-t-surface/30 hover:text-t-surface/80 transition-colors z-20 cursor-pointer"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
        )}

        {/* Image */}
        <div className="relative w-full h-full max-w-[90vw] max-h-[70vh]">
          <Image
            src={current.url}
            alt={current.alt}
            fill
            className="object-contain"
            sizes="90vw"
            priority
            unoptimized
          />
        </div>

        {/* Next arrow */}
        {currentIndex < images.length - 1 && (
          <button
            onClick={goNext}
            aria-label="Next image"
            className="absolute right-2 top-1/2 -translate-y-1/2 text-t-surface/30 hover:text-t-surface/80 transition-colors z-20 cursor-pointer"
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 18l6-6-6-6" />
            </svg>
          </button>
        )}

        {/* Download button */}
        <a
          href={current.url}
          download
          aria-label="Download image"
          title="Download"
          className="absolute bottom-2 right-2 z-20 text-t-surface/30 hover:text-t-accent transition-colors p-2"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        </a>
      </div>

      {/* Thumbnail strip */}
      <div className="relative z-10 border-t border-t-surface/10 bg-black/60 py-2 px-4">
        <div
          ref={stripRef}
          className="flex gap-2 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: "none" }}
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              onClick={() => setCurrentIndex(i)}
              aria-label={`View image ${i + 1}`}
              className={`relative shrink-0 w-14 h-14 overflow-hidden border transition-all cursor-pointer ${
                i === currentIndex
                  ? "border-t-accent opacity-100"
                  : "border-transparent opacity-40 hover:opacity-70"
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                className="object-cover"
                sizes="56px"
                loading="lazy"
                unoptimized
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return createPortal(overlay, document.body);
}
