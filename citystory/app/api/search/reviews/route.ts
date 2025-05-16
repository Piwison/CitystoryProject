import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { searchService } from "@/lib/services/searchService"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      query: searchParams.get("q") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      sortBy: searchParams.get("sort_by") || undefined,
      sortOrder: searchParams.get("sort_order") as "asc" | "desc" | undefined,
      rating: searchParams.getAll("rating[]").map(Number),
    }

    const results = await searchService.searchReviews(filters)
    
    return NextResponse.json(results)
  } catch (error) {
    console.error("Review search error:", error)
    return NextResponse.json(
      { error: "Failed to search reviews" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const results = await searchService.searchReviews(body)
    
    return NextResponse.json(results)
  } catch (error) {
    console.error("Review search error:", error)
    return NextResponse.json(
      { error: "Failed to search reviews" },
      { status: 500 }
    )
  }
} 