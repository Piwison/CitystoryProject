# Additional Field Name Changes for Standardizing on placeType and priceLevel

The following files were updated to use the standardized field names `placeType` and `priceLevel`:

## Backend Files Updated:

1. `core/views/places.py`:
   - Updated the `near_me` method to use `placeType` instead of `type`

2. `core/views/reviews.py`:
   - Updated the `validate_review_data` method to use `placeType` instead of `type`

3. `core/views/saved_places.py`:
   - Updated the `SavedPlaceFilter` class to use `place__placeType` instead of `place__type`

4. `core/views/search.py`: 
   - Updated the filter methods to use `placeType` and `priceLevel` instead of `type` and `price_range`
   - Added documentation to clarify that query parameters map to new field names internally

5. `core/admin.py`:
   - Updated the `PlaceAdmin` class field references to use `placeType` and `priceLevel`

## Frontend Files Updated:

1. `citystory/app/places/[slug]/page.tsx`:
   - Updated mock data structure to use `placeType` instead of `type`
   - Updated JSX template to use the new field names

2. `citystory/components/place-search.tsx`:
   - Updated mock data to use `placeType` instead of `type`
   - Updated dialog component to reference `placeType`

## Benefits:

1. Consistent naming across the entire codebase
2. Clearer, more descriptive field names
3. Better alignment with frontend TypeScript type definitions
4. Maintained backward compatibility with database using `db_column` attribute

All changes have been implemented without requiring database schema changes by using the `db_column` attribute in Django models. 