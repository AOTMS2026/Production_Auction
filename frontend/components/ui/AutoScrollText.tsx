'use client';

import React, { useRef, useState, useEffect } from 'react';

interface AutoScrollTextProps {
  text: string;
  className?: string;
  title?: string;
  speed?: number;
}

export const AutoScrollText: React.FC<AutoScrollTextProps> = ({
  text,
  className = '',
  title,
  speed,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        setIsOverflowing(textRef.current.scrollWidth > containerRef.current.clientWidth + 2);
      }
    };

    checkOverflow();
    const timeout = setTimeout(checkOverflow, 100);
    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [text]);

  const duration = speed || Math.max(6, Math.min(22, (text?.length || 10) * 0.55));

  return (
    <div
      ref={containerRef}
      className={`overflow-hidden whitespace-nowrap relative select-none ${className}`}
      title={title || text}
    >
      {isOverflowing ? (
        <div
          className="inline-flex whitespace-nowrap animate-name-scroll hover:[animation-play-state:paused]"
          style={{ animationDuration: `${duration}s` }}
        >
          <span ref={textRef} className="pr-8">
            {text}
          </span>
          <span className="pr-8">{text}</span>
        </div>
      ) : (
        <span ref={textRef} className="block truncate">
          {text}
        </span>
      )}
    </div>
  );
};
