import { Pub, ScheduleDay, ScheduleVisit } from '../context/PubDataContext';
import { addBusinessDays, format } from 'date-fns';

const POSTCODE_DISTANCE_MULTIPLIER = 0.8; // Miles per numeric difference
const BASE_DRIVE_TIME = 5; // Base minutes for any journey
const MINUTES_PER_MILE = 3; // Average minutes per mile

export const extractNumericPart = (zipCode: string): [string, number] => {
  if (!zipCode || typeof zipCode !== 'string') {
    return ["Unknown", -1];
  }

  const match = /([A-Za-z]+)(\d+)/.exec(zipCode);
  if (match) {
    const [_, alpha_prefix, numeric_part] = match;
    return [alpha_prefix.toUpperCase(), parseInt(numeric_part, 10)];
  }
  
  return ["Unknown", -1];
};

export const calculateDistance = (fromZip: string, toZip: string): { mileage: number; driveTime: number } => {
  if (!fromZip || !toZip) {
    return { mileage: 0, driveTime: 0 };
  }

  const [fromPrefix, fromNum] = extractNumericPart(fromZip);
  const [toPrefix, toNum] = extractNumericPart(toZip);
  
  if (fromPrefix === "Unknown" || toPrefix === "Unknown") {
    return { mileage: 0, driveTime: 0 };
  }

  // Calculate numeric difference
  const numericDifference = Math.abs(fromNum - toNum);
  
  // Calculate prefix difference (distance between letters)
  const prefixDifference = Math.abs(
    fromPrefix.charCodeAt(fromPrefix.length - 1) - 
    toPrefix.charCodeAt(toPrefix.length - 1)
  );

  let mileage: number;
  
  if (fromPrefix === toPrefix) {
    // Same area: Use numeric difference with some variation
    mileage = numericDifference * POSTCODE_DISTANCE_MULTIPLIER;
    // Add small random variation (±20%)
    mileage *= (0.8 + Math.random() * 0.4);
  } else {
    // Different areas: Base distance on both prefix and numeric differences
    const baseMileage = prefixDifference * 5; // 5 miles per letter difference
    const additionalMileage = numericDifference * POSTCODE_DISTANCE_MULTIPLIER;
    mileage = baseMileage + additionalMileage;
    // Add larger random variation for different areas (±30%)
    mileage *= (0.7 + Math.random() * 0.6);
  }

  // Ensure minimum distance
  mileage = Math.max(0.5, mileage);
  
  // Calculate drive time with traffic consideration
  const baseTime = BASE_DRIVE_TIME;
  const mileageTime = mileage * MINUTES_PER_MILE;
  
  // Add random traffic delay (0-5 minutes)
  const trafficDelay = Math.floor(Math.random() * 6);
  
  const driveTime = Math.round(baseTime + mileageTime + trafficDelay);

  return {
    mileage: Number(mileage.toFixed(1)),
    driveTime: Math.max(5, driveTime) // Minimum 5 minutes
  };
};

export const normalizePubName = (name: string | undefined): string => {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 4);
};

export const findDuplicatePubs = (pubs: Pub[]): Map<string, Pub[]> => {
  const duplicates = new Map<string, Pub[]>();
  const pubGroups = new Map<string, Pub[]>();

  pubs.forEach(pub => {
    if (!pub?.pub || !pub?.zip) return;
    const key = `${pub.zip}-${normalizePubName(pub.pub)}`;
    const existing = pubGroups.get(key) || [];
    pubGroups.set(key, [...existing, pub]);
  });

  pubGroups.forEach((group, key) => {
    if (group.length > 1) {
      duplicates.set(key, group);
    }
  });

  return duplicates;
};

export const findNearestPubs = (currentPub: Pub | null, availablePubs: Pub[], maxDriveTime: number = 16): Pub[] => {
  if (!currentPub?.zip || !availablePubs.length) return [];
  
  // Filter out pubs without valid postcodes
  const validPubs = availablePubs.filter(pub => pub?.zip);
  
  return validPubs
    .filter(pub => {
      const { driveTime } = calculateDistance(currentPub.zip!, pub.zip!);
      return driveTime <= maxDriveTime;
    })
    .sort((a, b) => {
      const distA = calculateDistance(currentPub.zip!, a.zip!);
      const distB = calculateDistance(currentPub.zip!, b.zip!);
      return distA.driveTime - distB.driveTime;
    });
};

