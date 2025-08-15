
import { useState, useEffect } from 'react';
import { realTimeTrackingService } from '@/services/realTimeTrackingService';
import { Student, School } from '@/types/driver';

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

// Hook for driver/route execution with tracking controls
export const useRealTimeTracking = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [hasActiveRoute, setHasActiveRoute] = useState(false);
  const [trackingError, setTrackingError] = useState<string | null>(null);

  useEffect(() => {
    // Check if there's an active route on mount
    const activeRoute = realTimeTrackingService.getActiveRoute();
    setHasActiveRoute(!!activeRoute && activeRoute.isActive);
    setIsTracking(!!activeRoute && activeRoute.isActive);
  }, []);

  const startTracking = async (
    driverId: string,
    driverName: string,
    direction: 'to_school' | 'to_home',
    students: Student[],
    school: School
  ): Promise<boolean> => {
    try {
      setTrackingError(null);
      
      const success = await realTimeTrackingService.startRoute(
        driverId,
        driverName,
        direction,
        students,
        school
      );
      
      if (success) {
        setIsTracking(true);
        setHasActiveRoute(true);
        console.log('✅ Real-time tracking started successfully');
        return true;
      } else {
        setTrackingError('Failed to start tracking');
        return false;
      }
    } catch (error) {
      console.error('❌ Error starting tracking:', error);
      setTrackingError(error instanceof Error ? error.message : 'Unknown error');
      return false;
    }
  };

  const stopTracking = () => {
    try {
      realTimeTrackingService.stopRoute();
      setIsTracking(false);
      setHasActiveRoute(false);
      setTrackingError(null);
      console.log('🛑 Real-time tracking stopped');
    } catch (error) {
      console.error('❌ Error stopping tracking:', error);
      setTrackingError(error instanceof Error ? error.message : 'Error stopping tracking');
    }
  };

  return {
    isTracking,
    hasActiveRoute,
    trackingError,
    startTracking,
    stopTracking
  };
};
