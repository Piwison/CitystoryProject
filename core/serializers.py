from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Place, Review, Photo, Feature, Notification, HelpfulVote, SavedPlace
from .models import Badge, UserBadge, UserPoints, UserLevel
from django.contrib.auth.password_validation import validate_password
from django.core.exceptions import ValidationError
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.core.validators import URLValidator
from .choices import PLACE_TYPE_CHOICES
import logging

User = get_user_model()
logger = logging.getLogger(__name__)

class UserSerializer(serializers.ModelSerializer):
    """Serializer for user model."""
    class Meta:
        model = User
        fields = ['id', 'email', 'first_name', 'last_name', 'auth_type']

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['email'] = user.email
        token['first_name'] = user.first_name
        token['last_name'] = user.last_name
        token['is_staff'] = user.is_staff
        token['auth_type'] = user.auth_type

        return token

    def validate(self, attrs):
        data = super().validate(attrs)
        # Add user info to the response
        data['user'] = UserSerializer(self.user).data
        return data

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    password_confirm = serializers.CharField(write_only=True, required=False, style={'input_type': 'password'})
    auth_type = serializers.CharField(required=False, default='local')
    google_id = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = User
        fields = ('email', 'password', 'password_confirm', 'first_name', 'last_name', 'auth_type', 'google_id')
        extra_kwargs = {
            'first_name': {'required': False},
            'last_name': {'required': False}
        }

    def validate(self, attrs):
        is_social_account = self.context.get('is_social_account', False)
        password = attrs.get('password')
        password_confirm = attrs.get('password_confirm')
        auth_type = attrs.get('auth_type', 'local')
        
        try:
            if auth_type == 'local' and not is_social_account:
                # Regular registration: require password and confirm
                if not password or not password_confirm:
                    raise serializers.ValidationError({"password": "Password and confirmation are required."})
                if password != password_confirm:
                    raise serializers.ValidationError({"password": "Password fields didn't match."})
                try:
                    validate_password(password)
                except ValidationError as e:
                    raise serializers.ValidationError({"password": list(e.messages)})
            # For SSO, skip password validation
            return attrs
        except Exception as e:
            logger.exception("Validation failed in UserRegistrationSerializer")
            raise

    def create(self, validated_data):
        is_social_account = self.context.get('is_social_account', False)
        auth_type = validated_data.get('auth_type', 'local')
        validated_data.pop('password_confirm', None)
        password = validated_data.get('password')
        google_id = validated_data.pop('google_id', None)
        
        try:
            email = validated_data.get('email')
            if email:
                existing_user = User.objects.filter(email=email).first()
                if existing_user:
                    # User already exists, update any social information if needed
                    if auth_type == 'google' and google_id and not existing_user.google_id:
                        existing_user.google_id = google_id
                        existing_user.auth_type = 'google'
                        existing_user.save(update_fields=['google_id', 'auth_type'])
                        logger.info(f"Updated existing user {existing_user.id} with Google ID {google_id}")
                    return existing_user
                    
            # If social account or password is missing, generate a random password
            if is_social_account or auth_type != 'local' or not password:
                password = User.objects.make_random_password()
                validated_data['password'] = password
                
            # Generate a unique username from email if not provided
            if 'username' not in validated_data:
                base_username = email.split('@')[0] if email else User.objects.make_random_password(8)
                username = base_username
                counter = 1
                while User.objects.filter(username=username).exists():
                    username = f"{base_username}{counter}"
                    counter += 1
                validated_data['username'] = username
                
            # Create and return the user
            user = User.objects.create_user(**validated_data)
            
            # Set google_id if provided
            if google_id:
                user.google_id = google_id
                user.save(update_fields=['google_id'])
                
            return user
        except Exception as e:
            logger.exception("User creation failed in UserRegistrationSerializer")
            raise serializers.ValidationError({"detail": str(e)})

