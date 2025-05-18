import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import type { Prisma } from "@prisma/client"; // Import Prisma types
import { authOptions } from "@/lib/auth/options"
import { PrismaClient, PlaceStatus, PlaceType } from "@prisma/client"
import { z } from "zod"

const placeSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  placeType: z.string().min(1),
  features: z.array(z.string()).optional(), // Array of feature IDs
  foodQuality: z.number().min(0).max(5),
  service: z.number().min(0).max(5),
  value: z.number().min(0).max(5),
  cleanliness: z.number().min(0).max(5),
  comment: z.string().min(10),
  priceRange: z.number().optional(),
  googleMapsLink: z.string().url().optional(),
  photos: z.array(z.string()).optional(), // Array of photo URLs
  overallRating: z.number()
})

const db = new PrismaClient()

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user || !session.user.email) {
      return new NextResponse("Unauthorized: missing user email", { status: 401 })
    }

    // Fetch the user by email to get their id
    const user = await db.user.findUnique({ where: { email: session.user.email } });
    if (!user) {
      return new NextResponse("User not found", { status: 404 })
    }

    const body = await req.json()
    const validatedData = placeSchema.parse(body)
    const { features, photos, ...placeDataFields } = validatedData;

    const placeCreateInput: Prisma.PlaceCreateInput = {
      ...placeDataFields,
      placeType: placeDataFields.placeType as PlaceType,
      contributor: { connect: { id: user.id } }, // Connect by user id
      status: PlaceStatus.PENDING_REVIEW,
      photos: photos && photos.length > 0 ? {
        create: photos.map(url => ({
          url,
          user: { connect: { id: user.id } }
        }))
      } : undefined,
      features: features && features.length > 0 ? {
        create: features.map(featureId => ({
          feature: { connect: { id: featureId } }
        }))
      } : undefined,
      reviews: {
        create: [{
          user: { connect: { id: user.id } },
          foodQuality: validatedData.foodQuality,
          service: validatedData.service,
          value: validatedData.value,
          cleanliness: validatedData.cleanliness,
          comment: validatedData.comment,
          overallRating: validatedData.overallRating
        }]
      }
    };

    const place = await db.place.create({
      data: {
        ...validatedData,
        // features: validatedData.features ?? [], // Old way of handling features
        // New way: Create PlaceFeature records to link Place and Feature
        placeFeatures: validatedData.features ? {
          create: validatedData.features.map((featureId: string) => ({
            feature: {
              connect: { id: featureId },
            },
          })),
        } : undefined,
        photos: validatedData.photos ?? [],
        userId: session.user.email,
        status: "PENDING", // Places need approval before being public
      }
    });

    return NextResponse.json(place)
  } catch (error: any) { // Explicitly type error as any to resolve TypeScript error
    if (error instanceof z.ZodError) {
      return new NextResponse(JSON.stringify(error.issues), { status: 400 })
    }
    console.error("[PLACES_POST] Error:", error) 
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const search = searchParams.get("search") || ""
    const category = searchParams.get("category")

    const skip = (page - 1) * limit

    const whereClause: Prisma.PlaceWhereInput = {
      status: PlaceStatus.APPROVED
    };
    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { address: { contains: search, mode: "insensitive" } }
      ];
    }
    if (category) {
      whereClause.placeType = category as any; // Allow string for enum type if needed, or ensure type matches
    }

    // Get total count for pagination
    const total = await db.place.count({ where: where }) // Use the dynamic where for accurate total count
    
    // Get places for current page
    const items = await db.place.findMany({
      where: where, // Fix: Use the dynamically constructed 'where' clause
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
      },
      include: { // Add: Include photos and features according to schema.prisma
        photos: true, // Assumes PlacePhoto is the correct relation for photos
        placeFeatures: {   // Corrected: 'features' changed to 'placeFeatures'
          include: {
            feature: true // Include the actual Feature model from PlaceFeature
          }
        }
      }
    })

    return NextResponse.json({
      items: mappedItems,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    console.error("[PLACES_GET] Error:", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}