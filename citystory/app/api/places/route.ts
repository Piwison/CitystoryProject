import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "@/lib/auth/options"
import { db } from "@/lib/db"
import { z } from "zod"

const placeSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  placeType: z.string().min(1),
  features: z.array(z.string()).optional(),
  foodQuality: z.number().min(0).max(5),
  service: z.number().min(0).max(5),
  value: z.number().min(0).max(5),
  cleanliness: z.number().min(0).max(5),
  comment: z.string().min(10),
  priceRange: z.number().optional(),
  googleMapsLink: z.string().url().optional(),
  photos: z.array(z.string()).optional(),
  overallRating: z.number()
})

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.email) {
      return new NextResponse("Unauthorized: missing user email", { status: 401 })
    }

    const body = await req.json()
    const validatedData = placeSchema.parse(body)

    const place = await db.place.create({
      data: {
        ...validatedData,
        features: validatedData.features ?? [],
        photos: validatedData.photos ?? [],
        userId: session.user.email,
        status: "PENDING", // Places need approval before being public
      }
    })

    return NextResponse.json(place)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 })
    }
    console.error("[PLACES_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    
    // Parse pagination params
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category")
    
    // Calculate offset
    const skip = (page - 1) * limit

    // Build where clause
    const where = {
      AND: [
        {
          status: "APPROVED" // Only show approved places
        },
        search ? {
          OR: [
            { name: { contains: search, mode: "insensitive" } },
            { address: { contains: search, mode: "insensitive" } }
          ]
        } : {},
        category ? { placeType: category } : {}
      ]
    }

    // Get total count for pagination
    const total = await db.place.count({ where: { status: "APPROVED" } })
    
    // Get places for current page
    const items = await db.place.findMany({
      where: { status: "APPROVED" },
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
    })

    return NextResponse.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("[PLACES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}