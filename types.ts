export interface ItineraryActivity {
  time: string;
  name: string;
  description: string;
  location: string;
  cost?: string;
}

export interface Accommodation {
  type: string[];
  details?: string;
}

export interface Transport {
  type: string[];
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
  mealsIncluded?: string;
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
  includedServices: ServiceCategory[];
  highlightDescription: string;
  itineraryDays: ItineraryDay[];
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
  vendorId: string;
  category: 'Transport' | 'Accommodation' | 'Guide' | 'Permits' | 'Other';
  name: string;
  priceUSD: number;
  priceINR: number;
  unit: string;
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
}

export interface MinchaResponse {
  response: string;
  suggestedTrek?: TrekSuggestion;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  suggestion?: TrekSuggestion;
  isError?: boolean;
}
