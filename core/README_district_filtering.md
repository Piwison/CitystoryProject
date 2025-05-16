# District-Based Filtering

This document describes the implementation of district-based filtering functionality for CityStory.

## Overview

District-based filtering allows users to filter places by specific districts in Taipei. This feature enables users to narrow down their search results to specific geographic areas of interest. Multiple districts can be selected to create a broader search area.

## Key Components

### 1. District Data Structure

- Districts are defined in `core/choices.py` as `DISTRICT_CHOICES`
- Each district has a machine-readable ID (e.g., 'xinyi') and a human-readable name (e.g., 'Xinyi District')
- The `Place` model has a `district` field with choices from `DISTRICT_CHOICES`

### 2. Filtering Implementation

- In `PlaceFilter` (views/places.py), a `districts` filter enables filtering by multiple districts
- Multiple districts can be specified as a comma-separated list (e.g., `?districts=xinyi,daan`)
- The filter validates district values against `DISTRICT_CHOICES` to prevent invalid filters

### 3. Combined Search Integration

- The `CombinedSearchView` (views/search.py) supports district filtering via the `district` query parameter
- The same comma-separated format is supported (e.g., `?district=xinyi,daan`)
- District filtering can be combined with other filters (text search, place type, etc.)

### 4. Districts API Endpoint

- The `/api/places/districts/` endpoint provides a list of all districts with place counts
- Each entry includes the district name, value (code), and count of approved places
- The list is sorted alphabetically by district name
- Example response:
  ```json
  [
    {"name": "Beitou", "value": "beitou", "count": 5},
    {"name": "Da'an", "value": "daan", "count": 15},
    {"name": "Datong", "value": "datong", "count": 8},
    ...
  ]
  ```

## Usage Examples

### Filtering Places by District

```
GET /api/places/?districts=xinyi,daan
```

This returns places located in either Xinyi or Da'an districts.

### Combining with Other Filters

```
GET /api/places/?districts=xinyi,daan&types=restaurant,cafe
```

This returns restaurants and cafes located in either Xinyi or Da'an districts.

### Using with Combined Search

```
GET /api/search/?q=coffee&district=daan,zhongshan
```

This performs a text search for "coffee" within places located in Da'an or Zhongshan districts.

### Getting District List with Counts

```
GET /api/places/districts/
```

This returns a list of all districts with the count of approved places in each.

## Implementation Details

### District Validation

The system validates district codes against the predefined `DISTRICT_CHOICES` to ensure only valid districts are used in filtering. Invalid district codes in the query parameters are ignored.

### Performance Considerations

- The `district` field in the `Place` model is indexed to optimize filtering queries
- District counts are calculated on demand using efficient database queries

### Frontend Integration

Frontend applications can:
1. Fetch the list of districts from `/api/places/districts/`
2. Render a multi-select dropdown or checkboxes for district selection
3. Use the counts to show users how many places are available in each district
4. Send the selected districts as a comma-separated list in API requests 