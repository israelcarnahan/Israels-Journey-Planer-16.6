import React from 'react';
import { Clock, Calendar, Users, ListChecks, Plus, Phone, Mail, Star } from 'lucide-react';
import { Pub } from '../context/PubDataContext';
import { checkPubOpeningHours } from '../utils/openingHours';
import { findNearestPubs } from '../utils/scheduleUtils';
import { format, parseISO, isValid } from 'date-fns';
import clsx from 'clsx';
import * as Tooltip from '@radix-ui/react-tooltip';
import { mapsLoader } from '../config/environment';

interface UnscheduledPubsProps {
  pubs: Pub[];
  selectedPub: Pub | null;
  onScheduleAnyway: (pub: Pub) => void;
}

const StarRating: React.FC<{ rating: number }> = ({ rating }) => {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - Math.ceil(rating);

  return (
    <div className="flex items-center gap-1">
      {[...Array(fullStars)].map((_, i) => (
        <Star 
          key={`full-${i}`} 
          className="h-3 w-3 fill-neon-purple text-neon-purple" 
        />
      ))}
      {hasHalfStar && (
        <div className="relative h-3 w-3">
          <Star className="absolute inset-0 h-3 w-3 fill-neon-purple text-neon-purple clip-path-half" />
          <Star className="absolute inset-0 h-3 w-3 text-eggplant-500" />
        </div>
      )}
      {[...Array(emptyStars)].map((_, i) => (
        <Star 
          key={`empty-${i}`} 
          className="h-3 w-3 text-eggplant-500" 
        />
      ))}
    </div>
  );
};

