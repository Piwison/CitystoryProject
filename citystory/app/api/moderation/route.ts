import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { ModerationService } from "@/lib/api/services"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.is_moderator) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const type = searchParams.get("type") || "places"
    const status = searchParams.get("status") || "pending"
    
    const moderationService = ModerationService.getInstance()
    let content

    if (type === "places") {
      content = await moderationService.getPendingPlaces()
    } else if (type === "reviews") {
      content = await moderationService.getPendingReviews()
    } else {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      )
    }
    
    return NextResponse.json({ content })
  } catch (error) {
    console.error("Moderation error:", error)
    return NextResponse.json(
      { error: "Failed to fetch content for moderation" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.is_moderator) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { id, type, status, comment } = body

    if (!id || !type || !status) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const moderationService = ModerationService.getInstance()

    if (type === "place") {
      await moderationService.updatePlaceStatus(id, { status, comment })
    } else if (type === "review") {
      await moderationService.updateReviewStatus(id, { status, comment })
    } else {
      return NextResponse.json(
        { error: "Invalid content type" },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Moderation update error:", error)
    return NextResponse.json(
      { error: "Failed to update moderation status" },
      { status: 500 }
    )
  }
} 