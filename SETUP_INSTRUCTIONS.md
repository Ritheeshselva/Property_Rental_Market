# Property Rental Project Setup Instructions

## Backend Setup

1. **Create Environment File**
   Create a file named `.env` in the `backend/` folder with:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/property_rental
   JWT_SECRET=supersecretchangeme123
   CLIENT_URL=http://localhost:3000
   UPLOAD_DIR=uploads
   ADMIN_EMAIL=admin@example.com
   ADMIN_PASSWORD=admin123
   ADMIN_NAME=Admin
   ```

2. **Install Dependencies & Start Backend**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Server will run at http://localhost:5000

## Frontend Setup

1. **Install Dependencies & Start Frontend**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   App will run at http://localhost:3000

## MongoDB Setup

- Install MongoDB locally, or
- Use MongoDB Atlas (cloud) and update `MONGO_URI` in `.env`

## Features Added

### User Authentication
- **Signup**: New users can create accounts with name, email, and password
- **Login**: Users and admins can login with email/password
- **Toggle**: Single page switches between login and signup modes

### Property Registration
- **5 Images**: Users can upload up to 5 property images
- **Image Preview**: Shows thumbnails of selected images
- **Remove Images**: Users can remove individual images before submission
- **Validation**: Ensures at least one image is selected
- **Form Fields**: All required property details (title, address, price, etc.)

### Admin Features
- **Auto-admin**: Default admin account created from environment variables
- **Property Approval**: Admins can approve/reject pending properties
- **Dashboard**: Admin-only access to review pending properties

## Usage

1. **Create Account**: Use the signup form to create a new user account
2. **Login**: Login with your credentials
3. **Register Property**: Fill out property form and upload up to 5 images
4. **Admin Login**: Use admin@example.com / admin123 to access admin features
5. **Approve Properties**: Admins can approve properties to make them visible on the home page

## API Endpoints

- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/login` - User/admin login
- `POST /api/properties` - Submit new property (with images)
- `GET /api/properties` - List approved properties
- `GET /api/admin/pending` - List pending properties (admin only)
- `POST /api/admin/:id/approve` - Approve property (admin only)
- `POST /api/admin/:id/reject` - Reject property (admin only)
