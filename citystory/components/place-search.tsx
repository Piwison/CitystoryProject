"use client"

import { useState, useEffect } from "react"
import { Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface PlaceSearchProps {
  value: string
  onChange: (value: string) => void
  onExistingPlace: (place: any) => void
}

// Mock data for existing places - in a real app, this would come from an API
const mockExistingPlaces = [
  {
    id: "1",
    name: "Elephant Mountain Café",
    type: "Café",
    location: "Xinyi District",
    image: "/laptop-cafe-buzz.png",
  },
  {
    id: "2",
    name: "Din Tai Fung",
    type: "Restaurant",
    location: "Xinyi District",
    image: "/waterfront-elegance.png",
  },
  {
    id: "3",
    name: "Taipei Night Market",
    type: "Night Market",
    location: "Shilin District",
    image: "/craft-beer-haven.png",
  },
]

export default function PlaceSearch({ value, onChange, onExistingPlace }: PlaceSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [matchedPlace, setMatchedPlace] = useState<any>(null)

  useEffect(() => {
    const searchPlaces = async () => {
      if (!value || value.length < 2) return

      setIsSearching(true)
      try {
        const response = await fetch(`/api/places?name=${encodeURIComponent(value)}`)
        if (response.ok) {
          const places = await response.json()
          if (places.length > 0) {
            setMatchedPlace(places[0])
            setShowDialog(true)
          }
        }
      } catch (error) {
        console.error("Error searching places:", error)
      } finally {
        setIsSearching(false)
      }
    }

    const debounceTimer = setTimeout(searchPlaces, 500)
    return () => clearTimeout(debounceTimer)
  }, [value])

  const handleConfirm = () => {
    if (matchedPlace) {
      onExistingPlace(matchedPlace)
    }
    setShowDialog(false)
  }

  const handleCancel = () => {
    setShowDialog(false)
  }

  return (
    <div className="relative">
      <div className="relative">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Enter place name"
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          ) : (
            <Search className="h-4 w-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Dialog for confirming if it's the same place */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Place Already Exists</DialogTitle>
            <DialogDescription>
              We found a similar place in our database. Is this the place you&apos;re trying to add?
            </DialogDescription>
          </DialogHeader>
          {matchedPlace && (
            <div className="flex items-center space-x-4 py-4">
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md">
                <img
                  src={matchedPlace.image || "/placeholder.svg"}
                  alt={matchedPlace.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-medium">{matchedPlace.name}</h4>
                <p className="text-sm text-gray-500">
                  {matchedPlace.type} • {matchedPlace.location}
                </p>
              </div>
            </div>
          )}
          <DialogFooter className="flex flex-col sm:flex-row sm:justify-between sm:space-x-2">
            <Button type="button" variant="outline" onClick={handleCancel}>
              No, it&apos;s a different place
            </Button>
            <Button type="button" onClick={handleConfirm} className="bg-[#3F72AF]">
              Yes, it&apos;s the same place
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
