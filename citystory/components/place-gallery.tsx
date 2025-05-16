"use client"

import { useState } from "react"
import Image from "next/image"
import { X, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface PlaceGalleryProps {
  photos: string[]
  name: string
}

export default function PlaceGallery({ photos, name }: PlaceGalleryProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  const openLightbox = (index: number) => {
    setCurrentPhotoIndex(index)
    setIsOpen(true)
  }

  const nextPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev + 1) % photos.length)
  }

  const prevPhoto = () => {
    setCurrentPhotoIndex((prev) => (prev - 1 + photos.length) % photos.length)
  }

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {photos.map((photo, index) => (
          <div
            key={index}
            className={`relative ${
              index === 0 ? "col-span-2 row-span-2" : ""
            } aspect-square rounded-lg overflow-hidden cursor-pointer`}
            onClick={() => openLightbox(index)}
          >
            <Image
              src={photo || "/placeholder.svg"}
              alt={`${name} - Photo ${index + 1}`}
              fill
              className="object-cover"
            />
          </div>
        ))}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-4xl p-0 bg-black border-none">
          <div className="relative h-[80vh]">
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-black/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-6 w-6" />
            </Button>
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={photos[currentPhotoIndex] || "/placeholder.svg"}
                alt={`${name} - Photo ${currentPhotoIndex + 1}`}
                fill
                className="object-contain"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-black/20"
              onClick={prevPhoto}
            >
              <ChevronLeft className="h-8 w-8" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-black/20"
              onClick={nextPhoto}
            >
              <ChevronRight className="h-8 w-8" />
            </Button>
            <div className="absolute bottom-4 left-0 right-0 text-center text-white">
              {currentPhotoIndex + 1} / {photos.length}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
