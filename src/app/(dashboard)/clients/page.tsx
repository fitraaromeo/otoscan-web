'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, Building2, Phone, Mail, MapPin, X, RefreshCw, Radio } from 'lucide-react';
import PageHeader from '@/app/_components/PageHeader';
import Modal from '@/app/_components/Modal';
import { mockClients } from '@/app/_lib/mock-data';
import type { Client } from '@/app/_lib/types';
import { fetchUsersApi, createUserApi, updateUserApi, deleteUserApi, formatErrorMessage } from '@/app/_lib/api';

const EMPTY_CLIENT: Omit<Client, 'id' | 'totalVehicles' | 'createdAt'> = {
  name: '',
  contactPerson: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  status: 'active',
};

// Reusable form fields component outside parent to prevent React remounting / focus loss
function ClientFormFields({
  form,
  setForm,
  errorMsg,
}: {
  form: typeof EMPTY_CLIENT;
  setForm: React.Dispatch<React.SetStateAction<typeof EMPTY_CLIENT>>;
  errorMsg: string | null;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Company / Client Name *</label>
          <input
            className="form-input"
            placeholder="PT. Example Indonesia"
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            autoFocus
          />
        </div>
        <div>
          <label className="form-label">Phone Number</label>
          <input
            className="form-input"
            placeholder="0812-345-6789"
            value={form.phone}
            onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div>
          <label className="form-label">Email</label>
          <input
            className="form-input"
            type="email"
            placeholder="contact@company.com"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
          />
        </div>
        <div style={{ gridColumn: '1 / -1' }}>
          <label className="form-label">Full Address</label>
          <input
            className="form-input"
            placeholder="Jl. Raya Pasar Minggu No. 15, Jakarta"
            value={form.address}
            onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [loading, setLoading] = useState(true);
  const [isLiveApi, setIsLiveApi] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');

  const [addOpen, setAddOpen] = useState(false);
  const [editClient, setEditClient] = useState<Client | null>(null);
  const [deleteClient, setDeleteClient] = useState<Client | null>(null);

  const [form, setForm] = useState({ ...EMPTY_CLIENT });

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    const { clients: fetchedClients, isMock } = await fetchUsersApi();
    setClients(fetchedClients);
    setIsLiveApi(!isMock);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = clients.filter((c) => {
    return (
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.contactPerson && c.contactPerson.toLowerCase().includes(search.toLowerCase())) ||
      (c.city && c.city.toLowerCase().includes(search.toLowerCase())) ||
      (c.address && c.address.toLowerCase().includes(search.toLowerCase()))
    );
  });

  function openAdd() {
    setForm({ ...EMPTY_CLIENT });
    setErrorMsg(null);
    setAddOpen(true);
  }

  function openEdit(c: Client) {
    setForm({
      name: c.name,
      contactPerson: c.contactPerson || c.name,
      phone: c.phone || '',
      email: c.email || '',
      address: c.address || '',
      city: c.city || '',
      status: c.status || 'active',
    });
    setErrorMsg(null);
    setEditClient(c);
  }

  async function handleSaveAdd() {
    setSaving(true);
    setErrorMsg(null);
    try {
      if (isLiveApi) {
        const created = await createUserApi({
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
        setClients((prev) => [created, ...prev]);
      } else {
        const newClient: Client = {
          ...form,
          id: `cli-${Date.now()}`,
          totalVehicles: 0,
          createdAt: new Date().toISOString().split('T')[0],
        };
        setClients((prev) => [newClient, ...prev]);
      }
      setAddOpen(false);
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveEdit() {
    if (!editClient) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      if (isLiveApi) {
        const updated = await updateUserApi(editClient.id, {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
        });
        setClients((prev) => prev.map((c) => (c.id === editClient.id ? updated : c)));
      } else {
        setClients((prev) =>
          prev.map((c) => (c.id === editClient.id ? { ...c, ...form } : c))
        );
      }
      setEditClient(null);
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteClient) return;
    setSaving(true);
    try {
      if (isLiveApi) {
        await deleteUserApi(deleteClient.id);
      }
      setClients((prev) => prev.filter((c) => c.id !== deleteClient.id));
      setDeleteClient(null);
    } catch (err: any) {
      alert(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  const totalVehicles = clients.reduce((s, c) => s + (c.totalVehicles || c.vehicleCount || 0), 0);

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Client Management"
        subtitle="Manage client data and vehicle fleet relationships (/api/users)"
        stats={[
          { label: 'total clients', value: clients.length },
          { label: 'total vehicles', value: totalVehicles, color: 'var(--info)' },
        ]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary" onClick={loadData} disabled={loading} title="Refresh Data">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} />
              Add Client
            </button>
          </div>
        }
      />

      {/* Search & Counter Filter */}
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
        {/* Search */}
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search
            size={15}
            style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-3)',
            }}
          />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search name, address, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: 10,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color: 'var(--text-3)',
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <span style={{ fontSize: 13, color: 'var(--text-3)', marginLeft: 'auto' }}>
          {filtered.length} clients
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Client</th>
                <th>Contact</th>
                <th>Address</th>
                <th>Total Vehicles</th>
                <th>Created At</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                    Loading data from Go API backend...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                    No clients found
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id}>
                    {/* Klien */}
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 36,
                            height: 36,
                            borderRadius: 10,
                            background: 'rgba(99,102,241,0.12)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Building2 size={16} style={{ color: 'var(--accent-light)' }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13 }}>
                            {c.name}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Kontak */}
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {c.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
                            <Phone size={11} style={{ color: 'var(--text-3)' }} /> {c.phone}
                          </span>
                        )}
                        {c.email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--text-2)' }}>
                            <Mail size={11} style={{ color: 'var(--text-3)' }} /> {c.email}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Alamat */}
                    <td style={{ maxWidth: 240 }}>
                      <span style={{ display: 'flex', alignItems: 'flex-start', gap: 5, fontSize: 12, color: 'var(--text-2)' }}>
                        <MapPin size={12} style={{ color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }} />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.address || '—'}
                        </span>
                      </span>
                    </td>

                    {/* Total Kendaraan */}
                    <td>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--accent-light)' }}>
                        {c.totalVehicles ?? c.vehicleCount ?? 0}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--text-3)', marginLeft: 4 }}>units</span>
                    </td>

                    {/* Dibuat */}
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-US', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      }) : '—'}
                    </td>

                    {/* Aksi */}
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => openEdit(c)}
                          title="Edit"
                        >
                          <Edit2 size={14} style={{ color: 'var(--accent-light)' }} />
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setDeleteClient(c)}
                          title="Delete"
                        >
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
      <Modal
        isOpen={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add New Client"
        subtitle="Data will be saved directly to Go Fiber API / PostgreSQL"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddOpen(false)} disabled={saving}>
              Cancel
            </button>
            <button
              className="btn btn-primary"
              onClick={handleSaveAdd}
              disabled={!form.name.trim() || saving}
            >
              {saving ? 'Saving...' : 'Save Client'}
            </button>
          </>
        }
      >
        <ClientFormFields form={form} setForm={setForm} errorMsg={errorMsg} />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editClient}
        onClose={() => setEditClient(null)}
        title="Edit Client"
        subtitle={editClient?.name}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditClient(null)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <ClientFormFields form={form} setForm={setForm} errorMsg={errorMsg} />
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal
        isOpen={!!deleteClient}
        onClose={() => setDeleteClient(null)}
        title="Delete Client"
        size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteClient(null)} disabled={saving}>
              Cancel
            </button>
            <button className="btn btn-danger" onClick={handleDelete} disabled={saving}>
              {saving ? 'Deleting...' : 'Delete'}
            </button>
          </>
        }
      >
        <div style={{ textAlign: 'center', padding: '8px 0' }}>
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--danger-bg)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <Trash2 size={24} style={{ color: 'var(--danger)' }} />
          </div>
          <p style={{ color: 'var(--text-1)', fontWeight: 600, marginBottom: 8 }}>
            Delete &ldquo;{deleteClient?.name}&rdquo;?
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.6 }}>
            This action will remove client data from the Go API database (Soft Delete).
          </p>
        </div>
      </Modal>
    </div>
  );
}
