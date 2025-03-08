import React, { useState, useCallback } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { RotateCw, X, AlertCircle, Check, RefreshCw, MapPin, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ScheduleDay, ScheduleVisit, usePubData } from '../context/PubDataContext';
import { planVisits } from '../utils/scheduleUtils';
import validatePostcode from 'uk-postcode-validator';
import clsx from 'clsx';

interface RescheduleDialogProps {
  day: ScheduleDay;
  onReschedule: (newSchedule: ScheduleDay) => void;
}

const RescheduleDialog: React.FC<RescheduleDialogProps> = ({ day, onReschedule }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newSchedule, setNewSchedule] = useState<ScheduleDay | null>(null);
  const [postcode, setPostcode] = useState('');
  const [postcodeError, setPostcodeError] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showExpandSearch, setShowExpandSearch] = useState(false);
  const [expandedSearch, setExpandedSearch] = useState(false);
  const { wishlistPubs, unvisitedPubs, masterfilePubs, kpiPubs } = usePubData();

  const MAX_VISITS_PER_DAY = 8;

  const validatePostcodeInput = (code: string) => {
    if (!code) {
      setPostcodeError('Postcode is required');
      return false;
    }

    // Format postcode to ensure proper validation
    const formattedPostcode = code.toUpperCase().replace(/\s+/g, ' ').trim();
    
    // Try both with and without space
    const isValidWithSpace = validatePostcode(formattedPostcode);
    const isValidWithoutSpace = validatePostcode(formattedPostcode.replace(/\s/g, ''));

    if (!isValidWithSpace && !isValidWithoutSpace) {
      setPostcodeError('Please enter a valid UK postcode');
      return false;
    }

    setPostcodeError('');
    return true;
  };

  const handlePostcodeSubmit = () => {
    if (validatePostcodeInput(postcode)) {
      setShowConfirmation(true);
    }
  };

  const formatPostcode = (input: string): string => {
    // Remove all spaces and convert to uppercase
    const cleaned = input.toUpperCase().replace(/\s+/g, '');
    
    // If the postcode is long enough, add a space in the correct position
    if (cleaned.length > 3) {
      return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
    }
    
    return cleaned;
  };

  const handlePostcodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setPostcode(formatPostcode(newValue));
    setPostcodeError('');
  };

  const handlePostcodeKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent space from triggering button clicks
    if (e.key === ' ') {
      e.stopPropagation();
    }
  };

  const getAdjacentPostcodes = (postcode: string): string[] => {
    const [area, district] = postcode.split(' ')[0].match(/([A-Z]+)(\d+)/)?.slice(1) || [];
    const districtNum = parseInt(district);
    
    return [
      `${area}${districtNum - 1}`,
      `${area}${districtNum + 1}`,
      `${area}${districtNum - 1}`,
      `${area}${districtNum + 1}`
    ];
  };

  const handleReschedule = async () => {
    setIsLoading(true);
    setShowConfirmation(false);
    
    try {
      const allPubs = [
        ...wishlistPubs.map(pub => ({ ...pub, Priority: 'Wishlist' })),
        ...unvisitedPubs.map(pub => ({ ...pub, Priority: 'Unvisited' })),
        ...masterfilePubs.map(pub => ({ ...pub, Priority: 'Masterfile' })),
        ...kpiPubs.map(pub => ({ ...pub, Priority: 'KPI' }))
      ];

      const scheduledPubNames = new Set(day.visits.map(visit => visit.pub));
      const availablePubs = allPubs.filter(pub => !scheduledPubNames.has(pub.pub));

      const formattedPostcode = formatPostcode(postcode);
      const postcodeArea = formattedPostcode.split(' ')[0];
      let searchAreas = [postcodeArea];
      
      if (expandedSearch) {
        searchAreas = [...searchAreas, ...getAdjacentPostcodes(formattedPostcode)];
      }

      const nearbyPubs = availablePubs.filter(pub => {
        const pubPostcodeArea = (pub.zip || '').split(' ')[0].toUpperCase();
        return searchAreas.some(area => pubPostcodeArea.startsWith(area));
      });

      if (nearbyPubs.length === 0) {
        if (!expandedSearch) {
          setShowExpandSearch(true);
          throw new Error('No pubs found. Would you like to expand the search radius?');
        } else {
          throw new Error('No pubs found even with expanded search radius.');
        }
      }

      const sortedPubs = nearbyPubs.sort((a, b) => {
        const priorityOrder = { KPI: 0, Wishlist: 1, Unvisited: 2, Masterfile: 3 };
        return priorityOrder[a.Priority as keyof typeof priorityOrder] - priorityOrder[b.Priority as keyof typeof priorityOrder];
      });

      const limitedPubs = sortedPubs.slice(0, MAX_VISITS_PER_DAY);
      const newDaySchedule = {
        ...planVisits(limitedPubs, parseISO(day.date), 1, formattedPostcode)[0],
        date: day.date
      };
      
      setNewSchedule(newDaySchedule);
    } catch (error) {
      console.error('Error regenerating schedule:', error);
      setPostcodeError(error instanceof Error ? error.message : 'Failed to generate schedule');
      if (!error.message.includes('expand the search radius')) {
        setShowConfirmation(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExpandSearch = useCallback((expand: boolean) => {
    setExpandedSearch(expand);
    setShowExpandSearch(false);
    if (expand) {
      handleReschedule();
    }
  }, [expandedSearch]);

  const handleConfirm = () => {
    if (newSchedule) {
      onReschedule(newSchedule);
      handleDialogClose();
    }
  };

  const handleDialogClose = () => {
    setIsOpen(false);
    setPostcode('');
    setPostcodeError('');
    setShowConfirmation(false);
    setNewSchedule(null);
    setShowExpandSearch(false);
    setExpandedSearch(false);
  };

  const isPastDate = new Date(day.date) < new Date();

  const getRandomSideQuestText = () => {
    const texts = [
      "Embark on a new side quest",
      "Time for a plot twist",
      "Unlocking new territory",
      "Rolling for initiative",
      "Changing the game plan",
      "Rewriting the journey",
      "Quest update incoming",
      "New adventure awaits",
      "Remixing the route",
      "Shuffling the deck"
    ];
    return texts[Math.floor(Math.random() * texts.length)];
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={setIsOpen}>
      <Dialog.Trigger asChild>
        <button
          className={clsx(
            'p-2 rounded-full transition-all duration-300',
            isPastDate
              ? 'opacity-50 cursor-not-allowed bg-eggplant-800/50'
              : 'hover:bg-eggplant-700/50 text-neon-blue hover:text-neon-purple'
          )}
          disabled={isPastDate}
          title={isPastDate ? "Cannot reschedule past dates" : "Reschedule this day"}
          role="button"
          aria-label={isPastDate ? "Cannot reschedule past dates" : "Reschedule this day"}
        >
          <RotateCw className="h-5 w-5" />
        </button>
      </Dialog.Trigger>

      <Dialog.Portal>
        <Dialog.Overlay 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
          onClick={handleDialogClose}
        />
        <Dialog.Content 
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl max-h-[85vh] overflow-y-auto animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 rounded-lg p-6"
          onPointerDownOutside={handleDialogClose}
          onEscapeKeyDown={handleDialogClose}
        >
          <div className="flex justify-between items-center mb-6">
            <Dialog.Title className="text-xl font-bold text-eggplant-100">
              {getRandomSideQuestText()}: {format(parseISO(day.date), 'MMMM d, yyyy')}
            </Dialog.Title>
            <Dialog.Close 
              className="text-eggplant-300 hover:text-eggplant-100 transition-colors p-2"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {showExpandSearch && (
            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-eggplant-800/50">
                <Search className="h-5 w-5 text-neon-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-eggplant-100 font-medium">Expand Search Area?</p>
                  <p className="text-sm text-eggplant-200 mt-1">
                    No pubs found in {postcode}. Would you like to expand the search to nearby areas?
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleExpandSearch(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors"
                >
                  Keep Current Area
                </button>
                <button
                  onClick={() => handleExpandSearch(true)}
                  className="flex-1 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-neon-purple transform hover:scale-105"
                >
                  Expand Search
                </button>
              </div>
            </div>
          )}

          {!showExpandSearch && !showConfirmation && !newSchedule && !isLoading && (
            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-eggplant-800/50 mb-4">
                <MapPin className="h-5 w-5 text-neon-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-eggplant-100 font-medium">Enter Target Area</p>
                  <p className="text-sm text-eggplant-200 mt-1">
                    Please enter a UK postcode to find available pubs in that area.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="postcode" className="block text-sm font-medium text-eggplant-100 mb-1">
                    Postcode
                  </label>
                  <input
                    type="text"
                    id="postcode"
                    value={postcode}
                    onChange={handlePostcodeChange}
                    onKeyDown={handlePostcodeKeyDown}
                    className="w-full px-4 py-2 rounded-lg border border-eggplant-700 bg-dark-900/50 text-eggplant-100 focus:border-neon-blue focus:ring-1 focus:ring-neon-blue"
                    placeholder="e.g., SW1A 1AA"
                  />
                  {postcodeError && (
                    <p className="mt-1 text-sm text-red-400">{postcodeError}</p>
                  )}
                </div>

                <button
                  onClick={handlePostcodeSubmit}
                  className="w-full bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-neon-purple transform hover:scale-105"
                >
                  Find Available Pubs
                </button>
              </div>
            </div>
          )}

          {!showExpandSearch && showConfirmation && !newSchedule && !isLoading && (
            <div className="mb-6">
              <div className="flex items-start gap-3 p-4 rounded-lg bg-eggplant-800/50">
                <AlertCircle className="h-5 w-5 text-neon-blue flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-eggplant-100 font-medium">Confirm Rescheduling</p>
                  <p className="text-sm text-eggplant-200 mt-1">
                    This will generate a new schedule for this day using pubs near {postcode}.
                    The existing schedule will be replaced.
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={handleReschedule}
                  className="flex-1 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 hover:shadow-neon-purple transform hover:scale-105"
                >
                  <RefreshCw className="h-5 w-5 inline mr-2" />
                  Generate New Schedule
                </button>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <RefreshCw className="h-8 w-8 text-neon-blue animate-spin" />
              <p className="mt-4 text-eggplant-100">Generating new schedule...</p>
            </div>
          )}

          {newSchedule && (
            <>
              <div className="space-y-4 mb-6">
                <h3 className="font-medium text-eggplant-100">New Schedule Preview</h3>
                <div className="bg-dark-900/50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-eggplant-800/30">
                    <thead>
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Pub</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Priority</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-eggplant-100 uppercase tracking-wider">Distance</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-eggplant-800/30">
                      {newSchedule.visits.map((visit: ScheduleVisit, index: number) => (
                        <tr key={index} className="hover:bg-eggplant-800/20">
                          <td className="px-4 py-2 text-eggplant-100">{visit.pub}</td>
                          <td className="px-4 py-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              visit.Priority === 'KPI' ? 'bg-red-900/50 text-red-200 border border-red-700/50' :
                              visit.Priority === 'Wishlist' ? 'bg-blue-900/50 text-blue-200 border border-blue-700/50' :
                              visit.Priority === 'Unvisited' ? 'bg-green-900/50 text-green-200 border border-green-700/50' :
                              'bg-gray-900/50 text-gray-200 border border-gray-700/50'
                            }`}>
                              {visit.Priority}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-eggplant-100">
                            {visit.mileageToNext ? `${visit.mileageToNext.toFixed(1)} mi` : 'End'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="flex justify-end gap-3">
                <Dialog.Close className="px-4 py-2 rounded-lg text-eggplant-100 hover:bg-eggplant-800/50 transition-colors">
                  Cancel
                </Dialog.Close>
                <button
                  onClick={handleConfirm}
                  className="flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-neon-purple to-neon-blue text-white font-medium hover:shadow-neon-purple transition-all duration-300"
                >
                  <Check className="h-5 w-5 mr-2" />
                  Confirm Changes
                </button>
              </div>
            </>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default RescheduleDialog;