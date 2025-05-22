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
import Image from "next/image"

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
    placeType: "Café",
    location: "Xinyi District",
    image: "/laptop-cafe-buzz.png",
    address: "No. 15, Lane 150, Section 5, Xinyi Road, Xinyi District, Taipei City",
  },
  {
    id: "2",
    name: "Din Tai Fung",
    placeType: "Restaurant",
    location: "Xinyi District",
    image: "/waterfront-elegance.png",
    address: "No. 194, Section 2, Xinyi Road, Da'an District, Taipei City",
  },
  {
    id: "3",
    name: "Taipei Night Market",
    placeType: "Night Market",
    location: "Shilin District",
    image: "/craft-beer-haven.png",
    address: "No. 101, Jihe Road, Shilin District, Taipei City",
  },
]

export default function PlaceSearch({ value, onChange, onExistingPlace }: PlaceSearchProps) {
  const [isSearching, setIsSearching] = useState(false)
  const [showDialog, setShowDialog] = useState(false)
  const [matchedPlace, setMatchedPlace] = useState<any>(null)
  const [inputBlurred, setInputBlurred] = useState(false);

  useEffect(() => {
    if (!inputBlurred) return;
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
  }, [value, inputBlurred])

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
          onChange={(e) => {
            onChange(e.target.value);
            setInputBlurred(false);
          }}
          onBlur={() => setInputBlurred(true)}
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
      {matchedPlace && showDialog && (
        <Dialog open={true} onOpenChange={() => setShowDialog(false)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Place Already Exists</DialogTitle>
              <DialogDescription>
                A similar place already exists in our database. Would you like to view it instead?
              </DialogDescription>
            </DialogHeader>
            <div className="flex p-2 rounded-lg gap-3 hover:bg-gray-50">
              <Image
                src={matchedPlace.image || "/place-placeholder.jpg"}
                alt={matchedPlace.name}
                width={80}
                height={80}
                className="rounded-md object-cover h-20 w-20"
              />
              <div>
                <h3 className="font-medium">{matchedPlace.name}</h3>
                <p className="text-sm text-gray-500 mt-1">
                  {matchedPlace.placeType} • {matchedPlace.location}
                </p>
                <p className="text-xs text-gray-400 mt-1 truncate">{matchedPlace.address}</p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDialog(false)}>
                Continue Adding
              </Button>
              <Button onClick={() => onExistingPlace(matchedPlace)}>View Place</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
