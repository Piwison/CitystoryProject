"use client"

import type React from "react"

import { useState } from "react"
import { Star } from "lucide-react"

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  size?: "sm" | "md" | "lg"
  allowHalf?: boolean
  readOnly?: boolean
}

export default function StarRating({
  value,
  onChange,
  size = "md",
  allowHalf = false,
  readOnly = false,
}: StarRatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null)

  const sizeClass = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>, index: number) => {
    if (readOnly) return

    if (!allowHalf) {
      setHoverValue(index)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const halfWidth = rect.width / 2

    if (x <= halfWidth) {
      setHoverValue(index - 0.5)
    } else {
      setHoverValue(index)
    }
  }

  const handleMouseLeave = () => {
    if (readOnly) return
    setHoverValue(null)
  }

  const handleClick = (index: number, e: React.MouseEvent<HTMLDivElement>) => {
    if (readOnly) return

    if (!allowHalf) {
      onChange(index)
      return
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX - rect.left
    const halfWidth = rect.width / 2

    if (x <= halfWidth) {
      onChange(index - 0.5)
    } else {
      onChange(index)
    }
  }

  const renderStar = (index: number) => {
    const displayValue = hoverValue !== null ? hoverValue : value
    const filled = index <= displayValue
    const halfFilled = allowHalf && index - 0.5 === displayValue

    return (
      <div
        key={index}
        className={`relative cursor-${readOnly ? "default" : "pointer"} p-0.5`}
        onMouseMove={readOnly ? undefined : (e) => handleMouseMove(e, index)}
        onClick={readOnly ? undefined : (e) => handleClick(index, e)}
      >
        <Star
          className={`${sizeClass[size]} ${
            filled ? "text-[#FFD700] fill-[#FFD700]" : "text-gray-300"
          } transition-colors`}
        />
        {halfFilled && (
          <div className="absolute inset-y-0 left-0 w-1/2 overflow-hidden p-0.5">
            <Star className={`${sizeClass[size]} text-[#FFD700] fill-[#FFD700]`} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className="flex"
      onMouseLeave={handleMouseLeave}
      role="slider"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={5}
      aria-label="Rating"
    >
      {[1, 2, 3, 4, 5].map((index) => renderStar(index))}
    </div>
  )
}
