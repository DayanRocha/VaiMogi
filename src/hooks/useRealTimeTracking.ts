
import { useState, useEffect } from 'react';

export interface RouteLocation {
  lat: number;
  lng: number;
  timestamp: string;
}

export interface RoutePoint {
  id: string;
  type: 'student' | 'school';
  studentName?: string;
  schoolName?: string;
  address: string;
  lat: number;
  lng: number;
}

export interface GuardianTrackingInfo {
  hasActiveRoute: boolean;
  driverLocation?: RouteLocation;
  driverName?: string;
  routeGeometry?: any;
  estimatedArrival?: string;
  nextStop?: RoutePoint;
}

export const useGuardianTracking = (guardianId: string): GuardianTrackingInfo => {
  const [trackingInfo, setTrackingInfo] = useState<GuardianTrackingInfo>({
    hasActiveRoute: false
  });

  useEffect(() => {
    // Mock implementation - in real app, this would connect to real-time tracking
    const mockTrackingInfo: GuardianTrackingInfo = {
      hasActiveRoute: false,
      driverName: 'João Silva' // Mock driver name
    };

    setTrackingInfo(mockTrackingInfo);
  }, [guardianId]);

  return trackingInfo;
};

// Add the missing export
export const useRealTimeTracking = useGuardianTracking;
