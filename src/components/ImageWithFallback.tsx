import React, { useState } from 'react';
import { MASCOT_ASSETS } from '../assets/mascot';

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
  avatarMode?: boolean;
}

// Inline SVG dynamic avatar guaranteed to never fail even offline or broken asset
const createInlineSvgAvatar = (label: string = 'D') => {
  const initial = (label || 'D').charAt(0).toUpperCase();
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#3B82F6"/>
        <stop offset="50%" stop-color="#8B5CF6"/>
        <stop offset="100%" stop-color="#06B6D4"/>
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="url(#g)" rx="24"/>
    <text x="50" y="58" font-family="system-ui, sans-serif" font-size="40" font-weight="900" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt,
  className,
  fallbackSrc = MASCOT_ASSETS.portraitAvatar,
  avatarMode = false,
  ...props
}) => {
  const [errorCount, setErrorCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || fallbackSrc);

  React.useEffect(() => {
    setCurrentSrc(src || fallbackSrc);
    setErrorCount(0);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (errorCount === 0) {
      // First attempt fallback: Dqua Mascot Portrait
      setErrorCount(1);
      setCurrentSrc(fallbackSrc);
    } else if (errorCount === 1) {
      // Second attempt fallback: Inline SVG avatar that can never fail
      setErrorCount(2);
      setCurrentSrc(createInlineSvgAvatar(alt || 'Dqua'));
    }
  };

  return (
    <img
      src={currentSrc}
      alt={alt || 'Dqua Media'}
      className={className}
      onError={handleError}
      loading="lazy"
      referrerPolicy="no-referrer"
      {...props}
    />
  );
};

