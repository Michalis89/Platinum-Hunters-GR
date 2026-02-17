import Image, { type ImageProps } from 'next/image';
import { cn } from '@/lib/utils';

type AvatarImageProps = Omit<
  ImageProps,
  'fill' | 'width' | 'height' | 'sizes' | 'className' | 'src' | 'alt'
> & {
  src?: ImageProps['src'];
  alt?: string;
  size: number;
  className?: string;
};

export function AvatarImage({ size, className, ...props }: AvatarImageProps) {
  const { src, alt, ...rest } = props;
  if (!src) {
    return null;
  }

  return (
    <Image
      src={src}
      alt={alt ?? ''}
      {...rest}
      width={size}
      height={size}
      sizes={`${size}px`}
      className={cn('h-full w-full object-cover', className)}
    />
  );
}
