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
import { AlertTriangle } from 'lucide-react';

const PlannerDashboard: React.FC = () => {
  const { 
    masterfilePubs, setMasterfilePubs,
    kpiPubs, setKpiPubs,
    repslyWins, setRepslyWins,
    wishlistPubs, setWishlistPubs,
    businessDays, setSchedule,
    kpiDeadline, setKpiDeadline,
    repslyDeadline, setRepslyDeadline,
    homeAddress,
    visitsPerDay
  } = usePubData();

  const [error, setError] = useState<string | null>(null);
  const [unscheduledPubs, setUnscheduledPubs] = useState<Pub[]>([]);
  const [uploadedFileNames, setUploadedFileNames] = useState<Record<string, string>>({});

  const uploadedFiles = [
    ...(masterfilePubs.length > 0 ? [{
      type: 'masterhouse',
      name: 'Masterhouse List',
      count: masterfilePubs.length,
      priority: 4,
      color: 'border-gray-700/50',
      fileName: uploadedFileNames['masterhouse']
    }] : []),
    ...(kpiPubs.length > 0 ? [{
      type: 'kpi',
      name: 'KPI Targets',
      count: kpiPubs.length,
      priority: 1,
      deadline: kpiDeadline,
      color: 'border-red-700/50',
      fileName: uploadedFileNames['kpi']
    }] : []),
    ...(repslyWins.length > 0 ? [{
      type: 'wins',
      name: 'Recent Wins',
      count: repslyWins.length,
      priority: 2,
      deadline: repslyDeadline,
      color: 'border-purple-700/50',
      fileName: uploadedFileNames['wins']
    }] : []),
    ...(wishlistPubs.length > 0 ? [{
      type: 'hitlist',
      name: 'Hit List',
      count: wishlistPubs.length,
      priority: 3,
      color: 'border-blue-700/50',
      fileName: uploadedFileNames['hitlist']
    }] : [])
  ];

  const handleFileLoaded = (data: Pub[], type: string, fileName: string) => {
    setUploadedFileNames(prev => ({ ...prev, [type]: fileName }));
    
    switch (type) {
      case 'masterhouse':
        setMasterfilePubs(data);
        break;
      case 'kpi':
        setKpiPubs(data);
        break;
      case 'wins':
        setRepslyWins(data);
        break;
      case 'hitlist':
        setWishlistPubs(data);
        break;
    }
  };

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
    if (!masterfilePubs.length) {
      setError("Please upload your Masterhouse list to continue");
      return;
    }

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
      ...kpiPubs.map(pub => ({ ...pub, Priority: 'KPI' })),
      ...wishlistPubs.map(pub => ({ ...pub, Priority: 'Wishlist' })),
      ...masterfilePubs.map(pub => ({ ...pub, Priority: 'Masterfile' }))
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

                {error && (
                  <div className="mb-4 p-3 rounded-lg bg-red-900/20 border border-red-700/50 text-red-200 flex items-start gap-2">
                    <AlertTriangle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <FileUploader 
                  onFileLoaded={handleFileLoaded}
                  isLoaded={masterfilePubs.length > 0}
                  onDeadlineSet={(date) => {
                    if (kpiPubs.length > 0) {
                      setKpiDeadline(date);
                    } else if (repslyWins.length > 0) {
                      setRepslyDeadline(date);
                    }
                  }}
                  uploadedFiles={uploadedFiles}
                />
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
              selectedPub={null}
              onScheduleAnyway={handleScheduleAnyway}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlannerDashboard;