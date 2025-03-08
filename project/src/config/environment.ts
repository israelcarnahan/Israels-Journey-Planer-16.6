import { Loader } from '@googlemaps/js-api-loader';

// Environment variables
export const MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

// Browser detection
export const browser = {
  name: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
  os: typeof navigator !== 'undefined' ? navigator.platform : 'unknown'
};

// Feature detection
export const hasLocalStorage = (() => {
  try {
    localStorage.setItem('test', 'test');
    localStorage.removeItem('test');
    return true;
  } catch (e) {
    return false;
  }
})();

export const hasGeolocation = 'geolocation' in navigator;

export const hasTouchScreen = (() => {
  try {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  } catch (e) {
    return false;
  }
})();

// Initialize Google Maps loader
export const mapsLoader = new Loader({
  apiKey: MAPS_API_KEY,
  version: "weekly",
  libraries: ["places"]
});

// Check if Maps service is available
export const checkMapsService = async (service: 'places' | 'geocoding'): Promise<boolean> => {
  try {
    await mapsLoader.load();
    return true;
  } catch (error) {
    console.error(`Error loading Google Maps ${service} service:`, error);
    return false;
  }
};

// Validate environment configuration
export const validateEnvironment = (): boolean => {
  if (!MAPS_API_KEY) {
    console.warn('Google Maps API key is not configured');
    return false;
  }
  return true;
};

// Generate realistic mock data for pubs
export const getMockPlaceData = (pubName: string) => {
  // Use pub name as seed for consistent random data
  let seed = pubName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const rand = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  const rating = 3.5 + rand() * 1.5;
  const totalRatings = Math.floor(50 + rand() * 200);
  const phoneNumber = '020 ' + Math.floor(1000 + rand() * 9000) + ' ' + Math.floor(1000 + rand() * 9000);

  // Generate realistic opening hours
  const openingHours = [
    'Monday: 11:00 AM - 11:00 PM',
    'Tuesday: 11:00 AM - 11:00 PM',
    'Wednesday: 11:00 AM - 11:00 PM',
    'Thursday: 11:00 AM - 11:00 PM',
    'Friday: 11:00 AM - 12:00 AM',
    'Saturday: 11:00 AM - 12:00 AM',
    'Sunday: 12:00 PM - 10:30 PM'
  ];

  // Generate email and website based on pub name
  const normalizedName = pubName.toLowerCase().replace(/[^a-z0-9]/g, '');
  const email = `info@${normalizedName}.co.uk`;
  const website = `https://www.${normalizedName}.co.uk`;

  return {
    rating,
    totalRatings,
    phoneNumber,
    email,
    openingHours,
    website
  };
};