'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Plus,
  Search,
  Eye,
  Trash2,
  Edit2,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Cpu,
  RefreshCw,
  X,
  Camera,
} from 'lucide-react';
import PageHeader from '@/app/_components/PageHeader';
import Modal from '@/app/_components/Modal';
import { InspectionStatusBadge } from '@/app/_components/Badge';
import { mockInspections } from '@/app/_lib/mock-data';
import type { Inspection, Vehicle } from '@/app/_lib/types';
import {
  fetchInspectionsApi,
  createInspectionApi,
  updateInspectionApi,
  deleteInspectionApi,
  fetchVehiclesApi,
  fetchEmployeesApi,
  fetchMasterInspectionStatusesApi,
  Employee,
  MasterInspectionStatus,
  formatErrorMessage,
  formatDateTime,
} from '@/app/_lib/api';

type StatusFilter = 'all' | 'in_progress' | 'completed' | 'failed' | 'pending';

function SearchableVehicleSelect({
  vehiclesList,
  selectedVehicleId,
  onSelectVehicle,
}: {
  vehiclesList: Vehicle[];
  selectedVehicleId: string;
  onSelectVehicle: (v: Vehicle | null) => void;
}) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const selectedVehicle = vehiclesList.find((v) => v.id === selectedVehicleId);

  const filtered = vehiclesList.filter((v) => {
    const q = query.toLowerCase();
    return (
      v.licensePlate.toLowerCase().includes(q) ||
      v.brand.toLowerCase().includes(q) ||
      v.model.toLowerCase().includes(q) ||
      (v.clientName || '').toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ position: 'relative' }}>
      <label className="form-label">Search & Select Registered Vehicle 🚗</label>
      <div style={{ position: 'relative' }}>
        <input
          className="form-input"
          placeholder="Type license plate / brand / client to search..."
          value={selectedVehicle ? `${selectedVehicle.licensePlate} — ${selectedVehicle.brand} ${selectedVehicle.model} (${selectedVehicle.clientName})` : query}
          onChange={(e) => {
            setQuery(e.target.value);
            onSelectVehicle(null);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          style={{ paddingRight: selectedVehicle ? 36 : 12 }}
        />
        {selectedVehicle && (
          <button
            type="button"
            onClick={() => {
              onSelectVehicle(null);
              setQuery('');
            }}
            style={{
              position: 'absolute',
              right: 10,
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'none',
              border: 'none',
              color: 'var(--text-3)',
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {isOpen && !selectedVehicle && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            zIndex: 50,
            marginTop: 4,
            maxHeight: 180,
            overflowY: 'auto',
            borderRadius: 8,
            background: '#131b2e',
            border: '1px solid var(--border)',
            boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
          }}
        >
          {filtered.length === 0 ? (
            <div style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-3)' }}>
              Vehicle not found. Type license plate below to create new.
            </div>
          ) : (
            filtered.map((v) => (
              <div
                key={v.id}
                onClick={() => {
                  onSelectVehicle(v);
                  setIsOpen(false);
                }}
                style={{
                  padding: '9px 12px',
                  cursor: 'pointer',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(99,102,241,0.15)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <div>
                  <span style={{ fontWeight: 700, color: 'var(--accent-light)', fontFamily: 'monospace', fontSize: 13 }}>
                    {v.licensePlate}
                  </span>
                  <span style={{ color: 'var(--text-1)', fontSize: 13, marginLeft: 8 }}>
                    {v.brand} {v.model}
                  </span>
                </div>
                <span style={{ fontSize: 11, color: 'var(--text-3)' }}>{v.clientName}</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function InspectionFormFields({
  form,
  setForm,
  vehiclesList,
  employeesList,
  statusesList,
  errorMsg,
}: {
  form: { vehicleId: string; employeeId: string; statusId: string; status: string; nopol: string; merk: string; tipe: string; jenis: string };
  setForm: React.Dispatch<
    React.SetStateAction<{ vehicleId: string; employeeId: string; statusId: string; status: string; nopol: string; merk: string; tipe: string; jenis: string }>
  >;
  vehiclesList: Vehicle[];
  employeesList: Employee[];
  statusesList: MasterInspectionStatus[];
  errorMsg: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {errorMsg && (
        <div
          style={{
            padding: '10px 14px',
            borderRadius: 8,
            background: 'var(--danger-bg)',
            color: 'var(--danger)',
            fontSize: 13,
            border: '1px solid rgba(239, 68, 68, 0.2)',
          }}
        >
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Select Inspector / Petugas */}
      <div>
        <label className="form-label">Select Inspector Officer 👤</label>
        <select
          className="form-input"
          value={form.employeeId}
          onChange={(e) => setForm((prev) => ({ ...prev, employeeId: e.target.value }))}
        >
          <option value="">-- Select Inspector Officer --</option>
          {employeesList.map((emp) => (
            <option key={emp.id} value={emp.id}>
              {emp.name} ({emp.position || 'Inspector'})
            </option>
          ))}
        </select>
      </div>

      {/* Searchable Existing Vehicle */}
      <SearchableVehicleSelect
        vehiclesList={vehiclesList}
        selectedVehicleId={form.vehicleId}
        onSelectVehicle={(v) => {
          if (v) {
            setForm((prev) => ({
              ...prev,
              vehicleId: v.id,
              nopol: v.licensePlate,
              merk: v.brand,
              tipe: v.model,
              jenis: v.color || 'Car',
            }));
          } else {
            setForm((prev) => ({ ...prev, vehicleId: '' }));
          }
        }}
      />

      {/* Select Status Inspeksi */}
      <div>
        <label className="form-label">Initial Inspection Status 📋</label>
        <select
          className="form-input"
          value={form.statusId || form.status}
          onChange={(e) => {
            const val = e.target.value;
            const found = statusesList.find((s) => s.id === val || s.code === val);
            setForm((prev) => ({
              ...prev,
              statusId: val,
              status: found ? found.code : val,
            }));
          }}
        >
          {statusesList.map((st) => (
            <option key={st.id} value={st.id}>
              {st.name}
            </option>
          ))}
        </select>
      </div>

      {/* Manual Input Fields */}
      {!form.vehicleId && (
        <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', marginTop: 4 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--accent-light)', marginBottom: 10 }}>
            📝 Manual Vehicle Entry (Unregistered)
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label className="form-label">License Plate *</label>
              <input
                className="form-input"
                placeholder="B 1234 ABC"
                value={form.nopol}
                onChange={(e) => setForm((prev) => ({ ...prev, nopol: e.target.value.toUpperCase() }))}
                style={{ textTransform: 'uppercase', fontFamily: 'monospace' }}
              />
            </div>
            <div>
              <label className="form-label">Brand *</label>
              <input
                className="form-input"
                placeholder="Toyota / Honda"
                value={form.merk}
                onChange={(e) => setForm((prev) => ({ ...prev, merk: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Model / Type</label>
              <input
                className="form-input"
                placeholder="Avanza / Brio"
                value={form.tipe}
                onChange={(e) => setForm((prev) => ({ ...prev, tipe: e.target.value }))}
              />
            </div>
            <div>
              <label className="form-label">Category</label>
              <input
                className="form-input"
                placeholder="Car / SUV / Motorcycle"
                value={form.jenis}
                onChange={(e) => setForm((prev) => ({ ...prev, jenis: e.target.value }))}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [vehiclesList, setVehiclesList] = useState<Vehicle[]>([]);
  const [employeesList, setEmployeesList] = useState<Employee[]>([]);
  const [statusesList, setStatusesList] = useState<MasterInspectionStatus[]>([]);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Inspection | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Inspection | null>(null);

  const [form, setForm] = useState<{
    vehicleId: string;
    employeeId: string;
    statusId: string;
    status: string;
    nopol: string;
    merk: string;
    tipe: string;
    jenis: string;
  }>({
    vehicleId: '',
    employeeId: '',
    statusId: '',
    status: 'in_progress',
    nopol: '',
    merk: '',
    tipe: '',
    jenis: 'Car',
  });

  const [editStatusId, setEditStatusId] = useState<string>('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [insRes, vehRes, empRes, stRes] = await Promise.all([
        fetchInspectionsApi(),
        fetchVehiclesApi(),
        fetchEmployeesApi(),
        fetchMasterInspectionStatusesApi(),
      ]);
      setInspections(insRes.inspections);
      setIsLiveApi(!insRes.isMock);
      setVehiclesList(vehRes.vehicles);
      setEmployeesList(empRes);
      setStatusesList(stRes);
    } catch (err: any) {
      console.error('[OtoScan API] Error loading inspections page data:', err);
      setInspections([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Count per status
  const counts = {
    all: inspections.length,
    in_progress: inspections.filter((i) => i.status === 'in_progress').length,
    completed: inspections.filter((i) => i.status === 'completed').length,
    failed: inspections.filter((i) => i.status === 'failed').length,
    pending: inspections.filter((i) => i.status === 'pending').length,
  };

  const filtered = inspections.filter((ins) => {
    const matchTab = activeTab === 'all' || ins.status === activeTab;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      ins.id.toLowerCase().includes(q) ||
      ins.licensePlate.toLowerCase().includes(q) ||
      ins.vehicleName.toLowerCase().includes(q) ||
      ins.clientName.toLowerCase().includes(q) ||
      ins.inspectorName.toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  function openAdd() {
    const defaultStatus = statusesList[0];
    setForm({
      vehicleId: '',
      employeeId: employeesList[0]?.id || '',
      statusId: defaultStatus?.id || '',
      status: defaultStatus?.code || 'in_progress',
      nopol: '',
      merk: '',
      tipe: '',
      jenis: 'Car',
    });
    setErrorMsg(null);
    setAddOpen(true);
  }

  function openEdit(ins: Inspection) {
    const matchedSt = statusesList.find((s) => s.code === ins.status || s.id === ins.status);
    setEditStatusId(matchedSt ? matchedSt.id : statusesList[0]?.id || '');
    setErrorMsg(null);
    setEditTarget(ins);
  }

  async function handleSaveAdd() {
    setSaving(true);
    setErrorMsg(null);
    try {
      if (isLiveApi) {
        const created = await createInspectionApi({
          vehicleId: form.vehicleId || undefined,
          employeeId: form.employeeId || undefined,
          statusId: form.statusId || undefined,
          status: form.status,
          nopol: form.nopol,
          merk: form.merk,
          tipe: form.tipe,
          jenis: form.jenis,
        });
        setInspections((prev) => [created, ...prev]);
      } else {
        const selectedEmp = employeesList.find((e) => e.id === form.employeeId);
        const newIns: Inspection = {
          id: `ins-${Date.now().toString().slice(-4)}`,
          vehicleId: form.vehicleId || 'veh-1',
          licensePlate: form.nopol || 'N 1234 XX',
          vehicleName: `${form.merk} ${form.tipe}`.trim() || 'New Vehicle',
          clientId: 'cli-1',
          clientName: 'Registered Client',
          inspectorName: selectedEmp?.name || 'AI Inspector Officer',
          status: (form.status || 'in_progress') as any,
          angles: [
            { angle: 'front', imageUrl: null, resultUrl: null, damages: [], capturedAt: null },
            { angle: 'rear', imageUrl: null, resultUrl: null, damages: [], capturedAt: null },
            { angle: 'left', imageUrl: null, resultUrl: null, damages: [], capturedAt: null },
            { angle: 'right', imageUrl: null, resultUrl: null, damages: [], capturedAt: null },
          ],
          totalDamages: 0,
          notes: '',
          startedAt: new Date().toISOString(),
          completedAt: null,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setInspections((prev) => [newIns, ...prev]);
      }
      setAddOpen(false);
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editTarget) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const selectedSt = statusesList.find((s) => s.id === editStatusId);
      if (isLiveApi) {
        const updated = await updateInspectionApi(editTarget.id, {
          statusId: editStatusId,
          status: selectedSt ? selectedSt.code : editTarget.status,
        });
        setInspections((prev) => prev.map((i) => (i.id === editTarget.id ? updated : i)));
      } else {
        setInspections((prev) =>
          prev.map((i) => (i.id === editTarget.id ? { ...i, status: (selectedSt?.code || editTarget.status) as any } : i))
        );
      }
      setEditTarget(null);
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      if (isLiveApi) {
        await deleteInspectionApi(deleteTarget.id);
      }
      setInspections((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  const totalDamages = inspections.reduce((sum, i) => sum + i.totalDamages, 0);

  const TABS: { key: StatusFilter; label: string; count: number; icon: React.ReactNode }[] = [
    { key: 'all', label: 'All Sessions', count: counts.all, icon: <Camera size={14} /> },
    { key: 'in_progress', label: 'In Progress', count: counts.in_progress, icon: <Cpu size={14} /> },
    { key: 'completed', label: 'Completed', count: counts.completed, icon: <CheckCircle2 size={14} /> },
    { key: 'pending', label: 'Pending', count: counts.pending, icon: <Clock size={14} /> },
    { key: 'failed', label: 'Failed / Cancelled', count: counts.failed, icon: <XCircle size={14} /> },
  ];

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Inspection Management"
        subtitle="List of 4-side AI vehicle inspection sessions (/api/inspections)"
        stats={[
          { label: 'total sessions', value: inspections.length },
          { label: 'total AI damages', value: totalDamages, color: 'var(--warning)' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary" onClick={loadData} disabled={loading} title="Refresh Data">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} />
              New Inspection
            </button>
          </div>
        }
      />

      {/* Quick stat cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 12,
          marginBottom: 20,
        }}
      >
        {[
          { label: 'Active Sessions', value: counts.in_progress, color: 'var(--info)', bg: 'var(--info-bg)', icon: Cpu },
          { label: 'Completed Inspections', value: counts.completed, color: 'var(--success)', bg: 'var(--success-bg)', icon: CheckCircle2 },
          { label: 'Total AI Findings', value: totalDamages, color: 'var(--warning)', bg: 'var(--warning-bg)', icon: AlertCircle },
          { label: 'Failed / Cancelled', value: counts.failed, color: 'var(--danger)', bg: 'var(--danger-bg)', icon: XCircle },
        ].map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: s.bg,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: s.color,
                  flexShrink: 0,
                }}
              >
                <Icon size={20} />
              </div>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 3 }}>{s.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls & Filter Tabs */}
      <div className="card" style={{ padding: '16px 20px', marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          {/* Status Tabs */}
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    padding: '7px 14px',
                    borderRadius: 8,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    transition: 'all 0.15s ease',
                    background: isActive ? 'var(--gradient)' : 'rgba(255,255,255,0.04)',
                    color: isActive ? '#fff' : 'var(--text-2)',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  <span
                    style={{
                      background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.08)',
                      color: isActive ? '#fff' : 'var(--text-3)',
                      fontSize: 10,
                      padding: '1px 6px',
                      borderRadius: 999,
                    }}
                  >
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div style={{ position: 'relative', width: 240 }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
            <input
              className="form-input"
              style={{ paddingLeft: 32, fontSize: 13 }}
              placeholder="Search license plate, client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}
              >
                <X size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Vehicle</th>
                <th>Client / Owner</th>
                <th>Inspector</th>
                <th>AI Damages</th>
                <th>Date</th>
                <th>Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                    Loading inspection data from Go API backend...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                    No inspection data found
                  </td>
                </tr>
              ) : (
                filtered.map((ins) => (
                  <tr key={ins.id}>
                    {/* Kendaraan */}
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-1)', fontSize: 13, letterSpacing: '0.04em', fontFamily: 'monospace' }}>
                        {ins.licensePlate}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)' }}>{ins.vehicleName}</div>
                    </td>

                    {/* Klien */}
                    <td style={{ fontSize: 13, fontWeight: 500 }}>{ins.clientName}</td>

                    {/* Inspektor */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: '50%', background: 'var(--gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                          {(ins.inspectorName || 'AI Inspector').split(' ').map((w) => w[0]).join('').slice(0, 2)}
                        </div>
                        <span style={{ fontSize: 12 }}>{ins.inspectorName}</span>
                      </div>
                    </td>

                    {/* Kerusakan */}
                    <td>
                      {ins.totalDamages > 0 ? (
                        <span style={{
                          fontWeight: 700, fontSize: 14,
                          color: ins.totalDamages > 2 ? 'var(--danger)' : 'var(--warning)',
                        }}>
                          {ins.totalDamages}
                          <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 400, marginLeft: 4 }}>findings</span>
                        </span>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                          {ins.status === 'completed' ? '✅ Clean' : '—'}
                        </span>
                      )}
                    </td>

                    {/* Tanggal & Waktu */}
                    <td style={{ fontSize: 12 }}>
                      {formatDateTime(ins.createdAt)}
                    </td>

                    {/* Status */}
                    <td><InspectionStatusBadge status={ins.status} /></td>

                    {/* Aksi */}
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <Link
                          href={`/inspections/${ins.id}`}
                          className="btn btn-ghost btn-sm"
                          title="View Report Detail"
                        >
                          <Eye size={14} style={{ color: 'var(--accent-light)' }} />
                        </Link>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(ins)} title="Edit Status">
                          <Edit2 size={14} style={{ color: 'var(--accent-light)' }} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(ins)} title="Delete">
                          <Trash2 size={14} style={{ color: 'var(--danger)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Create Vehicle Inspection" subtitle="Select vehicle to start inspection session"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveAdd} disabled={(!form.vehicleId && !form.nopol.trim()) || saving}>
              {saving ? 'Processing...' : 'Start Inspection'}
            </button>
          </>
        }
      >
        <InspectionFormFields form={form} setForm={setForm} vehiclesList={vehiclesList} employeesList={employeesList} statusesList={statusesList} errorMsg={errorMsg} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Inspection Session" subtitle={`License Plate: ${editTarget?.licensePlate} — ${editTarget?.vehicleName}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditTarget(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {errorMsg && (
            <div
              style={{
                padding: '10px 14px',
                borderRadius: 8,
                background: 'var(--danger-bg)',
                color: 'var(--danger)',
                fontSize: 13,
                border: '1px solid rgba(239, 68, 68, 0.2)',
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}
          <div>
            <label className="form-label">Inspection Status *</label>
            <select
              className="form-input"
              value={editStatusId}
              onChange={(e) => setEditStatusId(e.target.value)}
            >
              {statusesList.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Inspection" size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete Permanently'}
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trash2 size={24} style={{ color: 'var(--danger)' }} />
          </div>
          <p style={{ color: 'var(--text-1)', fontWeight: 600, marginBottom: 8 }}>
            Delete vehicle inspection {deleteTarget?.licensePlate}?
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.6 }}>
            Vehicle: {deleteTarget?.vehicleName}
            <br />
            All photos and AI detection results will be deleted (Soft Delete).
          </p>
        </div>
      </Modal>
    </div>
  );
}
