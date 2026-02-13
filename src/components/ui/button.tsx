import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import Link, { type LinkProps } from 'next/link';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'text-sm font-medium leading-none',
    'transition duration-200 ease-out',
    'rounded-md',
    // Focus
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
    'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
    // Disabled
    'disabled:pointer-events-none disabled:opacity-50',
    // Icons
    '[&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary:
          'bg-primary text-primary-foreground shadow-sm hover:brightness-105 active:brightness-95',
        secondary:
          'bg-secondary text-secondary-foreground border border-border shadow-sm hover:bg-surface-hover',
        outline:
          'border border-border bg-transparent text-foreground shadow-sm hover:bg-surface-hover',
        ghost: 'bg-transparent text-foreground hover:bg-surface-hover',
        link: 'h-auto rounded-none p-0 text-primary underline-offset-4 hover:underline',
        success: 'bg-success text-white shadow-sm hover:brightness-105 active:brightness-95',
        warning: 'bg-warning text-black shadow-sm hover:brightness-105 active:brightness-95',
        destructive:
          'bg-destructive text-destructive-foreground shadow-sm hover:brightness-105 active:brightness-95',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-11 px-6',
        xl: 'h-12 w-full px-6 text-lg font-semibold',
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
  disabled?: boolean;
};

type AnchorButtonProps = ButtonBaseProps &
  LinkProps &
  Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'className'> & {
    href: LinkProps['href'];
    type?: never;
  };

type NativeButtonProps = ButtonBaseProps &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
    href?: undefined;
    type?: 'button' | 'submit' | 'reset';
  };

export type ButtonProps = AnchorButtonProps | NativeButtonProps;

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

    const content = asChild ? (
      (React.Children.toArray(children).find(child => React.isValidElement(child)) ?? null)
    ) : (
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
