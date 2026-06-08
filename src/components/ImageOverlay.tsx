import React, { useState, useEffect, useRef } from "react";
import { ZoomIn, ZoomOut, RotateCw, Maximize2, X, RefreshCw, Move } from "lucide-react";

interface ImageOverlayProps {
  src: string;
  alt?: string;
  onClose: () => void;
}

export default function ImageOverlay({ src, alt, onClose }: ImageOverlayProps) {
  const [scale, setScale] = useState<number>(1);
  const [rotation, setRotation] = useState<number>(0);
  const [position, setPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const imageRef = useRef<HTMLImageElement>(null);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleZoomIn = () => setScale(prev => Math.min(prev + 0.25, 4));
  const handleZoomOut = () => setScale(prev => Math.max(prev - 0.25, 0.75));
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);
  const handleReset = () => {
    setScale(1);
    setRotation(0);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (scale === 1) return; // Only allow drag when zoomed
    setIsDragging(true);
    dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/90 p-4 select-none backdrop-blur-md"
      onMouseUp={handleMouseUp}
    >
      {/* Header bar */}
      <div className="w-full flex items-center justify-between text-white border-b border-white/10 pb-3" id="zoom-overlay-header">
        <div className="flex items-center gap-2">
          <Maximize2 className="h-5 w-5 text-indigo-400" />
          <span className="font-medium text-lg text-slate-100">Kính lúp kiểm tra hình vẽ</span>
          <span className="text-xs bg-indigo-600/60 px-2 py-0.5 rounded text-white/90">
            {Math.round(scale * 100)}% Zoom
          </span>
        </div>
        <button
          onClick={onClose}
          id="close-zoom-btn"
          className="p-2 bg-white/10 hover:bg-white/20 transition-all rounded-full border border-white/10 hover:scale-105 active:scale-95"
          title="Đóng kính lúp (Esc)"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Image container area with grid */}
      <div 
        className={`relative flex-1 w-full flex items-center justify-center overflow-hidden cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        style={{ touchAction: "none" }}
      >
        {/* Subtle coordinate grids for scientific atmosphere */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:30px_30px]" />
        
        <div
          style={{
            transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.1, 0.7, 0.1, 1)',
          }}
          className="relative max-w-full max-h-[70vh] flex items-center justify-center pointer-events-none"
        >
          <img
            ref={imageRef}
            src={src}
            alt={alt || "Hình ảnh bài tập"}
            className="max-w-[90vw] max-h-[65vh] object-contain rounded-lg shadow-2xl border border-white/10 pointer-events-auto"
            referrerPolicy="no-referrer"
          />
        </div>

        {scale > 1 && (
          <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 text-xs text-white/80 flex items-center gap-1">
            <Move className="h-3.5 w-3.5 text-indigo-400" />
            <span>Kéo thả chuột để di chuyển vùng phóng to</span>
          </div>
        )}
      </div>

      {/* Controller Controls Footer */}
      <div className="w-full max-w-lg mb-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-4 flex flex-col gap-3">
        {/* Slider control */}
        <div className="flex items-center gap-3">
          <ZoomOut className="h-4 w-4 text-slate-400" />
          <input
            id="zoom-range-slider"
            type="range"
            min="0.75"
            max="4"
            step="0.05"
            value={scale}
            onChange={(e) => setScale(Number(e.target.value))}
            className="flex-1 accent-indigo-500 h-1.5 bg-slate-700 rounded-lg cursor-pointer"
          />
          <ZoomIn className="h-4 w-4 text-slate-400" />
        </div>

        {/* Buttons Control Row */}
        <div className="flex items-center justify-between text-xs font-medium">
          <button
            onClick={handleZoomOut}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white rounded-xl transition border border-slate-700"
          >
            <ZoomOut className="h-4 w-4" /> THU NHỎ
          </button>
          
          <button
            onClick={handleZoomIn}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white rounded-xl transition border border-slate-700"
          >
            <ZoomIn className="h-4 w-4" /> PHÓNG TO
          </button>

          <button
            onClick={handleRotate}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-200 hover:text-white rounded-xl transition border border-slate-700"
          >
            <RotateCw className="h-4 w-4" /> XOAY HÌNH
          </button>

          <button
            onClick={handleReset}
            className="flex items-center gap-1 px-3 py-2 bg-slate-800/60 hover:bg-slate-700/80 hover:text-white text-slate-400 rounded-xl transition border border-slate-700"
          >
            <RefreshCw className="h-3.5 w-3.5" /> MẶC ĐỊNH
          </button>
        </div>
      </div>
    </div>
  );
}
