"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useAuth } from '@/context/AuthContext'
import LoginModal from "@/components/login-modal"
import RegisterModal from "@/components/register-modal" // Import RegisterModal
import { Loader2 } from "lucide-react"

interface AuthGuardProps {
  children: React.ReactNode
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  // Protected routes that require authentication
  const protectedRoutes = ["/add", "/add-content", "/settings", "/saved"]
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  useEffect(() => {
    // Wait for auth to initialize
    if (!isLoading) {
      if (isProtectedRoute && !user) {
        setShowLoginModal(true)
      }
      setIsCheckingAuth(false)
    }
  }, [isLoading, user, isProtectedRoute, pathname])

  // Show loading state while checking auth
  if (isLoading || isCheckingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
        <div className="flex flex-col items-center">
          <Loader2 className="h-10 w-10 text-[#3F72AF] animate-spin mb-4" />
          <p className="text-[#112D4E] font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      {children}

      <LoginModal
        open={showLoginModal}
        onOpenChange={(open) => {
          setShowLoginModal(open)
          if (!open && isProtectedRoute && !user) {
            router.push("/")
          }
        }}
        onRegisterClick={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
      />

      <RegisterModal
        open={showRegisterModal}
        onOpenChange={(open) => {
          setShowRegisterModal(open)
          if (!open && isProtectedRoute && !user) {
            router.push("/")
          }
        }}
        onLoginClick={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />
    </>
  )
}
