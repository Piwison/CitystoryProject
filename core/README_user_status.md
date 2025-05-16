# User Status Management

This document outlines the User Status Management functionality implemented in the CityStory backend.

## Key Functionality

1. **Admin Status Change Endpoint**
   - Endpoint: `/api/admin/users/<user_id>/status/`
   - Method: PATCH
   - Authentication: Admin only
   - Purpose: Allows administrators to change a user's status (active/suspended)
   - Parameters:
     - `is_active`: Boolean value to activate (true) or suspend (false) a user

2. **Self-Deactivation Endpoint**
   - Endpoint: `/api/users/self/deactivate/`
   - Method: POST
   - Authentication: Any authenticated user
   - Purpose: Allows users to deactivate their own accounts
   - No request body required

3. **Status-Aware Authentication**
   - The authentication process now checks user status before issuing tokens
   - Suspended or deleted users (is_active=False) cannot log in
   - Custom error messages inform users about their account status

4. **Middleware Protection**
   - UserStatusMiddleware checks user status on protected routes
   - Suspended users are blocked from accessing protected resources
   - Token validation is enhanced to reject tokens for suspended users

## Implementation Details

### User Model

User status is managed using Django's built-in `is_active` field:
- `is_active=True`: User has normal access
- `is_active=False`: User is suspended/deactivated and cannot access protected resources

### Authentication Flow

1. When a user attempts to log in, the `CustomTokenObtainPairView` checks if the user is active
2. If the user is not active, a 403 Forbidden response is returned with a message
3. If the user is active, tokens are issued and the `last_login` timestamp is updated

### Protected Routes

1. The `UserStatusMiddleware` checks the user's status on each protected request
2. Public routes are excluded from the middleware check
3. If a suspended user attempts to access a protected route with a valid token, they receive a 403 Forbidden response

### Status Change Auditing

All status changes are logged with:
- Timestamp of the change
- The user or admin who made the change
- The status change details

## API Response Examples

### Admin Status Change (Success)

```json
{
  "id": 123,
  "email": "user@example.com",
  "username": "username",
  "is_active": false,
  "status": "SUSPENDED"
}
```

### Authentication Error (Suspended User)

```json
{
  "detail": "Your account is inactive or suspended. Please contact support."
}
```

### Protected Route Access Denied

```json
{
  "detail": "Your account is suspended or inactive. Please contact support."
}
```

### Self-Deactivation Success

```json
{
  "detail": "Your account has been successfully deactivated."
}
```

## Testing Notes

To properly test this functionality:

1. Create test users with different statuses (active, suspended)
2. Test authentication with each user type
3. Test middleware protection by attempting to access protected routes with suspended users
4. Test the admin status change endpoint with both admin and non-admin users
5. Test self-deactivation functionality and verify the user status is changed
6. Test token invalidation when user status changes

## Security Considerations

- User status changes should be logged for audit purposes
- Consider implementing a gradual token invalidation approach for production
- Rate limit status change requests to prevent abuse
- Consider adding a "reason" field for status changes for better record-keeping 