import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

export const THUMB_SIZES_XXS = '32px';
export const THUMB_SIZES_XS = '40px';
export const THUMB_SIZES_SM = '48px';
export const THUMB_SIZES_TINY = '56px';
export const THUMB_SIZES_MD = '64px';
export const DEFAULT_THUMB_SIZES = '(max-width: 640px) 44vw, (max-width: 1024px) 22vw, 240px';
export const DEFAULT_HERO_SIZES = '(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 1200px';
export const IMAGE_SIZES = {
  grid3: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  grid4: '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw',
  list: DEFAULT_THUMB_SIZES,
  hero: DEFAULT_HERO_SIZES,
  thumb: THUMB_SIZES_MD,
} as const;
export const BLUR_DATA_URL =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMWUyOTNiIi8+PC9zdmc+';

type CoverThumbImageProps = Omit<ImageProps, 'fill' | 'sizes' | 'className'> & {
  sizes?: ImageProps['sizes'];
  className?: ImageProps['className'];
  priority?: boolean;
  blur?: boolean;
};

type CoverHeroImageProps = Omit<ImageProps, 'fill' | 'sizes' | 'className'> & {
  sizes?: ImageProps['sizes'];
  className?: ImageProps['className'];
  priority?: boolean;
  blur?: boolean;
};

export function CoverThumbImage({
  src,
  alt,
  sizes = DEFAULT_THUMB_SIZES,
  className,
  priority = false,
  blur = true,
  placeholder,
  blurDataURL,
  ...rest
}: CoverThumbImageProps) {
  const resolvedPlaceholder = placeholder ?? (blur ? 'blur' : undefined);
  const resolvedBlurDataURL = blurDataURL ?? (blur ? BLUR_DATA_URL : undefined);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      placeholder={resolvedPlaceholder}
      blurDataURL={resolvedBlurDataURL}
      className={cn('object-cover', className)}
      {...rest}
    />
  );
}

export function CoverHeroImage({
  src,
  alt,
  sizes = DEFAULT_HERO_SIZES,
  className,
  priority = false,
  blur = true,
  placeholder,
  blurDataURL,
  ...rest
}: CoverHeroImageProps) {
  const resolvedPlaceholder = placeholder ?? (blur ? 'blur' : undefined);
  const resolvedBlurDataURL = blurDataURL ?? (blur ? BLUR_DATA_URL : undefined);

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      placeholder={resolvedPlaceholder}
      blurDataURL={resolvedBlurDataURL}
      className={cn('object-cover', className)}
      {...rest}
    />
  );
}