class FeatureSerializer(serializers.ModelSerializer):
    """Serializer for features."""
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    applicable_place_types_list = serializers.SerializerMethodField()
    places_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Feature
        fields = [
            'id', 'name', 'type', 'type_display', 'description', 'icon',
            'applicable_place_types', 'applicable_place_types_list', 'places_count'
        ]
        
    def get_applicable_place_types_list(self, obj):
        """Return the applicable place types as a list"""
        if not obj.applicable_place_types:
            return []
        return [pt.strip() for pt in obj.applicable_place_types.split(',')]
        
    def get_places_count(self, obj):
        """Return the number of places with this feature"""
        return obj.get_places_count()
        
    def validate_name(self, value):
        """Validate that the name is not empty and properly formatted"""
        if not value.strip():
            raise serializers.ValidationError("Feature name cannot be empty")
        return value.strip().title()  # Convert to title case
        
    def validate_applicable_place_types(self, value):
        """Validate the applicable place types"""
        if not value:
            return value  # Empty is allowed (applicable to all)
            
        place_types = [pt.strip() for pt in value.split(',')]
        valid_types = [choice[0] for choice in PLACE_TYPE_CHOICES]
        
        for pt in place_types:
            if pt not in valid_types:
                raise serializers.ValidationError(
                    f"Invalid place type: {pt}. Valid types are: {', '.join(valid_types)}"
                )
        
        return ','.join(place_types)  # Normalize the string

class PlaceSerializer(serializers.ModelSerializer):
    """Serializer for places."""
    owner = UserSerializer(read_only=True)
    features = FeatureSerializer(many=True, read_only=True)
    feature_ids = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Feature.objects.all(),
        write_only=True,
        required=False,
        source='features'
    )
    total_reviews = serializers.SerializerMethodField()
    average_rating = serializers.SerializerMethodField()
    is_owner = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Place
        fields = [
            'id', 'name', 'description', 'type', 'price_range',
            'address', 'district', 'slug', 'website', 'phone',
            'latitude', 'longitude', 'owner', 'features',
            'feature_ids', 'average_rating', 'total_reviews',
            'created_at', 'updated_at', 'moderation_status',
            'is_owner', 'status_display'
        ]
        read_only_fields = [
            'owner', 'average_rating', 'total_reviews',
            'created_at', 'updated_at', 'moderation_status', 'slug',
            'is_owner', 'status_display'
        ]

    def get_total_reviews(self, obj):
        """Get the total number of approved reviews"""
        return obj.get_review_count()

    def get_average_rating(self, obj):
        """Get the average rating across all reviews"""
        return obj.average_rating
        
    def get_is_owner(self, obj):
        """Determine if the current user is the owner of this place"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.user == request.user
        return False
        
    def get_status_display(self, obj):
        """Get a user-friendly status display"""
        status_map = {
            'PENDING': 'Pending Approval',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected'
        }
        return status_map.get(obj.moderation_status, obj.moderation_status)

    def validate_feature_ids(self, value):
        """
        Validate that all features are applicable to the place type.
        """
        place_type = self.initial_data.get('type')
        if not place_type:
            place_type = self.instance.type if self.instance else None
            
        if place_type:
            invalid_features = [
                feature for feature in value
                if not feature.is_applicable_to_place_type(place_type)
            ]
            if invalid_features:
                feature_names = [f"{f.name} ({f.get_type_display()})" for f in invalid_features]
                raise serializers.ValidationError(
                    f"The following features are not applicable to {place_type}: {', '.join(feature_names)}"
                )
        return value

    def create(self, validated_data):
        feature_ids = validated_data.pop('feature_ids', [])
        place = Place.objects.create(**validated_data)
        place.features.set(feature_ids)
        return place

    def update(self, instance, validated_data):
        feature_ids = validated_data.pop('feature_ids', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if feature_ids is not None:
            instance.features.set(feature_ids)
        return instance 

class ReviewSerializer(serializers.ModelSerializer):
    """Serializer for reviews."""
    user = UserSerializer(read_only=True)
    place = PlaceSerializer(read_only=True)
    is_owner = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Review
        fields = [
            'id', 'user', 'place', 'comment',
            'food_rating', 'service_rating', 'value_rating', 'cleanliness_rating',
            'overall_rating', 'created_at', 'updated_at', 'moderation_status',
            'helpful_count', 'is_owner', 'status_display'
        ]
        read_only_fields = [
            'user', 'place', 'overall_rating', 'created_at', 'updated_at',
            'moderation_status', 'helpful_count', 'is_owner', 'status_display'
        ]
    
    def get_is_owner(self, obj):
        """Determine if the current user is the owner of this review"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.user == request.user
        return False
        
    def get_status_display(self, obj):
        """Get a user-friendly status display"""
        status_map = {
            'PENDING': 'Pending Approval',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected'
        }
        return status_map.get(obj.moderation_status, obj.moderation_status)

    def validate(self, data):
        """
        Validate the review data:
        - Ensure ratings are between 1 and 5
        - Check for existing review by the same user for the place
        - Validate required ratings based on place type
        """
        # Get the place from the view's kwargs
        place = None
        if self.context['view'] and hasattr(self.context['view'], 'kwargs'):
            place_id = self.context['view'].kwargs.get('place_pk')
            if place_id:
                place = Place.objects.filter(id=place_id).first()
        
        if not place:
            raise serializers.ValidationError("Place not found")
            
        # Check for existing review by the same user
        user = self.context['request'].user
        if self.instance is None:  # Only check on create
            existing_review = Review.objects.filter(
                user=user,
                place=place
            ).exists()
            if existing_review:
                raise serializers.ValidationError(
                    "You have already reviewed this place"
                )
        
        # Validate rating values
        rating_fields = ['food_rating', 'service_rating', 'value_rating', 'cleanliness_rating']
        for field in rating_fields:
            if field in data:
                rating = data[field]
                if rating is not None and not (1 <= rating <= 5):
                    raise serializers.ValidationError(
                        f"{field} must be between 1 and 5"
                    )
        
        # Validate required ratings based on place type
        if place.type in ['restaurant', 'cafe', 'bar']:
            required_fields = ['food_rating', 'service_rating', 'value_rating']
            for field in required_fields:
                if field not in data or data[field] is None:
                    raise serializers.ValidationError(
                        f"{field} is required for {place.type} reviews"
                    )
        
        return data

    def create(self, validated_data):
        """Create a new review and update place ratings"""
        review = super().create(validated_data)
        review.update_place_ratings()
        return review

    def update(self, instance, validated_data):
        """Update an existing review and recalculate place ratings"""
        review = super().update(instance, validated_data)
        review.update_place_ratings()
        return review

