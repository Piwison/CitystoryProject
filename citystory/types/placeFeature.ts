export interface PlaceFeature {
  id: string;
  place_id: string;
  feature_id: string; // Assuming feature_id is a string identifier for the feature
  feature_type?: string; // Example: 'amenity', 'cuisine'
} 