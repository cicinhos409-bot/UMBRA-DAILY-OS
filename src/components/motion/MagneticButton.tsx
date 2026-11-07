import React, { useRef, useState } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useSound } from '../../hooks/useSound';

interface MagneticButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  magneticStrength?: number;
  enableSound?: boolean;
}

export const MagneticButton: React.FC<MagneticButtonProps> = ({
  children,
  className = '',
  variant = 'primary',
  magneticStrength = 0.22,
  enableSound = true,
  onClick,
  onMouseEnter,
  ...props
}) => {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const reducedMotion = useReducedMotion();
  const { playClick, playHover } = useSound();

  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (reducedMotion || !btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const deltaX = (e.clientX - centerX) * magneticStrength;
    const deltaY = (e.clientY - centerY) * magneticStrength;
    setOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    setIsHovered(true);
    if (enableSound) playHover();
    if (onMouseEnter) onMouseEnter(e);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setOffset({ x: 0, y: 0 });
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (enableSound) playClick();
    if (onClick) onClick(e);
  };

  // Base styles depending on variant
  const baseVariants = {
    primary:
      'bg-[#F59E0B] hover:bg-[#FBBF24] text-black font-extrabold shadow-[0_0_25px_-5px_rgba(245,158,11,0.5)] hover:shadow-[0_0_35px_0px_rgba(245,158,11,0.7)]',
    secondary:
      'bg-[#121212] hover:bg-[#1A1A1A] text-white border border-[#2E2E2E] hover:border-[#F59E0B]/50',
    ghost:
      'bg-transparent hover:bg-[#1A1A1A]/60 text-[#A1A1AA] hover:text-white',
  };

  return (
    <button
      ref={btnRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        transform: !reducedMotion ? `translate3d(${offset.x}px, ${offset.y}px, 0)` : undefined,
        transition: isHovered
          ? 'transform 0.1s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease'
          : 'transform 0.35s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease',
      }}
      className={`relative inline-flex items-center justify-center overflow-hidden rounded-xl cursor-pointer active:scale-95 transition-colors select-none ${baseVariants[variant]} ${className}`}
      {...props}
    >
      {/* Light sweep shimmer effect */}
      <div
        className="pointer-events-none absolute -inset-full top-0 block h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 group-hover:animate-shimmer"
      />

      <span className="relative z-10 flex items-center justify-center gap-2">
        {children}
      </span>
    </button>
  );
};
