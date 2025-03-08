import React, { createContext, useState, useContext, ReactNode } from 'react';
import { useEffect } from 'react';

export interface Pub {
  id?: string;
  pub: string;
  zip: string;
  last_visited?: string | null;
  short_post?: string;
  rtm?: string;
  landlord?: string;
  notes?: string;
  Priority?: string;
  zip_prefix?: string;
  zip_numeric?: number;
  win_date?: string;
  win_type?: string;
  scheduledTime?: string;
  visitNotes?: string;
  isBooked?: boolean;
  deadline?: string;
  priorityLevel?: number;
  fileName?: string;
}

export interface PubDataContextType {
  wishlistPubs: Pub[];
  unvisitedPubs: Pub[];
  masterfilePubs: Pub[];
  kpiPubs: Pub[];
  repslyWins: Pub[];
  schedule: ScheduleDay[];
  businessDays: number;
  visitsPerDay: number;
  homeAddress: string;
  setWishlistPubs: (pubs: Pub[]) => void;
  setUnvisitedPubs: (pubs: Pub[]) => void;
  setMasterfilePubs: (pubs: Pub[]) => void;
  setKpiPubs: (pubs: Pub[]) => void;
  setRepslyWins: (pubs: Pub[]) => void;
  setSchedule: (schedule: ScheduleDay[]) => void;
  setBusinessDays: (days: number) => void;
  setVisitsPerDay: (visits: number) => void;
  setHomeAddress: (address: string) => void;
  kpiDeadline: string;
  setKpiDeadline: (date: string) => void;
  repslyDeadline: string;
  setRepslyDeadline: (date: string) => void;
  addPubList: (pubs: Pub[], type: string, fileName: string, deadline?: string) => void;
  removePubList: (fileName: string) => void;
  updatePubList: (fileName: string, updates: Partial<Pub>) => void;
}

export interface ScheduleDay {
  date: string;
  visits: ScheduleVisit[];
  totalMileage?: number;
  totalDriveTime?: number;
  startMileage?: number;
  startDriveTime?: number;
  endMileage?: number;
  endDriveTime?: number;
}

export interface ScheduleVisit extends Pub {
  mileageToNext?: number;
  driveTimeToNext?: number;
}

const PubDataContext = createContext<PubDataContextType | undefined>(undefined);

