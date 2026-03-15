"use client";

import { useState } from "react";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

type PhotoGalleryProps = {
  photos: string[];
};

export function PhotoGallery({ photos }: PhotoGalleryProps) {
  const [active, setActive] = useState<string | null>(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap gap-2">
        {photos.map((relativePath) => {
          const src = `${API_BASE}/${relativePath}`;
          return (
            <button
              key={relativePath}
              type="button"
              className="border rounded overflow-hidden p-0"
              onClick={() => setActive(relativePath)}
            >
              <img
                src={src}
                alt="Produce"
                className="h-16 w-16 object-cover"
              />
            </button>
          );
        })}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center"
          onClick={() => setActive(null)}
        >
          <img
            src={`${API_BASE}/${active}`}
            alt="Produce full size"
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />
        </div>
      )}
    </div>
  );
}

