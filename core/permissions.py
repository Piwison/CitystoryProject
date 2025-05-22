from rest_framework import permissions

class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow owners of an object to edit it.
    """
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request,
        # so we'll always allow GET, HEAD or OPTIONS requests.
        if request.method in permissions.SAFE_METHODS:
            return True

        # Write permissions are only allowed to the creator of the object.
        return obj.created_by == request.user

class IsModeratorOrReadOnly(permissions.BasePermission):
    """
    Custom permission to only allow moderators to modify objects.
    Read-only access is allowed to any user.
    """
    def has_permission(self, request, view):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to moderators
        return request.user and request.user.is_staff
        
    def has_object_permission(self, request, view, obj):
        # Read permissions are allowed to any request
        if request.method in permissions.SAFE_METHODS:
            return True
            
        # Write permissions are only allowed to moderators
        return request.user and request.user.is_staff 

class IsModeratorPermission(permissions.BasePermission):
    """Permission class to only allow moderators to access the view."""
    
    def has_permission(self, request, view):
        """Check if user is authenticated and is a moderator."""
        if not request.user.is_authenticated:
            return False
        return request.user.is_staff and request.user.groups.filter(name='moderators').exists() 