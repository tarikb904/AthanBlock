# Overview

Imaanify is an Islamic daily planner web application designed to help Muslims organize their worship and strengthen their faith. The application provides prayer time tracking, daily planning with time blocks, adhkar (remembrance of Allah) management, and personal Islamic settings. It features a modern React frontend with a Node.js/Express backend, using PostgreSQL for data storage and Drizzle ORM for database operations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **Routing**: Wouter for client-side routing
- **State Management**: TanStack Query (React Query) for server state management
- **UI Library**: Radix UI primitives with custom Tailwind CSS styling following shadcn/ui design system
- **Styling**: Tailwind CSS with CSS custom properties for theming (light/dark mode support)
- **Form Handling**: React Hook Form with Zod validation schemas
- **Date Handling**: date-fns library for date manipulation

## Backend Architecture
- **Framework**: Express.js with TypeScript running on Node.js
- **API Design**: RESTful API structure with organized route handlers
- **Database ORM**: Drizzle ORM for type-safe database operations
- **Development Server**: Custom Vite integration for development mode with hot module replacement
- **Error Handling**: Centralized error handling middleware with structured error responses
- **Request Logging**: Custom middleware for API request logging and performance monitoring

## Database Schema Design
- **Users Table**: Stores user authentication, preferences (prayer method, madhab, timezone, language, theme)
- **Prayers Table**: Daily prayer tracking with completion status
- **Adhkar Table**: Islamic remembrance texts in Arabic and English with categorization
- **Time Blocks Table**: Daily planning blocks with start/end times, descriptions, and completion tracking
- **User Adhkar Table**: Personal adhkar progress tracking
- **Reminders Table**: Notification reminders for prayers and adhkar
- **Templates Table**: Reusable time block templates for quick daily planning

## Authentication & Session Management
- Simple email/password authentication system
- Session-based user state management
- Profile management with Islamic preferences (prayer calculation methods, madhab selection)
- Demo user simulation for development/testing

## Islamic Features Integration
- Prayer time calculations with multiple calculation methods (ISNA, MWL, Egyptian, Makkah)
- Islamic calendar date conversion and display
- Categorized adhkar library (morning, evening, before prayer, before sleep, general)
- Prayer method preferences (Hanafi/Shafi madhab support)
- Arabic text display with transliteration support

## UI/UX Design Patterns
- Responsive design with mobile-first approach
- Progressive Web App (PWA) support with service worker and offline capabilities
- Dark/light theme system with CSS custom properties
- Accessible components using Radix UI primitives
- Toast notifications for user feedback
- Loading states and error boundaries for better user experience

# External Dependencies

## Core Framework Dependencies
- **React Ecosystem**: React 18+ with TypeScript, React DOM, React Hook Form
- **Build Tools**: Vite with React plugin, ESBuild for production builds
- **Routing**: Wouter for lightweight client-side routing

## UI & Styling Dependencies
- **UI Components**: Radix UI primitives for accessible component foundations
- **Styling**: Tailwind CSS with PostCSS, class-variance-authority for component variants
- **Icons**: Lucide React icons, Font Awesome icons via CDN
- **Fonts**: Google Fonts (Inter, Source Serif Pro, IBM Plex Mono)

## State Management & Data Fetching
- **Server State**: TanStack React Query for API calls and caching
- **Form Management**: React Hook Form with Hookform Resolvers
- **Validation**: Zod for runtime type checking and validation
- **Date Utilities**: date-fns for date manipulation and formatting

## Database & Backend Dependencies
- **Database**: PostgreSQL with Neon serverless database provider
- **ORM**: Drizzle ORM with Drizzle Kit for migrations
- **Validation**: Drizzle-Zod for schema validation integration
- **Server Framework**: Express.js with TypeScript support

## Development & Build Tools
- **TypeScript**: Full TypeScript support across client and server
- **Development**: TSX for TypeScript execution, custom Vite development server
- **Linting & Formatting**: TypeScript compiler for type checking
- **PWA**: Service worker for offline functionality and caching strategies

## Islamic Calculation Libraries
- Custom prayer time calculation implementation (simplified for demo)
- Islamic calendar conversion utilities
- Arabic text and transliteration display support

## Session & Security
- Connect PG Simple for PostgreSQL session storage
- Express session management
- Basic authentication with password handling

## Deployment & Production
- **Database**: Neon PostgreSQL serverless database
- **Build**: Vite production build with ESBuild bundling
- **Environment**: Node.js runtime with environment variable configuration