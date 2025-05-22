export type PlaceType = 'restaurant' | 'cafe' | 'bar' | 'hotel' | 'attraction' | 'shopping';

export type District = 
  | 'Zhongzheng' | 'Datong' | 'Zhongshan' | 'Songshan' | 'Daan' | 'Wanhua' 
  | 'Xinyi' | 'Shilin' | 'Beitou' | 'Neihu' | 'Nangang' | 'Wenshan';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Feature {
  id: string;
  name: string;
  category?: string; // e.g., 'amenities', 'cuisine', 'atmosphere'
  icon?: string; // Optional: for UI display
}

export interface Highlight {
  field: 'title' | 'description' | 'address' | string; // Field that contains the highlight
  text: string; // The highlighted text snippet (could include <mark> tags or similar)
}

export interface PlaceSearchResult {
  id: string;
  slug: string;
  title: string;
  description: string;
  placeType: PlaceType;
  district: District;
  address: string;
  coordinates: Coordinates;
  rating?: number; // Average rating
  reviewCount?: number;
  priceLevel?: string; // e.g., '0' (free), '200', '400', etc.
  imageUrl?: string;
  features: string[]; // Array of feature IDs
  distance?: number; // In kilometers, for 'near me' searches
  highlights?: Highlight[]; // For search result highlighting
  // Add any other relevant fields that the backend search API might return
  openingHours?: string; // Could be a simple string or a structured object
  phone?: string;
  website?: string;
  isVerified?: boolean; // If applicable
  score?: number; // Search relevance score, if provided by backend
  googleMapsLink?: string;
}

export interface SearchFilters {
  query?: string;
  placeType?: PlaceType;
  district?: District;
  features?: string[]; // Array of feature IDs
  priceRange?: [string, string]; // Min and Max price level
  coordinates?: Coordinates; // For 'near me' or map-based search
  radius?: number; // Search radius in kilometers, used with coordinates
  sortBy?: 'relevance' | 'rating' | 'distance' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    Object.setPrototypeOf(this, ApiError.prototype); // Ensure instanceof works
  }
}

export interface SavedPlace extends PlaceSearchResult {
  savedPlaceId: string; // Unique ID for the user-place saved record, distinct from place.id
  userId: string; // ID of the user who saved the place
  placeId: string; // ID of the place that was saved (from PlaceSearchResult.id)
  savedDate: string; // ISO date string when the place was saved
  userNotes?: string;
}

// --- Place Management Types ---

export interface PlaceCreationPayload {
  title: string;
  description: string;
  placeType: PlaceType;
  district: District;
  address: string;
  coordinates?: Coordinates; // Optional if backend geocodes from address
  features?: string[]; // Array of feature names or IDs
  imageUrl?: string;
  priceLevel?: string; // e.g., '0' (Free), '200', '400', etc.
  openingHours?: string; // Simple string or structured object for hours
  phone?: string;
  website?: string;
  googleMapsLink?: string;
  // Fields from "Enhanced Place Creation Form"
  slug?: string; // Optional if backend generates it
  // status?: 'DRAFT' | 'PENDING' | 'APPROVED' | 'REJECTED'; // If admins/users can set initial status
  tags?: string[]; // General tags
  // any other fields required for creation
}

export type PlaceUpdatePayload = Partial<PlaceCreationPayload> & {
  // Potentially add specific fields that can only be updated, not created
  // or enforce certain fields during update if necessary.
  // For example, if slug cannot be changed after creation, it wouldn't be here.
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT'; // If this is part of place update by admins
};

export interface ManagedPlace extends PlaceSearchResult {
  moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'DRAFT';
  // any other fields specific to a user's managed places list
  dateSubmitted?: string; // ISO date string
  lastUpdated?: string; // ISO date string
}

// --- Review Types ---

export interface ReviewPayload {
  placeId: string;
  placeType: string;
  rating: number;
  comment: string;
  foodQuality?: number;
  service?: number;
  value?: number;
  cleanliness?: number;
}

export interface Review {
  id: string;
  author: string;
  authorInitials: string;
  date: string;
  rating: number;
  comment: string;
  foodQuality?: number;
  service?: number;
  value?: number;
  cleanliness?: number;
  helpful: number;
}

// Add other shared types below as needed 