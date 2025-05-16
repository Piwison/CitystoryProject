import Link from "next/link"
import { MapPin, Home, Compass, PlusCircle, Instagram, Twitter, Facebook, Heart } from "lucide-react"

export default function Footer() {
  return (
    <footer className="py-8 px-4 bg-[#112D4E] text-white">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-6 md:mb-0">
            <div className="flex items-center space-x-2 mb-2">
              <MapPin className="h-5 w-5 text-[#3F72AF]" />
              <h3 className="text-xl font-bold">Taipei Guide</h3>
            </div>
            <p className="text-sm text-gray-300">Discover the best of Taipei</p>
          </div>

          <div className="flex flex-wrap justify-center gap-6 mb-6 md:mb-0">
            <Link href="/" className="flex flex-col items-center hover:text-[#3F72AF] transition-colors">
              <Home className="h-5 w-5 mb-1" />
              <span className="text-xs">Home</span>
            </Link>
            <Link href="/explore" className="flex flex-col items-center hover:text-[#3F72AF] transition-colors">
              <Compass className="h-5 w-5 mb-1" />
              <span className="text-xs">Explore</span>
            </Link>
            <Link href="/add" className="flex flex-col items-center hover:text-[#3F72AF] transition-colors">
              <PlusCircle className="h-5 w-5 mb-1" />
              <span className="text-xs">Add</span>
            </Link>
            <Link href="/saved" className="flex flex-col items-center hover:text-[#3F72AF] transition-colors">
              <Heart className="h-5 w-5 mb-1" />
              <span className="text-xs">Saved</span>
            </Link>
          </div>

          <div className="flex space-x-4">
            <Link href="#" className="hover:text-[#3F72AF] transition-colors">
              <Instagram className="h-5 w-5" />
              <span className="sr-only">Instagram</span>
            </Link>
            <Link href="#" className="hover:text-[#3F72AF] transition-colors">
              <Twitter className="h-5 w-5" />
              <span className="sr-only">Twitter</span>
            </Link>
            <Link href="#" className="hover:text-[#3F72AF] transition-colors">
              <Facebook className="h-5 w-5" />
              <span className="sr-only">Facebook</span>
            </Link>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Taipei Guide. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
