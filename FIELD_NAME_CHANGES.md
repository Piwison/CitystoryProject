# Field Name Changes: Standardizing on placeType and priceLevel

## Frontend Files Updated:
1. `citystory/components/add-place-form.tsx`: 
   - Updated payload field names to `title`, `placeType`, and `priceLevel`

2. `citystory/types/place.ts`: 
   - Updated `Place` interface to use `placeType` and `priceLevel` fields

3. `citystory/components/places/PlaceForm.tsx`:
   - Updated `Place` interface to use `placeType` instead of `type`
   - Updated form schema to use `placeType` field
   - Updated form state and form field references

## Backend Files Updated:
1. `core/models.py`: 
   - Updated `Place` model to use `placeType` and `priceLevel` field names
   - Added `db_column` parameters to maintain database compatibility

2. `core/serializers.py`:
   - Updated `PlaceSerializer` fields to include `placeType` and `priceLevel`
   - Updated validation methods

3. `core/views/places.py`:
   - Updated `PlaceFilter` field references
   - Updated filter methods to use new field names
   - Updated Meta class and documentation

4. Created a migration file `core/migrations/0002_rename_place_fields.py` (empty operations since db_column is used)

## Strategy:
- **Frontend**: Full migration to `placeType` and `priceLevel` field names
- **Backend**: Used `db_column` to maintain database compatibility while updating code
- **API**: API now accepts and returns `placeType` and `priceLevel` fields

## Benefits:
- Consistent naming across frontend and backend
- Maintains backward compatibility with existing database
- Reduces confusion and potential bugs from inconsistent naming 