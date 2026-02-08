import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import Link, { type LinkProps } from 'next/link';

import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--apple-radius-control)] text-sm font-medium leading-none transition duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--hb-ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--hb-bg)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--hb-primary-strong)] text-[var(--hb-button-primary-text)] font-semibold shadow-[var(--hb-shadow-sm)] hover:brightness-105 active:brightness-95',
        secondary:
          'border-[var(--apple-hairline)] border-[var(--hb-border)] bg-[var(--hb-card)] text-[var(--hb-text)] shadow-[var(--hb-shadow-sm)] hover:bg-[var(--apple-tertiary-fill)]',
        outline:
          'border-[var(--apple-hairline)] border-[var(--hb-border)] font-semibold bg-transparent shadow-[var(--hb-shadow-sm)] hover:bg-[var(--apple-tertiary-fill)]',
        ghost:
          'text-[var(--hb-text)] hover:bg-[var(--apple-tertiary-fill)] font-semibold',
        link: 'h-auto rounded-none p-0 text-[var(--hb-primary-strong)] underline-offset-4 hover:underline font-semibold',
        success: 'bg-[#34c759] text-white shadow-[var(--hb-shadow-sm)] hover:brightness-105 font-semibold',
        warning: 'bg-[#ff9f0a] text-black shadow-[var(--hb-shadow-sm)] hover:brightness-105 font-semibold',
        destructive:
          'bg-[#ff3b30] text-[var(--hb-button-primary-text)] shadow-[var(--hb-shadow-sm)] hover:brightness-105 active:brightness-95 font-semibold',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6',
        xl: 'h-12 w-full px-6 text-lg font-bold',
        icon: 'h-9 w-9 p-0',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'default',
    },
  },
);

type ButtonBaseProps = VariantProps<typeof buttonVariants> & {
  asChild?: boolean;
  className?: string;
  children?: React.ReactNode;
  icon?: React.ReactNode;
  iconOnly?: boolean;
  ariaLabel?: string;
};

export type ButtonProps = ButtonBaseProps &
  React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    href?: LinkProps['href'];
    type?: 'button' | 'submit' | 'reset';
  };

const Button = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      href,
      icon,
      iconOnly,
      ariaLabel,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const classes = cn(buttonVariants({ variant, size, className }), iconOnly && 'px-0 py-0');
    const accessibleLabel = ariaLabel || props['aria-label'];

    if (href) {
      return (
        <Link
          href={href}
          className={classes}
          aria-label={accessibleLabel}
          aria-disabled={disabled}
          tabIndex={disabled ? -1 : undefined}
          onClick={props.onClick as React.MouseEventHandler<HTMLAnchorElement>}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {icon}
          {children}
        </Link>
      );
    }

    const Comp = asChild ? Slot : 'button';
    const content = asChild
      ? React.Children.toArray(children).find(child => React.isValidElement(child)) ?? null
      : (
          <>
            {icon}
            {children}
          </>
        );
    return (
      <Comp
        className={classes}
        ref={ref as React.Ref<HTMLButtonElement>}
        aria-label={accessibleLabel}
        disabled={disabled}
        {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      >
        {content}
      </Comp>
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
