import React from 'react';
import { MapboxMap } from '@/components/MapboxMap';
import { ActiveRoute, RouteLocation } from '@/services/routeTrackingService';

interface RealTimeMapProps {
  activeRoute: ActiveRoute;
  driverLocation?: RouteLocation;
  nextDestination?: {
    studentId: string;
    studentName: string;
    address: string;
    lat?: number;
    lng: number;
    status: 'pending' | 'picked_up' | 'dropped_off';
  };
}

export const RealTimeMap: React.FC<RealTimeMapProps> = (props) => {
  // Simply delegate to MapboxMap since it's already fully featured
  return <MapboxMap {...props} />;
};