export const PubDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize state from localStorage if available
  const [wishlistPubs, setWishlistPubs] = useState<Pub[]>(() => {
    try {
      const saved = localStorage.getItem('wishlistPubs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [unvisitedPubs, setUnvisitedPubs] = useState<Pub[]>(() => {
    try {
      const saved = localStorage.getItem('unvisitedPubs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [masterfilePubs, setMasterfilePubs] = useState<Pub[]>(() => {
    try {
      const saved = localStorage.getItem('masterfilePubs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [kpiPubs, setKpiPubs] = useState<Pub[]>(() => {
    try {
      const saved = localStorage.getItem('kpiPubs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [repslyWins, setRepslyWins] = useState<Pub[]>(() => {
    try {
      const saved = localStorage.getItem('repslyWins');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [schedule, setSchedule] = useState<ScheduleDay[]>(() => {
    try {
      const saved = localStorage.getItem('schedule');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [businessDays, setBusinessDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('businessDays');
      return saved ? parseInt(saved) : 100;
    } catch (e) {
      return 100;
    }
  });
  const [visitsPerDay, setVisitsPerDay] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('visitsPerDay');
      return saved ? parseInt(saved) : 5;
    } catch (e) {
      return 5;
    }
  });
  const [homeAddress, setHomeAddress] = useState<string>(() => {
    try {
      return localStorage.getItem('homeAddress') || "";
    } catch (e) {
      return "";
    }
  });
  const [kpiDeadline, setKpiDeadline] = useState<string>(() => {
    try {
      return localStorage.getItem('kpiDeadline') || "";
    } catch (e) {
      return "";
    }
  });
  const [repslyDeadline, setRepslyDeadline] = useState<string>(() => {
    try {
      return localStorage.getItem('repslyDeadline') || "";
    } catch (e) {
      return "";
    }
  });

  // Persist state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('wishlistPubs', JSON.stringify(wishlistPubs));
      localStorage.setItem('unvisitedPubs', JSON.stringify(unvisitedPubs));
      localStorage.setItem('masterfilePubs', JSON.stringify(masterfilePubs));
      localStorage.setItem('kpiPubs', JSON.stringify(kpiPubs));
      localStorage.setItem('repslyWins', JSON.stringify(repslyWins));
      localStorage.setItem('schedule', JSON.stringify(schedule));
      localStorage.setItem('businessDays', businessDays.toString());
      localStorage.setItem('visitsPerDay', visitsPerDay.toString());
      localStorage.setItem('homeAddress', homeAddress);
      localStorage.setItem('kpiDeadline', kpiDeadline);
      localStorage.setItem('repslyDeadline', repslyDeadline);
    } catch (e) {
      console.warn('Failed to save state to localStorage:', e);
    }
  }, [wishlistPubs, unvisitedPubs, masterfilePubs, kpiPubs, repslyWins, 
      schedule, businessDays, visitsPerDay, homeAddress, kpiDeadline, repslyDeadline]);

  // Add a new pub list
  const addPubList = (pubs: Pub[], type: string, fileName: string, deadline?: string) => {
    const pubsWithMetadata = pubs.map(pub => ({
      ...pub,
      fileName,
      deadline
    }));

    switch (type) {
      case 'masterhouse':
        setMasterfilePubs(prev => [...prev, ...pubsWithMetadata]);
        break;
      case 'kpi':
        setKpiPubs(prev => [...prev, ...pubsWithMetadata]);
        if (deadline) setKpiDeadline(deadline);
        break;
      case 'wins':
        setRepslyWins(prev => [...prev, ...pubsWithMetadata]);
        if (deadline) setRepslyDeadline(deadline);
        break;
      case 'hitlist':
        setWishlistPubs(prev => [...prev, ...pubsWithMetadata]);
        break;
    }
  };

  // Remove a pub list by filename
  const removePubList = (fileName: string) => {
    setMasterfilePubs(prev => prev.filter(pub => pub.fileName !== fileName));
    setKpiPubs(prev => prev.filter(pub => pub.fileName !== fileName));
    setRepslyWins(prev => prev.filter(pub => pub.fileName !== fileName));
    setWishlistPubs(prev => prev.filter(pub => pub.fileName !== fileName));
  };

  // Update a pub list
  const updatePubList = (fileName: string, updates: Partial<Pub>) => {
    const updateList = (list: Pub[], setList: (pubs: Pub[]) => void) => {
      const updatedList = list.map(pub => 
        pub.fileName === fileName ? { ...pub, ...updates } : pub
      );
      setList(updatedList);
    };

    updateList(masterfilePubs, setMasterfilePubs);
    updateList(kpiPubs, setKpiPubs);
    updateList(repslyWins, setRepslyWins);
    updateList(wishlistPubs, setWishlistPubs);
  };

  // Set default Repsly deadline when wins are loaded
  React.useEffect(() => {
    if (repslyWins.length > 0 && !repslyDeadline) {
      const defaultDeadline = new Date();
      defaultDeadline.setDate(defaultDeadline.getDate() + 12); // 12 days from now
      setRepslyDeadline(defaultDeadline.toISOString().split('T')[0]);
    }
  }, [repslyWins, repslyDeadline]);

  const value = React.useMemo(() => ({
    wishlistPubs,
    unvisitedPubs,
    masterfilePubs,
    kpiPubs,
    repslyWins,
    schedule,
    businessDays,
    visitsPerDay,
    homeAddress,
    setWishlistPubs,
    setUnvisitedPubs,
    setMasterfilePubs,
    setKpiPubs,
    setRepslyWins,
    setSchedule,
    setBusinessDays,
    setVisitsPerDay,
    setHomeAddress,
    kpiDeadline,
    setKpiDeadline,
    repslyDeadline,
    setRepslyDeadline,
    addPubList,
    removePubList,
    updatePubList
  }), [
    wishlistPubs,
    unvisitedPubs,
    masterfilePubs,
    kpiPubs,
    repslyWins,
    schedule,
    businessDays,
    visitsPerDay,
    homeAddress,
    kpiDeadline,
    repslyDeadline
  ]);

  return (
    <PubDataContext.Provider value={value}>
      {children}
    </PubDataContext.Provider>
  );
};

export const usePubData = (): PubDataContextType => {
  const context = useContext(PubDataContext);
  if (context === undefined) {
    throw new Error('usePubData must be used within a PubDataProvider');
  }
  return context;
};