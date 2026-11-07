import React from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

interface TextRevealProps {
  text: string;
  className?: string;
  highlightWords?: string[];
  highlightClass?: string;
  delayOffset?: number;
}

export const TextReveal: React.FC<TextRevealProps> = ({
  text,
  className = '',
  highlightWords = [],
  highlightClass = 'bg-gradient-to-r from-[#F59E0B] via-[#FBBF24] to-[#F59E0B] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(245,158,11,0.25)]',
  delayOffset = 0,
}) => {
  const words = text.split(' ');
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return (
      <span className={className}>
        {words.map((word, i) => {
          const isHighlight = highlightWords.some((hw) =>
            word.toLowerCase().includes(hw.toLowerCase())
          );
          return (
            <span
              key={i}
              className={isHighlight ? highlightClass : 'text-white'}
            >
              {word}{' '}
            </span>
          );
        })}
      </span>
    );
  }

  return (
    <span className={`inline-block ${className}`}>
      {words.map((word, i) => {
        const isHighlight = highlightWords.some((hw) =>
          word.toLowerCase().includes(hw.toLowerCase())
        );
        const delay = delayOffset + i * 0.055;

        return (
          <span
            key={i}
            className={`inline-block mr-[0.25em] transition-all duration-500 hover:scale-105 hover:-translate-y-0.5 cursor-default ${
              isHighlight ? highlightClass : 'text-white'
            }`}
            style={{
              animation: `textBlurFadeIn 0.7s cubic-bezier(0.16, 1, 0.3, 1) both`,
              animationDelay: `${delay}s`,
            }}
          >
            {word}
          </span>
        );
      })}
    </span>
  );
};
