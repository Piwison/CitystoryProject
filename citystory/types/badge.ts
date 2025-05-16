export interface Badge {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  max_level?: number;
  category?: string;
  points_reward?: number;
}

export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  level?: number;
  earned_at?: string;
} 