# Django REST API with PostgreSQL

A robust backend system with PostgreSQL database integration.

## Setup Instructions

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   ```
3. Activate the virtual environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`

4. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

5. Create a `.env` file in the project root and add your environment variables:
   ```
   DEBUG=True
   SECRET_KEY=your_secret_key
   DB_NAME=your_db_name
   DB_USER=your_db_user
   DB_PASSWORD=your_db_password
   DB_HOST=localhost
   DB_PORT=5432
   ```

6. Run migrations:
   ```bash
   python manage.py migrate
   ```

7. Start the development server:
   ```bash
   python manage.py runserver
   ```

## Features

- PostgreSQL database integration
- Django REST Framework for API endpoints
- User authentication system
- Database backup and restore procedures
- Role-based access control
- SSL/TLS for database connections
- Database encryption
- Audit logging
- Connection pooling
- Database monitoring

## Technical Stack

- Python 3.x
- Django
- Django REST Framework
- PostgreSQL 17.4
- Environment variables configuration
- Database migration tools
- Connection pooling
- Backup/restore utilities

## API Documentation

API documentation is available at `/api/docs/` when the server is running.

## Testing

Run tests with:
```bash
python manage.py test
```

## Contributing

1. Create a feature branch
2. Commit your changes
3. Push to the branch
4. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Environment Variable Management (Best Practices)

For a multi-app project (Next.js frontend and Django backend), manage your environment variables as follows:

### 1. Project Root `.env` or `.env.local`
- Use as a master copy or for scripts/tools that run from the root.
- **Not automatically loaded by frontend or backend apps.**
- Example:
  ```env
  # Master copy, not loaded by apps directly
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  DB_NAME=your_db_name
  DB_USER=your_db_user
  # ...etc
  ```

### 2. Frontend (Next.js) `citystory/.env.local`
- **Required for all frontend secrets and config.**
- Only variables needed by the frontend should go here.
- Example:
  ```env
  GOOGLE_CLIENT_ID=your-google-client-id
  GOOGLE_CLIENT_SECRET=your-google-client-secret
  NEXTAUTH_URL=http://localhost:3000
  NEXTAUTH_SECRET=your-nextauth-secret
  # ...other frontend-specific vars
  ```

### 3. Backend (Django) `citystory_backend/.env`
- **Create this file for all backend (Django) secrets and config.**
- Only variables needed by the backend should go here.
- Example:
  ```env
  DEBUG=True
  SECRET_KEY=your_secret_key
  DB_NAME=your_db_name
  DB_USER=your_db_user
  DB_PASSWORD=your_db_password
  DB_HOST=localhost
  DB_PORT=5432
  # ...other backend-specific vars
  ```

### 4. General Tips
- **Do not commit `.env.local` or `.env` files to version control.**
- Document required variables in `env.example` or similar template files.
- If you want to keep a master copy, use the root `.env` and copy/sync to app folders as needed.
- Each app loads only its own `.env`/`.env.local`. 