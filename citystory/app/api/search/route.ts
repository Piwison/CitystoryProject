import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { searchPlaces } from "@/lib/api/services/searchService"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const filters = {
      query: searchParams.get("q") || undefined,
      placeType: searchParams.get("type") || undefined,
      district: searchParams.get("location") || undefined,
      features: searchParams.getAll("features[]"),
      priceRange: searchParams.has("price_min") && searchParams.has("price_max") ? 
        [Number(searchParams.get("price_min")), Number(searchParams.get("price_max"))] : 
        undefined,
      coordinates: searchParams.has("lat") && searchParams.has("lng") ? 
        { 
          lat: Number(searchParams.get("lat")), 
          lng: Number(searchParams.get("lng")) 
        } : 
        undefined,
      radius: searchParams.has("radius") ? Number(searchParams.get("radius")) : undefined
    }

    const results = await searchPlaces(filters)
    
    return NextResponse.json({ results })
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
    const results = await searchPlaces(body)
    
    return NextResponse.json({ results })
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    )
  }
} 