"use client";

import Link from "next/link";
import { useState } from "react";
import "./GameCard.css";

interface GameCardProps {
  title: string;
  image_path: string;
  link_url: string;
  category_group?: string;
  theme_color?: string;
  show_title?: boolean;
  show_category_ribbon?: boolean; // 👈 নতুন প্রপ
}

export default function GameCard({ 
  title, 
  image_path, 
  link_url, 
  category_group = "CASINO",
  theme_color = "#22c55e",
  show_title = true,
  show_category_ribbon = true // 👈 ডিফল্ট true
}: GameCardProps) {
  const [imgError, setImgError] = useState(false);
  const showFallback = !image_path || imgError;

  return (
    <Link 
      href={link_url} 
      className="shuffle-game-card"
      // বর্ডার কালার সবসময় থাকবে, এটি টাইটেল বা রিবনের ওপর নির্ভর করে না
      style={{ border: `2px solid ${theme_color}` }} 
    >
      <div className="card-inner">
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
        
        {/* রিবন (ওপরের কালার বার) - শুধু show_category_ribbon true হলে দেখাবে */}
        {show_category_ribbon && (
          <div className="card-ribbon" style={{ backgroundColor: theme_color }}>
            {category_group}
          </div>
        )}

        <div className="card-gradient"></div>
        
        {/* টাইটেল (নিচের নাম) - শুধু show_title true হলে দেখাবে */}
        {show_title && (
          <h3 className="card-title">{title}</h3>
        )}
        
      </div>
    </Link>
  );
}
