"use client";

import Link from "next/link";
import { useState } from "react";

interface GameCardProps {
  title: string;
  image_path: string;
  link_url: string;
}

export default function GameCard({ title, image_path, link_url }: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const t = (en: string, bn: string) => en; 

  return (
    <Link href={link_url} className="game-card-premium">
      <div className="game-card-image-wrapper">
        {image_path && !imgError ? (
          <img 
            src={image_path} 
            alt={title} 
            className="game-card-image" 
            onError={() => setImgError(true)} 
          />
        ) : (
          <div className="game-card-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        <div className="game-card-overlay">
          <div className="play-btn">▶</div>
        </div>
      </div>
      <div className="game-card-content">
        <h3 className="game-card-title">{title}</h3>
      </div>
    </Link>
  );
}
