"use client"

import { useEffect, useRef } from "react"

export default function CityHero() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas dimensions to match parent container
    const resizeCanvas = () => {
      const parent = canvas.parentElement
      if (parent) {
        canvas.width = parent.offsetWidth
        canvas.height = parent.offsetHeight
        drawSkyline(ctx, canvas.width, canvas.height)
      }
    }

    // Initial resize
    resizeCanvas()

    // Resize on window resize
    window.addEventListener("resize", resizeCanvas)

    // Clean up
    return () => {
      window.removeEventListener("resize", resizeCanvas)
    }
  }, [])

  const drawSkyline = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height)
    bgGradient.addColorStop(0, "#F9F7F7")
    bgGradient.addColorStop(1, "#DBE2EF")
    ctx.fillStyle = bgGradient
    ctx.fillRect(0, 0, width, height)

    // Draw skyline layers - position them lower to make room for content above
    const offset = height * 0.2 // Push skyline down to make room for content
    drawSkylineLayer(ctx, width, height, 0.85 + offset / height, "#DBE2EF")
    drawSkylineLayer(ctx, width, height, 0.7 + offset / height, "#3F72AF")
    drawSkylineLayer(ctx, width, height, 0.55 + offset / height, "#112D4E")
  }

  const drawSkylineLayer = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    heightFactor: number,
    color: string,
  ) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(0, height * heightFactor)

    // Number of buildings based on width
    const buildingCount = Math.floor(width / 50)
    const segmentWidth = width / buildingCount

    for (let i = 0; i < buildingCount; i++) {
      const x = i * segmentWidth

      // Random building heights
      const buildingHeight = Math.random() * (height * 0.3) + height * 0.1
      const buildingTop = height * heightFactor - buildingHeight

      // Draw building
      ctx.lineTo(x, buildingTop)

      // Add some variation to building tops
      if (Math.random() > 0.7) {
        // Antenna or spire
        const spireHeight = buildingHeight * 0.2
        ctx.lineTo(x + segmentWidth * 0.1, buildingTop - spireHeight)
        ctx.lineTo(x + segmentWidth * 0.2, buildingTop)
      }

      // Complete building
      ctx.lineTo(x + segmentWidth, buildingTop)
    }

    // Complete the path
    ctx.lineTo(width, height * heightFactor)
    ctx.lineTo(width, height)
    ctx.lineTo(0, height)
    ctx.closePath()
    ctx.fill()
  }

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" aria-hidden="true" />
}
