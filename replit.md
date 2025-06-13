# Charterly - Fishing Charter Booking Platform

## Overview

Charterly is a full-stack web application for booking fishing charters in the Florida Keys. The platform connects anglers with verified captains, providing a streamlined booking experience without traditional marketplace fees. Built as a modern React/Node.js application with PostgreSQL database and Replit authentication.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom ocean-themed color palette
- **State Management**: TanStack Query for server state management
- **Forms**: React Hook Form with Zod validation
- **Build Tool**: Vite with hot module replacement

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL
- **Authentication**: Replit Auth with OpenID Connect
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: tsx for TypeScript execution in development

### Database Design
- **Primary Database**: PostgreSQL (Neon serverless)
- **Schema Management**: Drizzle Kit for migrations
- **Key Tables**:
  - `users` - Replit Auth user profiles
  - `sessions` - Session storage for authentication
  - `captains` - Captain profiles with verification status
  - `charters` - Charter listings with details and pricing
  - `bookings` - Trip bookings with status tracking
  - `messages` - Direct messaging between users
  - `reviews` - Charter reviews and ratings

## Key Components

### Authentication System
- **Provider**: Replit Auth with OpenID Connect
- **Session Storage**: PostgreSQL-backed express sessions
- **Authorization**: Route-level protection with middleware
- **User Management**: Automatic user creation and profile updates

### Charter Management
- **Search & Filtering**: Location, species, duration-based filtering
- **Charter Details**: Comprehensive trip information with captain profiles
- **Booking System**: Date selection, guest count, and message integration
- **Image Handling**: Charter photo galleries with fallback images

### Messaging System
- **Direct Communication**: Captain-angler messaging threads
- **Booking Integration**: Charter-specific conversations
- **Real-time UI**: Optimistic updates with query invalidation

### UI/UX Design
- **Design System**: Consistent component library with ocean theme
- **Responsive Design**: Mobile-first approach with desktop optimization
- **Accessibility**: ARIA-compliant components from Radix UI
- **Visual Design**: Professional maritime aesthetic with custom branding

## Data Flow

### User Journey
1. **Discovery**: Search charters by location, species, or duration
2. **Selection**: View detailed charter information and captain profiles
3. **Booking**: Select dates, guest count, and submit booking request
4. **Communication**: Message captains directly through platform
5. **Management**: Track bookings and view trip history

### API Architecture
- **RESTful Endpoints**: Conventional HTTP methods and status codes
- **Request/Response**: JSON API with consistent error handling
- **Authentication**: Session-based auth with CSRF protection
- **Data Validation**: Zod schemas for request/response validation

### State Management
- **Server State**: TanStack Query for caching and synchronization
- **Client State**: React hooks for component-level state
- **Form State**: React Hook Form for complex form management
- **Route State**: URL-based state for search filters and navigation

## External Dependencies

### Core Framework Dependencies
- **React Ecosystem**: React, React DOM, React Router (Wouter)
- **Build Tools**: Vite, TypeScript, ESBuild for production builds
- **UI Components**: Radix UI primitives, Lucide React icons
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer

### Backend Dependencies
- **Server Framework**: Express.js with TypeScript support
- **Database**: Drizzle ORM, @neondatabase/serverless, node-postgres
- **Authentication**: Passport.js, OpenID Client, Express Session
- **Utilities**: date-fns, memoizee, nanoid

### Development Tools
- **Development Server**: Vite dev server with HMR
- **Type Checking**: TypeScript compiler with strict mode
- **Database Management**: Drizzle Kit for schema management
- **Replit Integration**: Custom Vite plugins for Replit environment

## Deployment Strategy

### Development Environment
- **Platform**: Replit with Node.js 20 runtime
- **Database**: Automatically provisioned PostgreSQL 16
- **Port Configuration**: Internal port 5000, external port 80
- **Hot Reloading**: Vite HMR for frontend, tsx for backend

### Production Build
- **Frontend Build**: Vite production build with asset optimization
- **Backend Build**: ESBuild bundling for Node.js deployment
- **Static Assets**: Served from dist/public directory
- **Environment**: Production NODE_ENV with optimized configurations

### Scaling Considerations
- **Database**: Neon serverless PostgreSQL with connection pooling
- **Session Storage**: PostgreSQL-backed sessions for horizontal scaling
- **Static Assets**: CDN-ready asset structure
- **Performance**: Query optimization and caching strategies

## Changelog

```
Changelog:
- June 13, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```