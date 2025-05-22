import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"

// Backend API URL
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.email) {
      return new NextResponse("Unauthorized: missing user email", { status: 401 })
    }

    // Get JWT token from session or localStorage
    const token = session.accessToken;
    if (!token) {
      return new NextResponse("Unauthorized: missing access token", { status: 401 })
    }

    // Forward the request to Django backend
    const body = await req.json()
    const response = await fetch(`${BACKEND_URL}/api/places/`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });

    // Handle errors from backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[PLACES_POST] Backend error:", errorData);
      return new NextResponse(
        errorData ? JSON.stringify(errorData) : "Backend API error", 
        { status: response.status }
      );
    }

    // Return the response from backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error("[PLACES_POST] Error:", error) 
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    // Get the original query parameters
    const { searchParams } = new URL(req.url)
    
    // Construct query string to forward to Django
    const queryString = searchParams.toString();
    
    // Forward request to Django backend
    const response = await fetch(`${BACKEND_URL}/api/places/?${queryString}`);
    
    // Handle errors from backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[PLACES_GET] Backend error:", errorData);
      return new NextResponse(
        errorData ? JSON.stringify(errorData) : "Backend API error", 
        { status: response.status }
      );
    }
    
    // Return the response from backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[PLACES_GET] Error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}