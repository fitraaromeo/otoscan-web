'use client';

import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Edit2, Trash2, X, RefreshCw, Layers, Camera, CheckCircle } from 'lucide-react';
import PageHeader from '@/app/_components/PageHeader';
import Modal from '@/app/_components/Modal';
import {
  fetchDamageTypesApi,
  createDamageTypeApi,
  updateDamageTypeApi,
  deleteDamageTypeApi,
  fetchAngleCapturesApi,
  createAngleCaptureApi,
  updateAngleCaptureApi,
  deleteAngleCaptureApi,
  fetchInspectionStatusesApi,
  createInspectionStatusApi,
  updateInspectionStatusApi,
  deleteInspectionStatusApi,
  formatErrorMessage,
  type MasterItem,
} from '@/app/_lib/api';

type TabType = 'damage-types' | 'angle-captures' | 'inspection-statuses';

function MasterFormFields({
  activeTab,
  form,
  setForm,
  errorMsg,
}: {
  activeTab: TabType;
  form: { code: string; name: string; description: string };
  setForm: React.Dispatch<React.SetStateAction<{ code: string; name: string; description: string }>>;
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
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {activeTab !== 'angle-captures' && (
          <div>
            <label className="form-label">Code *</label>
            <input
              className="form-input"
              placeholder={activeTab === 'damage-types' ? 'dent, scratch, crack...' : 'pending, inProgress...'}
              value={form.code}
              onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
              autoFocus
            />
          </div>
        )}

        <div>
          <label className="form-label">Master Name *</label>
          <input
            className="form-input"
            placeholder={
              activeTab === 'damage-types'
                ? 'Dent'
                : activeTab === 'angle-captures'
                ? 'Front View'
                : 'Pending'
            }
            value={form.name}
            onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
            autoFocus={activeTab === 'angle-captures'}
          />
        </div>

        <div>
          <label className="form-label">Description</label>
          <input
            className="form-input"
            placeholder="Short explanation..."
            value={form.description}
            onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          />
        </div>
      </div>
    </div>
  );
}

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<TabType>('damage-types');
  const [items, setItems] = useState<MasterItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<MasterItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MasterItem | null>(null);

  const [form, setForm] = useState({ code: '', name: '', description: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'damage-types') {
        const data = await fetchDamageTypesApi();
        setItems(data);
      } else if (activeTab === 'angle-captures') {
        const data = await fetchAngleCapturesApi();
        setItems(data);
      } else if (activeTab === 'inspection-statuses') {
        const data = await fetchInspectionStatusesApi();
        setItems(data);
      }
    } catch (err: any) {
      setErrorMsg(formatErrorMessage(err.message));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filtered = items.filter((i) => {
    const q = search.toLowerCase();
    return (
      (i.code && i.code.toLowerCase().includes(q)) ||
      i.name.toLowerCase().includes(q) ||
      (i.description && i.description.toLowerCase().includes(q))
    );
  });

  function openAdd() {
    setForm({ code: '', name: '', description: '' });
    setErrorMsg(null);
    setAddOpen(true);
  }

  function openEdit(item: MasterItem) {
    setForm({
      code: item.code || '',
      name: item.name,
      description: item.description || '',
    });
    setErrorMsg(null);
    setEditTarget(item);
  }

  async function handleSaveAdd() {
    setSaving(true);
    setErrorMsg(null);
    try {
      if (activeTab === 'damage-types') {
        await createDamageTypeApi(form);
      } else if (activeTab === 'angle-captures') {
        await createAngleCaptureApi({ name: form.name, description: form.description });
      } else if (activeTab === 'inspection-statuses') {
        await createInspectionStatusApi(form);
      }
      setAddOpen(false);
      loadData();
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
      if (activeTab === 'damage-types') {
        await updateDamageTypeApi(editTarget.id, form);
      } else if (activeTab === 'angle-captures') {
        await updateAngleCaptureApi(editTarget.id, { name: form.name, description: form.description });
      } else if (activeTab === 'inspection-statuses') {
        await updateInspectionStatusApi(editTarget.id, form);
      }
      setEditTarget(null);
      loadData();
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
      if (activeTab === 'damage-types') {
        await deleteDamageTypeApi(deleteTarget.id);
      } else if (activeTab === 'angle-captures') {
        await deleteAngleCaptureApi(deleteTarget.id);
      } else if (activeTab === 'inspection-statuses') {
        await deleteInspectionStatusApi(deleteTarget.id);
      }
      setItems((prev) => prev.filter((i) => i.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (err: any) {
      alert(formatErrorMessage(err.message));
    } finally {
      setSaving(false);
    }
  }

  const TABS = [
    { key: 'damage-types' as TabType, label: 'AI Damage Types', icon: <Layers size={14} /> },
    { key: 'angle-captures' as TabType, label: 'Scan Angles', icon: <Camera size={14} /> },
    { key: 'inspection-statuses' as TabType, label: 'Inspection Statuses', icon: <CheckCircle size={14} /> },
  ];

  return (
    <div style={{ width: '100%' }}>
      <PageHeader
        title="Master Data Management"
        subtitle="Manage system master data (/api/master)"
        stats={[{ label: 'total items', value: items.length }]}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <button className="btn btn-secondary" onClick={loadData} disabled={loading} title="Refresh Data">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <button className="btn btn-primary" onClick={openAdd}>
              <Plus size={16} />
              Add Master Item
            </button>
          </div>
        }
      />

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16, borderBottom: '1px solid var(--border)', paddingBottom: 10 }}>
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => {
              setActiveTab(tab.key);
              setSearch('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
              transition: 'all 0.15s ease',
              background: activeTab === tab.key ? 'var(--gradient)' : 'rgba(255,255,255,0.04)',
              color: activeTab === tab.key ? '#fff' : 'var(--text-2)',
            }}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search Bar */}
      <div className="card" style={{ padding: '14px 16px', marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)' }} />
          <input
            className="form-input"
            style={{ paddingLeft: 36 }}
            placeholder="Search code, name, or description..."
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
          {filtered.length} items
        </span>
      </div>

      {/* Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                {activeTab !== 'angle-captures' && <th>Code</th>}
                <th>Master Name</th>
                <th>Description</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                    <RefreshCw size={20} className="animate-spin" style={{ margin: '0 auto 8px', color: 'var(--accent)' }} />
                    Loading master data...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)', padding: '40px 0' }}>
                    No master items found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id}>
                    {activeTab !== 'angle-captures' && (
                      <td>
                        <span style={{ fontFamily: 'monospace', fontSize: 12, color: 'var(--accent-light)', fontWeight: 700, background: 'rgba(99,102,241,0.1)', padding: '3px 8px', borderRadius: 5 }}>
                          {item.code || '—'}
                        </span>
                      </td>
                    )}
                    <td>
                      <div style={{ fontWeight: 600, color: 'var(--text-1)', fontSize: 13 }}>
                        {item.name}
                      </div>
                    </td>
                    <td style={{ fontSize: 13, color: 'var(--text-2)' }}>
                      {item.description || '—'}
                    </td>
                    <td>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(item)} title="Edit">
                          <Edit2 size={14} style={{ color: 'var(--accent-light)' }} />
                        </button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleteTarget(item)} title="Delete">
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
      <Modal isOpen={addOpen} onClose={() => setAddOpen(false)} title="Add Master Data" subtitle={`Adding ${activeTab.replace('-', ' ')}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setAddOpen(false)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveAdd} disabled={!form.name.trim() || saving}>
              {saving ? 'Saving...' : 'Save Data'}
            </button>
          </>
        }
      >
        <MasterFormFields activeTab={activeTab} form={form} setForm={setForm} errorMsg={errorMsg} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editTarget} onClose={() => setEditTarget(null)} title="Edit Master Data" subtitle={editTarget?.name}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setEditTarget(null)} disabled={saving}>Cancel</button>
            <button className="btn btn-primary" onClick={handleSaveEdit} disabled={!form.name.trim() || saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        }
      >
        <MasterFormFields activeTab={activeTab} form={form} setForm={setForm} errorMsg={errorMsg} />
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Delete Master Data" size="sm"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)} disabled={saving}>Cancel</button>
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
            Delete &ldquo;{deleteTarget?.name}&rdquo;?
          </p>
          <p style={{ color: 'var(--text-3)', fontSize: 13, lineHeight: 1.6 }}>
            This action will remove master item data from the database (Soft Delete).
          </p>
        </div>
      </Modal>
    </div>
  );
}
