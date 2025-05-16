const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
  // Clear existing data
  await prisma.place.deleteMany()

  // Create sample places
  const places = [
    {
      name: "The Cozy Corner Cafe",
      address: "123 Main St, Downtown",
      placeType: "cafe",
      features: JSON.stringify(["wifi", "outdoor-seating", "pet-friendly"]),
      foodQuality: 4.5,
      service: 4.8,
      value: 4.2,
      cleanliness: 4.7,
      overallRating: 4.5,
      comment: "A charming cafe with excellent coffee and friendly staff",
      priceRange: 2,
      googleMapsLink: "https://maps.google.com/?q=cozy-corner-cafe",
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1554118811-1e0d58224f24",
        "https://images.unsplash.com/photo-1559925393-8be0ec4767c8"
      ]),
      status: "approved",
      userId: "demo@example.com"
    },
    {
      name: "Bella Italia Restaurant",
      address: "456 Oak Ave, Westside",
      placeType: "restaurant",
      features: JSON.stringify(["reservations", "full-bar", "private-room"]),
      foodQuality: 4.8,
      service: 4.6,
      value: 4.0,
      cleanliness: 4.9,
      overallRating: 4.6,
      comment: "Authentic Italian cuisine in an elegant setting",
      priceRange: 3,
      googleMapsLink: "https://maps.google.com/?q=bella-italia",
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1555396273-367ea4eb4db5",
        "https://images.unsplash.com/photo-1414235077428-338989a2e8c0"
      ]),
      status: "approved",
      userId: "demo@example.com"
    },
    {
      name: "The Local Pub",
      address: "789 Pine St, Historic District",
      placeType: "bar",
      features: JSON.stringify(["live-music", "sports-tv", "pub-food"]),
      foodQuality: 4.0,
      service: 4.3,
      value: 4.5,
      cleanliness: 4.2,
      overallRating: 4.2,
      comment: "Great atmosphere and selection of craft beers",
      priceRange: 2,
      googleMapsLink: "https://maps.google.com/?q=local-pub",
      photos: JSON.stringify([
        "https://images.unsplash.com/photo-1514933651103-005eec06c04b",
        "https://images.unsplash.com/photo-1538488881038-e252a119ace7"
      ]),
      status: "approved",
      userId: "demo@example.com"
    }
  ]

  for (const place of places) {
    await prisma.place.create({
      data: place
    })
  }

  console.log('Database has been seeded with sample places')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  }) 