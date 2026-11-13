"use client";

import Link from "next/link";
import { useState } from "react";
import "./GameCard.css";

interface GameCardProps {
  title: string;
  image_path: string;
  link_url: string;
  category_group?: string;
  theme_color?: string; // অ্যাডমিন থেকে আসা কালার
}

export default function GameCard({ 
  title, 
  image_path, 
  link_url, 
  category_group = "SHUFFLE", // ডিফল্ট নাম
  theme_color = "#8b5cf6" // ডিফল্ট কালার (বেগুনি)
}: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !image_path || imgError;

  return (
    <Link 
      href={link_url} 
      className="shuffle-game-card"
      style={{ borderColor: theme_color }} // বর্ডার কালার
    >
      <div className="card-inner">
        {/* ইমেজ */}
        {!showFallback ? (
          <img 
            src={image_path} 
            alt={title} 
            className="card-img" 
            onError={() => setImgError(true)} 
            loading="lazy"
          />
        ) : (
          <div className="card-placeholder">
            <span>No Image</span>
          </div>
        )}
        
        {/* টপ রিবন */}
        <div className="card-ribbon" style={{ backgroundColor: theme_color }}>
          {category_group}
        </div>

        {/* নিচের কালো শ্যাডো (টেক্সট ফুটিয়ে তোলার জন্য) */}
        <div className="card-gradient"></div>
        
        {/* গেমের নাম */}
        <h3 className="card-title">{title}</h3>
      </div>
    </Link>
  );
}
