import React from 'react';
import { Clock } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import clsx from 'clsx';

interface OpeningHoursIndicatorProps {
  isOpen: boolean;
  hours?: string;
  error?: string;
  openTime?: string;
  closeTime?: string;
}

const OpeningHoursIndicator: React.FC<OpeningHoursIndicatorProps> = ({ 
  isOpen, 
  hours, 
  error,
  openTime,
  closeTime
}) => {
  const getStatusText = () => {
    if (error) return 'Unknown';
    if (!isOpen) return `Opens too late (${openTime})`;
    return `Opens ${openTime}`;
  };

  const getTooltipContent = () => {
    if (error) return error;
    if (!isOpen && openTime) return `Opens at ${openTime}, which is too late for scheduling visits.\nFull schedule:\n${hours}`;
    return hours || 'Opening hours not available';
  };

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className={clsx(
            'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs',
            {
              'bg-yellow-900/20 text-yellow-200 border border-yellow-700/50': error,
              'bg-green-900/20 text-green-200 border border-green-700/50': isOpen && !error,
              'bg-red-900/20 text-red-200 border border-red-700/50': !isOpen && !error
            }
          )}>
            <Clock className="h-3 w-3" />
            <span>{getStatusText()}</span>
          </div>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-dark-800 text-eggplant-100 px-3 py-2 rounded-lg text-sm shadow-lg max-w-xs whitespace-pre-line"
            sideOffset={5}
          >
            {getTooltipContent()}
            <Tooltip.Arrow className="fill-dark-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
};

export default OpeningHoursIndicator;