# Save as test_api.py
import requests
import json

# Base URL
base_url = 'http://127.0.0.1:8000/api/'

def get_token():
    auth_data = {
        'username': 'admin',
        'password': 'adminpass',
        'email': 'admin@example.com'
    }
    response = requests.post(f'{base_url}token/', json=auth_data)
    print(f"Token Response Status: {response.status_code}")
    print(response.text)
    return response.json() if response.status_code == 200 else None

def get_places(token=None):
    headers = {'Authorization': f'Bearer {token}'} if token else {}
    response = requests.get(f'{base_url}places/', headers=headers)
    print(f"Places Response Status: {response.status_code}")
    print(response.text[:500])  # Print first 500 chars
    return response.json() if response.status_code == 200 else None

def create_place(token):
    headers = {'Authorization': f'Bearer {token}'}
    place_data = {
        'name': 'Python Test Cafe',
        'description': 'Created via Python script',
        'type': 'cafe',
        'price_range': '500',
        'district': 'daan'
    }
    response = requests.post(f'{base_url}places/', json=place_data, headers=headers)
    print(f"Create Place Response Status: {response.status_code}")
    print(response.text)
    return response.json() if response.status_code < 300 else None

if __name__ == '__main__':
    # Step 1: Get token
    tokens = get_token()
    if tokens:
        access_token = tokens.get('access')
        print(f"Got access token: {access_token[:20]}...")
        
        # Step 2: Get places
        print("\nGetting places...")
        get_places(access_token)
        
        # Step 3: Create a place
        print("\nCreating a place...")
        create_place(access_token)
    else:
        # Try without token
        print("\nTrying to get places without authentication...")
        get_places()