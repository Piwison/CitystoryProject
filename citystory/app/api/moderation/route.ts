import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.isModerator) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get JWT token from session
    const token = session.accessToken;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing access token" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const queryString = searchParams.toString();
    
    // Forward request to Django backend
    const response = await fetch(`${BACKEND_URL}/api/moderation/?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Handle errors from backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[MODERATION_GET] Backend error:", errorData);
      return NextResponse.json(
        { error: errorData || "Backend API error" },
        { status: response.status }
      );
    }
    
    // Return the response from backend
    const data = await response.json();
    return NextResponse.json(data);
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
    if (!session?.user?.isModerator) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // Get JWT token from session
    const token = session.accessToken;
    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: missing access token" },
        { status: 401 }
      )
    }

    const body = await request.json()
    
    // Forward request to Django backend
    const response = await fetch(`${BACKEND_URL}/api/moderation/`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    
    // Handle errors from backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[MODERATION_PATCH] Backend error:", errorData);
      return NextResponse.json(
        { error: errorData || "Backend API error" },
        { status: response.status }
      );
    }
    
    // Return the response from backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Moderation update error:", error)
    return NextResponse.json(
      { error: "Failed to update moderation status" },
      { status: 500 }
    )
  }
} 