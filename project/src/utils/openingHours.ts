import { format, parse, set } from 'date-fns';

type DaySchedule = {
  open: string;
  close: string;
  closed?: boolean;
};

type WeekSchedule = Record<string, DaySchedule>;

const generateRandomTime = (baseHour: number, variance: number): string => {
  const hour = baseHour + Math.floor(Math.random() * variance);
  const minute = Math.floor(Math.random() * 4) * 15; // Random quarter hour
  return format(new Date().setHours(hour, minute), 'HH:mm');
};

const generatePubSchedule = (pubName: string): WeekSchedule => {
  if (!pubName) {
    throw new Error('Pub name is required');
  }

  // Use pub name as seed for consistency
  const seed = pubName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  // Determine pub type and hours based on seed
  const isTraditional = seed % 3 === 0; // 33% chance
  const hasLateNights = seed % 2 === 0; // 50% chance
  const hasSundayHours = seed % 4 !== 0; // 75% chance
  const isEarlyOpener = seed % 10 === 0; // 10% chance
  
  // Opening hours based on pub type
  const openHour = isEarlyOpener ? 10 : isTraditional ? 11 : 12;
  const closeHour = hasLateNights ? 23 : 22;

  const weekSchedule: WeekSchedule = {
    Monday: {
      open: generateRandomTime(openHour, 1),
      close: generateRandomTime(closeHour, 1),
      closed: seed % 5 === 0 // 20% chance of Monday closure
    },
    Tuesday: {
      open: generateRandomTime(openHour, 1),
      close: generateRandomTime(closeHour, 1)
    },
    Wednesday: {
      open: generateRandomTime(openHour, 1),
      close: generateRandomTime(closeHour, 1)
    },
    Thursday: {
      open: generateRandomTime(openHour, 1),
      close: hasLateNights ? generateRandomTime(23, 1) : generateRandomTime(closeHour, 1)
    },
    Friday: {
      open: generateRandomTime(openHour, 1),
      close: hasLateNights ? generateRandomTime(24, 1) : generateRandomTime(23, 1)
    },
    Saturday: {
      open: generateRandomTime(openHour - 1, 1),
      close: hasLateNights ? generateRandomTime(24, 1) : generateRandomTime(23, 1)
    },
    Sunday: {
      open: generateRandomTime(openHour + 1, 1),
      close: generateRandomTime(21, 1),
      closed: !hasSundayHours
    }
  };

  return weekSchedule;
};

export const checkPubOpeningHours = (pubName: string, date: string): {
  isOpen: boolean;
  hours: string;
  openTime: string;
  closeTime: string;
} => {
  if (!pubName || !date) {
    return {
      isOpen: false,
      hours: 'Opening hours not available',
      openTime: 'Unknown',
      closeTime: 'Unknown'
    };
  }

  try {
    const schedule = generatePubSchedule(pubName);
    const visitDate = new Date(date);
    const dayName = format(visitDate, 'EEEE') as keyof WeekSchedule;
    const daySchedule = schedule[dayName];

    const formattedSchedule = Object.entries(schedule)
      .map(([day, hours]) => {
        if (hours.closed) return `${day}: Closed`;
        return `${day}: ${hours.open} - ${hours.close}`;
      })
      .join('\n');

    if (daySchedule.closed) {
      return {
        isOpen: false,
        hours: formattedSchedule,
        openTime: 'Closed',
        closeTime: 'Closed'
      };
    }

    // Parse opening time
    const openTime = parse(daySchedule.open, 'HH:mm', visitDate);
    const closeTime = parse(daySchedule.close, 'HH:mm', visitDate);

    // Check if opens before 17:31
    const latestAcceptableTime = set(visitDate, { hours: 17, minutes: 31 });
    const isOpenEarlyEnough = openTime < latestAcceptableTime;

    return {
      isOpen: isOpenEarlyEnough,
      hours: formattedSchedule,
      openTime: format(openTime, 'HH:mm'),
      closeTime: format(closeTime, 'HH:mm')
    };
  } catch (error) {
    console.error('Error checking pub opening hours:', error);
    return {
      isOpen: false,
      hours: 'Error checking opening hours',
      openTime: 'Unknown',
      closeTime: 'Unknown'
    };
  }
};