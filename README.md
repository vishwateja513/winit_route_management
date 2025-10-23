# Route Management System

A comprehensive route management system built with Next.js, TypeScript, and PostgreSQL. This application provides a complete solution for managing delivery routes, drivers, locations, and analytics.

## Features

- **Dashboard**: Overview of key metrics and recent activity
- **Route Management**: Create, view, and manage delivery routes
- **Location Management**: Manage pickup and delivery locations
- **Driver Management**: Track and manage delivery drivers
- **Analytics**: Performance insights and route optimization
- **Responsive Design**: Mobile-friendly sidebar navigation
- **Database Integration**: PostgreSQL backend with TypeScript

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, PostgreSQL
- **UI Components**: Lucide React icons
- **Database**: PostgreSQL with connection pooling

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd route-management-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   DATABASE_URL=postgresql://username:password@localhost:5432/route_management
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-secret-key-here
   ```

4. **Set up PostgreSQL database**
   - Create a PostgreSQL database named `route_management`
   - Update the `DATABASE_URL` in your `.env.local` file with your database credentials

5. **Initialize the database**
   The database tables will be created automatically when you first run the application.

6. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

7. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── routes/        # Route management API
│   │   ├── locations/     # Location management API
│   │   └── drivers/       # Driver management API
│   ├── routes/            # Routes page
│   ├── locations/         # Locations page
│   ├── drivers/           # Drivers page
│   ├── analytics/         # Analytics page
│   ├── settings/         # Settings page
│   ├── layout.tsx         # Root layout with sidebar
│   └── page.tsx           # Dashboard page
├── components/            # React components
│   └── Sidebar.tsx        # Navigation sidebar
└── lib/                   # Utility functions
    └── database.ts        # Database configuration
```

## Database Schema

The application includes the following database tables:

- **routes**: Store route information (name, start/end locations, distance, duration)
- **locations**: Manage pickup and delivery locations
- **drivers**: Store driver information and contact details
- **route_assignments**: Link routes to drivers

## API Endpoints

- `GET /api/routes` - Get all routes
- `POST /api/routes` - Create a new route
- `GET /api/locations` - Get all locations
- `POST /api/locations` - Create a new location
- `GET /api/drivers` - Get all drivers
- `POST /api/drivers` - Create a new driver

## Features Overview

### Dashboard
- Key performance metrics
- Recent route activity
- Quick statistics overview

### Route Management
- View all routes in a table format
- Search and filter functionality
- Route status tracking
- Distance and duration information

### Location Management
- Grid view of all locations
- Pickup and delivery location types
- Status management
- Address information

### Driver Management
- Driver contact information
- Status tracking
- Route assignment tracking

### Analytics
- Performance metrics
- Top performing routes
- Trend analysis (placeholder for charts)

### Settings
- System configuration
- Database connection info
- User preferences
- Security settings

## Development

### Adding New Features

1. Create new API routes in `src/app/api/`
2. Add corresponding pages in `src/app/`
3. Update the sidebar navigation in `src/components/Sidebar.tsx`
4. Add database tables in `src/lib/database.ts`

### Database Operations

The application uses connection pooling for database operations. All database interactions are handled through the `pool` object from `src/lib/database.ts`.

## Deployment

1. Build the application:
   ```bash
   npm run build
   ```

2. Start the production server:
   ```bash
   npm start
   ```

3. Ensure your PostgreSQL database is accessible from your deployment environment.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.