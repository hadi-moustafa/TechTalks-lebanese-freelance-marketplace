"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

const AvatarContext = React.createContext<{
    imageLoadingStatus: 'loading' | 'loaded' | 'error',
    setImageLoadingStatus: (status: 'loading' | 'loaded' | 'error') => void
} | null>(null)

const Avatar = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const [imageLoadingStatus, setImageLoadingStatus] = React.useState<'loading' | 'loaded' | 'error'>('loading')

    return (
        <AvatarContext.Provider value={{ imageLoadingStatus, setImageLoadingStatus }}>
            <div
                ref={ref}
                className={cn(
                    "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full",
                    className
                )}
                {...props}
            />
        </AvatarContext.Provider>
    )
})
Avatar.displayName = "Avatar"

const AvatarImage = React.forwardRef<
    HTMLImageElement,
    Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src?: string | Blob }
>(({ className, src, ...props }, ref) => {
    const context = React.useContext(AvatarContext)
    const [blobUrl, setBlobUrl] = React.useState<string>()

    React.useEffect(() => {
        if (src instanceof Blob) {
            const url = URL.createObjectURL(src)
            setBlobUrl(url)
            return () => URL.revokeObjectURL(url)
        } else {
            setBlobUrl(undefined)
        }
    }, [src])

    const effectiveSrc = typeof src === 'string' ? src : blobUrl

    React.useEffect(() => {
        if (!context) return

        if (!src) {
            context.setImageLoadingStatus('error')
            return
        }

        if (!effectiveSrc) {
            // Waiting for blob url or src is undefined
            return
        }

        context.setImageLoadingStatus('loading')

        const img = new Image()
        img.src = effectiveSrc
        img.onload = () => context.setImageLoadingStatus('loaded')
        img.onerror = () => context.setImageLoadingStatus('error')

    }, [effectiveSrc, context?.setImageLoadingStatus, src])

    if (context && context.imageLoadingStatus !== 'loaded') return null

    return (
        <img
            ref={ref}
            src={effectiveSrc}
            className={cn("aspect-square h-full w-full", className)}
            {...props}
        />
    )
})
AvatarImage.displayName = "AvatarImage"

const AvatarFallback = React.forwardRef<
    HTMLDivElement,
    React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
    const context = React.useContext(AvatarContext)

    if (context && context.imageLoadingStatus === 'loaded') return null

    return (
        <div
            ref={ref}
            className={cn(
                "flex h-full w-full items-center justify-center rounded-full bg-muted",
                className
            )}
            {...props}
        />
    )
})
AvatarFallback.displayName = "AvatarFallback"

export { Avatar, AvatarImage, AvatarFallback }
