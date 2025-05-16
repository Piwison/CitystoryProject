export interface PlacePhoto {
  id: string;
  place_id?: string;
  user_id?: string;
  url: string;
  caption?: string;
  uploaded_at?: string;
  is_approved?: boolean;
}

export interface PlaceFormData {
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  photos?: File[];
}

export interface CreatePlaceDto {
  name: string;
  description: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface UpdatePlaceDto extends Partial<CreatePlaceDto> {}

export interface Place extends CreatePlaceDto {
  id: string;
  contributor_id?: string;
  slug?: string;
  place_type?: string;
  location?: string;
  avg_rating?: number;
  price_range?: number;
  google_maps_link?: string;
  photos: PlacePhoto[];
  createdAt: string;
  updatedAt: string;
  is_approved?: boolean;
}

export interface PlaceFilters {
  search?: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
} 