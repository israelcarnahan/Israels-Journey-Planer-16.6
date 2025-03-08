import React, { useState, useEffect } from 'react';
import { Clock, CalendarClock, Phone, Mail, Star, X } from 'lucide-react';
import * as Popover from '@radix-ui/react-popover';
import * as Switch from '@radix-ui/react-switch';
import { format, parse } from 'date-fns';
import { ScheduleVisit } from '../context/PubDataContext';
import { mapsLoader, checkMapsService, getMockPlaceData } from '../config/environment';
import clsx from 'clsx';

interface VisitSchedulerProps {
  visit: ScheduleVisit;
  date: string;
  onSchedule: (visitId: string, time: string, notes: string) => void;
}

interface PlaceDetails {
  phoneNumber?: string;
  email?: string;
  openingHours?: string[];
  website?: string;
  rating?: number;
  totalRatings?: number;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="h-3 w-3 fill-neon-purple text-neon-purple" />
      ))}
      {hasHalfStar && (
        <div className="relative h-3 w-3">
          <Star className="absolute inset-0 h-3 w-3 fill-neon-purple text-neon-purple clip-path-half" />
          <Star className="absolute inset-0 h-3 w-3 text-eggplant-500" />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="h-3 w-3 text-eggplant-500" />
      ))}
    </div>
  );
};

