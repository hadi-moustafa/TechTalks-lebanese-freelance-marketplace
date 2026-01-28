import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
// Removed unused cva import for now, as the component uses a custom variants object.
// import { cva, type VariantProps } from "class-variance-authority"

import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost" | "social" | "destructive"
    size?: "default" | "sm" | "lg" | "icon"
    isLoading?: boolean
    asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "default", isLoading, asChild = false, children, ...props }, ref) => {
        // Base styles
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"

        // Variants
        const variants = {
            primary: "bg-lebanon-red text-white hover:bg-red-700 shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5",
            secondary: "bg-lebanon-green text-white hover:bg-green-700 shadow-md",
            outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
            ghost: "hover:bg-accent hover:text-accent-foreground",
            social: "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:text-gray-900 shadow-sm",
            destructive: "bg-red-500 text-white hover:bg-red-600",
        }

        // Sizes
        const sizes = {
            default: "h-10 px-4 py-2",
            sm: "h-9 rounded-md px-3",
            lg: "h-11 rounded-md px-8",
            icon: "h-10 w-10",
        }

        const Comp = asChild ? Slot : "button"
        // Note: I need @radix-ui/react-slot for Slot. I didn't install it. I'll remove Slot support for now to keep it simple and dependencyless.

        return (
            <button
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                ref={ref}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {children}
            </button>
        )
    }
)
Button.displayName = "Button"

export { Button }
