# CityStory Badge and Points System

The CityStory badge and points system is designed to encourage user engagement and reward contributions to the platform. This document describes the models, API endpoints, and implementation details of the system.

## Table of Contents

1. [Models](#models)
    - [Badge](#badge)
    - [UserBadge](#userbadge)
    - [UserPoints](#userpoints)
    - [UserLevel](#userlevel)
2. [API Endpoints](#api-endpoints)
3. [Points System](#points-system)
4. [Badge Requirements](#badge-requirements)
5. [User Levels](#user-levels)
6. [Integration with Notifications](#integration-with-notifications)
7. [Scheduled Tasks](#scheduled-tasks)

## Models

### Badge

The `Badge` model represents achievements that users can earn. Badges are categorized by type and level, with points awarded for earning them.

**Fields:**
- `name`: The name of the badge
- `description`: A description of the badge
- `type`: The category of the badge (place_contribution, review_contribution, etc.)
- `level`: The level of the badge (bronze, silver, gold, platinum)
- `icon`: URL to the badge icon image
- `points`: Points awarded for earning the badge
- `requirement_description`: Human-readable description of how to earn the badge
- `requirement_code`: Code used to programmatically check badge requirements

**Methods:**
- `check_eligibility(user)`: Checks if a user is eligible for any badges they don't have
- `BadgeRequirementChecker`: Class containing methods to check various badge requirements

### UserBadge

The `UserBadge` model tracks which badges a user has earned and when they were awarded.

**Fields:**
- `user`: The user who earned the badge
- `badge`: The badge that was earned
- `awarded_at`: When the badge was awarded

**Methods:**
- `award_badge(user, badge)`: Awards a badge to a user if they don't already have it

### UserPoints

The `UserPoints` model tracks points earned by users for various activities.

**Fields:**
- `user`: The user who earned the points
- `points`: Number of points (positive for earned, negative for deducted)
- `source_type`: Type of action that generated points (place, review, photo, etc.)
- `source_id`: ID of the object that generated points
- `description`: Description of the points

**Methods:**
- `get_total_points(user)`: Get the total points for a user
- `get_points_by_source(user, source_type)`: Get points for a user by source type
- `add_points(user, points, source_type, source_id, description)`: Add points to a user's account
- `deduct_points(user, points, source_type, source_id, description)`: Deduct points from a user's account

### UserLevel

The `UserLevel` model tracks a user's level based on their points.

**Fields:**
- `user`: The user whose level is being tracked
- `level`: The user's current level
- `updated_at`: When the level was last updated

**Methods:**
- `get_level_title()`: Get the title for the current level
- `get_next_level_threshold()`: Get the points threshold for the next level
- `get_progress_to_next_level()`: Get the user's progress to the next level as a percentage
- `calculate_level(points)`: Calculate the level for a given number of points
- `check_level_progress(user)`: Check if a user has earned enough points to level up

## API Endpoints

### Badges

- `GET /api/badges/`: List all badges
- `GET /api/badges/{id}/`: Retrieve a specific badge
- `GET /api/badges/?type=review_contribution`: Filter badges by type
- `GET /api/badges/?level=gold`: Filter badges by level

### User Badges

- `GET /api/user-badges/`: List badges earned by the current user
- `GET /api/user-badges/{id}/`: Retrieve a specific user badge
- `POST /api/user-badges/check-eligibility/`: Check if the user is eligible for any new badges

### User Points

- `GET /api/user-points/`: List points earned by the current user
- `GET /api/user-points/{id}/`: Retrieve a specific point transaction
- `GET /api/user-points/summary/`: Get a summary of the user's points

### User Level

- `GET /api/user-level/`: Get the current user's level information

### User Profile

- `GET /api/user-profile/`: Get the current user's profile with badges and points

## Points System

Users earn points for various activities on the platform:

- **Place Contributions**:
  - Adding an approved place: 20 points
  - Adding place details: 5 points

- **Review Contributions**:
  - Writing an approved review: 10 points
  - Receiving a helpful vote: 2 points

- **Photo Contributions**:
  - Uploading an approved photo: 5 points

- **Badge Rewards**:
  - Bronze badges: 10 points
  - Silver badges: 25 points
  - Gold badges: 50 points
  - Platinum badges: 100 points

Points are automatically awarded when:
- A moderation status changes to 'approved'
- A user earns a badge
- A review receives a helpful vote

## Badge Requirements

Badges are earned based on specific user activities:

**Place Contribution Badges:**
- First Place (Bronze): Add one approved place
- Prolific Creator (Silver): Add 5 approved places
- Place Master (Gold): Add 20 approved places

**Review Contribution Badges:**
- First Review (Bronze): Write one approved review
- Review Enthusiast (Silver): Write 10 approved reviews
- Review Expert (Gold): Write 30 approved reviews

**Photo Contribution Badges:**
- First Photo (Bronze): Upload one approved photo
- Photographer (Silver): Upload 10 approved photos
- Photo Journalist (Gold): Upload 30 approved photos

**Engagement Badges:**
- Helpful Reviewer (Bronze): Receive 5 helpful votes on reviews
- Very Helpful Reviewer (Silver): Receive 25 helpful votes on reviews
- Essential Reviewer (Gold): Receive 100 helpful votes on reviews

**Longevity Badges:**
- One Month Active (Bronze): Be a member for one month
- Six Months Active (Silver): Be a member for six months
- One Year Active (Gold): Be a member for one year

**Special Badges:**
- City Explorer (Silver): Add places in at least 3 different cities
- Diverse Tastes (Silver): Add places of at least 4 different types

## User Levels

Users progress through levels as they earn points:

1. Newcomer (0+ points)
2. Explorer (100+ points)
3. Guide (300+ points)
4. Expert (700+ points)
5. Master (1500+ points)
6. Connoisseur (3000+ points)
7. Legend (6000+ points)

When a user levels up, they receive a notification. The user's progress to the next level is available through the API.

## Integration with Notifications

The system creates notifications for:
- Badge earned: When a user earns a new badge
- Level up: When a user reaches a new level

These notifications are displayed in the user's notification feed and optionally sent via email.

## Scheduled Tasks

A scheduled task runs periodically to check for badge eligibility:

- `check_badge_eligibility`: Runs daily to check if users are eligible for any new badges based on their activity

This ensures that badges are awarded even if they weren't triggered by a specific event. 