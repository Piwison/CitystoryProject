import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { searchService } from "@/lib/services/searchService"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      query: searchParams.get("q") || undefined,
      category: searchParams.get("category") || undefined,
      type: searchParams.get("type") || undefined,
      location: searchParams.get("location") || undefined,
      page: searchParams.get("page") ? parseInt(searchParams.get("page")!) : undefined,
      limit: searchParams.get("limit") ? parseInt(searchParams.get("limit")!) : undefined,
      sortBy: searchParams.get("sort_by") || undefined,
      sortOrder: searchParams.get("sort_order") as "asc" | "desc" | undefined,
      priceRange: searchParams.getAll("price_range[]").map(Number),
      rating: searchParams.getAll("rating[]").map(Number),
      features: searchParams.getAll("features[]"),
    }

    const results = await searchService.searchPlaces(filters)
    
    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const results = await searchService.searchPlaces(body)
    
    return NextResponse.json(results)
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    )
  }
} 