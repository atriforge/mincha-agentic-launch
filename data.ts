import { Trek, Vendor, VendorService } from './types';

export const getWhatsAppLink = (trekName: string) => {
  const phone = "977984123456";
  const text = encodeURIComponent(`Namaste Mincha! I am interested in booking the ${trekName}.`);
  return `https://wa.me/${phone}?text=${text}`;
};

export const VENDORS: Vendor[] = [
  { id: 'v_sherpa', name: 'Sherpa Wheels Pvt', type: 'Transport', contactPerson: 'Pasang Sherpa', phone: '9801234567', email: 'pasang@sherpawheels.com', location: 'Kathmandu', isVerified: true },
  { id: 'v_green', name: 'Greenline Transport', type: 'Transport', contactPerson: 'Rajesh Kumar', phone: '9841122334', email: 'info@greenline.com.np', location: 'Kathmandu/Pokhara', isVerified: true },
  { id: 'v_guide_assoc', name: 'Nepal Guide Association', type: 'Guide Agency', contactPerson: 'Maya Tamang', phone: '9851098765', email: 'maya@nepalguides.org', location: 'Kathmandu', isVerified: true },
  { id: 'v_lodges', name: 'Mountain Lodges Network', type: 'Lodging', contactPerson: 'Kancha Gurung', phone: '9812345670', email: 'kancha@mountainlodges.com', location: 'Solukhumbu', isVerified: false },
  { id: 'v_gov', name: 'DNPWC / TAAN', type: 'Permit Office', contactPerson: 'Official', phone: '01-4220850', email: 'info@taan.org.np', location: 'Exhibition Road', isVerified: true }
];

export const VENDOR_SERVICES: VendorService[] = [
  { id: 's1', vendorId: 'v_sherpa', category: 'Transport', name: 'Private Jeep (KTM-Phaplu)', priceUSD: 250, priceINR: 21000, unit: 'per trip', availability: 'Instant', lastUpdated: '2024-03-15' },
  { id: 's2', vendorId: 'v_green', category: 'Transport', name: 'Tourist Bus (KTM-Pokhara)', priceUSD: 25, priceINR: 2100, unit: 'per seat', availability: 'Instant', lastUpdated: '2024-03-10' },
  { id: 's3', vendorId: 'v_guide_assoc', category: 'Guide', name: 'English Speaking Guide', priceUSD: 35, priceINR: 3000, unit: 'per day', availability: 'On Request', lastUpdated: '2024-03-20' },
  { id: 's4', vendorId: 'v_lodges', category: 'Accommodation', name: 'Standard Teahouse Room', priceUSD: 10, priceINR: 800, unit: 'per night', availability: 'Limited', lastUpdated: '2024-02-01' },
  { id: 's5', vendorId: 'v_gov', category: 'Permits', name: 'TIMS Card', priceUSD: 20, priceINR: 1000, unit: 'per person', availability: 'Instant', lastUpdated: '2024-01-01' }
];

export const ITINERARIES: Trek[] = [
  {
    id: "sunuwar-panchthar",
    name: "Panchthar Cultural Trek",
    culture: "Sunuwar",
    region: "Panchthar District",
    difficulty: "Easy",
    priceUSD: 95,
    priceINR: 7980,
    highlightDescription: "Explore the heart of Sunuwar culture in Panchthar, experiencing traditional homestays and the famous Sakela festival celebrations.",
    includedServices: [
      { category: "Transport", items: ["Shared Jeep (Birtamod-Panchthar)", "Local Transfers"] },
      { category: "Accommodation", items: ["3 Nights Community Homestay"] },
      { category: "Guide", items: ["Cultural Guide"] },
      { category: "Meals", items: ["Traditional Sunuwar Cuisine"] },
      { category: "Other", items: ["Sakela Dance Performance"] }
    ],
    itineraryDays: [
      {
        dayNumber: 1,
        title: "Day 1: Journey to Panchthar",
        description: "Drive through the tea gardens of Ilam to reach the heart of Panchthar. Welcome by the local Sunuwar community.",
        accommodation: { type: ["Homestay"], details: "Traditional Mud House" },
        transport: { type: ["Private Jeep"], duration: "6 hours", features: ["Scenic"] },
        mealsIncluded: "D",
        activities: [
          { time: "10:00 AM", name: "Drive from Birtamod", description: "Scenic drive ascending through tea estates.", location: "Birtamod to Panchthar", cost: "Included" },
          { time: "05:00 PM", name: "Community Welcome", description: "Traditional welcome ceremony with Tika and garlands.", location: "Panchthar Village", cost: "Included" }
        ]
      },
      {
        dayNumber: 2,
        title: "Day 2: Sakela & Sunuwar Culture",
        description: "Immerse yourself in the Sakela festival traditions (seasonal) and explore the unique lifestyle of the Sunuwar people.",
        accommodation: { type: ["Homestay"], details: "Village Stay" },
        mealsIncluded: "B, L, D",
        activities: [
          { time: "08:00 AM", name: "Sakela Dance", description: "Participate in or watch the rhythmic Sakela dance honoring nature.", location: "Village Ground", cost: "Included" },
          { time: "02:00 PM", name: "Culinary Workshop", description: "Learn to cook traditional dishes using local ingredients.", location: "Homestay Kitchen", cost: "Included" }
        ]
      },
      {
        dayNumber: 3,
        title: "Day 3: Tea Gardens & Departure",
        description: "Morning walk through lush tea gardens before bidding farewell to your hosts.",
        accommodation: undefined,
        transport: { type: ["Private Jeep"], duration: "6 hours", features: ["Return"] },
        mealsIncluded: "B",
        activities: [
          { time: "07:00 AM", name: "Tea Garden Walk", description: "Refreshing morning walk in the nearby organic tea gardens.", location: "Panchthar", cost: "Included" },
          { time: "11:00 AM", name: "Return Drive", description: "Drive back to Birtamod/Bhadrapur Airport.", location: "Panchthar to Birtamod", cost: "Included" }
        ]
      }
    ]
  }
];
