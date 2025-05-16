export interface Review {
  id: string;
  user_id: string;
  place_id: string;
  food_quality?: number;
  service?: number;
  value?: number;
  cleanliness?: number;
  overall_rating: number;
  comment?: string;
  helpful_count?: number;
  created_at: string;
  updated_at?: string;
} 