class PhotoSerializer(serializers.ModelSerializer):
    """Serializer for photos."""
    user = UserSerializer(read_only=True)
    place = PlaceSerializer(read_only=True)
    is_owner = serializers.SerializerMethodField()
    status_display = serializers.SerializerMethodField()
    
    class Meta:
        model = Photo
        fields = [
            'id', 'user', 'place', 'image', 'thumbnail',
            'caption', 'order', 'is_primary',
            'created_at', 'updated_at', 'moderation_status',
            'is_owner', 'status_display'
        ]
        read_only_fields = [
            'user', 'place', 'thumbnail', 'created_at', 
            'updated_at', 'moderation_status', 'is_owner',
            'status_display'
        ]
    
    def get_is_owner(self, obj):
        """Determine if the current user is the uploader of this photo"""
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            return obj.user == request.user
        return False
        
    def get_status_display(self, obj):
        """Get a user-friendly status display"""
        status_map = {
            'PENDING': 'Pending Approval',
            'APPROVED': 'Approved',
            'REJECTED': 'Rejected'
        }
        return status_map.get(obj.moderation_status, obj.moderation_status)

    def validate_order(self, value):
        """Validate the order field"""
        if value < 0:
            raise serializers.ValidationError("Order must be a non-negative number")
        return value

    def validate(self, data):
        """
        Additional validation:
        - Ensure image is provided on creation
        - Validate file size and dimensions (handled by model validator)
        """
        if not self.instance and not data.get('image'):
            raise serializers.ValidationError({
                'image': 'An image file is required'
            })
        return data

