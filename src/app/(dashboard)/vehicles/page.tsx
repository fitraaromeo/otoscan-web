'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Car, X, RefreshCw, Radio } from 'lucide-react';
import PageHeader from '@/app/_components/PageHeader';
import Modal from '@/app/_components/Modal';
import { mockVehicles, mockClients } from '@/app/_lib/mock-data';
import type { Vehicle, Client } from '@/app/_lib/types';
import { fetchVehiclesApi, createVehicleApi, updateVehicleApi, deleteVehicleApi, fetchUsersApi, formatErrorMessage } from '@/app/_lib/api';

const BRANDS = ['Toyota', 'Honda', 'Daihatsu', 'Mitsubishi', 'Suzuki', 'Hyundai', 'Wuling', 'Yamaha', 'Other'];
const VEHICLE_TYPES = ['Sedan', 'SUV', 'MPV', 'Hatchback', 'Crossover', 'Coupe', 'Minivan', 'Pickup'];

const EMPTY = {
  licensePlate: '',
  brand: '',
  model: '',
  jenis: 'Sedan',
  clientId: '',
};

function VehicleFormFields({
  form,
  setForm,
  clientsList,
  errorMsg,
}: {
  form: typeof EMPTY;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY>>;
  clientsList: Client[];
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">License Plate Number *</label>
          <input
            className="form-input"
            placeholder="B 1234 ABC"
            value={form.licensePlate}
            onChange={(e) => setForm((prev) => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
            style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}
            autoFocus
          />
        </div>
        <div>
          <label className="form-label">Brand *</label>
          <select
            className="form-select"
            value={form.brand}
            onChange={(e) => setForm((prev) => ({ ...prev, brand: e.target.value }))}
          >
            <option value="">Select brand</option>
            {BRANDS.map((b) => <option key={b}>{b}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Model / Type *</label>
          <input
            className="form-input"
            placeholder="Avanza, Brio, Innova..."
            value={form.model}
            onChange={(e) => setForm((prev) => ({ ...prev, model: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Vehicle Type</label>
          <select
            className="form-select"
            value={form.jenis}
            onChange={(e) => setForm((prev) => ({ ...prev, jenis: e.target.value }))}
          >
            {VEHICLE_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Client / Owner</label>
          <select
            className="form-select"
            value={form.clientId}
            onChange={(e) => setForm((prev) => ({ ...prev, clientId: e.target.value }))}
          >
            <option value="">— No Owner —</option>
            {clientsList.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default function VehiclesPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(mockVehicles);
  const [clientsList, setClientsList] = useState<Client[]>(mockClients);
  const [loading, setLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [deleteVehicle, setDeleteVehicle] = useState<Vehicle | null>(null);

  const [form, setForm] = useState({ ...EMPTY });

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);

    const [{ vehicles: fetchedVehicles, isMock: vMock }, { clients: fetchedClients }] = await Promise.all([
      fetchVehiclesApi(),
      fetchUsersApi(),
    ]);

    setVehicles(fetchedVehicles);
    setClientsList(fetchedClients);
    setIsLiveApi(!vMock);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = vehicles.filter((v) => {
    return (
      v.licensePlate.toLowerCase().includes(search.toLowerCase()) ||
      v.brand.toLowerCase().includes(search.toLowerCase()) ||
      v.model.toLowerCase().includes(search.toLowerCase()) ||
      (v.clientName && v.clientName.toLowerCase().includes(search.toLowerCase()))
    );
  });

  function openAdd() {
    setForm({ ...EMPTY, clientId: clientsList[0]?.id || '' });
    setErrorMsg(null);
    setAddOpen(true);
  }

  function openEdit(v: Vehicle) {
    setForm({
      licensePlate: v.licensePlate,
      brand: v.brand,
      model: v.model,
      jenis: v.color || 'Sedan',
      clientId: v.clientId || '',
    });
    setErrorMsg(null);
    setEditVehicle(v);
  }

  async function handleSaveAdd() {
    setSaving(true);
    setErrorMsg(null);
    try {
      if (isLiveApi) {
        const created = await createVehicleApi({
          userId: form.clientId || undefined,
          nopol: form.licensePlate,
          merk: form.brand,
          tipe: form.model,
          jenis: form.jenis,
        });
        setVehicles((prev) => [created, ...prev]);
      } else {
        const client = clientsList.find((c) => c.id === form.clientId);
        const newVehicle: Vehicle = {
          id: `veh-${Date.now()}`,
          licensePlate: form.licensePlate,
          brand: form.brand,
          model: form.model,
          year: new Date().getFullYear(),
          color: form.jenis,
          clientId: form.clientId,
          clientName: client?.name ?? 'No Owner',
          status: 'active',
          lastInspection: null,
          totalInspections: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setVehicles((prev) => [newVehicle, ...prev]);
      }
      setAddOpen(false);
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editVehicle) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      if (isLiveApi) {
        const updated = await updateVehicleApi(editVehicle.id, {
          userId: form.clientId || undefined,
          nopol: form.licensePlate,
          merk: form.brand,
          tipe: form.model,
          jenis: form.jenis,
        });
        setVehicles((prev) => prev.map((v) => (v.id === editVehicle.id ? updated : v)));
      } else {
        const client = clientsList.find((c) => c.id === form.clientId);
        setVehicles((prev) =>
          prev.map((v) =>
            v.id === editVehicle.id
              ? {
                  ...v,
                  licensePlate: form.licensePlate,
                  brand: form.brand,
                  model: form.model,
                  color: form.jenis,
                  clientId: form.clientId,
                  clientName: client?.name ?? 'No Owner',
                }
              : v
          )
        );
      }
      setEditVehicle(null);
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteVehicle) return;
    setSaving(true);
    try {
      if (isLiveApi) {
        await deleteVehicleApi(deleteVehicle.id);
      }
      setVehicles((prev) => prev.filter((v) => v.id !== deleteVehicle.id));
      setDeleteVehicle(null);
    } catch (err: any) {
      alert(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Vehicle Management"
        subtitle="Manage fleet vehicles and client ownership"
        stats={[
          { label: 'total vehicles', value: vehicles.length },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary" onClick={loadData} disabled={loading} title="Refresh Data">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} />
              Add Vehicle
            </button>
          </div>
        }
      />

      <div
        className="card"
        style={{
          padding: '14px 16px',
          marginBottom: 16,
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search
            size={15}
            style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }}
          />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search license plate, brand, model, or owner name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)' }}>
              <X size={14} />
            </button>
          )}
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 'auto' }}>
          {filtered.length} vehicles
        </span>
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>License Plate</th>
                <th>Specification (Brand & Model)</th>
                <th>Owner (Client)</th>
                <th>Category</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                    Loading vehicle data from Go API backend...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                    No vehicles found
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Car size={16} style={{ color: 'var(--info)' }} />
                        </div>
                        <div>
                          <div
                            style={{
                              fontWeight: 800,
                              color: 'var(--text-1)',
                              fontSize: 14,
                              letterSpacing: '0.04em',
                              fontFamily: 'monospace',
                            }}
                          >
                            {v.licensePlate}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text-3)' }}>
                            {v.brand} {v.model}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td>
                      <div style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 600 }}>
                        {v.brand} {v.model}
                      </div>
                    </td>

                    <td style={{ fontSize: 13, maxWidth: 220 }}>
                      <span style={{ color: 'var(--text-2)', fontWeight: 500 }}>{v.clientName}</span>
                    </td>

                    <td>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: 'rgba(99,102,241,0.12)',
                          color: 'var(--accent-light)',
                        }}
                      >
                        {v.color || 'Car'}
                      </span>
                    </td>

                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {v.createdAt ? new Date(v.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>

                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)} title="Edit">
                          <Edit2 size={14} style={{ color: 'var(--accent-light)' }} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteVehicle(v)} title="Delete">
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

      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add New Vehicle" subtitle="Data will be saved directly to Go Fiber API (/api/vehicles)"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveAdd} disabled={!form.licensePlate.trim() || !form.brand || saving}>
              {saving ? 'Saving...' : 'Save Vehicle'}
            </button>
          </>
        }
      >
        <VehicleFormFields form={form} setForm={setForm} clientsList={clientsList} errorMsg={errorMsg} />
      </Modal>

      <Modal isOpen={!!editVehicle} onClose={() => setEditVehicle(null)} title="Edit Vehicle" subtitle={editVehicle?.licensePlate}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditVehicle(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <VehicleFormFields form={form} setForm={setForm} clientsList={clientsList} errorMsg={errorMsg} />
      </Modal>

      <Modal isOpen={!!deleteVehicle} onClose={() => setDeleteVehicle(null)} title="Delete Vehicle" size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteVehicle(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--danger-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <Trash2 size={24} style={{ color: 'var(--danger)' }} />
          </div>
          <p style={{ color: 'var(--text-1)', fontWeight: 600, marginBottom: 8 }}>
            Delete &ldquo;{deleteVehicle?.licensePlate}&rdquo;?
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.6 }}>
            This action will remove the vehicle and its inspection data from Go API (Soft Delete).
          </p>
        </div>
      </Modal>
    </div>
  );
}
