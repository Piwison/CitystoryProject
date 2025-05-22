"""
Choice constants for the core app
"""

PLACE_TYPE_CHOICES = [
    ('restaurant', 'Restaurant'),
    ('cafe', 'Cafe'),
    ('bar', 'Bar'),
    ('shop', 'Shop'),
]

PRICE_LEVEL_CHOICES = [
    (0, 'Free'),
    (200, 'NT$1-200'),
    (400, 'NT$200-400'),
    (600, 'NT$400-600'),
    (800, 'NT$600-800'),
    (1000, 'NT$800-1000'),
    (1500, 'NT$1000-1500'),
    (2000, 'NT$1500-2000'),
    (3000, 'NT$2000+'),  # Use 3000 as a stand-in for '2000+' upper bound
]

# Districts in Taipei
DISTRICT_CHOICES = [
    ('xinyi', 'Xinyi'),
    ('datong', 'Datong'),
    ('daan', 'Da\'an'),
    ('shilin', 'Shilin'),
    ('wanhua', 'Wanhua'),
    ('songshan', 'Songshan'),
    ('zhongshan', 'Zhongshan'),
    ('beitou', 'Beitou'),
    ('nangang', 'Nangang'),
    ('wenshan', 'Wenshan'),
    ('neihu', 'Neihu'),
    ('zhongzheng', 'Zhongzheng'),
    ('other', 'Other'),
]

# Placeholder for Feature types
FEATURE_TYPES = [
    ('amenity', 'Amenity'),         # e.g., WiFi, Parking, Pool
    ('cuisine', 'Cuisine'),         # e.g., Italian, Mexican, Vegan
    ('atmosphere', 'Atmosphere'),   # e.g., Romantic, Casual, Lively
    ('service', 'Service Option'), # e.g., Delivery, Takeaway, Outdoor Seating
    ('payment', 'Payment Option'), # e.g., Credit Cards, Mobile Payment
    ('accessibility', 'Accessibility'), # e.g., Wheelchair Accessible
    ('other', 'Other'),
] 