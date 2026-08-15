import type { Client, Vehicle, Inspection, AngleCapture } from './types';
import { mockClients, mockVehicles, mockInspections } from './mock-data';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';

export interface Employee {
  id: string;
  name: string;
  position?: string;
  phone?: string;
}

export async function fetchEmployeesApi(): Promise<Employee[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/employees`, { cache: 'no-store' });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && Array.isArray(json.data)) {
      return json.data.map((emp: any) => ({
        id: emp.id,
        name: emp.name || emp.nama || 'Petugas AI',
        position: emp.position || emp.jabatan || 'Inspektor',
        phone: emp.phone || '—',
      }));
    }
    return [
      { id: 'emp-1', name: 'Fitra Romeo Winky', position: 'Senior Inspector' },
      { id: 'emp-2', name: 'Budi Santoso', position: 'Field Inspector' },
      { id: 'emp-3', name: 'Siti Rahma', position: 'AI Operator' },
    ];
  } catch {
    return [
      { id: 'emp-1', name: 'Fitra Romeo Winky', position: 'Senior Inspector' },
      { id: 'emp-2', name: 'Budi Santoso', position: 'Field Inspector' },
      { id: 'emp-3', name: 'Siti Rahma', position: 'AI Operator' },
    ];
  }
}

export interface MasterInspectionStatus {
  id: string;
  code: string;
  name: string;
  description?: string;
}

export async function fetchMasterInspectionStatusesApi(): Promise<MasterInspectionStatus[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/inspection-statuses`, { cache: 'no-store' });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && Array.isArray(json.data) && json.data.length > 0) {
      return json.data.map((st: any) => ({
        id: st.id,
        code: st.code || st.id,
        name: st.name || st.nama || st.code || 'Status',
        description: st.description || '',
      }));
    }
  } catch (err) {
    console.warn('[OtoScan API] Master statuses endpoint fallback:', err);
  }

  return [
    { id: '76d55bcc-baa5-4531-93e9-9d5ed102c72a', code: 'in_progress', name: 'In Progress (Berlangsung)' },
    { id: '5c48e104-6668-4981-8137-283820d4928a', code: 'pending', name: 'Menunggu Antrean' },
    { id: '529a193a-7a0b-442b-84c8-38b2ee02d855', code: 'completed', name: 'Completed (Selesai)' },
    { id: '43967378-e6af-4f9e-ac5a-ce7041c63dd5', code: 'failed', name: 'Gagal / Dibatalkan' },
  ];
}

// Safe JSON parser to handle plain text HTTP responses (like "Method Not Allowed" or "404 Not Found")
async function safeJsonParse(res: Response): Promise<any> {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    if (res.status === 405 || text.toLowerCase().includes('method not allowed')) {
      return { status: 'error', message: 'Method Not Allowed — Silakan restart backend Go (go run main.go) agar route PUT baru aktif.' };
    }
    if (res.status === 404 || text.toLowerCase().includes('cannot')) {
      return { status: 'error', message: 'Route API tidak ditemukan di server.' };
    }
    return { status: 'error', message: text || 'Respon dari server backend tidak valid' };
  }
}

