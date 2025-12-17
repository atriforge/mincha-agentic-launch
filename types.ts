export interface ItineraryActivity {
  time: string; // e.g., "09:00 AM", or "Morning"
  name: string; // e.g., "Visit Swayambhunath Stupa"
  description: string; // Brief details about the activity
  location: string; // e.g., "Kathmandu Valley"
  cost?: string; // e.g., "Included", "$5 entry fee", "Optional"
  notes?: string; // e.g., "Wear comfortable shoes", "Bring water"
  bookingLink?: string; // Dynamic link for reservations
}

export interface Accommodation {
  type: string[]; // Array of accommodation types (e.g. ['Teahouse', 'Camping'])
  details?: string; // e.g. "Private bathroom", "Shared facilities"
}

export interface Transport {
  type: string;
  duration?: string;
  features: string[];
}

export interface ItineraryDay {
  dayNumber: number;
  title: string;
  description: string;
  activities: ItineraryActivity[];
  accommodation?: Accommodation;
  transport?: Transport;
  mealsIncluded?: string; // e.g., "B, L, D" or "Breakfast only"
  distanceKm?: number;
  elevationGainM?: number;
  travelTimeHours?: number;
}

export interface ServiceCategory {
  category: 'Transport' | 'Accommodation' | 'Meals' | 'Guide' | 'Permits' | 'Other';
  items: string[];
}

export interface Trek {
  id: string;
  name: string;
  culture: string;
  region: string;
  difficulty: 'Easy' | 'Moderate' | 'Challenging' | 'Hard';
  priceUSD: number;
  priceINR: number;
  includedServices: ServiceCategory[]; // Categorized services
  highlightDescription: string;
  itineraryDays: ItineraryDay[];
  durationDays?: number;
  bestSeason?: string[];
  groupSizeMin?: number;
  groupSizeMax?: number;
  gearList?: string[];
}

export interface Vendor {
  id: string;
  name: string;
  type: 'Transport' | 'Lodging' | 'Guide Agency' | 'Permit Office' | 'Other';
  contactPerson: string;
  phone: string;
  email: string;
  location: string;
  isVerified: boolean;
}

export interface VendorService {
  id: string;
  vendorId: string; // Linked to Vendor
  category: 'Transport' | 'Accommodation' | 'Guide' | 'Permits' | 'Other';
  name: string; // e.g. "Private Jeep (KTM-Pokhara)"
  priceUSD: number;
  priceINR: number;
  unit: string; // e.g. "per trip", "per day", "per night"
  availability: 'Instant' | 'On Request' | 'Limited';
  lastUpdated: string;
}

export interface TrekSuggestion {
  id: string;
  name: string;
  culture: string;
  difficulty: string;
  priceDisplay: string;
  whatsappLink: string;
  pdfUrl: string;
  gpxUrl: string;
  description?: string;
}

export interface MinchaResponse {
  response: string;
  suggestedTrek?: TrekSuggestion;
  vendorUpdateAction?: string; // Signal UI to open vendor dashboard
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestion?: TrekSuggestion;
  isError?: boolean;
}