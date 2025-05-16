"use client"

import { useEffect, useRef } from "react"

interface MinimalistIllustrationProps {
  type: "cityscape" | "landmarks" | "people"
  primaryColor: string
  accentColor: string
}

export default function MinimalistIllustration({ type, primaryColor, accentColor }: MinimalistIllustrationProps) {
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
        drawIllustration(ctx, canvas.width, canvas.height, type, primaryColor, accentColor)
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
  }, [type, primaryColor, accentColor])

  const drawIllustration = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    type: string,
    primaryColor: string,
    accentColor: string,
  ) => {
    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw based on type
    if (type === "cityscape") {
      drawCityscape(ctx, width, height, primaryColor, accentColor)
    } else if (type === "landmarks") {
      drawLandmarks(ctx, width, height, primaryColor, accentColor)
    } else if (type === "people") {
      drawPeople(ctx, width, height, primaryColor, accentColor)
    }
  }

  const drawCityscape = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    primaryColor: string,
    accentColor: string,
  ) => {
    // Background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Draw minimalist buildings
    ctx.fillStyle = primaryColor

    // Draw Taipei 101 (iconic building)
    const taipei101X = width * 0.7
    const taipei101Width = width * 0.06
    const taipei101Height = height * 0.7
    const taipei101Y = height - taipei101Height

    // Main tower
    ctx.fillRect(taipei101X, taipei101Y, taipei101Width, taipei101Height)

    // Segments
    for (let i = 1; i <= 8; i++) {
      const segmentY = taipei101Y + (taipei101Height * i) / 10
      const segmentWidth = taipei101Width * 1.3
      const segmentX = taipei101X - (segmentWidth - taipei101Width) / 2
      ctx.fillRect(segmentX, segmentY, segmentWidth, 2)
    }

    // Spire
    ctx.beginPath()
    ctx.moveTo(taipei101X + taipei101Width / 2, taipei101Y - height * 0.1)
    ctx.lineTo(taipei101X + taipei101Width / 2, taipei101Y)
    ctx.strokeStyle = primaryColor
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw other buildings
    const buildingCount = 12
    const buildingWidth = width / buildingCount

    for (let i = 0; i < buildingCount; i++) {
      // Skip where Taipei 101 is
      if (i * buildingWidth > taipei101X - buildingWidth && i * buildingWidth < taipei101X + taipei101Width) {
        continue
      }

      const buildingHeight = Math.random() * height * 0.4 + height * 0.1
      ctx.fillStyle = i % 3 === 0 ? accentColor : primaryColor
      ctx.fillRect(i * buildingWidth, height - buildingHeight, buildingWidth * 0.8, buildingHeight)

      // Windows
      if (buildingHeight > height * 0.2) {
        ctx.fillStyle = "#ffffff"
        const windowRows = Math.floor(buildingHeight / 20)
        const windowCols = 2
        const windowWidth = (buildingWidth * 0.8) / (windowCols * 2)
        const windowHeight = buildingHeight / (windowRows * 2)

        for (let row = 0; row < windowRows; row++) {
          for (let col = 0; col < windowCols; col++) {
            ctx.fillRect(
              i * buildingWidth + col * windowWidth * 2 + windowWidth / 2,
              height - buildingHeight + row * windowHeight * 2 + windowHeight / 2,
              windowWidth,
              windowHeight,
            )
          }
        }
      }
    }

    // Draw mountains in the background
    ctx.fillStyle = "#f0f0f0"
    ctx.beginPath()
    ctx.moveTo(0, height * 0.6)
    ctx.lineTo(width * 0.2, height * 0.4)
    ctx.lineTo(width * 0.4, height * 0.5)
    ctx.lineTo(width * 0.6, height * 0.3)
    ctx.lineTo(width * 0.8, height * 0.5)
    ctx.lineTo(width, height * 0.45)
    ctx.lineTo(width, height * 0.6)
    ctx.closePath()
    ctx.fill()
  }

  const drawLandmarks = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    primaryColor: string,
    accentColor: string,
  ) => {
    // Background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Draw Taipei landmarks

    // Night market stalls
    const stallCount = 5
    const stallWidth = width / (stallCount * 2)
    const stallSpacing = width / stallCount

    for (let i = 0; i < stallCount; i++) {
      const x = stallSpacing * i + stallWidth
      const stallHeight = height * 0.25
      const y = height - stallHeight

      // Stall roof
      ctx.fillStyle = i % 2 === 0 ? primaryColor : accentColor
      ctx.beginPath()
      ctx.moveTo(x - stallWidth / 2, y)
      ctx.lineTo(x + stallWidth / 2, y)
      ctx.lineTo(x + stallWidth / 3, y - stallHeight * 0.2)
      ctx.lineTo(x - stallWidth / 3, y - stallHeight * 0.2)
      ctx.closePath()
      ctx.fill()

      // Stall body
      ctx.fillStyle = "#ffffff"
      ctx.fillRect(x - stallWidth / 3, y, (stallWidth * 2) / 3, stallHeight)

      // Food items or decorations
      ctx.fillStyle = i % 2 === 0 ? accentColor : primaryColor
      ctx.beginPath()
      ctx.arc(x, y + stallHeight * 0.3, stallWidth * 0.15, 0, Math.PI * 2)
      ctx.fill()
    }

    // Temple
    const templeX = width * 0.7
    const templeWidth = width * 0.2
    const templeHeight = height * 0.4
    const templeY = height - templeHeight

    // Temple base
    ctx.fillStyle = primaryColor
    ctx.fillRect(templeX, templeY + templeHeight * 0.6, templeWidth, templeHeight * 0.4)

    // Temple roof
    ctx.fillStyle = accentColor
    ctx.beginPath()
    ctx.moveTo(templeX - templeWidth * 0.1, templeY + templeHeight * 0.6)
    ctx.lineTo(templeX + templeWidth * 1.1, templeY + templeHeight * 0.6)
    ctx.lineTo(templeX + templeWidth * 0.9, templeY + templeHeight * 0.4)
    ctx.lineTo(templeX + templeWidth * 0.5, templeY + templeHeight * 0.2)
    ctx.lineTo(templeX + templeWidth * 0.1, templeY + templeHeight * 0.4)
    ctx.closePath()
    ctx.fill()

    // Temple columns
    ctx.fillStyle = primaryColor
    const columnCount = 3
    const columnWidth = templeWidth / (columnCount * 3)

    for (let i = 0; i < columnCount; i++) {
      ctx.fillRect(
        templeX + (templeWidth * (i + 1)) / (columnCount + 1) - columnWidth / 2,
        templeY + templeHeight * 0.6,
        columnWidth,
        templeHeight * 0.4,
      )
    }

    // Lanterns
    ctx.fillStyle = accentColor
    ctx.beginPath()
    ctx.arc(templeX + templeWidth * 0.25, templeY + templeHeight * 0.7, templeWidth * 0.05, 0, Math.PI * 2)
    ctx.fill()

    ctx.beginPath()
    ctx.arc(templeX + templeWidth * 0.75, templeY + templeHeight * 0.7, templeWidth * 0.05, 0, Math.PI * 2)
    ctx.fill()
  }

  const drawPeople = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    primaryColor: string,
    accentColor: string,
  ) => {
    // Background
    ctx.fillStyle = "#ffffff"
    ctx.fillRect(0, 0, width, height)

    // Draw stylized people
    const personCount = 5
    const spacing = width / (personCount + 1)

    for (let i = 0; i < personCount; i++) {
      const x = spacing * (i + 1)
      const y = height * 0.7
      const size = width * 0.04
      const color = i % 2 === 0 ? primaryColor : accentColor

      // Head
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.arc(x, y - size * 2, size, 0, Math.PI * 2)
      ctx.fill()

      // Body
      ctx.beginPath()
      ctx.moveTo(x, y - size)
      ctx.lineTo(x, y + size)
      ctx.strokeStyle = color
      ctx.lineWidth = size / 2
      ctx.stroke()

      // Arms
      ctx.beginPath()
      ctx.moveTo(x - size, y)
      ctx.lineTo(x + size, y)
      ctx.stroke()

      // Legs
      ctx.beginPath()
      ctx.moveTo(x, y + size)
      ctx.lineTo(x - size / 2, y + size * 3)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(x, y + size)
      ctx.lineTo(x + size / 2, y + size * 3)
      ctx.stroke()

      // If it&apos;s a special figure (like holding something)
      if (i === 2) {
        // Holding something up
        ctx.beginPath()
        ctx.moveTo(x, y)
        ctx.lineTo(x, y - size * 1.2)
        ctx.stroke()

        // The item being held
        ctx.fillStyle = i % 2 === 0 ? accentColor : primaryColor
        ctx.beginPath()
        ctx.arc(x, y - size * 1.5, size / 2, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw a simple path
    ctx.strokeStyle = "#f0f0f0"
    ctx.lineWidth = height * 0.05
    ctx.beginPath()
    ctx.moveTo(0, height * 0.85)
    ctx.bezierCurveTo(width * 0.3, height * 0.7, width * 0.6, height * 0.9, width, height * 0.8)
    ctx.stroke()
  }

  return <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
}
