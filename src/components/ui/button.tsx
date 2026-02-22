import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] disabled:pointer-events-none disabled:opacity-50 cursor-pointer active:scale-[0.97]",
    {
        variants: {
            variant: {
                default:
                    "bg-[var(--primary)] text-[var(--primary-foreground)] hover:brightness-110 shadow-lg shadow-[var(--primary)]/15",
                destructive:
                    "bg-[var(--destructive)] text-[var(--destructive-foreground)] hover:brightness-110 shadow-lg shadow-[var(--destructive)]/15",
                outline:
                    "border border-[var(--input)] bg-transparent hover:bg-white/[0.04] hover:border-white/[0.1]",
                secondary:
                    "bg-[var(--secondary)] text-[var(--secondary-foreground)] hover:brightness-125",
                ghost:
                    "hover:bg-white/[0.04]",
                link:
                    "text-[var(--primary)] underline-offset-4 hover:underline",
                success:
                    "bg-emerald-500 text-white hover:bg-emerald-400 shadow-lg shadow-emerald-500/15",
                warning:
                    "bg-amber-500 text-white hover:bg-amber-400 shadow-lg shadow-amber-500/15",
            },
            size: {
                default: "h-10 px-5 py-2",
                sm: "h-8 rounded-lg px-3 text-xs",
                lg: "h-12 rounded-xl px-8 text-base",
                icon: "h-9 w-9 rounded-lg",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> { }

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant, size, ...props }, ref) => {
        return (
            <button
                className={cn(buttonVariants({ variant, size, className }))}
                ref={ref}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

export { Button, buttonVariants };
