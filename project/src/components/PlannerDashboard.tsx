import React, { useState } from 'react';
import FileUploader from '../components/FileUploader';
import ScheduleSettings from '../components/ScheduleSettings';
import ScheduleDisplay from '../components/ScheduleDisplay';
import UnscheduledPubsPanel from '../components/UnscheduledPubsPanel';
import RepStatsPanel from '../components/RepStatsPanel';
import { usePubData } from '../context/PubDataContext';
import { planVisits } from '../utils/scheduleUtils';
import { checkPubOpeningHours } from '../utils/openingHours';
import { Pub } from '../context/PubDataContext';

const PlannerDashboard: React.FC = () => {
  const { 
    wishlistPubs, setWishlistPubs,
    unvisitedPubs, setUnvisitedPubs,
    masterfilePubs, setMasterfilePubs,
    kpiPubs, setKpiPubs,
    repslyWins, setRepslyWins,
    businessDays, setSchedule,
    kpiDeadline, repslyDeadline,
    homeAddress,
    visitsPerDay
  } = usePubData();

  const [error, setError] = useState<string | null>(null);
  const [unscheduledPubs, setUnscheduledPubs] = useState<Pub[]>([]);

  const filterLateOpeningPubs = (pubs: Pub[]): [Pub[], Pub[]] => {
    const schedulable: Pub[] = [];
    const unschedulable: Pub[] = [];

    pubs.forEach(pub => {
      const hours = checkPubOpeningHours(pub.pub, new Date().toISOString());
      if (hours.isOpen) {
        schedulable.push(pub);
      } else {
        unschedulable.push(pub);
      }
    });

    return [schedulable, unschedulable];
  };

  const generateSchedule = () => {
    if (kpiPubs.length > 0 && !kpiDeadline) {
      setError("Please set a KPI deadline when KPI target pubs are loaded");
      return;
    }

    if (repslyWins.length > 0 && !repslyDeadline) {
      setError("Please set a follow-up deadline for Repsly wins");
      return;
    }

    setError(null);

    const processedRepslyWins = repslyWins.map(pub => ({
      ...pub,
      Priority: 'RepslyWin',
      followUpDate: repslyDeadline
    }));

    const allPubs = [
      ...processedRepslyWins,
      ...wishlistPubs.map(pub => ({ ...pub, Priority: 'Wishlist' })),
      ...unvisitedPubs.map(pub => ({ ...pub, Priority: 'Unvisited' })),
      ...masterfilePubs.map(pub => ({ ...pub, Priority: 'Masterfile' })),
      ...kpiPubs.map(pub => ({ ...pub, Priority: 'KPI' }))
    ];

    const [schedulablePubs, unschedulablePubs] = filterLateOpeningPubs(allPubs);
    setUnscheduledPubs(unschedulablePubs);

    const schedule = planVisits(
      schedulablePubs, 
      new Date(), 
      businessDays, 
      homeAddress,
      visitsPerDay,
      kpiDeadline
    );
    
    setSchedule(schedule);
  };

  const handleScheduleAnyway = (pub: Pub) => {
    setUnscheduledPubs(prev => prev.filter(p => p.pub !== pub.pub));
    const newSchedule = planVisits(
      [pub],
      new Date(),
      1,
      homeAddress,
      1
    );
    
    setSchedule(prev => [...prev, ...newSchedule]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6 bg-gradient-to-r from-neon-purple via-neon-pink to-neon-blue bg-clip-text text-transparent animate-gradient-x">
        Prioritize Your House Lists
      </h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        <div className="lg:col-span-9">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
            <div className="lg:col-span-2">
              <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg shadow-xl p-4 sm:p-6 mb-4 sm:mb-6">
                <h2 className="text-lg sm:text-xl font-semibold mb-4 text-eggplant-100">
                  Upload Your Lists
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <h3 className="font-medium mb-2 text-eggplant-100">Recent Wins (Repsly)</h3>
                    <FileUploader 
                      onFileLoaded={setRepslyWins} 
                      fileType="repsly"
                      isLoaded={repslyWins.length > 0}
                    />
                    {repslyWins.length > 0 && (
                      <p className="mt-2 text-sm text-eggplant-200">{repslyWins.length} wins loaded</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-medium mb-2 text-eggplant-100">Priority #1</h3>
                    <FileUploader 
                      onFileLoaded={setWishlistPubs} 
                      fileType="wishlist"
                      isLoaded={wishlistPubs.length > 0}
                    />
                    {wishlistPubs.length > 0 && (
                      <p className="mt-2 text-sm text-eggplant-200">{wishlistPubs.length} accounts loaded</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 text-eggplant-100">Priority #2</h3>
                    <FileUploader 
                      onFileLoaded={setUnvisitedPubs} 
                      fileType="unvisited"
                      isLoaded={unvisitedPubs.length > 0}
                    />
                    {unvisitedPubs.length > 0 && (
                      <p className="mt-2 text-sm text-eggplant-200">{unvisitedPubs.length} accounts loaded</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 text-eggplant-100">Masterfile (Priority #3)</h3>
                    <FileUploader 
                      onFileLoaded={setMasterfilePubs} 
                      fileType="masterfile"
                      isLoaded={masterfilePubs.length > 0}
                    />
                    {masterfilePubs.length > 0 && (
                      <p className="mt-2 text-sm text-eggplant-200">{masterfilePubs.length} accounts loaded</p>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="font-medium mb-2 text-eggplant-100">KPI Target (Optional)</h3>
                    <FileUploader 
                      onFileLoaded={setKpiPubs} 
                      fileType="kpi"
                      isLoaded={kpiPubs.length > 0}
                    />
                    {kpiPubs.length > 0 && (
                      <p className="mt-2 text-sm text-eggplant-200">{kpiPubs.length} accounts loaded</p>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div>
              <ScheduleSettings onGenerateSchedule={generateSchedule} />
            </div>
          </div>
          
          <ScheduleDisplay />
        </div>

        <div className="lg:col-span-3 space-y-6">
          <RepStatsPanel />
          {unscheduledPubs.length > 0 && (
            <UnscheduledPubsPanel 
              pubs={unscheduledPubs}
              onScheduleAnyway={handleScheduleAnyway}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlannerDashboard;