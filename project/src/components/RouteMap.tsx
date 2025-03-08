import React from 'react';
import { ScheduleDay } from '../context/PubDataContext';
import { AlertTriangle } from 'lucide-react';
import { getRtmColor } from '../utils/rtmColors';

interface RouteMapProps {
  day: ScheduleDay;
  homeAddress: string;
  className?: string;
}

const RouteMap: React.FC<RouteMapProps> = ({ day, homeAddress, className = '' }) => {
  return (
    <div className={`${className} bg-dark-900/50 rounded-lg p-6`}>
      <div className="flex flex-col items-center justify-center gap-4 text-center h-full">
        <AlertTriangle className="h-8 w-8 text-yellow-400" />
        <div>
          <h3 className="text-lg font-medium text-eggplant-100 mb-2">Map Preview Unavailable</h3>
          <p className="text-sm text-eggplant-200">
            The map preview is currently unavailable. Your schedule and route planning will continue to work normally.
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-2 w-full max-w-md">
          {day.visits.map((visit, index) => (
            <div 
              key={visit.pub}
              className="bg-dark-800/50 rounded-lg p-3 border border-eggplant-800/30"
            >
              <div className="flex items-center gap-2 mb-1">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: getRtmColor(visit.rtm) }}
                />
                <span className="text-sm font-medium text-eggplant-100 truncate">
                  Stop {index + 1}
                </span>
              </div>
              <p className="text-xs text-eggplant-200 truncate">{visit.pub}</p>
              <p className="text-xs text-eggplant-300">{visit.zip}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RouteMap;