const VisitScheduler: React.FC<VisitSchedulerProps> = ({ visit, date, onSchedule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [placeDetails, setPlaceDetails] = useState<PlaceDetails | null>(null);
  const [selectedTime, setSelectedTime] = useState(visit.scheduledTime || '');
  const [notes, setNotes] = useState(visit.visitNotes || '');
  const [isBooked, setIsBooked] = useState(visit.isBooked || false);

  useEffect(() => {
    if (isOpen && !placeDetails) {
      fetchPlaceDetails();
    }
  }, [isOpen]);

  const fetchPlaceDetails = async () => {
    try {
      const apiAvailable = await checkMapsService('places');
      if (!apiAvailable) {
        const mockData = getMockPlaceData(visit.pub);
        setPlaceDetails(mockData);
        setIsLoading(false);
        return;
      }

      await mapsLoader.load();
      const service = new google.maps.places.PlacesService(document.createElement('div'));
      
      const request = {
        query: `${visit.pub} ${visit.zip}`,
        fields: ['name', 'formatted_phone_number', 'opening_hours', 'website', 'rating', 'user_ratings_total']
      };

      service.findPlaceFromQuery(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
          const place = results[0];
          
          service.getDetails({
            placeId: place.place_id!,
            fields: [
              'formatted_phone_number',
              'opening_hours',
              'website',
              'rating',
              'user_ratings_total',
              'email'
            ]
          }, (placeDetails, detailStatus) => {
            if (detailStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
              setPlaceDetails({
                phoneNumber: placeDetails.formatted_phone_number,
                email: placeDetails.email,
                openingHours: placeDetails.opening_hours?.weekday_text,
                website: placeDetails.website,
                rating: placeDetails.rating,
                totalRatings: placeDetails.user_ratings_total
              });
            } else {
              setPlaceDetails(getMockPlaceData(visit.pub));
            }
            setIsLoading(false);
          });
        } else {
          setPlaceDetails(getMockPlaceData(visit.pub));
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error fetching place details:', error);
      setPlaceDetails(getMockPlaceData(visit.pub));
      setIsLoading(false);
    }
  };

  const handleSchedule = () => {
    if (selectedTime) {
      onSchedule(visit.pub, selectedTime, notes);
      setIsOpen(false);
    }
  };

  const timeSlots = Array.from({ length: 16 }, (_, i) => {
    const hour = Math.floor(i / 2) + 9;
    const minute = (i % 2) * 30;
    return format(new Date().setHours(hour, minute), 'HH:mm');
  });

  return (
    <Popover.Root open={isOpen} onOpenChange={setIsOpen}>
      <Popover.Trigger asChild>
        <button 
          className={clsx(
            "p-1 rounded-lg transition-colors text-xs",
            visit.scheduledTime 
              ? "bg-green-900/20 text-green-200 border border-green-700/50"
              : "bg-eggplant-800/50 text-eggplant-200 border border-eggplant-700/50 hover:border-neon-purple"
          )}
        >
          {visit.scheduledTime ? (
            <div className="flex items-center gap-1">
              <CalendarClock className="h-3 w-3" />
              <span>{visit.scheduledTime}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Schedule</span>
            </div>
          )}
        </button>
      </Popover.Trigger>

      <Popover.Portal>
        <Popover.Content 
          className="w-80 bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-lg border border-eggplant-800/30 p-4"
          sideOffset={5}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-eggplant-100">{visit.pub}</h3>
            <Popover.Close className="text-eggplant-400 hover:text-eggplant-100">
              <X className="h-4 w-4" />
            </Popover.Close>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              <div className="h-4 bg-eggplant-800/50 rounded animate-pulse" />
              <div className="h-4 bg-eggplant-800/50 rounded animate-pulse w-3/4" />
            </div>
          ) : (
            <>
              {placeDetails?.rating && (
                <div className="mb-3">
                  <StarRating rating={placeDetails.rating} />
                  <span className="text-xs text-eggplant-300 ml-1">
                    ({placeDetails.totalRatings} reviews)
                  </span>
                </div>
              )}

              <div className="space-y-2 mb-4">
                {placeDetails?.phoneNumber && (
                  <a 
                    href={`tel:${placeDetails.phoneNumber}`}
                    className="flex items-center gap-2 text-sm text-eggplant-200 hover:text-neon-blue transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    {placeDetails.phoneNumber}
                  </a>
                )}
                {placeDetails?.email && (
                  <a 
                    href={`mailto:${placeDetails.email}`}
                    className="flex items-center gap-2 text-sm text-eggplant-200 hover:text-neon-pink transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    {placeDetails.email}
                  </a>
                )}
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-eggplant-100 mb-2">
                  Visit Time
                </label>
                <div className="grid grid-cols-4 gap-1">
                  {timeSlots.map(time => (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={clsx(
                        "px-2 py-1 text-xs rounded-lg transition-colors",
                        selectedTime === time
                          ? "bg-gradient-to-r from-neon-purple to-neon-blue text-white"
                          : "bg-eggplant-800/50 text-eggplant-200 hover:bg-eggplant-700/50"
                      )}
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-eggplant-100 mb-2">
                  Visit Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-dark-900/50 border border-eggplant-700 rounded-lg text-eggplant-100 text-sm focus:border-neon-purple focus:ring-1 focus:ring-neon-purple"
                  rows={3}
                  placeholder="Add any notes about the visit..."
                />
              </div>

              <div className="flex items-center justify-between mb-4">
                <label className="text-sm text-eggplant-100">
                  Appointment Booked?
                </label>
                <Switch.Root
                  checked={isBooked}
                  onCheckedChange={setIsBooked}
                  className={clsx(
                    "w-10 h-6 rounded-full transition-colors",
                    isBooked ? "bg-neon-purple" : "bg-eggplant-800"
                  )}
                >
                  <Switch.Thumb 
                    className={clsx(
                      "block w-4 h-4 bg-white rounded-full transition-transform",
                      "transform translate-x-1",
                      isBooked && "translate-x-5"
                    )}
                  />
                </Switch.Root>
              </div>

              <button
                onClick={handleSchedule}
                disabled={!selectedTime}
                className={clsx(
                  "w-full py-2 px-4 rounded-lg font-medium transition-all",
                  selectedTime
                    ? "bg-gradient-to-r from-neon-purple to-neon-blue text-white hover:shadow-neon-purple"
                    : "bg-eggplant-800/50 text-eggplant-400 cursor-not-allowed"
                )}
              >
                {selectedTime ? "Schedule Visit" : "Select a time"}
              </button>
            </>
          )}
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
};

export default VisitScheduler;