export const getPriorityOrder = (pub: Pub): number => {
  switch (pub?.Priority) {
    case 'KPI': return 0;
    case 'Wishlist': return 1;
    case 'Unvisited': return 2;
    case 'Masterfile': return 3;
    default: return 4;
  }
};

const optimizeRouteForDay = (visits: Pub[], homeZip: string): Pub[] => {
  if (!visits.length || !homeZip) return [];

  const optimizedRoute: Pub[] = [];
  let remainingPubs = visits.filter(pub => pub?.zip);
  let currentLocation = homeZip;

  while (remainingPubs.length > 0) {
    const nearest = remainingPubs.reduce((closest, pub) => {
      if (!pub?.zip) return closest;
      const distToCurrent = calculateDistance(currentLocation, pub.zip);
      const distToClosest = closest ? calculateDistance(currentLocation, closest.zip!) : { driveTime: Infinity };
      
      return distToCurrent.driveTime < distToClosest.driveTime ? pub : closest;
    }, null as Pub | null);

    if (!nearest) break;

    optimizedRoute.push(nearest);
    currentLocation = nearest.zip!;
    remainingPubs = remainingPubs.filter(pub => pub.pub !== nearest.pub);
  }

  return optimizedRoute;
};

export const reorderVisitsForDay = (
  visits: ScheduleVisit[],
  homeAddress: string
): ScheduleVisit[] => {
  const unscheduledVisits = visits.filter(v => !v.scheduledTime);
  const scheduledVisits = visits.filter(v => v.scheduledTime)
    .sort((a, b) => {
      if (!a.scheduledTime || !b.scheduledTime) return 0;
      return a.scheduledTime.localeCompare(b.scheduledTime);
    });

  // If there are no scheduled visits, return the original optimization
  if (scheduledVisits.length === 0) {
    return optimizeRouteForDay(visits, homeAddress);
  }

  // Find optimal positions for unscheduled visits
  let bestRoute = [...scheduledVisits];
  
  unscheduledVisits.forEach(visit => {
    let bestPosition = 0;
    let minExtraDistance = Infinity;

    for (let i = 0; i <= bestRoute.length; i++) {
      const routeCopy = [...bestRoute];
      routeCopy.splice(i, 0, visit);

      let totalDistance = 0;
      for (let j = 0; j < routeCopy.length - 1; j++) {
        const { mileage } = calculateDistance(routeCopy[j].zip!, routeCopy[j + 1].zip!);
        totalDistance += mileage;
      }

      if (totalDistance < minExtraDistance) {
        minExtraDistance = totalDistance;
        bestPosition = i;
      }
    }

    bestRoute.splice(bestPosition, 0, visit);
  });

  return bestRoute;
};

