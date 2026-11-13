"use client";

import Link from "next/link";
import { useState } from "react";

interface GameCardProps {
  title: string;
  image_path: string;
  link_url: string;
  category_group?: string;
  theme_color?: string; // নতুন: কালার প্রপ
}

export default function GameCard({ 
  title, 
  image_path, 
  link_url, 
  category_group = "CASINO",
  theme_color = "#22c55e" // ডিফল্ট কালার
}: GameCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <Link 
      href={link_url} 
      className="shuffle-game-card"
      style={{ 
        borderColor: theme_color, // বর্ডার কালার ডাটাবেস থেকে আসবে
        boxShadow: `0 4px 10px rgba(0,0,0,0.5), inset 0 0 10px ${theme_color}40` // হালকা ইনসেট গ্লো
      }}
    >
      <div className="card-image-wrapper">
        {image_path && !imgError ? (
          <img 
            src={image_path} 
            alt={title} 
            className="card-image" 
            onError={() => setImgError(true)} 
            loading="lazy"
          />
        ) : (
          <div className="card-placeholder">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
          </div>
        )}
        
        {/* টপ রিবন (কালার ডাটাবেস থেকে আসবে) */}
        <div className="card-ribbon" style={{ backgroundColor: theme_color }}>
          {category_group}
        </div>

        <div className="card-overlay-gradient"></div>
        <h3 className="card-title-bottom">{title}</h3>
        
        <div className="card-hover-effect">
          <div className="play-icon">▶</div>
        </div>
      </div>
    </Link>
  );
}
