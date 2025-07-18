
export interface Driver {
  id: string;
  name: string;
  phone: string;
  address: string;
  photo?: string;
}

export interface Van {
  id: string;
  driverId: string;
  model: string;
  plate: string;
  capacity: number;
  observations?: string;
  photo?: string;
}

export interface Route {
  id: string;
  driverId: string;
  name: string;
  startTime: string;
  weekDays: string[];
  students: Student[];
}

export interface Student {
  id: string;
  name: string;
  guardianId: string;
  pickupPoint: string;
  schoolId: string;
  status: 'waiting' | 'embarked' | 'at_school';
}

export interface Guardian {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface School {
  id: string;
  name: string;
  address: string;
}

export interface Trip {
  id: string;
  routeId: string;
  date: string;
  status: 'planned' | 'in_progress' | 'completed';
  students: TripStudent[];
}

export interface TripStudent {
  studentId: string;
  status: 'waiting' | 'van_arrived' | 'embarked' | 'at_school' | 'disembarked';
  pickupTime?: string;
  dropoffTime?: string;
}
