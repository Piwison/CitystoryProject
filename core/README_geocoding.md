# Geocoding Integration

This document describes the implementation of geocoding functionality for CityStory.

## Overview

Geocoding allows us to convert addresses to coordinates and determine districts. This is essential for location-based features like map displays, "near me" searches, and district-based filtering.

## Key Components

### 1. Core Utilities (`core/utils/geocoding.py`)

- **`geocode_address`**: Converts an address to latitude and longitude using Google Maps API
- **`reverse_geocode`**: Converts coordinates to address components
- **`determine_district`**: Determines the district for a set of coordinates
- **`batch_geocode_places`**: Batch geocodes places with addresses but no coordinates

### 2. Model Integration

- The `Place` model includes fields for `latitude`, `longitude`, and `district`
- Validation ensures coordinates are within valid ranges
- District values map to the predefined `DISTRICT_CHOICES`

### 3. API Endpoints

- **`/api/places/{id}/geocode/`**: Geocode a specific place's address
- **`/api/places/batch-geocode/`**: Admin endpoint for batch geocoding

## Implementation Details

### District Determination

The system maps Google's district names to our predefined district choices. The process:

1. Reverse geocode coordinates to get address components
2. Look for `administrative_area_level_3` components which usually contain district info
3. Map the district name to our choices using the `DISTRICT_MAPPING` dictionary
4. Fall back to examining the formatted address if no district component is found
5. Use 'other' as a last resort

### Rate Limiting

To avoid hitting Google Maps API limits:

- Requests are throttled using the `GEOCODING_RATE_LIMIT` setting (default: 0.2 seconds between requests)
- Batch operations are designed to process places gradually

### Error Handling

- Robust error handling for API failures
- Logging of geocoding errors for monitoring
- Graceful fallbacks when geocoding fails

## Configuration

In your `.env` file:

```
GEOCODING_API_KEY=your_google_maps_api_key
GEOCODING_RATE_LIMIT=0.2  # Time in seconds between API calls
```

## Usage Examples

### Geocoding a Place

```python
from core.utils.geocoding import geocode_address

coordinates = geocode_address("101 Taipei 101, Xinyi District, Taipei, Taiwan")
if coordinates:
    latitude, longitude = coordinates
    print(f"Latitude: {latitude}, Longitude: {longitude}")
```

### Determining a District

```python
from core.utils.geocoding import determine_district

district = determine_district(25.0339639, 121.5644722)
print(f"District: {district}")  # e.g., "xinyi"
```

### Using the API Endpoint

```http
POST /api/places/42/geocode/
Authorization: Bearer <token>

Response:
{
    "latitude": 25.0339639,
    "longitude": 121.5644722,
    "district": "xinyi"
}
```

## Testing

Tests are provided in `core/tests/test_geocoding.py` and cover:

- Address to coordinate conversion
- Coordinate to district mapping
- Error handling for invalid inputs
- Batch geocoding functionality

## Future Improvements

- Implement caching for frequently geocoded addresses
- Add support for additional geocoding providers
- Enhance district determination with more precise boundary data
- Implement progressive batch geocoding for large datasets

> **Note:** Geocoding endpoints and features are deferred to v2 and are not available in the MVP release. All related endpoints, utilities, and tests are disabled for now. 