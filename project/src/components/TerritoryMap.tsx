import React, { useEffect, useRef, useState } from 'react';
import { ScheduleDay, Pub } from '../context/PubDataContext';
import { AlertTriangle } from 'lucide-react';
import { getRtmColor } from '../utils/rtmColors';
import { mapsLoader, validateEnvironment } from '../config/environment';
import * as Tooltip from '@radix-ui/react-tooltip';

interface TerritoryMapProps {
  schedule: ScheduleDay[];
  allPubs: Pub[];
  homeAddress: string;
  className?: string;
}

const TerritoryMap: React.FC<TerritoryMapProps> = ({ schedule, allPubs, homeAddress, className = '' }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    let isMounted = true;

    const initMap = async () => {
      try {
        await mapsLoader.load();

        if (!mapRef.current || !isMounted) return;

        const mapOptions: google.maps.MapOptions = {
          center: { lat: 51.5074, lng: -0.1278 },
          zoom: 8,
          styles: [
            {
              featureType: "all",
              elementType: "geometry",
              stylers: [{ color: "#242f3e" }]
            },
            {
              featureType: "all",
              elementType: "labels.text.stroke",
              stylers: [{ color: "#242f3e" }]
            },
            {
              featureType: "all",
              elementType: "labels.text.fill",
              stylers: [{ color: "#746855" }]
            },
            {
              featureType: "water",
              elementType: "geometry",
              stylers: [{ color: "#17263c" }]
            }
          ]
        };

        const newMap = new google.maps.Map(mapRef.current, mapOptions);
        setMap(newMap);

        return () => {
          markersRef.current.forEach(marker => marker.setMap(null));
        };
      } catch (error) {
        console.error('Error initializing map:', error);
        setError('Unable to load the map. Please check your API key configuration.');
      }
    };

    initMap();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!map) return;

    const updateMapMarkers = async () => {
      // Clear existing markers
      markersRef.current.forEach(marker => marker.setMap(null));
      markersRef.current = [];

      const geocoder = new google.maps.Geocoder();
      const bounds = new google.maps.LatLngBounds();

      // Add home marker first
      try {
        const homeResult = await geocoder.geocode({ address: homeAddress });
        const homePosition = homeResult.results[0].geometry.location;
        bounds.extend(homePosition);

        const homeMarker = new google.maps.Marker({
          position: homePosition,
          map,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: 10,
            fillColor: "#9d00ff",
            fillOpacity: 1,
            strokeWeight: 2,
            strokeColor: "#ffffff"
          },
          title: "Home Base"
        });

        markersRef.current.push(homeMarker);

        const homeInfo = new google.maps.InfoWindow({
          content: `<div style="color: #242f3e; padding: 8px;"><strong>Home Base</strong><br/>${homeAddress}</div>`
        });
        homeMarker.addListener('click', () => homeInfo.open(map, homeMarker));
      } catch (error) {
        console.warn('Failed to geocode home address:', error);
      }

      // Process all scheduled visits
      const scheduledPubs = new Set();
      for (const day of schedule) {
        for (const visit of day.visits) {
          if (scheduledPubs.has(visit.pub)) continue;
          scheduledPubs.add(visit.pub);

          try {
            const result = await geocoder.geocode({ address: visit.zip });
            const position = result.results[0].geometry.location;
            bounds.extend(position);

            const marker = new google.maps.Marker({
              position,
              map,
              icon: {
                path: google.maps.SymbolPath.CIRCLE,
                scale: 8,
                fillColor: getRtmColor(visit.rtm),
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: "#ffffff"
              },
              title: visit.pub
            });

            markersRef.current.push(marker);

            const content = `
              <div style="color: #242f3e; padding: 8px;">
                <strong>${visit.pub}</strong><br/>
                ${visit.zip}<br/>
                RTM: ${visit.rtm || 'Unknown'}<br/>
                Priority: ${visit.Priority}<br/>
                Visit Date: ${day.date}
              </div>
            `;

            const infoWindow = new google.maps.InfoWindow({ content });
            marker.addListener('click', () => infoWindow.open(map, marker));

            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.warn(`Failed to geocode pub: ${visit.pub}`, error);
          }
        }
      }

      // Fit map to show all markers
      map.fitBounds(bounds);
    };

    updateMapMarkers();
  }, [map, schedule, homeAddress]);

  if (error) {
    return (
      <div className={`${className} bg-dark-900/50 rounded-lg p-6 text-center`}>
        <div className="flex items-center justify-center gap-2 text-red-400 mb-2">
          <AlertTriangle className="h-5 w-5" />
          <span className="font-medium">Map Error</span>
        </div>
        <p className="text-eggplant-200">{error}</p>
      </div>
    );
  }

  return (
    <div className="animated-border bg-gradient-to-r from-eggplant-900/90 via-dark-900/95 to-eggplant-900/90 backdrop-blur-sm rounded-lg p-4">
      <div className="relative rounded-lg overflow-hidden">
        <h3 className="absolute top-2 left-2 z-10 bg-dark-800/90 text-eggplant-100 px-3 py-1.5 rounded-lg text-sm font-medium">
          Visit Heat Map
        </h3>
        <div ref={mapRef} className="w-full h-[400px]" />
        <div className="absolute bottom-2 right-2 bg-dark-800/90 rounded-lg p-2">
          <div className="text-xs text-eggplant-100 font-medium mb-1">RTM Legend</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRtmColor('greene king') }} />
              <span className="text-xs text-eggplant-200">Greene King</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRtmColor('greene king ift') }} />
              <span className="text-xs text-eggplant-200">GK IFT</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRtmColor('admiral') }} />
              <span className="text-xs text-eggplant-200">Admiral</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRtmColor('punch') }} />
              <span className="text-xs text-eggplant-200">Punch</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRtmColor('stonegate') }} />
              <span className="text-xs text-eggplant-200">Stonegate</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getRtmColor('trust') }} />
              <span className="text-xs text-eggplant-200">Trust</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TerritoryMap;