# Full-Text Search Implementation

This document describes the implementation of full-text search functionality for CityStory.

## Overview

Full-text search allows users to find places using natural language queries. The search functionality leverages PostgreSQL's full-text search capabilities to provide fast and relevant results.

## Key Features

### 1. Advanced Text Search

- **Multi-field search**: Searches across name, description, address, and district fields
- **Weighted relevance**: Results are ranked based on field importance (name > description > address > district)
- **Fuzzy matching**: Handles typos and spelling variations using trigram similarity
- **Advanced syntax**: Supports quotes for exact phrases and minus for exclusion
- **Multilingual support**: Works with non-Latin characters and multiple languages

### 2. Performance Optimizations

- **Result caching**: Frequently performed searches are cached to improve response time
- **Pagination**: Results are paginated to improve performance with large result sets
- **Configurable thresholds**: Minimum rank threshold can be adjusted for performance tuning

### 3. User Experience Enhancements

- **Highlighted results**: Search terms are highlighted in the results for better visibility
- **Relevance scores**: Each result includes a relevance score for transparency
- **Configurable search fields**: Users can specify which fields to search

## Implementation Components

### 1. Search Endpoints

The system provides two main search endpoints:

- **`/api/search/`**: Simple full-text search with highlighting and pagination
- **`/api/combined-search/`**: Advanced search combining full-text search with filtering (district, type, price range)

### 2. Core Technologies

- **PostgreSQL full-text search**: Utilizes built-in text search capabilities
- **SearchVector**: Combines multiple fields with different weights
- **SearchQuery**: Processes search terms with "websearch" configuration for advanced syntax
- **SearchRank**: Determines result relevance and ordering
- **TrigramSimilarity**: Provides fuzzy matching for typos
- **SearchHeadline**: Highlights matching terms in results

## Usage Examples

### Basic Search

```
GET /api/search/?q=coffee
```

Returns places with "coffee" in any searchable field, ranked by relevance.

### Fuzzy Search

```
GET /api/search/?q=cofee&fuzzy=true
```

Finds "coffee" even with the typo "cofee" using fuzzy matching.

### Advanced Syntax

```
GET /api/search/?q="authentic ramen" -spicy
```

Finds places with the exact phrase "authentic ramen" but not containing "spicy".

### Combined Search with Filtering

```
GET /api/combined-search/?q=craft beer&district=zhongshan&type=bar
```

Searches for "craft beer" in bars located in Zhongshan district.

### Configuring Results

```
GET /api/search/?q=sushi&highlight=true&fields=name,description&page=2&page_size=10
```

Searches for "sushi" only in name and description fields, with highlighting, showing the second page of results with 10 results per page.

## Performance Considerations

### Caching Strategy

- Search results are cached for 5-10 minutes for frequently performed searches
- Cache keys include all search parameters to ensure accurate results
- Large result sets (>500 results) are not cached to conserve memory

### Optimal Query Construction

- Exact matching is attempted first for better performance
- Fuzzy matching is only employed when exact matching yields few results
- Field weights are configured to prioritize more specific fields (name > description)

### Pagination

- Default page size is 20 items
- Maximum page size is capped at 100 items
- Next/previous page links are provided for easy navigation

## Frontend Integration

Frontend applications can:

1. Implement a search box for simple queries
2. Add advanced search UI for power users (exact phrases, exclusions)
3. Render highlighted search matches using the provided HTML markers
4. Display relevance scores to help users understand why results are ranked as they are
5. Implement a search results page with pagination controls 