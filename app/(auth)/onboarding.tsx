'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast, Toaster } from 'react-hot-toast'

export default function OnboardingPage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is logged in
    const session = document.cookie.includes('session')
    if (!session) {
      router.push('/login')
      toast.error('Please login first')
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Toaster />
      
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-8 mt-8">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome to Lebanese Freelance Marketplace! 🎉
            </h1>
            <p className="text-xl text-gray-600">
              Let's set up your profile to get started
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Complete Profile</h3>
              <p className="text-gray-600">Add your personal information and skills</p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">💼</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Set Preferences</h3>
              <p className="text-gray-600">Choose your work preferences and availability</p>
            </div>
            
            <div className="text-center p-6 border border-gray-200 rounded-xl hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🚀</span>
              </div>
              <h3 className="text-xl font-semibold mb-2">Get Started</h3>
              <p className="text-gray-600">Start browsing projects or offering services</p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold mb-4 text-blue-900">Next Steps</h2>
            <ul className="space-y-3">
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">1</span>
                <span>Complete your profile information</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">2</span>
                <span>Add your skills and expertise</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">3</span>
                <span>Set up your payment methods</span>
              </li>
              <li className="flex items-center">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mr-3">4</span>
                <span>Browse available projects or post your services</span>
              </li>
            </ul>
          </div>

          <div className="flex justify-center space-x-4">
            <button
              onClick={() => router.push('/profile/setup')}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
            >
              Complete My Profile
            </button>
            <button
              onClick={() => router.push('/dashboard')}
              className="px-8 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition"
            >
              Skip to Dashboard
            </button>
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200 text-center">
            <p className="text-gray-600">
              Need help? <a href="#" className="text-blue-600 hover:underline">Contact support</a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}