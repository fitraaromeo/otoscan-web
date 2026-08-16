export interface Client {
  id: string;
  name: string;
  contactPerson?: string;
  phone: string;
  email: string;
  address: string;
  city?: string;
  totalVehicles: number;
  vehicleCount?: number;
  status: 'active' | 'inactive';
  createdAt: string;
}

// ─── Vehicle Entity ───────────────────────────────────────────────────────────
export interface Vehicle {
  id: string;
  licensePlate: string;
  brand: string;
  model: string;
  year: number;
  color: string;
  clientId: string;
  clientName: string;
  status: 'active' | 'inactive';
  lastInspection: string | null;
  totalInspections: number;
  createdAt: string;
}

// ─── Inspection & Damage ──────────────────────────────────────────────────────
export type DamageType = 'dent' | 'scratch' | 'crack' | 'glass_shatter' | 'lamp_broken' | 'tire_flat';
export type DamageSeverity = 'low' | 'medium' | 'high';
export type InspectionStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface DamageItem {
  id: string;
  type: DamageType;
  severity: DamageSeverity;
  confidence: number;
  angle: 'front' | 'rear' | 'left' | 'right';
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AngleCapture {
  angle: 'front' | 'rear' | 'left' | 'right';
  imageUrl: string | null;
  resultUrl: string | null;
  damages: DamageItem[];
  capturedAt: string | null;
}

export interface Inspection {
  id: string;
  vehicleId: string;
  licensePlate: string;
  vehicleName: string;
  clientId: string;
  clientName: string;
  inspectorName: string;
  status: InspectionStatus;
  angles: AngleCapture[];
  totalDamages: number;
  notes: string;
  startedAt: string;
  completedAt: string | null;
  createdAt: string;
}

// ─── Dashboard Stats ──────────────────────────────────────────────────────────
export interface StatData {
  label: string;
  value: number;
  change: number;     // percentage change vs last period
  trend: number[];    // sparkline data
}

export interface DashboardStats {
  totalClients: StatData;
  totalVehicles: StatData;
  inspectionsThisMonth: StatData;
  aiDetectionsThisMonth: StatData;
}

// ─── Authentication Types ──────────────────────────────────────────────────────
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'inspector' | string;
  phone?: string;
  address?: string;
  vehicleCount?: number;
  vehicles?: Vehicle[];
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
}

export interface AuthResponse {
  status: 'success' | 'error';
  message?: string;
  token?: string;
  expiresAt?: string;
  user?: AuthUser;
  data?: AuthUser;
}

