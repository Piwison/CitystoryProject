import { notFound } from 'next/navigation';
import { getManagedPlaceDetails } from '@/lib/api/services/placeManagementService';

export default async function PlacePage({ params }: any) {
  if (!params) {
    notFound();
  }
  const { id } = params;

  try {
    const place = await getManagedPlaceDetails(id);
    
    return (
      <div className="container max-w-4xl py-8">
        <h1 className="text-3xl font-bold mb-6">{place.name}</h1>
        <div className="space-y-4">
          <p>{place.description}</p>
          <p className="text-muted-foreground">{place.address}</p>
          <p>Category: {place.type}</p>
        </div>
        
        {place.photos && place.photos.length > 0 && (
          <div className="mt-8">
            <h2 className="text-2xl font-semibold mb-4">Photos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {place.photos.map((photo) => (
                <div key={photo.id} className="relative aspect-square">
                  <img
                    src={photo.url}
                    alt={place.name}
                    className="object-cover rounded-lg"
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  } catch (error) {
    notFound();
  }
} 