// ─── ERROR SANITIZER ─────────────────────────────────────────────────────────
export function formatErrorMessage(msg: string): string {
  if (!msg) return 'Terjadi kesalahan pada sistem. Silakan coba lagi.';

  const lower = msg.toLowerCase();

  // Method not allowed / Unparsed plain text errors
  if (lower.includes('method not allowed')) {
    return 'Metode HTTP (PUT) belum aktif. Silakan restart server backend Go (Ctrl+C lalu go run main.go).';
  }
  if (lower.includes('unexpected token') || lower.includes('not valid json')) {
    return 'Gagal memproses respon server. Silakan restart server backend Go (go run main.go).';
  }

  // Duplicate key / unique constraint errors
  if (lower.includes('unique constraint') || lower.includes('duplicate key') || lower.includes('already registered')) {
    if (lower.includes('nopol') || lower.includes('vehicles_nopol_key') || lower.includes('license plate')) {
      return 'Nomor plat kendaraan (Nopol) ini sudah terdaftar di sistem. Silakan gunakan Nopol lain.';
    }
    if (lower.includes('email') || lower.includes('users_email_key')) {
      return 'Alamat email ini sudah terdaftar di sistem. Silakan gunakan email lain.';
    }
    return 'Data ini sudah pernah terdaftar di sistem.';
  }

  // Foreign key / relation constraint
  if (lower.includes('foreign key') || lower.includes('violates foreign key')) {
    return 'Data tidak dapat dipproses karena masih terikat dengan data transaksi lain.';
  }

  // Data not found
  if (lower.includes('not found') || lower.includes('tidak ditemukan')) {
    return 'Data yang Anda cari tidak ditemukan atau telah dihapus.';
  }

  // Bad request / Validation
  if (lower.includes('invalid') || lower.includes('required') || lower.includes('wajib')) {
    return 'Mohon periksa kembali kelengkapan formulir Anda.';
  }

  // Network / Fetch failed
  if (lower.includes('fetch') || lower.includes('network') || lower.includes('failed to fetch')) {
    return 'Gagal terhubung ke server backend. Pastikan server aktif.';
  }

  // General SQL / DB internal errors
  if (msg.includes('ERROR:') || msg.includes('SQLSTATE') || msg.includes('GORM')) {
    return 'Gagal memproses data. Terjadi kendala teknis pada database.';
  }

  return msg;
}