const UnscheduledPubsPanel: React.FC<UnscheduledPubsProps> = ({ 
  pubs, 
  selectedPub,
  onScheduleAnyway 
}) => {
  const [placeDetails, setPlaceDetails] = React.useState<Record<string, {
    rating?: number;
    totalRatings?: number;
    phoneNumber?: string;
    email?: string;
  }>>({});

  React.useEffect(() => {
    const fetchPlaceDetails = async (pub: Pub) => {
      try {
        await mapsLoader.load();
        const service = new google.maps.places.PlacesService(document.createElement('div'));
        
        const request = {
          query: `${pub.pub} ${pub.zip}`,
          fields: ['name', 'formatted_phone_number', 'rating', 'user_ratings_total']
        };

        service.findPlaceFromQuery(request, (results, status) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
            const place = results[0];
            
            service.getDetails({
              placeId: place.place_id!,
              fields: ['formatted_phone_number', 'rating', 'user_ratings_total', 'email']
            }, (placeDetails, detailStatus) => {
              if (detailStatus === google.maps.places.PlacesServiceStatus.OK && placeDetails) {
                setPlaceDetails(prev => ({
                  ...prev,
                  [pub.pub]: {
                    rating: placeDetails.rating,
                    totalRatings: placeDetails.user_ratings_total,
                    phoneNumber: placeDetails.formatted_phone_number,
                    email: placeDetails.email
                  }
                }));
              }
            });
          }
        });
      } catch (error) {
        console.error('Error fetching place details:', error);
      }
    };

    if (selectedPub) {
      const nearbyPubs = findNearestPubs(selectedPub, pubs, 16);
      nearbyPubs.forEach(pub => {
        if (!placeDetails[pub.pub]) {
          fetchPlaceDetails(pub);
        }
      });
    }
  }, [selectedPub, pubs]);

  if (!selectedPub) return null;

  const nearbyPubs = findNearestPubs(selectedPub, pubs, 16);
  if (nearbyPubs.length === 0) return null;

  const formatDate = (dateStr: string | Date | null | undefined): string => {
    if (!dateStr) return 'Never';
    
    try {
      if (dateStr instanceof Date) {
        return format(dateStr, 'MMM d, yyyy');
      }

      if (!isNaN(Number(dateStr))) {
        const excelDate = new Date((Number(dateStr) - 25569) * 86400 * 1000);
        if (isValid(excelDate)) {
          return format(excelDate, 'MMM d, yyyy');
        }
      }

      const isoDate = parseISO(dateStr);
      if (isValid(isoDate)) {
        return format(isoDate, 'MMM d, yyyy');
      }

      return 'Never';
    } catch (error) {
      console.warn('Date parsing error:', error);
      return 'Never';
    }
  };

  const getPriorityStyles = (priority: string): string => {
    switch (priority) {
      case 'RepslyWin':
        return 'bg-purple-900/20 text-purple-200 border border-purple-700/50';
      case 'Wishlist':
        return 'bg-blue-900/20 text-blue-200 border border-blue-700/50';
      case 'KPI':
        return 'bg-red-900/20 text-red-200 border border-red-700/50';
      case 'Unvisited':
        return 'bg-green-900/20 text-green-200 border border-green-700/50';
      default:
        return 'bg-gray-900/20 text-gray-200 border border-gray-700/50';
    }
  };

  return (
    <div className="bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg border border-eggplant-800/30 w-64">
      <div className="flex items-center gap-2 p-2 border-b border-eggplant-800/30">
        <Clock className="h-4 w-4 text-neon-purple" />
        <h3 className="text-sm font-medium text-eggplant-100">
          Nearby Pubs
        </h3>
      </div>

      <div className="h-[352px] overflow-y-auto scrollbar-thin scrollbar-thumb-eggplant-700 scrollbar-track-dark-900">
        {nearbyPubs.map((pub, index) => {
          const hours = checkPubOpeningHours(pub.pub, new Date().toISOString());
          const details = placeDetails[pub.pub];
          
          return (
            <div 
              key={`${pub.pub}-${pub.zip}-${index}`}
              className="p-2 border-b border-eggplant-800/10 hover:bg-eggplant-800/20 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1">
                    <h4 className="font-medium text-sm text-eggplant-100 truncate flex-1">
                      {pub.pub}
                    </h4>
                    <Tooltip.Provider>
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button
                            onClick={() => onScheduleAnyway(pub)}
                            className={clsx(
                              "p-1 rounded-full transition-colors",
                              "text-eggplant-300 hover:text-neon-blue",
                              "hover:bg-eggplant-800/50"
                            )}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content
                            className="bg-dark-800 text-eggplant-100 px-2 py-1 rounded text-xs shadow-lg"
                            sideOffset={5}
                          >
                            Add to schedule
                            <Tooltip.Arrow className="fill-dark-800" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  </div>
                  <p className="text-xs text-eggplant-300 mb-1">{pub.zip}</p>
                  {details?.rating && (
                    <div className="mb-1">
                      <StarRating rating={details.rating} />
                      <span className="text-xs text-eggplant-300 ml-1">
                        ({details.totalRatings})
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-1 mb-1">
                    <span className={clsx(
                      'text-xs px-1.5 py-0.5 rounded-full',
                      getPriorityStyles(pub.Priority || '')
                    )}>
                      {pub.Priority || 'Unassigned'}
                    </span>
                    {pub.sources && (
                      <span className="text-xs px-1.5 py-0.5 rounded-full bg-eggplant-800/50 text-eggplant-200 border border-eggplant-700/50">
                        {pub.sources}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-1 text-xs">
                <div className="flex items-center gap-1.5 text-eggplant-200">
                  <Clock className="h-3 w-3 text-neon-blue" />
                  <span>Opens {hours.openTime}</span>
                </div>

                <div className="flex items-center gap-1.5 text-eggplant-200">
                  <Calendar className="h-3 w-3 text-neon-pink" />
                  <span>Last: {formatDate(pub.last_visited)}</span>
                </div>

                {details?.phoneNumber && (
                  <div className="flex items-center gap-1.5 text-eggplant-200">
                    <Phone className="h-3 w-3 text-neon-blue" />
                    <a 
                      href={`tel:${details.phoneNumber}`}
                      className="hover:text-neon-blue transition-colors"
                    >
                      {details.phoneNumber}
                    </a>
                  </div>
                )}

                {details?.email && (
                  <div className="flex items-center gap-1.5 text-eggplant-200">
                    <Mail className="h-3 w-3 text-neon-pink" />
                    <a 
                      href={`mailto:${details.email}`}
                      className="hover:text-neon-pink transition-colors truncate"
                    >
                      {details.email}
                    </a>
                  </div>
                )}

                {pub.rtm && (
                  <div className="flex items-center gap-1.5 text-eggplant-200">
                    <Users className="h-3 w-3 text-neon-purple" />
                    <span>{pub.rtm}</span>
                  </div>
                )}

                {pub.sources && (
                  <div className="flex items-center gap-1.5 text-eggplant-200">
                    <ListChecks className="h-3 w-3 text-neon-blue" />
                    <span>From: {pub.sources}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default UnscheduledPubsPanel;