export interface Place {
  id: string;
  name: string;
  description: string;
  location: string;
  moderation_status: "pending" | "approved" | "rejected";
  created_at: string;
  moderated_at?: string;
  moderator_id?: string;
}

export interface Review {
  id: string;
  place_id: string;
  place_name: string;
  user_id: string;
  user_name: string;
  comment: string;
  food_quality: number;
  service: number;
  value: number;
  cleanliness: number;
  moderation_status: "pending" | "approved" | "rejected";
  created_at: string;
  moderated_at?: string;
  moderator_id?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  is_moderator: boolean;
} 