# Combined Search API

This document describes the Combined Search functionality for CityStory, which integrates full-text search, district-based filtering, and geolocation-based search capabilities.

## Overview

The Combined Search API provides a unified endpoint for searching places with multiple filtering and sorting options. It combines the power of PostgreSQL's full-text search with geolocation capabilities and comprehensive filtering options to deliver relevant results based on user preferences.

## Key Features

### 1. Integrated Search Capabilities

- **Full-text search**: Search across name, description, address, and district fields with relevance ranking
- **District filtering**: Filter by one or multiple districts (e.g., Xinyi, Daan, Zhongshan)
- **Geolocation search**: Find places near a specified location with customizable radius
- **Feature filtering**: Filter by place features (e.g., Wi-Fi, Outdoor Seating)
- **Place type filtering**: Filter by place types (e.g., restaurant, cafe, bar)
- **Price range filtering**: Set minimum and maximum price ranges

### 2. Advanced Search Options

- **Fuzzy matching**: Handles typos and spelling variations using trigram similarity
- **Result highlighting**: Highlights matching terms in results for better visibility
- **Advanced syntax**: Supports quotes for exact phrases and minus for exclusion
- **Multilingual support**: Works with non-Latin characters and multiple languages

### 3. Performance Features

- **Optimized geospatial queries**: Uses Haversine formula for accurate distance calculation
- **Response caching**: Frequently performed searches are cached to improve response time
- **Efficient pagination**: Supports both page-based and cursor-based pagination

### 4. Flexible Sorting

- **Relevance sorting**: Results ranked by search relevance
- **Distance sorting**: Results sorted by proximity to specified coordinates
- **Rating sorting**: Results sorted by average rating
- **Name sorting**: Results sorted alphabetically by name

## API Endpoint

```
GET /api/search/combined/
```

## Query Parameters

| Parameter  | Description | Example |
|------------|-------------|---------|
| `q`        | Search query text | `?q=coffee` |
| `district` | Filter by district (comma-separated for multiple) | `?district=xinyi,daan` |
| `type`     | Filter by place type | `?type=cafe` |
| `features` | Filter by features (comma-separated feature IDs) | `?features=1,3` |
| `price_min` | Minimum price range | `?price_min=300` |
| `price_max` | Maximum price range | `?price_max=800` |
| `latitude` | Latitude for geolocation search | `?latitude=25.0330` |
| `longitude` | Longitude for geolocation search | `?longitude=121.5654` |
| `radius`   | Search radius in kilometers | `?radius=2` |
| `sort`     | Sort order (relevance, distance, rating, name) | `?sort=distance` |
| `fuzzy`    | Enable fuzzy matching (true/false) | `?fuzzy=true` |
| `highlight`| Enable highlighting (true/false) | `?highlight=true` |
| `page`     | Page number for pagination | `?page=2` |
| `page_size`| Results per page | `?page_size=20` |
| `cursor`   | Cursor for pagination | `?cursor=42:1.5` |

## Usage Examples

### Text Search with District Filtering

```
GET /api/search/combined/?q=coffee&district=xinyi
```

Returns coffee places in the Xinyi district.

### Geolocation Search with Type Filtering

```
GET /api/search/combined/?latitude=25.0330&longitude=121.5654&radius=1&type=restaurant
```

Returns restaurants within 1km of the specified coordinates.

### Combined Filtering with Feature and Price Range

```
GET /api/search/combined/?features=1,3&price_min=300&price_max=800&sort=rating
```

Returns places with features 1 and 3, price range between NT$300-800, sorted by rating.

### Advanced Search with All Options

```
GET /api/search/combined/?q=cocktail&district=daan&features=2&latitude=25.0330&longitude=121.5654&radius=3&price_min=500&sort=distance&highlight=true&page_size=10
```

Returns cocktail places in Daan district with feature 2, within 3km of coordinates, minimum price NT$500, sorted by distance, with highlighted matches, 10 results per page.

## Response Format

```json
{
  "count": 42,
  "page": 1,
  "page_size": 20,
  "total_pages": 3,
  "next": "http://example.com/api/search/combined/?page=2&...",
  "previous": null,
  "next_cursor": "15:2.5",
  "query": "coffee",
  "fuzzy_enabled": true,
  "location": {
    "latitude": 25.0330,
    "longitude": 121.5654,
    "radius_km": 2.0
  },
  "results": [
    {
      "id": 1,
      "name": "Coffee House",
      "description": "A cozy coffee shop",
      "address": "123 Coffee Street",
      "district": "xinyi",
      "type": "cafe",
      "price_range": "400",
      "average_rating": 4.5,
      "latitude": 25.0328,
      "longitude": 121.5650,
      "distance_km": 0.15,
      "relevance": 0.89,
      "highlights": {
        "name": "A cozy <mark>coffee</mark> shop",
        "description": "Serving premium <mark>coffee</mark> and pastries"
      },
      "features": [1, 3, 5]
    },
    // More results...
  ]
}
```

## Implementation Details

### 1. Text Search Implementation

- Uses `SearchVector` with field weights for relevance ranking
- Employs `SearchQuery` with 'websearch' type for advanced syntax
- Utilizes `TrigramSimilarity` for fuzzy matching
- Implements `SearchHeadline` for result highlighting

### 2. Geolocation Implementation

- Uses the Haversine formula for accurate Earth-surface distance calculation
- Optimizes query with proper indexing and null-value handling
- Returns distance from query point in kilometers

### 3. Pagination Implementation

- Supports traditional page-based pagination with `page` and `page_size` parameters
- Implements cursor-based pagination for better performance with large result sets
- Cursor format: `<id>:<sort_value>` for efficient continuation

## Performance Considerations

- Response caching is applied for frequent searches (5-minute cache)
- Cache is bypassed for large result sets (>500 results)
- Geolocation queries use optimized formulas for better performance
- Feature filtering uses `__in` queries for efficiency with multiple features

## Frontend Integration

Frontend applications can:

1. Implement a search box with filters UI (district dropdown, price sliders, etc.)
2. Provide map integration for location-based searches
3. Render highlighted search matches in results
4. Implement pagination with either page numbers or "load more" functionality
5. Display distance information for location-based searches 