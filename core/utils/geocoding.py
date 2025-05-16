"""
Utilities for geocoding addresses and performing geospatial operations.
"""
import logging
import requests
from django.conf import settings
from typing import Tuple, Optional, Dict, Any
import time

logger = logging.getLogger(__name__)

# Map Google's district names to our DISTRICT_CHOICES values
DISTRICT_MAPPING = {
    # Common mappings for Taipei districts
    'xinyi district': 'xinyi',
    'da\'an district': 'daan',
    'datong district': 'datong',
    'shilin district': 'shilin',
    'wanhua district': 'wanhua',
    'songshan district': 'songshan',
    'zhongshan district': 'zhongshan',
    'beitou district': 'beitou',
    'nangang district': 'nangang',
    'wenshan district': 'wenshan',
    'neihu district': 'neihu',
    'zhongzheng district': 'zhongzheng',
    # Common variations
    'daan district': 'daan',
    'da-an district': 'daan',
    'zhong zheng district': 'zhongzheng',
    'taipei': 'other',  # Default for Taipei with no specific district
}

def geocode_address(address: str) -> Optional[Tuple[float, float]]:
    """
    Convert an address to latitude and longitude coordinates.
    
    Args:
        address: The address to geocode
        
    Returns:
        A tuple of (latitude, longitude) or None if geocoding failed
    """
    if not getattr(settings, 'GEOCODING_API_KEY', None):
        logger.warning("Geocoding API key not configured. Skipping geocoding.")
        return None
        
    try:
        # Throttle requests to avoid hitting rate limits
        rate_limit = getattr(settings, 'GEOCODING_RATE_LIMIT', 0.2)
        time.sleep(rate_limit)
        
        # Call the Google Maps Geocoding API
        url = 'https://maps.googleapis.com/maps/api/geocode/json'
        params = {
            'address': address,
            'key': settings.GEOCODING_API_KEY
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data['status'] != 'OK':
            logger.error(f"Geocoding failed for address '{address}': {data['status']}")
            return None
            
        # Extract latitude and longitude from the response
        location = data['results'][0]['geometry']['location']
        latitude = location['lat']
        longitude = location['lng']
        
        return (latitude, longitude)
        
    except Exception as e:
        logger.exception(f"Error geocoding address '{address}': {str(e)}")
        return None

def reverse_geocode(latitude: float, longitude: float) -> Optional[Dict[str, Any]]:
    """
    Convert coordinates to an address.
    
    Args:
        latitude: The latitude coordinate
        longitude: The longitude coordinate
        
    Returns:
        A dictionary containing address components or None if reverse geocoding failed
    """
    if not getattr(settings, 'GEOCODING_API_KEY', None):
        logger.warning("Geocoding API key not configured. Skipping reverse geocoding.")
        return None
        
    try:
        # Throttle requests to avoid hitting rate limits
        rate_limit = getattr(settings, 'GEOCODING_RATE_LIMIT', 0.2)
        time.sleep(rate_limit)
        
        # Call the Google Maps Geocoding API
        url = 'https://maps.googleapis.com/maps/api/geocode/json'
        params = {
            'latlng': f"{latitude},{longitude}",
            'key': settings.GEOCODING_API_KEY
        }
        
        response = requests.get(url, params=params)
        data = response.json()
        
        if data['status'] != 'OK':
            logger.error(f"Reverse geocoding failed for coordinates ({latitude}, {longitude}): {data['status']}")
            return None
            
        # Return the full result for the caller to parse as needed
        return data['results'][0]
        
    except Exception as e:
        logger.exception(f"Error reverse geocoding coordinates ({latitude}, {longitude}): {str(e)}")
        return None
        
def extract_district_from_reverse_geocoding(result: Dict[str, Any]) -> Optional[str]:
    """
    Extract the district name from a reverse geocoding result.
    
    Args:
        result: The result from reverse_geocode()
        
    Returns:
        The district name in lowercase or None if not found
    """
    if not result or 'address_components' not in result:
        return None
        
    # Look for the district in the address components
    for component in result['address_components']:
        if 'administrative_area_level_3' in component['types']:
            district = component['long_name'].lower()
            return district
            
    return None

def determine_district(latitude: float, longitude: float) -> Optional[str]:
    """
    Determine the district for a given set of coordinates.
    
    Args:
        latitude: The latitude coordinate
        longitude: The longitude coordinate
        
    Returns:
        The district name in lowercase or None if it couldn't be determined
    """
    result = reverse_geocode(latitude, longitude)
    if not result:
        return None
        
    district = extract_district_from_reverse_geocoding(result)
    
    # Map the district to one of our choices
    if district:
        district = district.lower()
        return DISTRICT_MAPPING.get(district, 'other')
        
    # If we couldn't determine the district from address components,
    # check the formatted address for keywords
    if 'formatted_address' in result:
        address = result['formatted_address'].lower()
        for district_key, district_value in DISTRICT_MAPPING.items():
            if district_key.split(' ')[0] in address:
                return district_value
                
    return 'other'  # Default fallback

def batch_geocode_places(places, commit=True):
    """
    Batch geocode places that have addresses but no coordinates.
    
    Args:
        places: A queryset or list of Place objects
        commit: Whether to save changes to the database
        
    Returns:
        A tuple of (success_count, failure_count)
    """
    from ..models import Place
    
    # Check if input is a queryset or list
    if hasattr(places, 'filter'):
        # It's a queryset
        if not isinstance(places.first(), Place):
            raise ValueError("Queryset must contain Place objects")
            
        # Filter places with addresses but no coordinates
        places_to_geocode = places.filter(
            address__isnull=False,
            address__gt='',
            latitude__isnull=True,
            longitude__isnull=True
        )
    else:
        # It's a list
        if not places or not isinstance(places[0], Place):
            raise ValueError("List must contain Place objects")
            
        # Filter places with addresses but no coordinates
        places_to_geocode = [p for p in places if p.address and not p.latitude and not p.longitude]
    
    success_count = 0
    failure_count = 0
    
    for place in places_to_geocode:
        coordinates = geocode_address(place.address)
        if coordinates:
            latitude, longitude = coordinates
            place.latitude = latitude
            place.longitude = longitude
            
            # If district is not set, try to determine it
            if not place.district:
                district = determine_district(latitude, longitude)
                if district:
                    place.district = district
            
            if commit:
                place.save(update_fields=['latitude', 'longitude', 'district'])
            success_count += 1
        else:
            failure_count += 1
            
    return (success_count, failure_count) 