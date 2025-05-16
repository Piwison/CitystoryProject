# Saved Places API Documentation

This document provides information about the Saved Places API for CityStory, allowing users to save places they're interested in, add notes, and manage their collection of saved places.

## Overview

The Saved Places API enables users to:
- Save and unsave places they find interesting
- Add personal notes to saved places
- List and filter their saved places collection
- Perform batch operations on multiple saved places
- Check if a specific place is already saved

## Models

### SavedPlace

| Field      | Type          | Description                                 |
|------------|---------------|---------------------------------------------|
| id         | Integer       | Unique identifier for the saved place        |
| user       | ForeignKey    | Reference to the user who saved the place    |
| place      | ForeignKey    | Reference to the saved place                 |
| notes      | Text          | User's personal notes about the place        |
| created_at | DateTime      | When the place was saved                     |
| updated_at | DateTime      | When the saved place was last updated        |

## API Endpoints

### List Saved Places

Retrieves a list of places saved by the current user.

- **URL**: `/api/saved-places/`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `search`: Search in place name, notes, and address
  - `district`: Filter by place district
  - `place_type`: Filter by place type (restaurant, cafe, etc.)
  - `created_at_after`: Filter by creation date (format: YYYY-MM-DD)
  - `created_at_before`: Filter by creation date (format: YYYY-MM-DD)
  - `ordering`: Sort by field (prefix with `-` for descending order)
    - Options: `created_at`, `-created_at`, `updated_at`, `-updated_at`, `place__name`, `-place__name`

**Response**:
```json
{
  "count": 2,
  "next": null,
  "previous": null,
  "results": [
    {
      "id": 1,
      "user": 1,
      "place": 10,
      "place_details": {
        "id": 10,
        "name": "Green Cafe",
        "description": "Cozy cafe with organic options",
        "type": "cafe",
        "price_range": "1000",
        "address": "123 Green St, Example City",
        "district": "Downtown"
        // ... other place details
      },
      "notes": "Great place for working remotely",
      "created_at": "2023-06-15T14:23:11Z",
      "updated_at": "2023-06-16T08:45:22Z",
      "user_email": "user@example.com"
    },
    // ... more saved places
  ]
}
```

### Save a Place

Creates a new saved place for the current user.

- **URL**: `/api/saved-places/`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "place": 12,
    "notes": "Want to try their dessert menu"
  }
  ```

**Response** (201 Created):
```json
{
  "id": 3,
  "user": 1,
  "place": 12,
  "place_details": {
    "id": 12,
    "name": "Sweet Treats",
    // ... other place details
  },
  "notes": "Want to try their dessert menu",
  "created_at": "2023-06-17T10:12:45Z",
  "updated_at": "2023-06-17T10:12:45Z",
  "user_email": "user@example.com"
}
```

### Get a Specific Saved Place

Retrieves details of a specific saved place.

- **URL**: `/api/saved-places/{id}/`
- **Method**: `GET`
- **Authentication**: Required
- **URL Parameters**:
  - `id`: ID of the saved place

**Response**:
```json
{
  "id": 1,
  "user": 1,
  "place": 10,
  "place_details": {
    "id": 10,
    "name": "Green Cafe",
    // ... other place details
  },
  "notes": "Great place for working remotely",
  "created_at": "2023-06-15T14:23:11Z",
  "updated_at": "2023-06-16T08:45:22Z",
  "user_email": "user@example.com"
}
```

### Update a Saved Place

Updates a saved place, typically for modifying notes.

- **URL**: `/api/saved-places/{id}/`
- **Method**: `PATCH`
- **Authentication**: Required
- **URL Parameters**:
  - `id`: ID of the saved place
- **Request Body**:
  ```json
  {
    "notes": "Updated notes about this place"
  }
  ```

**Response**:
```json
{
  "id": 1,
  "user": 1,
  "place": 10,
  "place_details": {
    "id": 10,
    "name": "Green Cafe",
    // ... other place details
  },
  "notes": "Updated notes about this place",
  "created_at": "2023-06-15T14:23:11Z",
  "updated_at": "2023-06-17T09:32:18Z",
  "user_email": "user@example.com"
}
```

### Delete a Saved Place

Removes a place from the user's saved places.

- **URL**: `/api/saved-places/{id}/`
- **Method**: `DELETE`
- **Authentication**: Required
- **URL Parameters**:
  - `id`: ID of the saved place

**Response** (204 No Content)

### Toggle Save/Unsave

Toggles a place as saved or unsaved. If the place is already saved, it will be removed; otherwise, it will be added.

- **URL**: `/api/saved-places/toggle/`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "place_id": 15,
    "notes": "Optional notes about this place"
  }
  ```

**Response** (if saved):
```json
{
  "id": 4,
  "user": 1,
  "place": 15,
  "place_details": {
    "id": 15,
    "name": "Mountain View Hotel",
    // ... other place details
  },
  "notes": "Optional notes about this place",
  "created_at": "2023-06-17T11:05:22Z",
  "updated_at": "2023-06-17T11:05:22Z",
  "user_email": "user@example.com"
}
```

**Response** (if unsaved):
```json
{
  "status": "removed"
}
```

### Check if Place is Saved

Checks if a specific place is saved by the current user.

- **URL**: `/api/saved-places/is-saved/?place_id={place_id}`
- **Method**: `GET`
- **Authentication**: Required
- **Query Parameters**:
  - `place_id`: ID of the place to check

**Response**:
```json
{
  "is_saved": true
}
```

### Batch Save Places

Saves multiple places at once.

- **URL**: `/api/saved-places/batch-save/`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "place_ids": [16, 17, 18]
  }
  ```

**Response**:
```json
{
  "status": "success",
  "message": "Added 3 places to your saved places"
}
```

### Batch Unsave Places

Removes multiple saved places at once.

- **URL**: `/api/saved-places/batch-unsave/`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "place_ids": [16, 17]
  }
  ```

**Response**:
```json
{
  "status": "success",
  "message": "Removed 2 places from your saved places"
}
```

### Batch Update Notes

Updates notes for multiple saved places at once.

- **URL**: `/api/saved-places/batch-update-notes/`
- **Method**: `POST`
- **Authentication**: Required
- **Request Body**:
  ```json
  {
    "updates": [
      {"place_id": 15, "notes": "Updated notes for place 15"},
      {"place_id": 18, "notes": "Updated notes for place 18"}
    ]
  }
  ```

**Response**:
```json
{
  "status": "success",
  "updated_count": 2
}
```

## Error Handling

The API returns appropriate HTTP status codes for different error conditions:

- `400 Bad Request`: Invalid input (missing required fields, invalid format)
- `401 Unauthorized`: Authentication required
- `403 Forbidden`: User doesn't have permission for the operation
- `404 Not Found`: Requested resource not found
- `500 Internal Server Error`: Server-side error

Example error response:

```json
{
  "error": "place_id is required"
}
```

## Use Cases

### Mobile App Bookmarking

The Saved Places API enables users of the mobile app to:
1. Browse places and save interesting ones for later
2. Add notes about why they want to visit
3. Filter their saved places by district or type
4. Quickly check if they've already saved a place
5. Manage their collection with batch operations

### Trip Planning

Users can:
1. Save multiple places they plan to visit on a trip
2. Add notes about their visit plans
3. Group places by district for organized itineraries
4. Remove places they've visited
5. Update notes with experiences after visiting

### Recommendations

The system can use saved places to:
1. Analyze user preferences based on saved place types
2. Generate personalized recommendations
3. Identify trending places by saving patterns
4. Create district-based recommendations for exploration 