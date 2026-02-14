import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

export const THUMB_SIZES_XXS = '32px';
export const THUMB_SIZES_XS = '40px';
export const THUMB_SIZES_SM = '48px';
export const THUMB_SIZES_TINY = '56px';
export const THUMB_SIZES_MD = '64px';
export const DEFAULT_THUMB_SIZES = '(max-width: 640px) 44vw, (max-width: 1024px) 22vw, 240px';
export const DEFAULT_HERO_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px';

const UNOPTIMIZED_CDN_HOSTNAMES = new Set([
  'media.rawg.io',
  'cdn.myanimelist.net',
  'image.tmdb.org',
]);

const getRemoteHostname = (src: ImageProps['src']) => {
  if (typeof src !== 'string') {
    return null;
  }

  const normalized = src.startsWith('//') ? `https:${src}` : src;
  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    return null;
  }

  try {
    return new URL(normalized).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const shouldDefaultToUnoptimized = (src: ImageProps['src']) => {
  const hostname = getRemoteHostname(src);
  return hostname ? UNOPTIMIZED_CDN_HOSTNAMES.has(hostname) : false;
};

type CoverThumbImageProps = Omit<ImageProps, 'fill' | 'sizes' | 'className'> & {
  sizes?: ImageProps['sizes'];
  className?: ImageProps['className'];
};

type CoverHeroImageProps = Omit<ImageProps, 'fill' | 'sizes' | 'className'> & {
  sizes?: ImageProps['sizes'];
  className?: ImageProps['className'];
};

export function CoverThumbImage({
  src,
  alt,
  sizes = DEFAULT_THUMB_SIZES,
  className,
  unoptimized,
  ...rest
}: CoverThumbImageProps) {
  const shouldUnoptimized = unoptimized ?? shouldDefaultToUnoptimized(src);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn('object-cover', className)}
      unoptimized={shouldUnoptimized}
      {...rest}
    />
  );
}

export function CoverHeroImage({
  src,
  alt,
  sizes = DEFAULT_HERO_SIZES,
  className,
  ...rest
}: CoverHeroImageProps) {
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      className={cn('object-cover', className)}
      {...rest}
    />
  );
}