const distributeVisits = (pubs: Pub[], totalDays: number, homeZip: string, maxVisitsPerDay: number = 5): ScheduleDay[] => {
  if (!pubs.length || !homeZip) return [];

  // Filter out invalid pubs
  const validPubs = pubs.filter(pub => pub?.pub && pub?.zip);
  
  const duplicates = findDuplicatePubs(validPubs);
  
  const markedPubs = validPubs.map(pub => {
    const key = `${pub.zip}-${normalizePubName(pub.pub)}`;
    const isDuplicate = duplicates.has(key);
    return {
      ...pub,
      sources: isDuplicate ? duplicates.get(key)?.map(p => p.Priority).join(', ') : undefined
    };
  });

  const MAX_DRIVE_TIME = 16; // Maximum 16 minutes between pubs
  const dailyVisits: ScheduleDay[] = [];
  let remainingPubs = [...markedPubs].sort((a, b) => getPriorityOrder(a) - getPriorityOrder(b));
  
  const priorityCounts = remainingPubs.reduce((acc, pub) => {
    if (pub?.Priority) {
      acc[pub.Priority] = (acc[pub.Priority] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Calculate minimum pubs per day based on maxVisitsPerDay
  const minPubsPerDay = {
    KPI: Math.min(Math.ceil((priorityCounts.KPI || 0) / totalDays), maxVisitsPerDay),
    Wishlist: Math.min(Math.ceil((priorityCounts.Wishlist || 0) / totalDays), maxVisitsPerDay),
    Unvisited: Math.min(Math.ceil((priorityCounts.Unvisited || 0) / totalDays), maxVisitsPerDay),
    Masterfile: Math.min(Math.ceil((priorityCounts.Masterfile || 0) / totalDays), maxVisitsPerDay)
  };

  for (let day = 0; day < totalDays && remainingPubs.length > 0; day++) {
    const dayVisits: Pub[] = [];
    const priorityPubsForDay = new Set<string>();

    // Start with priority pubs
    for (const priority of ['KPI', 'Wishlist', 'Unvisited', 'Masterfile']) {
      // Break if we've reached maxVisitsPerDay
      if (dayVisits.length >= maxVisitsPerDay) break;

      const priorityPubs = remainingPubs.filter(p => p?.Priority === priority);
      const remainingSlots = maxVisitsPerDay - dayVisits.length;
      const minRequired = Math.min(
        minPubsPerDay[priority],
        priorityPubs.length,
        remainingSlots
      );

      if (minRequired > 0) {
        const startPub = priorityPubs[0];
        if (startPub) {
          const nearbyPubs = findNearestPubs(startPub, priorityPubs, MAX_DRIVE_TIME);
          const selectedPubs = nearbyPubs.slice(0, minRequired);
          
          dayVisits.push(...selectedPubs);
          selectedPubs.forEach(pub => {
            remainingPubs = remainingPubs.filter(p => p.pub !== pub.pub);
            if (pub.Priority) {
              priorityPubsForDay.add(pub.Priority);
            }
          });
        }
      }
    }

    // Fill remaining slots with nearby pubs
    while (dayVisits.length < maxVisitsPerDay && remainingPubs.length > 0) {
      const lastPub = dayVisits[dayVisits.length - 1];
      if (!lastPub) break;

      const nearbyPubs = findNearestPubs(lastPub, remainingPubs, MAX_DRIVE_TIME);
      
      if (nearbyPubs.length === 0) break;
      
      const selectedPub = nearbyPubs[0];
      if (!selectedPub) break;

      dayVisits.push(selectedPub);
      remainingPubs = remainingPubs.filter(p => p.pub !== selectedPub.pub);
    }

    if (dayVisits.length === 0) continue;

    // Optimize the route for the day
    const optimizedVisits = optimizeRouteForDay(dayVisits, homeZip);

    // Calculate metrics for optimized route
    const visitsWithMetrics = optimizedVisits.map((visit, index) => {
      if (index === optimizedVisits.length - 1) {
        return { ...visit, mileageToNext: 0, driveTimeToNext: 0 };
      }

      const nextVisit = optimizedVisits[index + 1];
      if (!nextVisit?.zip || !visit?.zip) {
        return { ...visit, mileageToNext: 0, driveTimeToNext: 0 };
      }

      const { mileage, driveTime } = calculateDistance(visit.zip, nextVisit.zip);
      return { ...visit, mileageToNext: mileage, driveTimeToNext: driveTime };
    });

    const firstPub = optimizedVisits[0];
    const lastPub = optimizedVisits[optimizedVisits.length - 1];

    if (!firstPub?.zip || !lastPub?.zip) continue;

    const startMetrics = calculateDistance(homeZip, firstPub.zip);
    const endMetrics = calculateDistance(lastPub.zip, homeZip);

    dailyVisits.push({
      date: '',
      visits: visitsWithMetrics,
      startMileage: startMetrics.mileage,
      startDriveTime: startMetrics.driveTime,
      endMileage: endMetrics.mileage,
      endDriveTime: endMetrics.driveTime,
      totalMileage: visitsWithMetrics.reduce((sum, visit) => sum + (visit.mileageToNext || 0), 0) + startMetrics.mileage + endMetrics.mileage,
      totalDriveTime: visitsWithMetrics.reduce((sum, visit) => sum + (visit.driveTimeToNext || 0), 0) + startMetrics.driveTime + endMetrics.driveTime
    });
  }

  return dailyVisits;
};

export const planVisits = (
  allPubs: Pub[], 
  startDate: Date, 
  businessDays: number,
  homeZip: string,
  maxVisitsPerDay: number = 5,
  kpiDeadline?: string
): ScheduleDay[] => {
  if (!allPubs.length || !homeZip) return [];
  
  const validPubs = allPubs.filter(pub => pub?.pub && pub?.zip);
  const sortedPubs = [...validPubs].sort((a, b) => getPriorityOrder(a) - getPriorityOrder(b));
  const distributedVisits = distributeVisits(sortedPubs, businessDays, homeZip, maxVisitsPerDay);

  return distributedVisits.map((day, index) => ({
    ...day,
    date: format(addBusinessDays(startDate, index), 'yyyy-MM-dd')
  }));
};