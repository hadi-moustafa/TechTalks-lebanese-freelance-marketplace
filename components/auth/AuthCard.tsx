import * as React from "react"
import { ReactNode } from 'react'

interface AuthCardProps {
    children: React.ReactNode
    title: string
    subtitle?: string
    imageSideContent?: React.ReactNode
    className?: string
}

export function AuthCard({ children, title, subtitle, imageSideContent, className = "" }: AuthCardProps) {
    return (
        <div
            className="min-h-screen w-full flex items-center justify-center p-4 sm:p-8 animate-fade-in font-sans relative bg-cover bg-center bg-no-repeat bg-fixed"
            style={{ backgroundImage: "url('/images/lebanese_skyline_bg.png')" }}
        >
            {/* Brightening Overlay */}
            <div className="absolute inset-0 bg-white/70 backdrop-blur-[2px] z-0" />

            <div className={`w-full max-w-5xl bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl overflow-hidden grid lg:grid-cols-2 min-h-[600px] border border-white/60 ring-1 ring-gray-100 relative z-10 transition-all duration-500 hover:shadow-3xl ${className}`}>

                {/* Form Side */}
                <div className="p-8 md:p-12 flex flex-col justify-center space-y-8 order-2 lg:order-1 relative bg-white/50">
                    <div className="space-y-2 text-center lg:text-left">
                        {/* Logo */}
                        <div className="flex justify-center lg:justify-start mb-6">
                            <img src="/images/lfm_logo.png" alt="LFM Logo" className="h-16 w-auto object-contain" />
                        </div>
                        <h1 className="text-3xl font-bold tracking-tight text-gray-900">{title}</h1>
                        {subtitle && <p className="text-gray-500">{subtitle}</p>}
                    </div>
                    <div className="w-full max-w-sm mx-auto lg:mx-0">
                        {children}
                    </div>
                </div>

                {/* Image/Brand Side - New Uploaded Image */}
                <div
                    className="relative hidden lg:flex flex-col items-center justify-center p-12 order-1 lg:order-2 overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: "url('/images/auth_side_bg.jpg')" }}
                >
                    {/* Overlay for text readability */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent" />

                    <div className="relative z-10 text-center space-y-8 max-w-md text-white mt-auto">
                        {imageSideContent ? imageSideContent : (
                            <div className="space-y-4">
                                <h2 className="text-3xl font-extrabold tracking-tight drop-shadow-md">Welcome Home</h2>
                                <p className="text-white/90 text-lg leading-relaxed font-medium drop-shadow-sm">
                                    Join a community of Lebanese talent building the future, together.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