// ─── USER / CLIENT MAPPERS & API ───────────────────────────────────────────────
export function mapUserToClient(user: any): Client {
  return {
    id: user.id,
    name: user.name || 'Tanpa Nama',
    contactPerson: user.name || '—',
    phone: user.phone || '—',
    email: user.email || '—',
    address: user.address || '—',
    city: extractCityFromAddress(user.address),
    totalVehicles: user.vehicleCount ?? (user.vehicles ? user.vehicles.length : 0),
    status: 'active',
    createdAt: user.createdAt ? new Date(user.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

function extractCityFromAddress(addr?: string): string {
  if (!addr) return 'Indonesia';
  const parts = addr.split(',');
  if (parts.length > 1) {
    return parts[parts.length - 1].trim();
  }
  return addr;
}

export async function fetchUsersApi(): Promise<{ clients: Client[]; isMock: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && Array.isArray(json.data)) {
      const mapped = json.data.map(mapUserToClient);
      return { clients: mapped, isMock: false };
    }
    throw new Error(json.message || 'Invalid structure');
  } catch (err) {
    console.warn('[OtoScan API] Unable to connect to Go backend users, using fallback data:', err);
    return { clients: mockClients, isMock: true };
  }
}

export async function createUserApi(data: {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
}): Promise<Client> {
  try {
    const res = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) {
      return mapUserToClient(json.data);
    }
    throw new Error(formatErrorMessage(json.message || json.error || 'Gagal menambahkan klien'));
  } catch (err: any) {
    console.error('[OtoScan API] Create client failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function updateUserApi(
  id: string,
  data: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
  }
): Promise<Client> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) {
      return mapUserToClient(json.data);
    }
    throw new Error(formatErrorMessage(json.message || json.error || 'Gagal memperbarui data klien'));
  } catch (err: any) {
    console.error('[OtoScan API] Update client failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function deleteUserApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'DELETE',
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success') {
      return true;
    }
    throw new Error(formatErrorMessage(json.message || json.error || 'Gagal menghapus klien'));
  } catch (err: any) {
    console.error('[OtoScan API] Delete client failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}


// ─── VEHICLES MAPPERS & API ───────────────────────────────────────────────────
export function mapVehicleToFrontend(v: any): Vehicle {
  return {
    id: v.id,
    licensePlate: v.nopol || v.licensePlate || '—',
    brand: v.merk || v.brand || '—',
    model: v.tipe || v.model || '—',
    year: v.year || new Date().getFullYear(),
    color: v.jenis || v.color || 'Sedan',
    clientId: v.userId || v.clientId || '',
    clientName: v.user ? v.user.name : (v.clientName || 'Tanpa Pemilik'),
    status: 'active',
    lastInspection: v.lastInspection || null,
    totalInspections: v.totalInspections || 0,
    createdAt: v.createdAt ? new Date(v.createdAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
  };
}

export async function fetchVehiclesApi(): Promise<{ vehicles: Vehicle[]; isMock: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && Array.isArray(json.data)) {
      const mapped = json.data.map(mapVehicleToFrontend);
      return { vehicles: mapped, isMock: false };
    }
    throw new Error(json.message || 'Invalid structure');
  } catch (err) {
    console.warn('[OtoScan API] Unable to connect to Go backend vehicles, using fallback data:', err);
    return { vehicles: mockVehicles, isMock: true };
  }
}

export async function createVehicleApi(data: {
  userId?: string;
  nopol: string;
  merk: string;
  tipe: string;
  jenis: string;
}): Promise<Vehicle> {
  try {
    const res = await fetch(`${API_BASE_URL}/vehicles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) {
      return mapVehicleToFrontend(json.data);
    }
    throw new Error(formatErrorMessage(json.message || json.error || 'Gagal menambahkan kendaraan'));
  } catch (err: any) {
    console.error('[OtoScan API] Create vehicle failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function updateVehicleApi(
  id: string,
  data: {
    userId?: string;
    nopol?: string;
    merk?: string;
    tipe?: string;
    jenis?: string;
  }
): Promise<Vehicle> {
  try {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) {
      return mapVehicleToFrontend(json.data);
    }
    throw new Error(formatErrorMessage(json.message || json.error || 'Gagal memperbarui data kendaraan'));
  } catch (err: any) {
    console.error('[OtoScan API] Update vehicle failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function deleteVehicleApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/vehicles/${id}`, {
      method: 'DELETE',
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success') {
      return true;
    }
    throw new Error(formatErrorMessage(json.message || json.error || 'Gagal menghapus kendaraan'));
  } catch (err: any) {
    console.error('[OtoScan API] Delete vehicle failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}


// Helper to parse Indonesian & English angle names or image paths
function parseAngleKey(raw: string): 'front' | 'rear' | 'left' | 'right' | null {
  const s = (raw || '').toLowerCase();
  if (s.includes('depan') || s.includes('front')) return 'front';
  if (s.includes('belakang') || s.includes('rear') || s.includes('back')) return 'rear';
  if (s.includes('kiri') || s.includes('left')) return 'left';
  if (s.includes('kanan') || s.includes('right')) return 'right';
  return null;
}

// ─── INSPECTIONS MAPPERS & API ────────────────────────────────────────────────
export function mapInspectionToFrontend(ins: any): Inspection {
  const vehicle = ins.vehicle || {};
  const user = vehicle.user || {};
  const employee = ins.employee || {};
  const statusObj = ins.inspectionStatus || ins.inspection_status || {};
  const rawStatusText = `${statusObj.code || ''} ${statusObj.name || ''} ${statusObj.nama || ''} ${ins.status || ''}`.toLowerCase();

  let status: 'pending' | 'in_progress' | 'completed' | 'failed' = 'in_progress';
  if (rawStatusText.includes('pend') || rawStatusText.includes('tunggu') || rawStatusText.includes('antrean') || rawStatusText.includes('queue')) {
    status = 'pending';
  } else if (rawStatusText.includes('progress') || rawStatusText.includes('berlangsung') || rawStatusText.includes('jalan')) {
    status = 'in_progress';
  } else if (rawStatusText.includes('fail') || rawStatusText.includes('gagal') || rawStatusText.includes('batal') || rawStatusText.includes('cancel')) {
    status = 'failed';
  } else if (rawStatusText.includes('complete') || rawStatusText.includes('selesai') || rawStatusText.includes('done')) {
    status = 'completed';
  }

  const anglesMap: Record<'front' | 'rear' | 'left' | 'right', AngleCapture> = {
    front: { angle: 'front', imageUrl: null, resultUrl: null, damages: [], capturedAt: null },
    rear:  { angle: 'rear',  imageUrl: null, resultUrl: null, damages: [], capturedAt: null },
    left:  { angle: 'left',  imageUrl: null, resultUrl: null, damages: [], capturedAt: null },
    right: { angle: 'right', imageUrl: null, resultUrl: null, damages: [], capturedAt: null },
  };

  let totalDamages = 0;

  if (Array.isArray(ins.photos)) {
    // Group photos by resolved angleKey and take ONLY the latest photo per angle
    const latestPhotoPerAngle: Record<'front' | 'rear' | 'left' | 'right', any> = {
      front: null,
      rear: null,
      left: null,
      right: null,
    };

    ins.photos.forEach((photo: any, idx: number) => {
      const rawString = `${photo.angleCapture?.code || ''} ${photo.angleCapture?.name || ''} ${photo.imagePath || ''}`;
      const angleKey = (parseAngleKey(rawString) || (['front', 'rear', 'left', 'right'][idx % 4])) as 'front' | 'rear' | 'left' | 'right';

      const existing = latestPhotoPerAngle[angleKey];
      if (!existing || new Date(photo.createdAt || 0).getTime() >= new Date(existing.createdAt || 0).getTime()) {
        latestPhotoPerAngle[angleKey] = { ...photo, resolvedAngleKey: angleKey };
      }
    });

    // Process only the latest photo per angle
    (['front', 'rear', 'left', 'right'] as const).forEach((angleKey) => {
      const photo = latestPhotoPerAngle[angleKey];
      if (!photo) return;

      const targetAngle = anglesMap[angleKey];

      const fullImageUrl = photo.imagePath
        ? (photo.imagePath.startsWith('http') ? photo.imagePath : `${API_BASE_URL.replace('/api', '')}${photo.imagePath}`)
        : null;

      const cacheBuster = photo.updatedAt ? new Date(photo.updatedAt).getTime() : new Date(photo.createdAt || Date.now()).getTime();

      targetAngle.imageUrl = fullImageUrl ? `${fullImageUrl}?t=${cacheBuster}` : null;
      targetAngle.capturedAt = photo.createdAt || null;
      targetAngle.damages = [];

      if (Array.isArray(photo.damages)) {
        photo.damages.forEach((d: any, dIdx: number) => {
          totalDamages += d.quantity || 1;
          let bbox = { x: 100, y: 100, width: 60, height: 40 };
          try {
            if (d.bboxCoordinates) bbox = JSON.parse(d.bboxCoordinates);
          } catch {}

          targetAngle.damages.push({
            id: d.id || `d-${angleKey}-${dIdx}`,
            type: (d.damageType?.code || 'scratch') as any,
            severity: 'medium',
            confidence: 0.9,
            angle: angleKey,
            x: bbox.x ?? 100,
            y: bbox.y ?? 100,
            width: bbox.width ?? 60,
            height: bbox.height ?? 40,
          });

          if (d.annotatedImagePath) {
            const rawResultUrl = d.annotatedImagePath.startsWith('http')
              ? d.annotatedImagePath
              : `${API_BASE_URL.replace('/api', '')}${d.annotatedImagePath}`;
            targetAngle.resultUrl = `${rawResultUrl}?t=${cacheBuster}`;
          }
        });
      }
    });
  }

  return {
    id: ins.id,
    vehicleId: ins.vehicleId || vehicle.id || '',
    licensePlate: vehicle.nopol || '—',
    vehicleName: vehicle.merk ? `${vehicle.merk} ${vehicle.tipe || ''}` : 'Kendaraan',
    clientId: user.id || '',
    clientName: user.name || 'Tanpa Pemilik',
    inspectorName: employee.name || 'Petugas AI',
    status,
    angles: [anglesMap.front, anglesMap.rear, anglesMap.left, anglesMap.right],
    totalDamages,
    notes: ins.notes || '',
    startedAt: ins.createdAt || new Date().toISOString(),
    completedAt: ins.updatedAt || null,
    createdAt: ins.createdAt || new Date().toISOString(),
  };
}

export function formatDateTime(dateStr?: string | null): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;

  return d.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export async function fetchInspectionsApi(): Promise<{ inspections: Inspection[]; isMock: boolean }> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && Array.isArray(json.data)) {
      const mapped = json.data.map(mapInspectionToFrontend);
      return { inspections: mapped, isMock: false };
    }
    return { inspections: [], isMock: false };
  } catch (err) {
    console.error('[OtoScan API] Unable to connect to Go backend inspections:', err);
    return { inspections: [], isMock: false };
  }
}

export async function fetchInspectionByIDApi(id: string): Promise<Inspection | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      cache: 'no-store',
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) {
      return mapInspectionToFrontend(json.data);
    }
    return null;
  } catch (err) {
    console.error('[OtoScan API] Unable to fetch inspection detail:', err);
    return null;
  }
}

