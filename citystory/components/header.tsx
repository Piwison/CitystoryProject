"use client"

import Link from "next/link"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { Menu, X, MapPin, User, LogOut, Settings, Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import LoginModal from "@/components/login-modal"
import RegisterModal from "@/components/register-modal"

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showRegisterModal, setShowRegisterModal] = useState(false)
  const { data: session, status } = useSession();
  const router = useRouter()

  const handleLoginClick = () => {
    setShowLoginModal(true)
  }

  const handleRegisterClick = () => {
    setShowRegisterModal(true)
  }

  const handleProfileClick = () => {
    // No username in NextAuth user object by default
    // You can add a profile page by email or name if needed
    // Example: router.push(`/users/${session.user.email}`)
  }

  const getInitials = (name?: string) => {
    if (!name) return ''
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
  }

  const toggleMobileMenu = () => {
    setIsMenuOpen(!isMenuOpen)
  }

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b bg-white shadow-sm">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <MapPin className="h-6 w-6 text-[#3F72AF]" />
            <span className="font-bold text-xl text-[#112D4E]">Taipei Guide</span>
          </Link>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <Button 
              variant="ghost"
              size="sm"
              className="inline-flex items-center justify-center rounded-md text-gray-700"
              onClick={toggleMobileMenu}
            >
              <span className="sr-only">{isMenuOpen ? "Close menu" : "Open menu"}</span>
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>

          {/* Desktop navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/" className="text-sm font-medium hover:text-[#3F72AF] transition-colors">
              Home
            </Link>
            <Link href="/explore" className="text-sm font-medium hover:text-[#3F72AF] transition-colors">
              Explore
            </Link>
            <Button asChild className="bg-[#FFD700] hover:bg-[#F2C94C] text-[#112D4E]">
              <Link href="/explore">Where to go?</Link>
            </Button>

            {status === "authenticated" && session?.user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      {session.user.image ? (
                        <AvatarImage src={session.user.image} alt={session.user.name || session.user.email || ''} />
                      ) : (
                        <AvatarFallback className="bg-[#3F72AF] text-white">
                          {getInitials(session.user.name || session.user.email || '')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{session.user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{session.user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => router.push('/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => nextAuthSignOut()}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="outline" onClick={handleLoginClick} className="border-[1px]">
                  Log in
                </Button>
                <Button onClick={handleRegisterClick} className="bg-[#3F72AF]">
                  Join
                </Button>
              </div>
            )}
          </nav>
        </div>

        {/* Mobile navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white">
            <div className="space-y-4 p-4">
              <Link
                href="/"
                className="flex items-center py-2 text-base font-medium hover:text-[#3F72AF]"
                onClick={toggleMobileMenu}
              >
                Home
              </Link>
              <Link
                href="/explore"
                className="flex items-center py-2 text-base font-medium hover:text-[#3F72AF]"
                onClick={toggleMobileMenu}
              >
                Explore
              </Link>
              <Button
                asChild
                className="w-full bg-[#FFD700] hover:bg-[#F2C94C] text-[#112D4E]"
                onClick={toggleMobileMenu}
              >
                <Link href="/explore">Where to go?</Link>
              </Button>

              {status === "authenticated" && session?.user ? (
                <>
                  <div className="flex items-center space-x-3 py-2 border-t pt-4">
                    <Avatar className="h-10 w-10">
                      {session.user.image ? (
                        <AvatarImage src={session.user.image} alt={session.user.name || session.user.email || ''} />
                      ) : (
                        <AvatarFallback className="bg-[#3F72AF] text-white">
                          {getInitials(session.user.name || session.user.email || '')}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div>
                      <p className="font-medium">{session.user.name}</p>
                      <p className="text-xs text-gray-500">{session.user.email}</p>
                    </div>
                  </div>
                  <div className="border-t border-gray-100 pt-4 mt-2 space-y-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        if (session.user) {
                          router.push(`/users/${session.user.email}`)
                        }
                        toggleMobileMenu()
                      }}
                    >
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push("/add")
                        toggleMobileMenu()
                      }}
                    >
                      <MapPin className="mr-2 h-4 w-4" />
                      Add a Place
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push("/saved")
                        toggleMobileMenu()
                      }}
                    >
                      <Heart className="mr-2 h-4 w-4" />
                      Saved Places
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => {
                        router.push("/settings")
                        toggleMobileMenu()
                      }}
                    >
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                    onClick={() => {
                      nextAuthSignOut()
                      toggleMobileMenu()
                    }}
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </Button>
                </>
              ) : (
                <div className="space-y-3 pt-4 border-t">
                  <Button variant="outline" onClick={handleLoginClick} className="w-full">
                    Log in
                  </Button>
                  <Button onClick={handleRegisterClick} className="w-full bg-[#3F72AF]">
                    Join
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      <LoginModal
        open={showLoginModal}
        onOpenChange={setShowLoginModal}
        onRegisterClick={() => {
          setShowLoginModal(false)
          setShowRegisterModal(true)
        }}
      />
      <RegisterModal
        open={showRegisterModal}
        onOpenChange={setShowRegisterModal}
        onLoginClick={() => {
          setShowRegisterModal(false)
          setShowLoginModal(true)
        }}
      />
    </>
  )
}
