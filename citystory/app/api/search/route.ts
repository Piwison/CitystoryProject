import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// Remove import of local search service
// import { searchPlaces } from "@/lib/api/services/searchService"

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Forward the search request to Django backend with original query params
    const queryString = searchParams.toString();
    const response = await fetch(`${BACKEND_URL}/api/search/?${queryString}`);
    
    // Handle errors from backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[SEARCH_GET] Backend error:", errorData);
      return NextResponse.json(
        { error: errorData || "Backend API error" },
        { status: response.status }
      );
    }
    
    // Return the response from backend
    const data = await response.json();
    return NextResponse.json(data);
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
    
    // Forward the search request to Django backend
    const response = await fetch(`${BACKEND_URL}/api/search/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Handle errors from backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[SEARCH_POST] Backend error:", errorData);
      return NextResponse.json(
        { error: errorData || "Backend API error" },
        { status: response.status }
      );
    }
    
    // Return the response from backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search error:", error)
    return NextResponse.json(
      { error: "Failed to perform search" },
      { status: 500 }
    )
  }
} 