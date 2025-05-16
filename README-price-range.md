# Price Range Feature Update

This document outlines the price range feature update for the CityStory application.

## Overview

The price range format has been updated to use more specific numeric range format in NT$ (Taiwanese dollars) with 200 NT$ increments.

## New Price Range Format

The new price range format is as follows:

| Value    | Display Format  | Description                |
|----------|----------------|-------------------------------|
| '0'      | Free           | Free (no cost)                |
| '200'    | NT$1-200       | Very budget friendly          |
| '400'    | NT$200-400     | Budget friendly               |
| '600'    | NT$400-600     | Moderate budget              |
| '800'    | NT$600-800     | Mid-range                     |
| '1000'   | NT$800-1000    | Slightly expensive            |
| '1500'   | NT$1000-1500   | High-end                      |
| '2000'   | NT$1500-2000   | Very high-end                 |
| '2000+'  | NT$2000+       | Premium/luxury                |

## Backend Usage

### Creating Places with Price Range

When creating a place via the API, you should specify the price range using the numeric value:

```json
{
  "name": "Example Cafe",
  "description": "A nice cafe",
  "type": "cafe",
  "price_range": "800",  // Corresponds to NT$600-800
  "address": "123 Example Street, Taipei",
  "district": "daan"
}
```

### Authentication

Before using the API, you need to obtain an authentication token:

```bash
# Using curl (Bash)
curl -X POST "http://127.0.0.1:8000/api/token/" \
  -H "Content-Type: application/json" \
  -d '{"username": "your_username", "password": "your_password", "email": "your_email@example.com"}'

# Using PowerShell
$body = @{
    username = "your_username"
    password = "your_password"
    email = "your_email@example.com"
} | ConvertTo-Json

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/token/" -Method Post -Body $body -ContentType "application/json"
$access = $response.access  # This is your token
```

### Filtering Places by Price Range

You can filter places by price range using the `min_price` and `max_price` query parameters:

```bash
# Using curl (Bash)
curl -X GET "http://127.0.0.1:8000/api/places/?min_price=600&max_price=1000" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Using PowerShell
$headers = @{
    "Authorization" = "Bearer YOUR_TOKEN_HERE"
}

$response = Invoke-RestMethod -Uri "http://127.0.0.1:8000/api/places/?min_price=600&max_price=1000" -Method Get -Headers $headers
```

This will return places with price ranges from 600 to 1000 NT$ (NT$400-600, NT$600-800, and NT$800-1000).

## Frontend Usage

### Form Components

The frontend components (PlaceForm.tsx and add-place-form.tsx) have been updated to use the new price range format. They display the human-readable price ranges to users but submit the numeric values to the API.

Example usage in React components:

```tsx
// Format used in PlaceForm.tsx
<FormField
  control={form.control}
  name="priceRange"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Price Range</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select a price range" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          <SelectItem value="0">Free</SelectItem>
          <SelectItem value="200">NT$1-200</SelectItem>
          <SelectItem value="400">NT$200-400</SelectItem>
          <SelectItem value="600">NT$400-600</SelectItem>
          <SelectItem value="800">NT$600-800</SelectItem>
          <SelectItem value="1000">NT$800-1000</SelectItem>
          <SelectItem value="1500">NT$1000-1500</SelectItem>
          <SelectItem value="2000">NT$1500-2000</SelectItem>
          <SelectItem value="2000+">NT$2000+</SelectItem>
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

## Testing the Price Range Feature

A test script `test_price_range.py` is included in the repository that demonstrates:

1. Obtaining an authentication token
2. Creating a place with a specific price range
3. Filtering places by price range

To run the test:

1. Make sure your Django server is running with the latest migrations applied:
   ```bash
   python manage.py migrate
   python manage.py runserver
   ```

2. In another terminal, activate your virtual environment and run the test script:
   ```bash
   # Activate virtual environment (depending on your OS/shell)
   source venv/Scripts/activate  # Linux/Mac/Git Bash
   .\venv\Scripts\Activate.ps1   # Windows PowerShell
   .\venv\Scripts\activate.bat   # Windows CMD
   
   # Run the test script
   python test_price_range.py
   ``` 