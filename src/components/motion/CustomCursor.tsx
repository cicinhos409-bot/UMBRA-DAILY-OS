import React, { useEffect, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export const CustomCursor: React.FC = () => {
  const [pos, setPos] = useState({ x: -100, y: -100 });
  const [trailerPos, setTrailerPos] = useState({ x: -100, y: -100 });
  const [isHovering, setIsHovering] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isTouch, setIsTouch] = useState(true);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    // Check touch support
    if (typeof window === 'undefined') return;
    const isTouchDevice =
      'ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches;
    setIsTouch(isTouchDevice);

    if (isTouchDevice || reducedMotion) return;

    const handleMouseMove = (e: MouseEvent) => {
      setPos({ x: e.clientX, y: e.clientY });
      setIsVisible(true);

      // Check if hovering over clickable element
      const target = e.target as HTMLElement | null;
      if (target) {
        const clickable = target.closest('button, a, input, select, textarea, [role="button"], .cursor-pointer');
        setIsHovering(!!clickable);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('mouseleave', handleMouseLeave);

    // Smooth trailer interpolation
    let animationFrameId: number;
    const updateTrailer = () => {
      setTrailerPos((prev) => ({
        x: prev.x + (pos.x - prev.x) * 0.2,
        y: prev.y + (pos.y - prev.y) * 0.2,
      }));
      animationFrameId = requestAnimationFrame(updateTrailer);
    };
    animationFrameId = requestAnimationFrame(updateTrailer);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
      cancelAnimationFrame(animationFrameId);
    };
  }, [pos.x, pos.y, reducedMotion]);

  if (isTouch || reducedMotion || !isVisible) {
    return null;
  }

  return (
    <>
      {/* Central Amber Dot */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-50 rounded-full bg-[#F59E0B] shadow-[0_0_12px_#F59E0B] transition-transform duration-75"
        style={{
          width: '6px',
          height: '6px',
          transform: `translate3d(${pos.x - 3}px, ${pos.y - 3}px, 0)`,
        }}
      />

      {/* Smooth Follower Halo */}
      <div
        className="pointer-events-none fixed top-0 left-0 z-40 rounded-full border border-[#F59E0B]/50 transition-all duration-150 ease-out"
        style={{
          width: isHovering ? '44px' : '26px',
          height: isHovering ? '44px' : '26px',
          transform: `translate3d(${trailerPos.x - (isHovering ? 22 : 13)}px, ${
            trailerPos.y - (isHovering ? 22 : 13)
          }px, 0)`,
          backgroundColor: isHovering ? 'rgba(245, 158, 11, 0.08)' : 'transparent',
          boxShadow: isHovering ? '0 0 20px rgba(245, 158, 11, 0.2)' : 'none',
        }}
      />
    </>
  );
};
