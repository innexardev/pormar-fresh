'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { FALLBACK_IMAGES, sanitizeImageUrl } from '@/lib/images';

type Props = {
  src?: string | null;
  alt: string;
  fallback?: string;
  className?: string;
  fill?: boolean;
  priority?: boolean;
  sizes?: string;
};

export function ProductImage({
  src,
  alt,
  fallback = FALLBACK_IMAGES.product,
  className = '',
  fill = true,
  priority = false,
  sizes = '(max-width: 768px) 100vw, 33vw',
}: Props) {
  const [imgSrc, setImgSrc] = useState(() => sanitizeImageUrl(src, fallback));
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setImgSrc(sanitizeImageUrl(src, fallback));
    setLoaded(false);
  }, [src, fallback]);

  return (
    <div className={`relative overflow-hidden bg-fresh-100 ${className}`}>
      {!loaded && (
        <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-fresh-100 via-fresh-200/50 to-fresh-100 bg-[length:200%_100%]" />
      )}
      <Image
        src={imgSrc}
        alt={alt}
        fill={fill}
        priority={priority}
        sizes={sizes}
        unoptimized={imgSrc.includes('onnshoppe.com')}
        className={`object-cover transition-transform duration-700 group-hover:scale-110 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setLoaded(true)}
        onError={() => setImgSrc(fallback)}
      />
    </div>
  );
}
