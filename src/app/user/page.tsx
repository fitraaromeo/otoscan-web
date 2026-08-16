'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../_context/AuthContext';
import {
  fetchVehiclesApi,
  fetchInspectionsApi,
  createVehicleApi,
  updateMeApi,
  formatDateTime,
} from '../_lib/api';
import type { Vehicle, Inspection } from '../_lib/types';
import Modal from '../_components/Modal';
import { InspectionStatusBadge } from '../_components/Badge';

export default function UserPortalPage() {
  const router = useRouter();
  const { user, isLoading: isAuthLoading, logout, updateUser } = useAuth();

  const [activeTab, setActiveTab] = useState<'vehicles' | 'inspections' | 'profile'>('vehicles');

  // Data state
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(true);

  // Modals state
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);

  // Add Vehicle form
  const [newNopol, setNewNopol] = useState('');
  const [newMerk, setNewMerk] = useState('');
  const [newTipe, setNewTipe] = useState('');
  const [newJenis, setNewJenis] = useState('Sedan');
  const [addVehicleLoading, setAddVehicleLoading] = useState(false);
  const [addVehicleError, setAddVehicleError] = useState('');

  // Profile Edit form
  const [profileName, setProfileName] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileAddress, setProfileAddress] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Redirect if unauthenticated or admin
  useEffect(() => {
    if (!isAuthLoading) {
      if (!user) {
        router.replace('/login');
      } else if (user.role === 'admin') {
        router.replace('/dashboard');
      }
    }
  }, [user, isAuthLoading, router]);

  // Sync profile state when user changes
  useEffect(() => {
    if (user) {
      setProfileName(user.name || '');
      setProfilePhone(user.phone || '');
      setProfileAddress(user.address || '');
    }
  }, [user]);

  // Load user data (vehicles & inspections)
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!user) return;
      setIsLoadingData(true);
      try {
        const [vRes, iRes] = await Promise.all([fetchVehiclesApi(), fetchInspectionsApi()]);
        if (isMounted) {
          const userVehicles = vRes.vehicles.filter((v) => !v.clientId || v.clientId === user.id || user.role !== 'user');
          const userVehicleIds = new Set(userVehicles.map((v) => v.id));
          const userInspections = iRes.inspections.filter(
            (ins) => ins.clientId === user.id || userVehicleIds.has(ins.vehicleId)
          );

          setVehicles(userVehicles.length > 0 ? userVehicles : vRes.vehicles);
          setInspections(userInspections.length > 0 ? userInspections : iRes.inspections);
        }
      } catch (err) {
        console.error('[User Portal] Load data error:', err);
      } finally {
        if (isMounted) setIsLoadingData(false);
      }
    }

    if (user) {
      loadData();
    }
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleAddVehicleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddVehicleError('');
    if (!newNopol || !newMerk || !newTipe) {
      setAddVehicleError('License Plate, Brand, and Model are required.');
      return;
    }

    setAddVehicleLoading(true);
    try {
      const created = await createVehicleApi({
        userId: user?.id,
        nopol: newNopol.toUpperCase().trim(),
        merk: newMerk.trim(),
        tipe: newTipe.trim(),
        jenis: newJenis,
      });

      setVehicles((prev) => [created, ...prev]);
      setIsAddVehicleOpen(false);
      setNewNopol('');
      setNewMerk('');
      setNewTipe('');
    } catch (err: any) {
      setAddVehicleError(err.message || 'Failed to add new vehicle');
    } finally {
      setAddVehicleLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileError('');
    setProfileSuccess('');

    setProfileLoading(true);
    try {
      const payload: { name?: string; phone?: string; address?: string; password?: string } = {
        name: profileName,
        phone: profilePhone,
        address: profileAddress,
      };

      if (newPassword && newPassword.trim().length >= 6) {
        payload.password = newPassword.trim();
      }

      const updated = await updateMeApi(payload);
      updateUser(updated);
      setProfileSuccess('Profile updated successfully!');
      setNewPassword('');
    } catch (err: any) {
      setProfileError(err.message || 'Failed to update profile');
    } finally {
      setProfileLoading(false);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-[#0B0F17] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-cyan-400">
          <svg className="animate-spin w-8 h-8 text-cyan-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-medium text-slate-400">Loading Customer Portal...</span>
        </div>
      </div>
    );
  }

  const completedInspectionsCount = inspections.filter((i) => i.status === 'completed').length;
  const totalDamagesCount = inspections.reduce((acc, curr) => acc + (curr.totalDamages || 0), 0);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      {/* ─── CUSTOMER NAVBAR ─────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Logo & Portal Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 p-[1px] shadow-md shadow-cyan-500/20">
              <div className="w-full h-full bg-[#0F172A] rounded-[11px] flex items-center justify-center">
                <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-lg bg-gradient-to-r from-white to-cyan-300 bg-clip-text text-transparent">
                  OtoScan AI
                </span>
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 rounded-full">
                  Customer Portal
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">Automated Vehicle Inspection Service</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('vehicles')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'vehicles'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Vehicles ({vehicles.length})
            </button>
            <button
              onClick={() => setActiveTab('inspections')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'inspections'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Inspection History ({inspections.length})
            </button>
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'profile'
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-500 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              My Profile
            </button>
          </nav>

          {/* User Profile & Logout */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center text-white font-bold text-sm shadow-md">
                {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="hidden lg:block text-left">
                <p className="text-xs font-semibold text-white leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{user.email}</p>
              </div>
            </div>

            <button
              onClick={logout}
              title="Sign Out"
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-300 border border-slate-700/80 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher */}
      <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 py-2 flex items-center justify-around text-xs">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`py-1.5 px-3 rounded-lg font-medium ${
            activeTab === 'vehicles' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
          }`}
        >
          Vehicles ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('inspections')}
          className={`py-1.5 px-3 rounded-lg font-medium ${
            activeTab === 'inspections' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
          }`}
        >
          Inspections ({inspections.length})
        </button>
        <button
          onClick={() => setActiveTab('profile')}
          className={`py-1.5 px-3 rounded-lg font-medium ${
            activeTab === 'profile' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400'
          }`}
        >
          Profile
        </button>
      </div>

      {/* ─── MAIN CONTENT CONTAINER ────────────────────────────────────────── */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border border-slate-800/80 p-6 sm:p-8 shadow-xl">
          <div className="absolute right-0 top-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 text-xs font-medium mb-3">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                OtoScan AI Customer Portal
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-cyan-300 to-blue-400 bg-clip-text text-transparent">{user.name}</span>!
              </h2>
              <p className="text-sm text-slate-400 mt-1 max-w-xl">
                Monitor your vehicle condition, view YOLOv12 AI damage analysis reports, and request new inspections anytime.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                onClick={() => setIsAddVehicleOpen(true)}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm shadow-lg shadow-cyan-500/20 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add New Vehicle</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">My Registered Vehicles</p>
                <p className="text-2xl font-bold text-white mt-1">{vehicles.length}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
            </div>

            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Completed AI Inspections</p>
                <p className="text-2xl font-bold text-emerald-400 mt-1">{completedInspectionsCount}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>

            <div className="bg-slate-950/50 rounded-2xl p-4 border border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Total Damages Detected</p>
                <p className="text-2xl font-bold text-amber-400 mt-1">{totalDamagesCount} spots</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* ─── TAB 1: KENDARAAN SAYA ───────────────────────────────────────── */}
        {activeTab === 'vehicles' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">My Vehicles List</h3>
                <p className="text-xs text-slate-400">Select a vehicle to view inspection history or add details</p>
              </div>
            </div>

            {isLoadingData ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-44 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse p-5" />
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center">
                <div className="w-16 h-16 rounded-2xl bg-slate-800/80 text-slate-400 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h4 className="text-base font-semibold text-white">No Vehicles Registered Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Register your vehicle to start using OtoScan automated AI damage detection inspection features.
                </p>
                <button
                  onClick={() => setIsAddVehicleOpen(true)}
                  className="mt-5 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold text-xs rounded-xl transition-all inline-flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  <span>Register Vehicle Now</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {vehicles.map((v) => {
                  const vehicleInspections = inspections.filter((ins) => ins.vehicleId === v.id || ins.licensePlate === v.licensePlate);
                  return (
                    <div
                      key={v.id}
                      className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-2xl p-5 hover:border-cyan-500/40 transition-all duration-300 group flex flex-col justify-between"
                    >
                      <div>
                        {/* Header Plat */}
                        <div className="flex items-start justify-between mb-3">
                          <span className="px-3 py-1 rounded-lg bg-slate-950 border border-slate-700 font-mono font-bold text-sm tracking-wider text-amber-300">
                            {v.licensePlate}
                          </span>
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            Active
                          </span>
                        </div>

                        {/* Brand & Model */}
                        <h4 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {v.brand} {v.model}
                        </h4>
                        <p className="text-xs text-slate-400 mt-0.5">Manufacturing Year: {v.year || '—'}</p>

                        <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
                          <span>Total AI Scans:</span>
                          <span className="font-semibold text-white">{vehicleInspections.length} times</span>
                        </div>
                      </div>

                      <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between">
                        <button
                          onClick={() => {
                            setActiveTab('inspections');
                          }}
                          className="text-xs font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                        >
                          <span>View Scan History</span>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* ─── TAB 2: RIWAYAT INSPEKSI ─────────────────────────────────────── */}
        {activeTab === 'inspections' && (
          <section className="space-y-4">
            <div>
              <h3 className="text-lg font-bold text-white">AI Vehicle Inspection History</h3>
              <p className="text-xs text-slate-400">Damage spot detection scan results powered by YOLOv12 Neural Network</p>
            </div>

            {isLoadingData ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-24 bg-slate-900/60 rounded-2xl border border-slate-800 animate-pulse" />
                ))}
              </div>
            ) : inspections.length === 0 ? (
              <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-12 text-center">
                <p className="text-sm text-slate-400">No inspection records found for your vehicles.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {inspections.map((ins) => (
                  <div
                    key={ins.id}
                    className="bg-slate-900/80 backdrop-blur-md border border-slate-800 hover:border-slate-700 rounded-2xl p-5 transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-cyan-400 shrink-0">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-sm text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                            {ins.licensePlate}
                          </span>
                          <InspectionStatusBadge status={ins.status} />
                        </div>
                        <h4 className="text-base font-bold text-white mt-1">{ins.vehicleName}</h4>
                        <p className="text-xs text-slate-400 mt-0.5">
                          Scan Date: {formatDateTime(ins.startedAt || ins.createdAt)} • Inspector: {ins.inspectorName}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0 border-slate-800">
                      <div className="text-left md:text-right">
                        <p className="text-xs text-slate-400">Damages Detected</p>
                        <p className="text-base font-bold text-amber-400">{ins.totalDamages} spots</p>
                      </div>

                      <button
                        onClick={() => setSelectedInspection(ins)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
                      >
                        View Detailed Report
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ─── TAB 3: PROFIL SAYA ─────────────────────────────────────────── */}
        {activeTab === 'profile' && (
          <section className="max-w-2xl mx-auto space-y-6">
            <div className="bg-slate-900/80 backdrop-blur-md border border-slate-800 rounded-3xl p-6 sm:p-8">
              <h3 className="text-lg font-bold text-white mb-1">My Profile Settings</h3>
              <p className="text-xs text-slate-400 mb-6">Update your personal contact information and account password</p>

              {profileError && (
                <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
                  {profileError}
                </div>
              )}
              {profileSuccess && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs">
                  {profileSuccess}
                </div>
              )}

              <form onSubmit={handleProfileSave} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Email Address (Account)
                  </label>
                  <input
                    type="email"
                    disabled
                    value={user.email}
                    className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-slate-800/80 rounded-xl text-slate-400 text-sm cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    value={profileName}
                    onChange={(e) => setProfileName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Phone / WhatsApp Number
                  </label>
                  <input
                    type="text"
                    value={profilePhone}
                    onChange={(e) => setProfilePhone(e.target.value)}
                    placeholder="+62812xxxxxxxx"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Full Address
                  </label>
                  <input
                    type="text"
                    value={profileAddress}
                    onChange={(e) => setProfileAddress(e.target.value)}
                    placeholder="City / Residential address"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-4 border-t border-slate-800">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Change Password (Optional)
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Leave blank to keep current password"
                    className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-semibold text-sm rounded-xl shadow-lg shadow-cyan-500/20 transition-all disabled:opacity-50 mt-4"
                >
                  {profileLoading ? 'Saving Profile...' : 'Save Profile Changes'}
                </button>
              </form>
            </div>
          </section>
        )}
      </main>

      {/* ─── MODAL: TAMBAH KENDARAAN BARU ──────────────────────────────────── */}
      <Modal
        isOpen={isAddVehicleOpen}
        onClose={() => setIsAddVehicleOpen(false)}
        title="Register New Vehicle"
      >
        <form onSubmit={handleAddVehicleSubmit} className="space-y-4">
          {addVehicleError && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs">
              {addVehicleError}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">License Plate Number</label>
            <input
              type="text"
              required
              placeholder="e.g. B 1234 ABC"
              value={newNopol}
              onChange={(e) => setNewNopol(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500 uppercase font-mono"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Vehicle Brand</label>
              <input
                type="text"
                required
                placeholder="e.g. Toyota"
                value={newMerk}
                onChange={(e) => setNewMerk(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Type / Model</label>
              <input
                type="text"
                required
                placeholder="e.g. Avanza Veloz"
                value={newTipe}
                onChange={(e) => setNewTipe(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">Body Type / Category</label>
            <select
              value={newJenis}
              onChange={(e) => setNewJenis(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:border-cyan-500"
            >
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="MPV">MPV</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Coupe">Coupe / Sport</option>
              <option value="Truk / PickUp">Truck / PickUp</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={() => setIsAddVehicleOpen(false)}
              className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addVehicleLoading}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all disabled:opacity-50"
            >
              {addVehicleLoading ? 'Saving...' : 'Save Vehicle'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ─── MODAL: LAPORAN DETAIL INSPEKSI ────────────────────────────────── */}
      {selectedInspection && (
        <Modal
          isOpen={!!selectedInspection}
          onClose={() => setSelectedInspection(null)}
          title={`Inspection Detailed Report — ${selectedInspection.licensePlate}`}
        >
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div>
                <p className="text-slate-400">Vehicle: <span className="text-white font-semibold">{selectedInspection.vehicleName}</span></p>
                <p className="text-slate-400 mt-0.5">Scan Date: <span className="text-white">{formatDateTime(selectedInspection.startedAt)}</span></p>
              </div>
              <InspectionStatusBadge status={selectedInspection.status} />
            </div>

            <div>
              <h4 className="font-semibold text-slate-200 mb-2">Camera Angle Captures:</h4>
              <div className="grid grid-cols-2 gap-2">
                {selectedInspection.angles.map((ang) => (
                  <div key={ang.angle} className="bg-slate-950 p-2 rounded-xl border border-slate-800 text-center">
                    <p className="capitalize font-semibold text-slate-300 mb-1.5">{ang.angle} Angle</p>
                    {ang.resultUrl || ang.imageUrl ? (
                      <img
                        src={ang.resultUrl || ang.imageUrl || ''}
                        alt={`${ang.angle} Angle`}
                        className="w-full h-24 object-cover rounded-lg border border-slate-800"
                      />
                    ) : (
                      <div className="w-full h-24 bg-slate-900 rounded-lg flex items-center justify-center text-slate-600">
                        No image available
                      </div>
                    )}
                    <span className="text-[10px] text-amber-400 mt-1 block">
                      {ang.damages.length} damages detected
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {selectedInspection.notes && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-slate-400">Inspector Notes:</p>
                <p className="text-slate-200 mt-1">{selectedInspection.notes}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