export async function createInspectionApi(data: {
  vehicleId?: string;
  nopol?: string;
  merk?: string;
  tipe?: string;
  jenis?: string;
  employeeId?: string;
  statusId?: string;
  status?: string;
}): Promise<Inspection> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) {
      return mapInspectionToFrontend(json.data);
    }
    throw new Error(formatErrorMessage(json.message || json.error || 'Gagal membuat inspeksi'));
  } catch (err: any) {
    console.error('[OtoScan API] Create inspection failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function updateInspectionApi(
  id: string,
  data: {
    vehicleId?: string;
    employeeId?: string;
    statusId?: string;
    status?: string;
  }
): Promise<Inspection> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) {
      return mapInspectionToFrontend(json.data);
    }
    throw new Error(formatErrorMessage(json.message || json.error || 'Gagal memperbarui inspeksi'));
  } catch (err: any) {
    console.error('[OtoScan API] Update inspection failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function uploadInspectionPhotoApi(
  inspectionId: string,
  file: File,
  angleName: string
): Promise<Inspection | null> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const angleLabelMap: Record<string, string> = {
      front: 'Depan',
      rear: 'Belakang',
      left: 'Kiri',
      right: 'Kanan',
    };
    const resolvedAngleName = angleLabelMap[angleName] || angleName;
    formData.append('angleName', resolvedAngleName);

    const res = await fetch(`${API_BASE_URL}/inspections/${inspectionId}/detect`, {
      method: 'POST',
      body: formData,
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success') {
      return await fetchInspectionByIDApi(inspectionId);
    }
    throw new Error(formatErrorMessage(json.message || 'Gagal memproses foto kendaraan dengan AI'));
  } catch (err: any) {
    console.error('[OtoScan API] Upload inspection photo failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function deleteInspectionApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/inspections/${id}`, {
      method: 'DELETE',
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success') {
      return true;
    }
    throw new Error(formatErrorMessage(json.message || json.error || 'Gagal menghapus inspeksi'));
  } catch (err: any) {
    console.error('[OtoScan API] Delete inspection failed:', err);
    throw new Error(formatErrorMessage(err.message));
  }
}


