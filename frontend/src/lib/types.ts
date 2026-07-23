// Shared types for the AI Travel Planner

export interface TripInput {
  destination: string;
  startingLocation: string;
  budget: 'Budget' | 'Standard' | 'Luxury';
  travelType: 'Solo' | 'Couple' | 'Family' | 'Friends';
  transportation: 'Flight' | 'Train' | 'Car';
  accommodation: 'Hotel' | 'Hostel' | 'Resort' | 'Airbnb';
  interests: string[];
  specialRequests: string;
}

export interface SavedTrip {
  id: string;
  destination: string;
  starting_location: string | null;
  budget: string | null;
  travel_type: string | null;
  transportation: string | null;
  accommodation: string | null;
  interests: string | null;
  special_requests: string | null;
  itinerary: string;
  created_at: string;
}

export interface WeatherData {
  city: string;
  country?: string;
  temperature: number;
  feelsLike: number;
  condition: string;
  description: string;
  icon: string;
  humidity: number;
  windSpeed: number;
  bestTime: string;
}

export interface HealthStatus {
  status: string;
  ai_configured: boolean;
  ai_provider: string;
  ai_model: string;
  weather_configured: boolean;
  database_configured?: boolean;
  database?: string;
  time: string;
}

export const BUDGET_OPTIONS = ['Budget', 'Standard', 'Luxury'] as const;
export const TRAVEL_TYPE_OPTIONS = ['Solo', 'Couple', 'Family', 'Friends'] as const;
export const TRANSPORT_OPTIONS = ['Flight', 'Train', 'Car'] as const;
export const ACCOMMODATION_OPTIONS = ['Hotel', 'Hostel', 'Resort', 'Airbnb'] as const;
export const INTEREST_OPTIONS = [
  'Adventure',
  'Beaches',
  'Mountains',
  'Food',
  'Shopping',
  'Historical Places',
  'Wildlife',
  'Nightlife',
  'Nature',
  'Photography',
  'Culture',
] as const;
