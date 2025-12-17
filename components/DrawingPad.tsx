import React, { useRef, useEffect, useState, useCallback } from 'react';

interface DrawingPadProps {
  onClear: () => void;
  onDrawEnd?: () => void;
  width?: number;
  height?: number;
  className?: string;
}

// Helper to get touch/mouse coordinates
const getCoordinates = (event: MouseEvent | TouchEvent, canvas: HTMLCanvasElement) => {
  const rect = canvas.getBoundingClientRect();
  let clientX, clientY;

  if ((event as TouchEvent).touches && (event as TouchEvent).touches.length > 0) {
    clientX = (event as TouchEvent).touches[0].clientX;
    clientY = (event as TouchEvent).touches[0].clientY;
  } else {
    clientX = (event as MouseEvent).clientX;
    clientY = (event as MouseEvent).clientY;
  }

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
};

export const DrawingPad = React.forwardRef<HTMLCanvasElement, DrawingPadProps>(
  ({ onClear, onDrawEnd, width = 350, height = 350, className }, ref) => {
    const localRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    
    // Brush physics state
    const lastPos = useRef<{x: number, y: number} | null>(null);
    const lastTime = useRef<number>(0);
    const lastWidth = useRef<number>(0);

    // Configuration for "Brush" feel
    const MIN_WIDTH = 2;
    const MAX_WIDTH = 12;
    const VELOCITY_WEIGHT = 0.8; // How much velocity affects width (0-1)

    // Combine refs
    useEffect(() => {
      if (typeof ref === 'function') {
        ref(localRef.current);
      } else if (ref) {
        ref.current = localRef.current;
      }
    }, [ref]);

    useEffect(() => {
      const canvas = localRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Initial setup
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }, []);

    const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      const canvas = localRef.current;
      if (!canvas) return;

      setIsDrawing(true);
      const { x, y } = getCoordinates(e.nativeEvent as MouseEvent | TouchEvent, canvas);
      
      lastPos.current = { x, y };
      lastTime.current = Date.now();
      lastWidth.current = (MAX_WIDTH + MIN_WIDTH) / 2; // Start with medium width

      // Draw a single dot in case it's just a tap
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.beginPath();
        ctx.arc(x, y, lastWidth.current / 2, 0, Math.PI * 2);
        ctx.fillStyle = '#1a1a1a';
        ctx.fill();
      }
    }, []);

    const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!isDrawing || !lastPos.current) return;
      
      const canvas = localRef.current;
      if (!canvas) return;

      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const { x, y } = getCoordinates(e.nativeEvent as MouseEvent | TouchEvent, canvas);
      const currentTime = Date.now();
      
      // Calculate velocity
      const distance = Math.hypot(x - lastPos.current.x, y - lastPos.current.y);
      const timeDiff = currentTime - lastTime.current;
      const velocity = timeDiff > 0 ? distance / timeDiff : 0;

      // Calculate new width based on velocity (faster = thinner, slower = thicker)
      // We clamp velocity effect to keep it usable
      const targetWidth = Math.max(
          MIN_WIDTH, 
          Math.min(MAX_WIDTH, MAX_WIDTH - (velocity * 3))
      );
      
      // Smooth the width transition
      const newWidth = lastWidth.current + (targetWidth - lastWidth.current) * 0.2;

      // Draw segment
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(x, y);
      
      // We use the average width for this segment to smooth it out
      ctx.lineWidth = newWidth;
      ctx.strokeStyle = '#1a1a1a';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Update state
      lastPos.current = { x, y };
      lastTime.current = currentTime;
      lastWidth.current = newWidth;

    }, [isDrawing]);

    const stopDrawing = useCallback(() => {
      if (isDrawing) {
        setIsDrawing(false);
        lastPos.current = null;
        if (onDrawEnd) onDrawEnd();
      }
    }, [isDrawing, onDrawEnd]);

    return (
      <div className={`relative ${className} border-2 border-stone-300 bg-white shadow-inner rounded-sm overflow-hidden touch-none`}>
        {/* Grid Guidelines */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
             <div className="absolute left-1/2 top-0 bottom-0 border-l border-dashed border-red-500 transform -translate-x-1/2"></div>
             <div className="absolute top-1/2 left-0 right-0 border-t border-dashed border-red-500 transform -translate-y-1/2"></div>
        </div>
        
        <canvas
          ref={localRef}
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair w-full h-full block"
        />
      </div>
    );
  }
);

DrawingPad.displayName = "DrawingPad";