class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for notifications."""
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title',
            'message', 'is_read', 'related_object_type',
            'related_object_id', 'created_at'
        ]
        read_only_fields = [
            'user', 'notification_type', 'title',
            'message', 'related_object_type',
            'related_object_id', 'created_at'
        ]

class ModerationStatusSerializer(serializers.Serializer):
    """Serializer for handling moderation status updates."""
    status = serializers.ChoiceField(choices=['pending', 'approved', 'rejected'])
    comment = serializers.CharField(required=False, allow_blank=True)
    
    def validate(self, data):
        """Validate moderation status transitions."""
        if data.get('status') == 'rejected' and not data.get('comment'):
            raise serializers.ValidationError({
                'comment': 'A comment is required when rejecting content.'
            })
        return data 

class SavedPlaceSerializer(serializers.ModelSerializer):
    """Serializer for saved/bookmarked places."""
    place_details = PlaceSerializer(source='place', read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = SavedPlace
        fields = [
            'id', 'user', 'place', 'place_details', 'notes',
            'created_at', 'updated_at', 'user_email'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']
        extra_kwargs = {
            'place': {'required': False}  # Make place optional for update operations
        }
        
    def validate(self, data):
        """Validate that the user can save this place."""
        # Skip validation if this is an update operation (PATCH/PUT)
        request = self.context.get('request')
        if request and request.method in ['PATCH', 'PUT']:
            return data
            
        # Check if place is provided for create operations
        place = data.get('place')
        user = self.context['request'].user
        
        if not place:
            raise serializers.ValidationError({'place': 'Place is required'})
            
        if place.moderation_status != 'approved' and place.user != user:
            raise serializers.ValidationError(
                {'place': 'You can only save approved places or places you own'}
            )
            
        return data
        
    def create(self, validated_data):
        """Create a new saved place, handling the unique constraint."""
        user = self.context['request'].user
        place = validated_data.get('place')
        notes = validated_data.get('notes', '')
        
        # Check if already saved
        existing = SavedPlace.objects.filter(user=user, place=place).first()
        if existing:
            # Update notes if provided
            if notes:
                existing.notes = notes
                existing.save(update_fields=['notes', 'updated_at'])
            return existing
            
        # Create new saved place
        saved_place = SavedPlace.objects.create(
            user=user,
            place=place,
            notes=notes
        )
        return saved_place 

class BadgeSerializer(serializers.ModelSerializer):
    """Serializer for badges."""
    level_display = serializers.CharField(source='get_level_display', read_only=True)
    type_display = serializers.CharField(source='get_type_display', read_only=True)
    
    class Meta:
        model = Badge
        fields = [
            'id', 'name', 'description', 'type', 'type_display',
            'level', 'level_display', 'icon', 'points',
            'requirement_description', 'requirement_code',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']

class UserBadgeSerializer(serializers.ModelSerializer):
    """Serializer for user badges."""
    badge_details = BadgeSerializer(source='badge', read_only=True)
    
    class Meta:
        model = UserBadge
        fields = [
            'id', 'user', 'badge', 'badge_details',
            'awarded_at', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'awarded_at', 'created_at', 'updated_at']

class UserPointsSerializer(serializers.ModelSerializer):
    """Serializer for user points."""
    source_type_display = serializers.CharField(source='get_source_type_display', read_only=True)
    
    class Meta:
        model = UserPoints
        fields = [
            'id', 'user', 'points', 'source_type', 'source_type_display',
            'source_id', 'description', 'created_at', 'updated_at'
        ]
        read_only_fields = ['user', 'created_at', 'updated_at']

class UserLevelSerializer(serializers.ModelSerializer):
    """Serializer for user levels."""
    title = serializers.SerializerMethodField()
    total_points = serializers.SerializerMethodField()
    next_level_threshold = serializers.SerializerMethodField()
    progress_percentage = serializers.SerializerMethodField()
    
    class Meta:
        model = UserLevel
        fields = [
            'id', 'user', 'level', 'title', 'total_points',
            'next_level_threshold', 'progress_percentage', 'updated_at'
        ]
        read_only_fields = ['user', 'level', 'updated_at']
    
    def get_title(self, obj):
        return obj.get_level_title()
    
    def get_total_points(self, obj):
        return UserPoints.get_total_points(obj.user)
    
    def get_next_level_threshold(self, obj):
        return obj.get_next_level_threshold()
    
    def get_progress_percentage(self, obj):
        return obj.get_progress_to_next_level()

class UserProfileSerializer(serializers.ModelSerializer):
    """Serializer for user profile with badges and points."""
    badges = serializers.SerializerMethodField()
    level = serializers.SerializerMethodField()
    total_points = serializers.SerializerMethodField()
    badge_count = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'email', 'first_name', 'last_name', 
            'auth_type', 'badges', 'level', 'total_points',
            'badge_count'
        ]
        read_only_fields = ['email', 'auth_type']
    
    def get_badges(self, obj):
        # Get top 5 badges by level (highest first)
        user_badges = UserBadge.objects.filter(user=obj).select_related('badge').order_by('-badge__level')[:5]
        return UserBadgeSerializer(user_badges, many=True).data
    
    def get_level(self, obj):
        try:
            user_level = UserLevel.objects.get(user=obj)
            return UserLevelSerializer(user_level).data
        except UserLevel.DoesNotExist:
            return None
    
    def get_total_points(self, obj):
        return UserPoints.get_total_points(obj)
        
    def get_badge_count(self, obj):
        return UserBadge.objects.filter(user=obj).count() 