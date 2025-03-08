import React from 'react';
import { BarChart2, TrendingUp, Clock, Target, Users, Calendar } from 'lucide-react';
import { usePubData } from '../context/PubDataContext';
import { format, parseISO, differenceInDays, differenceInBusinessDays } from 'date-fns';
import clsx from 'clsx';
import TerritoryMap from './TerritoryMap';

const RepStatsPanel: React.FC = () => {
  const { 
    schedule,
    wishlistPubs,
    unvisitedPubs,
    masterfilePubs,
    kpiPubs,
    kpiDeadline,
    homeAddress
  } = usePubData();

  const calculateStats = () => {
    const totalPubs = wishlistPubs.length + unvisitedPubs.length + masterfilePubs.length + kpiPubs.length;
    const scheduledPubs = schedule.reduce((acc, day) => acc + day.visits.length, 0);
    const completionRate = totalPubs > 0 ? (scheduledPubs / totalPubs) * 100 : 0;

    const priorityBreakdown = {
      KPI: {
        total: kpiPubs.length,
        scheduled: schedule.reduce((acc, day) => 
          acc + day.visits.filter(v => v.Priority === 'KPI').length, 0
        )
      },
      Wishlist: {
        total: wishlistPubs.length,
        scheduled: schedule.reduce((acc, day) => 
          acc + day.visits.filter(v => v.Priority === 'Wishlist').length, 0
        )
      },
      Unvisited: {
        total: unvisitedPubs.length,
        scheduled: schedule.reduce((acc, day) => 
          acc + day.visits.filter(v => v.Priority === 'Unvisited').length, 0
        )
      }
    };

    const totalMileage = schedule.reduce((acc, day) => acc + (day.totalMileage || 0), 0);
    const totalDriveTime = schedule.reduce((acc, day) => acc + (day.totalDriveTime || 0), 0);

    const daysUntilKpiDeadline = kpiDeadline 
      ? differenceInBusinessDays(parseISO(kpiDeadline), new Date())
      : null;

    return {
      totalPubs,
      scheduledPubs,
      completionRate,
      priorityBreakdown,
      totalMileage,
      totalDriveTime,
      daysUntilKpiDeadline
    };
  };

  const stats = calculateStats();

  return (
    <div className="space-y-6">
      <div className="relative">
        <div 
          className="absolute inset-0 -z-10"
          style={{
            background: `
              linear-gradient(90deg, rgba(157, 0, 255, 0.1), rgba(157, 0, 255, 0.05)),
              url("data:image/svg+xml,%3Csvg width='50' height='960' viewBox='0 0 50 960' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0,480 C10,470 15,490 25,480 C35,470 40,490 50,480 C50,480 50,960 50,960 L0,960 Z' fill='%239d00ff' opacity='0.1'/%3E%3C/svg%3E")
            `,
            backgroundSize: '50px 100%',
            backgroundRepeat: 'repeat-x',
            animation: 'wave 15s linear infinite',
            filter: 'blur(0.5px)'
          }}
        />

        <div className="bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-4 border border-eggplant-800/30">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="h-5 w-5 text-neon-purple" />
            <h3 className="text-lg font-semibold text-eggplant-100">
              Territory Stats
            </h3>
          </div>

          <div className="space-y-6">
            {/* Overall Progress */}
            <div>
              <h4 className="text-sm font-medium text-eggplant-100 mb-2 flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-neon-blue" />
                Overall Progress
              </h4>
              <div className="bg-dark-800/50 rounded-lg p-3">
                <div className="flex justify-between text-sm text-eggplant-200 mb-2">
                  <span>Completion</span>
                  <span>{stats.completionRate.toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-neon-purple to-neon-blue rounded-full transition-all duration-500"
                    style={{ width: `${stats.completionRate}%` }}
                  />
                </div>
                <p className="text-xs text-eggplant-300 mt-2">
                  {stats.scheduledPubs} of {stats.totalPubs} pubs scheduled
                </p>
              </div>
            </div>

            {/* Priority Breakdown */}
            <div>
              <h4 className="text-sm font-medium text-eggplant-100 mb-2 flex items-center gap-2">
                <Target className="h-4 w-4 text-neon-pink" />
                Priority Breakdown
              </h4>
              <div className="space-y-2">
                {Object.entries(stats.priorityBreakdown).map(([priority, data]) => (
                  <div key={priority} className="bg-dark-800/50 rounded-lg p-3">
                    <div className="flex justify-between text-sm text-eggplant-200 mb-2">
                      <span>{priority}</span>
                      <span>{((data.scheduled / data.total) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-2 bg-dark-700 rounded-full overflow-hidden">
                      <div 
                        className={clsx(
                          "h-full rounded-full transition-all duration-500",
                          {
                            'bg-gradient-to-r from-red-500 to-red-700': priority === 'KPI',
                            'bg-gradient-to-r from-blue-500 to-blue-700': priority === 'Wishlist',
                            'bg-gradient-to-r from-green-500 to-green-700': priority === 'Unvisited'
                          }
                        )}
                        style={{ width: `${(data.scheduled / data.total) * 100}%` }}
                      />
                    </div>
                    <p className="text-xs text-eggplant-300 mt-2">
                      {data.scheduled} of {data.total} scheduled
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Travel Stats */}
            <div>
              <h4 className="text-sm font-medium text-eggplant-100 mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4 text-neon-blue" />
                Travel Stats
              </h4>
              <div className="bg-dark-800/50 rounded-lg p-3 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-eggplant-200">Total Distance</span>
                  <span className="text-eggplant-100">{stats.totalMileage.toFixed(1)} miles</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-eggplant-200">Total Drive Time</span>
                  <span className="text-eggplant-100">{stats.totalDriveTime} mins</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-eggplant-200">Avg. Per Day</span>
                  <span className="text-eggplant-100">
                    {schedule.length > 0 
                      ? `${(stats.totalMileage / schedule.length).toFixed(1)} mi`
                      : 'N/A'}
                  </span>
                </div>
              </div>
            </div>

            {/* KPI Deadline */}
            {stats.daysUntilKpiDeadline !== null && (
              <div>
                <h4 className="text-sm font-medium text-eggplant-100 mb-2 flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-neon-pink" />
                  KPI Deadline
                </h4>
                <div className="bg-dark-800/50 rounded-lg p-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-eggplant-200">Days Remaining</span>
                    <span className={clsx(
                      'font-medium',
                      stats.daysUntilKpiDeadline <= 5 ? 'text-red-400' :
                      stats.daysUntilKpiDeadline <= 10 ? 'text-yellow-400' :
                      'text-green-400'
                    )}>
                      {stats.daysUntilKpiDeadline} business days
                    </span>
                  </div>
                  <div className="text-xs text-eggplant-300 mt-2">
                    Deadline: {format(parseISO(kpiDeadline!), 'MMM d, yyyy')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <TerritoryMap 
        schedule={schedule}
        allPubs={[...wishlistPubs, ...unvisitedPubs, ...masterfilePubs, ...kpiPubs]}
        homeAddress={homeAddress}
        className="animated-border"
      />

      <style>{`
        @keyframes wave {
          0% { background-position: 0% 0%; }
          100% { background-position: 100px 0%; }
        }
      `}</style>
    </div>
  );
};

export default RepStatsPanel;