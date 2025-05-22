import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

// Get backend URL with proper environment variable fallback
const BACKEND_URL = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

export async function POST(request: Request) {
  try {
    // Get request body
    const body = await request.json();
    
    // Validate required fields
    if (!body.email) {
      return new NextResponse(
        JSON.stringify({ error: "Email is required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    
    // Forward request to Django backend
    const response = await fetch(`${BACKEND_URL}/api/auth/convert-session/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider: body.provider || "google",
        email: body.email,
        name: body.name || "",
        image: body.image || "",
      }),
    });

    // Handle errors from backend
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error("[CONVERT_SESSION] Backend error:", errorData);
      return new NextResponse(
        JSON.stringify(errorData || { error: "Failed to convert session" }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Return the response from backend
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("[CONVERT_SESSION] Error:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
} 