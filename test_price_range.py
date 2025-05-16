"""
Test script for price range functionality.

This script demonstrates how to:
1. Log in and obtain an authentication token
2. Create a place with a specific price range
3. Filter places by price range

To run:
1. Activate your virtual environment: 
   - Windows PowerShell: .\\venv\\Scripts\\Activate.ps1
   - Windows CMD: .\\venv\\Scripts\\activate.bat
   - Git Bash: source venv/Scripts/activate
2. Run: python test_price_range.py

Note: Make sure your Django server is running with the migrations applied!
If you haven't applied migrations, run:
python manage.py migrate
"""

import os
import sys
import requests
import json
from pprint import pprint

# API endpoint
API_URL = "http://127.0.0.1:8000/api"

# Update these with valid credentials for your Django app
USERNAME = "admin"  # Replace with your username
PASSWORD = "adminpass"
  # Replace with your password

# Place price range options
PRICE_RANGES = {
    "0": "Free",
    "200": "NT$1-200",
    "400": "NT$200-400",
    "600": "NT$400-600",
    "800": "NT$600-800",
    "1000": "NT$800-1000",
    "1500": "NT$1000-1500",
    "2000": "NT$1500-2000",
    "2000+": "NT$2000+"
}

def get_auth_token():
    """Obtain authentication token by logging in"""
    print(f"Logging in as {USERNAME}...")
    
    login_data = {
        "username": USERNAME,
        "password": PASSWORD,
        "email": "admin@example.com"
    }
    
    try:
        response = requests.post(
            f"{API_URL}/token/",
            json=login_data
        )
        
        print(f"Login response status code: {response.status_code}")
        print(f"Login response headers: {response.headers}")
        
        if response.status_code == 200:
            token_data = response.json()
            token = token_data.get("access", "")
            if token:
                print("✅ Successfully obtained auth token")
                return token
            else:
                print("⚠️ Token not found in response")
                print("Response data:")
                pprint(token_data)
                return None
        else:
            print(f"❌ Login failed with status code: {response.status_code}")
            print("Response content:")
            print(response.text)
            return None
    except Exception as e:
        print(f"❌ Error obtaining token: {str(e)}")
        return None

def test_create_place(auth_token):
    """Test creating a place with the new price range format"""
    if not auth_token:
        print("❌ Cannot create place: No auth token available")
        return None
        
    headers = {
        "Authorization": f"Bearer {auth_token}",
        "Content-Type": "application/json"
    }
    
    # Place data with the new price range format
    place_data = {
        "name": "Price Range Test Cafe",
        "description": "Testing the new price range format",
        "type": "cafe",
        "price_range": "1000",  # NT$800-1000
        "address": "123 Test Street, Taipei",
        "district": "daan"
    }
    
    print(f"Creating place with price_range={place_data['price_range']} ({PRICE_RANGES[place_data['price_range']]})")
    print(f"Headers: {headers}")
    print(f"Request data: {json.dumps(place_data, indent=2)}")
    
    # Make the API request
    response = requests.post(
        f"{API_URL}/places/",
        headers=headers,
        json=place_data
    )
    
    print(f"Create place response status code: {response.status_code}")
    
    if response.status_code == 201:
        print("✅ Successfully created place with price_range='1000'")
        place = response.json()
        print(f"Place ID: {place['id']}")
        print(f"Place details: {json.dumps(place, indent=2)}")
        return place['id']
    else:
        print("❌ Failed to create place")
        print(f"Status code: {response.status_code}")
        print("Response:")
        try:
            pprint(response.json())
        except:
            print(response.text)
        return None

def test_filter_by_price_range(auth_token, place_id=None):
    """Test filtering places by price range"""
    if not auth_token:
        print("❌ Cannot filter places: No auth token available")
        return
        
    headers = {
        "Authorization": f"Bearer {auth_token}"
    }
    
    # Test different price range filters
    filters = [
        {"name": "min_price=800", "params": {"min_price": 800}},
        {"name": "max_price=1500", "params": {"max_price": 1500}},
        {"name": "min_price=1500", "params": {"min_price": 1500}},
        {"name": "min_price=600&max_price=1000", "params": {"min_price": 600, "max_price": 1000}}
    ]
    
    for filter_test in filters:
        print(f"\n=== Testing filter: {filter_test['name']} ===")
        url = f"{API_URL}/places/"
        print(f"Request URL: {url}")
        print(f"Request params: {filter_test['params']}")
        print(f"Request headers: {headers}")
        
        response = requests.get(
            url,
            headers=headers,
            params=filter_test["params"]
        )
        
        print(f"Response status code: {response.status_code}")
        print(f"Response headers: {dict(response.headers)}")
        
        if response.status_code == 200:
            try:
                data = response.json()
                print(f"Response data type: {type(data)}")
                
                # Handle different response formats
                if isinstance(data, dict) and "results" in data:
                    # Paginated response
                    places = data["results"]
                    count = data.get("count", 0)
                elif isinstance(data, list):
                    # Direct list response
                    places = data
                    count = len(places)
                else:
                    places = []
                    count = 0
                    
                print(f"Found {count} places with filter: {filter_test['name']}")
                
                # Check if our test place is in the results
                if place_id:
                    place_found = False
                    for place in places:
                        if str(place["id"]) == str(place_id):
                            place_found = True
                            print(f"  ✅ Test place found in filter: {filter_test['name']}")
                            break
                    
                    if not place_found:
                        print(f"  ❌ Test place NOT found in filter: {filter_test['name']}")
                        print(f"  Filter should have included place with ID: {place_id}")
                
                # Print all results
                if places:
                    print(f"Places found ({len(places)}):")
                    for i, place in enumerate(places):
                        print(f"  {i+1}. ID={place['id']}, Name={place['name']}, Price Range={place['price_range']} ({PRICE_RANGES.get(place['price_range'], 'Unknown')})")
                else:
                    print("  No places found with this filter")
                    
                # Print full response for detailed debugging (only if there are issues)
                if not places and place_id:
                    print("Full response data for debugging:")
                    pprint(data)
            except Exception as e:
                print(f"❌ Error processing response: {str(e)}")
                print("Raw response text:")
                print(response.text[:500])  # Print first 500 chars to avoid overwhelming output
        else:
            print(f"❌ Failed to filter places with: {filter_test['name']}")
            print(f"Status code: {response.status_code}")
            print("Response:")
            print(response.text)

def main():
    print("=== Testing Price Range Functionality ===")
    
    # Step 1: Get authentication token
    auth_token = get_auth_token()
    if not auth_token:
        print("❌ Cannot proceed with tests without authentication")
        return
    
    # Step 2: Test creating a place with the new price range
    place_id = test_create_place(auth_token)
    
    if place_id:
        print("\n=== Testing Price Range Filtering ===")
        test_filter_by_price_range(auth_token, place_id)
    
    print("\nDone!")

if __name__ == "__main__":
    main() 