# API Field Naming Conventions

## Overview

This document outlines the field naming conventions used throughout the API. Understanding these conventions is essential for proper integration with the API.

## Key Principles

- **Model Fields**: All database model fields use `snake_case` (following Django conventions)
- **API Fields**: All external-facing API fields use `camelCase` (following JavaScript/frontend conventions)
- **Serializers**: Handle the mapping between snake_case and camelCase

## Field Mapping Examples

| Model Field (snake_case) | API Field (camelCase) | Description |
|--------------------------|----------------------|-------------|
| `price_level` | `priceLevel` | Price category (1-4) |
| `place_type` | `placeType` | Type of establishment |
| `feature_type` | `featureType` | Type of feature |
| `overall_rating` | `overallRating` | Overall rating (1-5) |
| `food_quality` | `foodQuality` | Food quality rating (1-5) |
| `helpful_count` | `helpfulCount` | Number of helpful votes |
| `is_primary` | `isPrimary` | Whether image is primary |
| `is_approved` | `isApproved` | Approval status |
| `first_name` | `firstName` | User's first name |
| `last_name` | `lastName` | User's last name |
| `google_maps_link` | `googleMapsLink` | Google Maps URL |

## URL Query Parameters

API query parameters also use camelCase:

- `minPrice` / `maxPrice`: Filter by price level (maps to `price_level` field)
- `placeType`: Filter by place type (maps to `place_type` field)
- `featureName`: Filter by feature name
- `featureType`: Filter by feature type
- `minRating` / `maxRating`: Filter by rating

## Making API Requests

When submitting data to the API, always use the camelCase version of field names:

```json
// CORRECT
{
  "name": "Restaurant Name",
  "placeType": "restaurant",
  "priceLevel": 3,
  "overallRating": 4.5,
  "foodQuality": 4.0,
  "isPrimary": true
}

// INCORRECT
{
  "name": "Restaurant Name",
  "place_type": "restaurant",
  "price_level": 3,
  "overall_rating": 4.5,
  "food_quality": 4.0,
  "is_primary": true
}
```

## Model-to-API Field Mapping Implementation

The field mapping is implemented in the serializers using source attributes:

```python
# Example from PlaceSerializer
priceLevel = serializers.IntegerField(source='price_level')
placeType = serializers.CharField(source='place_type')

# Example from ReviewSerializer
overallRating = serializers.FloatField(source='overall_rating')
foodQuality = serializers.FloatField(source='food_quality')
helpfulCount = serializers.IntegerField(source='helpful_count', read_only=True)
```

## Method Field Naming

SerializerMethodField getters follow the camelCase convention by prepending "get_" to the camelCase field name:

```python
# Example for isOwner field
def get_isOwner(self, obj):
    request = self.context.get('request')
    return request and request.user == obj.user
```

## API Response Format

All API responses will contain camelCase field names, regardless of the internal model field names:

```json
{
  "id": 123,
  "name": "Example Restaurant",
  "placeType": "restaurant",
  "priceLevel": 3,
  "averageRating": 4.5,
  "foodQuality": 4.2,
  "helpfulCount": 15,
  "isOwner": false
}
```

## Validation Errors

Validation error messages will reference fields using their camelCase API names:

```json
{
  "overallRating": ["Overall rating is required for all places."],
  "foodQuality": ["Food quality rating is required for restaurants."]
}
``` 