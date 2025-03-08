import { mapsLoader, getMockPlaceData } from '../config/environment';

export const checkPubOpeningHours = async (pubName: string, postcode: string): Promise<{
  isOpen: boolean;
  hours?: string;
  error?: string;
  openTime?: string;
  closeTime?: string;
}> => {
  try {
    // Generate mock data since Places API is not available
    const mockData = getMockPlaceData(pubName);
    return {
      isOpen: true,
      hours: mockData.openingHours.join('\n'),
      openTime: '09:00',
      closeTime: '23:00'
    };
  } catch (error) {
    console.error('Error checking pub opening hours:', error);
    return {
      isOpen: false,
      error: 'Failed to fetch opening hours',
      openTime: '09:00',
      closeTime: '23:00'
    };
  }
};