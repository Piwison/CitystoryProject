/*
 * This file is currently disabled because the searchReviews function
 * is not implemented in the new searchService.
 * 
 * TODO: Implement searchReviews in @/lib/api/services/searchService.ts
 * following a similar pattern to searchPlaces.
 */

import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
// import { searchService } from "@/lib/services/searchService"

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Forward the search request to Django backend with original query params
    const queryString = searchParams.toString();
    const response = await fetch(`${BACKEND_URL}/api/search/reviews/?${queryString}`);
    
    // Handle errors from backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[REVIEW_SEARCH_GET] Backend error:", errorData);
      return NextResponse.json(
        { error: errorData || "Backend API error" },
        { status: response.status }
      );
    }
    
    // Return the response from backend
    const data = await response.json();
    return NextResponse.json(data);
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
    
    // Forward the search request to Django backend
    const response = await fetch(`${BACKEND_URL}/api/search/reviews/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    // Handle errors from backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[REVIEW_SEARCH_POST] Backend error:", errorData);
      return NextResponse.json(
        { error: errorData || "Backend API error" },
        { status: response.status }
      );
    }
    
    // Return the response from backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Review search error:", error)
    return NextResponse.json(
      { error: "Failed to search reviews" },
      { status: 500 }
    )
  }
} 