// ─── MASTER DATA API ──────────────────────────────────────────────────────────
export interface MasterItem {
  id: string;
  code?: string;
  name: string;
  description?: string;
  createdAt?: string;
}

export async function fetchDamageTypesApi(): Promise<MasterItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/damage-types`, { cache: 'no-store' });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && Array.isArray(json.data)) {
      return json.data;
    }
    return [];
  } catch {
    return [
      { id: 'dt-1', code: 'dent', name: 'Penyok (Dent)', description: 'Kerusakan penyok bodi kendaraan' },
      { id: 'dt-2', code: 'scratch', name: 'Goresan (Scratch)', description: 'Kerusakan goresan cat kendaraan' },
      { id: 'dt-3', code: 'crack', name: 'Retak (Crack)', description: 'Kerusakan retak atau patah' },
      { id: 'dt-4', code: 'glass_shatter', name: 'Kaca Pecah', description: 'Kerusakan pecah kaca kendaraan' },
    ];
  }
}

export async function createDamageTypeApi(data: { code: string; name: string; description?: string }): Promise<MasterItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/damage-types`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) return json.data;
    throw new Error(formatErrorMessage(json.message || 'Gagal menambah jenis kerusakan'));
  } catch (err: any) {
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function updateDamageTypeApi(id: string, data: { code?: string; name?: string; description?: string }): Promise<MasterItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/damage-types/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) return json.data;
    throw new Error(formatErrorMessage(json.message || 'Gagal memperbarui jenis kerusakan'));
  } catch (err: any) {
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function deleteDamageTypeApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/damage-types/${id}`, { method: 'DELETE' });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success') return true;
    throw new Error(formatErrorMessage(json.message || 'Gagal menghapus jenis kerusakan'));
  } catch (err: any) {
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function fetchAngleCapturesApi(): Promise<MasterItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/angle-captures`, { cache: 'no-store' });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && Array.isArray(json.data)) return json.data;
    return [];
  } catch {
    return [
      { id: 'ac-1', name: 'Tampak Depan', description: 'Sudut pemindaian depan kendaraan' },
      { id: 'ac-2', name: 'Tampak Belakang', description: 'Sudut pemindaian belakang kendaraan' },
      { id: 'ac-3', name: 'Tampak Kiri', description: 'Sudut pemindaian samping kiri kendaraan' },
      { id: 'ac-4', name: 'Tampak Kanan', description: 'Sudut pemindaian samping kanan kendaraan' },
    ];
  }
}

