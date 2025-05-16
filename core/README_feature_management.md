# Feature Management System

This document outlines the Feature Management System implemented in the CityStory backend.

## Overview

The Feature Management System allows for the categorization and management of features/amenities associated with places. Features are organized by type (e.g., amenity, cuisine, atmosphere) and can be associated with specific place types (e.g., restaurant, cafe, bar).

## Key Features

1. **Feature Categorization**: Features are organized by predefined types for easy browsing
2. **Place Type Associations**: Features can be restricted to specific place types
3. **Batch Operations**: Create multiple features at once or associate multiple features with a place
4. **Feature Statistics**: Track how many places use each feature
5. **Validation**: Ensure features are only associated with compatible place types

## Implementation Details

### Models

The Feature model includes:

- `name`: The name of the feature
- `type`: Type/category of the feature (e.g., amenity, cuisine)
- `description`: Optional description
- `icon`: Optional icon reference for UI display
- `applicable_place_types`: Comma-separated list of place types this feature applies to

### API Endpoints

#### Feature Listing and Filtering

- `GET /api/features/`: List all features
  - Supports filtering by name, type, and place type
  - Supports searching across name and description
  - Supports ordering by name, type, or popularity

#### Feature Categories

- `GET /api/features/categories/`: Get all feature categories with counts
- `GET /api/features/by_category/`: Get features grouped by category
- `GET /api/features/by_place_type/?type=restaurant`: Get features applicable to a specific place type

#### Place-Feature Associations

- `GET /api/features/{id}/places/`: Get all places with a specific feature
- `POST /api/features/associate_with_place/`: Associate features with a place
  - Requires `place_id` and `feature_ids` (list)
  - Validates feature applicability to place type

#### Batch Operations

- `POST /api/features/batch_create/`: Create multiple features at once
  - Expects a list of feature objects
  - Returns created features and any errors

### Usage Examples

#### Create a Feature

```http
POST /api/features/
Content-Type: application/json

{
  "name": "Wi-Fi",
  "type": "amenity",
  "description": "Free wireless internet access",
  "icon": "wifi",
  "applicable_place_types": "restaurant,cafe,bar"
}
```

#### Get Features by Category

```http
GET /api/features/by_category/
```

Response:
```json
{
  "amenity": {
    "name": "Amenity",
    "features": [
      {
        "id": 1,
        "name": "Wi-Fi",
        "type": "amenity",
        "type_display": "Amenity",
        "description": "Free wireless internet access",
        "icon": "wifi",
        "applicable_place_types": "restaurant,cafe,bar",
        "applicable_place_types_list": ["restaurant", "cafe", "bar"],
        "places_count": 5
      },
      ...
    ]
  },
  "cuisine": {
    "name": "Cuisine",
    "features": [...]
  },
  ...
}
```

#### Associate Features with a Place

```http
POST /api/features/associate_with_place/
Content-Type: application/json

{
  "place_id": 1,
  "feature_ids": [1, 2, 3]
}
```

## Best Practices

1. **Feature Naming**: Use clear, concise names that users will understand
2. **Appropriate Categorization**: Choose the most relevant type for each feature
3. **Applicability**: Set applicable place types carefully to prevent inappropriate associations
4. **Icons**: Use standardized icon names that match your frontend icon library
5. **Batch Operations**: Use batch operations when creating multiple related features (e.g., cuisines)

## Future Enhancements

1. **Feature Popularity Analytics**: Track which features users search/filter by most often
2. **Dynamic Feature Types**: Allow admin users to create custom feature types
3. **Feature Relations**: Create relationships between related features (e.g., "Outdoor Seating" related to "Garden View")
4. **Feature Import/Export**: Provide utilities for bulk import/export of features
5. **Feature Images**: Allow image uploads for certain feature types (e.g., cuisine) 