export async function createAngleCaptureApi(data: { name: string; description?: string }): Promise<MasterItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/angle-captures`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) return json.data;
    throw new Error(formatErrorMessage(json.message || 'Gagal menambah sudut pemindaian'));
  } catch (err: any) {
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function updateAngleCaptureApi(id: string, data: { name?: string; description?: string }): Promise<MasterItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/angle-captures/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) return json.data;
    throw new Error(formatErrorMessage(json.message || 'Gagal memperbarui sudut pemindaian'));
  } catch (err: any) {
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function deleteAngleCaptureApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/angle-captures/${id}`, { method: 'DELETE' });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success') return true;
    throw new Error(formatErrorMessage(json.message || 'Gagal menghapus sudut pemindaian'));
  } catch (err: any) {
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function fetchInspectionStatusesApi(): Promise<MasterItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/inspection-statuses`, { cache: 'no-store' });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && Array.isArray(json.data)) return json.data;
    return [];
  } catch {
    return [
      { id: 'st-1', code: 'pending', name: 'Menunggu', description: 'Inspeksi dalam antrean' },
      { id: 'st-2', code: 'inProgress', name: 'Berlangsung', description: 'Inspeksi sedang berjalan' },
      { id: 'st-3', code: 'completed', name: 'Selesai', description: 'Inspeksi telah selesai' },
    ];
  }
}

export async function createInspectionStatusApi(data: { code: string; name: string; description?: string }): Promise<MasterItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/inspection-statuses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) return json.data;
    throw new Error(formatErrorMessage(json.message || 'Gagal menambah status inspeksi'));
  } catch (err: any) {
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function updateInspectionStatusApi(id: string, data: { code?: string; name?: string; description?: string }): Promise<MasterItem> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/inspection-statuses/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success' && json.data) return json.data;
    throw new Error(formatErrorMessage(json.message || 'Gagal memperbarui status inspeksi'));
  } catch (err: any) {
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function deleteInspectionStatusApi(id: string): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE_URL}/master/inspection-statuses/${id}`, { method: 'DELETE' });
    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success') return true;
    throw new Error(formatErrorMessage(json.message || 'Gagal menghapus status inspeksi'));
  } catch (err: any) {
    throw new Error(formatErrorMessage(err.message));
  }
}

export async function detectInspectionPhotoPreviewApi(
  file: File
): Promise<{ status: string; predictions: any[]; totalDetections: number } | null> {
  try {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE_URL}/inspections/detect-preview`, {
      method: 'POST',
      body: formData,
    });

    const json = await safeJsonParse(res);
    if (res.ok && json.status === 'success') {
      return json;
    }
    return null;
  } catch (err: any) {
    console.error('[OtoScan API] Detect preview failed:', err);
    return null;
  }
}
