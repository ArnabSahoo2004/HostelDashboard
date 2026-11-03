import React, { useState, useEffect, useMemo } from 'react';
import {
  Settings as SettingsIcon,
  Wifi,
  WifiOff,
  Send,
  MessageSquare,
  ShieldCheck,
  RefreshCw,
  Phone,
  Users,
  UserCheck,
  Filter,
  Search,
  CheckSquare,
  Square,
  X,
  Check
} from 'lucide-react';
import pb from '../api/client';
import {
  checkWhatsAppConnection,
  getWhatsAppConfig,
  sendBulkBroadcast,
  sendWhatsAppMessage,
  formatPhoneNumber,
  type WhatsAppStatus,
  type WhatsAppConfig
} from '../services/whatsapp';
import type { Resident as ResidentType, Room as RoomType } from '../types';

export default function WhatsApp() {
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [progress, setProgress] = useState<{ current: number; total: number } | null>(null);
  const [alert, setAlert] = useState<{ type: 'success' | 'error' | 'warning'; msg: string } | null>(null);

  // Connection State
  const [checkingConn, setCheckingConn] = useState(true);
  const [config, setConfig] = useState<WhatsAppConfig | null>(null);
  const [status, setStatus] = useState<WhatsAppStatus | null>(null);

  // Resident & Filter State
  const [residents, setResidents] = useState<ResidentType[]>([]);
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [audienceMode, setAudienceMode] = useState<'all' | 'filtered'>('all');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRoom, setFilterRoom] = useState('');
  const [filterFloor, setFilterFloor] = useState('');

  // Test Message State
  const [testPhone, setTestPhone] = useState('');
  const [testSending, setTestSending] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  const templates = [
    "Notice: Water supply will be suspended tomorrow from 10 AM to 12 PM due to scheduled maintenance.",
    "Gentle Reminder: Please ensure all outstanding rent dues for this month are cleared by the 5th.",
    "Alert: General maintenance work is scheduled for the common areas today. Sorry for the inconvenience.",
    "Notice: The main gate will be closed at 10 PM tonight. Please return on time."
  ];

  const verifyConnection = async () => {
    setCheckingConn(true);
    try {
      const cfg = await getWhatsAppConfig();
      setConfig(cfg);
      if (cfg.isConfigured) {
        const st = await checkWhatsAppConnection();
        setStatus(st);
      } else {
        setStatus({ connected: false, error: 'Credentials missing in Settings / .env' });
      }
    } catch (err: any) {
      setStatus({ connected: false, error: err.message || 'Failed to check connection' });
    } finally {
      setCheckingConn(false);
    }
  };

  const fetchResidentsAndRooms = async () => {
    setLoadingResidents(true);
    try {
      const [resData, roomData] = await Promise.all([
        pb.collection('residents').getFullList({
          filter: 'status = "active"',
          expand: 'bookings_via_resident,bookings_via_resident.bed,bookings_via_resident.bed.room',
          sort: 'fullName',
        }),
        pb.collection('rooms').getFullList({
          sort: 'roomNumber',
        }),
      ]);

      setResidents(resData as any);
      setRooms(roomData as any);
    } catch (err) {
      console.error('Failed to load residents or rooms:', err);
    } finally {
      setLoadingResidents(false);
    }
  };

  useEffect(() => {
    verifyConnection();
    fetchResidentsAndRooms();
  }, []);

  // Helper to extract room info for a resident
  const getResidentRoom = (resident: ResidentType): { roomNumber?: string; floor?: number | null; bedLabel?: string } => {
    const booking = resident.expand?.bookings_via_resident?.[0];
    const bed = booking?.expand?.bed;
    const room = bed?.expand?.room;
    return {
      roomNumber: room?.roomNumber,
      floor: room?.floor,
      bedLabel: bed?.bedLabel,
    };
  };

  // Filtered resident list for student selection
  const filteredResidents = useMemo(() => {
    return residents.filter((r) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        r.fullName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.phone && r.phone.includes(searchQuery)) ||
        getResidentRoom(r).roomNumber?.toLowerCase().includes(searchQuery.toLowerCase());

      const rInfo = getResidentRoom(r);

      const matchesRoom = !filterRoom || rInfo.roomNumber === filterRoom;
      const matchesFloor = !filterFloor || (rInfo.floor !== undefined && rInfo.floor !== null && String(rInfo.floor) === filterFloor);

      return matchesSearch && matchesRoom && matchesFloor;
    });
  }, [residents, searchQuery, filterRoom, filterFloor]);

  // Unique floors available across rooms
  const uniqueFloors = useMemo(() => {
    const floors = new Set<string>();
    rooms.forEach((rm) => {
      if (rm.floor !== undefined && rm.floor !== null) {
        floors.add(String(rm.floor));
      }
    });
    return Array.from(floors).sort();
  }, [rooms]);

  // Selection helpers
  const toggleResident = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const selectAllFiltered = () => {
    const filteredIds = filteredResidents.filter((r) => r.phone).map((r) => r.id);
    setSelectedIds((prev) => Array.from(new Set([...prev, ...filteredIds])));
  };

  const deselectAll = () => {
    setSelectedIds([]);
  };

  // Determine recipients based on audienceMode
  const targetResidents = useMemo(() => {
    if (audienceMode === 'all') {
      return residents.filter((r) => r.phone);
    } else {
      return residents.filter((r) => selectedIds.includes(r.id) && r.phone);
    }
  }, [audienceMode, residents, selectedIds]);

  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage.trim()) return;

    if (!config?.isConfigured) {
      setAlert({
        type: 'error',
        msg: 'WhatsApp API credentials are missing. Configure them in Settings > Notifications.',
      });
      return;
    }

    if (targetResidents.length === 0) {
      setAlert({
        type: 'error',
        msg: audienceMode === 'filtered'
          ? 'No residents selected. Please select at least one student.'
          : 'No active residents with phone numbers found.',
      });
      return;
    }

    setSending(true);
    setAlert(null);
    setProgress(null);

    const phones = targetResidents.map((r) => r.phone as string);

    try {
      setProgress({ current: 0, total: phones.length });

      const result = await sendBulkBroadcast(
        phones,
        broadcastMessage.trim(),
        (done, total) => {
          setProgress({ current: done, total });
        }
      );

      // Best effort log in notifications collection
      for (const res of targetResidents) {
        if (res.phone) {
          pb.collection('notifications')
            .create({
              resident: res.id,
              message: broadcastMessage,
              sentAt: new Date().toISOString(),
              channel: 'whatsapp',
              status: 'sent',
            })
            .catch(() => {});
        }
      }

      if (result.failureCount === 0) {
        setAlert({
          type: 'success',
          msg: `Successfully delivered notice to ${result.successCount} recipient${result.successCount > 1 ? 's' : ''}!`,
        });
        setBroadcastMessage('');
      } else if (result.successCount > 0) {
        setAlert({
          type: 'warning',
          msg: `Sent to ${result.successCount} resident${result.successCount > 1 ? 's' : ''}, but ${result.failureCount} failed. Check phone formats.`,
        });
      } else {
        setAlert({
          type: 'error',
          msg: `Failed to broadcast. Error details: ${result.errors[0] || 'Unknown Meta API error'}`,
        });
      }
    } catch (err: any) {
      setAlert({ type: 'error', msg: err.message || 'An error occurred during broadcast.' });
    } finally {
      setSending(false);
      setProgress(null);
    }
  };

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testPhone) return;

    setTestSending(true);
    setTestResult(null);

    try {
      const clean = formatPhoneNumber(testPhone);
      const res = await sendWhatsAppMessage(
        clean,
        'This is a verification test notice sent from Satabdi Girls Hostel Dashboard.'
      );

      if (res.success) {
        setTestResult(`✅ Message delivered successfully! (Message ID: ${res.messageId})`);
      } else {
        setTestResult(`❌ Failed: ${res.error}`);
      }
    } catch (err: any) {
      setTestResult(`❌ Error: ${err.message}`);
    } finally {
      setTestSending(false);
    }
  };

  const isConnected = Boolean(status?.connected);

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-100 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-primary-500" />
            WhatsApp Broadcast Center
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Meta Cloud API broadcast with custom recipient filtering and instant delivery
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={verifyConnection}
            disabled={checkingConn}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
            title="Refresh Connection Status"
          >
            <RefreshCw className={`w-4 h-4 ${checkingConn ? 'animate-spin' : ''}`} />
          </button>

          <div
            className={`flex items-center space-x-2 px-4 py-2 rounded-full border ${
              isConnected
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
            }`}
          >
            {isConnected ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            <span className="font-semibold text-xs uppercase tracking-wider">
              {checkingConn
                ? 'Checking...'
                : isConnected
                ? 'Meta Cloud API Connected'
                : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Connection Details & Quick Test */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5">
            <h2 className="text-base font-bold text-slate-100 mb-3 flex items-center gap-2">
              <SettingsIcon className="w-4 h-4 text-primary-500" />
              Meta API Profile
            </h2>

            {isConnected ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <ShieldCheck className="w-7 h-7 text-emerald-400 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-emerald-400">
                      {status?.verifiedName || "Satabdi Girls' Hostel"}
                    </div>
                    <div className="text-xs text-slate-400">
                      {status?.displayNumber || '+91 78488 01864'}
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                    <span>Quality Rating:</span>
                    <span className="font-semibold text-emerald-400">{status?.qualityRating || 'GREEN'}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                    <span>Approved Template:</span>
                    <span className="font-semibold text-slate-200">hostel_broadcast_notice</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800 text-slate-400">
                    <span>Template Language:</span>
                    <span className="font-semibold text-primary-400">English (en)</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-6">
                <div className="w-14 h-14 bg-rose-500/10 border-2 border-rose-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                  <WifiOff className="w-6 h-6 text-rose-500" />
                </div>
                <h3 className="text-xs font-bold text-slate-200 mb-1">Not Connected</h3>
                <p className="text-xs text-slate-400 mb-3">
                  {status?.error || 'Configure Meta API credentials in Settings.'}
                </p>
                <a
                  href="/settings"
                  className="inline-flex items-center text-xs text-primary-400 hover:text-primary-300 font-bold underline"
                >
                  Configure in Settings &rarr;
                </a>
              </div>
            )}
          </div>

          {/* Quick Test Send Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5">
            <h3 className="text-sm font-bold text-slate-200 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4 text-primary-400" />
              Direct Phone Test
            </h3>
            <p className="text-xs text-slate-400 mb-3">
              Send a test message directly to any 10-digit phone number.
            </p>
            <form onSubmit={handleSendTest} className="space-y-3">
              <input
                type="text"
                placeholder="e.g. 9876543210"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
              />
              <button
                type="submit"
                disabled={testSending || !testPhone}
                className="w-full py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {testSending ? (
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 text-primary-400" />
                    <span>Send Test WhatsApp</span>
                  </>
                )}
              </button>
            </form>
            {testResult && (
              <div
                className={`mt-3 p-2.5 rounded-lg text-xs leading-relaxed ${
                  testResult.startsWith('✅')
                    ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                    : 'bg-rose-500/10 text-rose-300 border border-rose-500/20'
                }`}
              >
                {testResult}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Audience Filter & Broadcast Compose */}
        <div className="lg:col-span-2 space-y-6">
          {/* Audience Filter Card */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Filter className="w-4 h-4 text-primary-500" />
                  Target Audience
                </h2>
                <p className="text-xs text-slate-400">
                  Select whether to message all residents or pick specific students
                </p>
              </div>

              {/* Audience Mode Toggle Buttons */}
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setAudienceMode('all')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    audienceMode === 'all'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>All Active ({residents.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAudienceMode('filtered')}
                  className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    audienceMode === 'filtered'
                      ? 'bg-primary-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Select Specific Students ({selectedIds.length})</span>
                </button>
              </div>
            </div>

            {/* Filter Controls (Visible when in 'filtered' mode) */}
            {audienceMode === 'filtered' && (
              <div className="space-y-3 pt-2 border-t border-slate-800/80 animate-fade-in">
                {/* Search & Filter Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search student or phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                    />
                  </div>

                  {/* Room Dropdown Filter */}
                  <div>
                    <select
                      value={filterRoom}
                      onChange={(e) => setFilterRoom(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                    >
                      <option value="">All Rooms</option>
                      {rooms.map((rm) => (
                        <option key={rm.id} value={rm.roomNumber}>
                          Room {rm.roomNumber} ({rm.roomType || `${rm.capacity} sharing`})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Floor Dropdown Filter */}
                  <div>
                    <select
                      value={filterFloor}
                      onChange={(e) => setFilterFloor(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                    >
                      <option value="">All Floors</option>
                      {uniqueFloors.map((fl) => (
                        <option key={fl} value={fl}>
                          Floor {fl}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Bulk Select / Deselect Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400 py-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={selectAllFiltered}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors font-medium text-[11px]"
                    >
                      <CheckSquare className="w-3 h-3 text-primary-400" />
                      Select Filtered ({filteredResidents.length})
                    </button>
                    {selectedIds.length > 0 && (
                      <button
                        type="button"
                        onClick={deselectAll}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-rose-300 rounded-lg transition-colors font-medium text-[11px]"
                      >
                        <Square className="w-3 h-3 text-rose-400" />
                        Clear All
                      </button>
                    )}
                  </div>

                  <span className="text-[11px] font-semibold text-primary-400">
                    {selectedIds.length} of {residents.length} students selected
                  </span>
                </div>

                {/* Selected Student Pills (Quick removal) */}
                {selectedIds.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 bg-slate-950/60 rounded-xl border border-slate-800/80">
                    {selectedIds.map((id) => {
                      const res = residents.find((r) => r.id === id);
                      if (!res) return null;
                      return (
                        <span
                          key={id}
                          className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-primary-600/20 text-primary-300 border border-primary-500/30 text-[11px] font-medium"
                        >
                          <span>{res.fullName}</span>
                          <button
                            type="button"
                            onClick={() => toggleResident(id)}
                            className="hover:text-rose-400 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Student Selection Scroll List */}
                <div className="border border-slate-800 rounded-xl overflow-hidden max-h-56 overflow-y-auto divide-y divide-slate-800/60 bg-slate-950/40">
                  {loadingResidents ? (
                    <div className="p-4 text-center text-xs text-slate-500">Loading residents...</div>
                  ) : filteredResidents.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-500">No students match the current filters.</div>
                  ) : (
                    filteredResidents.map((resident) => {
                      const isChecked = selectedIds.includes(resident.id);
                      const hasPhone = Boolean(resident.phone);
                      const rInfo = getResidentRoom(resident);

                      return (
                        <div
                          key={resident.id}
                          onClick={() => {
                            if (hasPhone) toggleResident(resident.id);
                          }}
                          className={`flex items-center justify-between p-2.5 text-xs transition-colors cursor-pointer ${
                            !hasPhone
                              ? 'opacity-40 cursor-not-allowed bg-slate-950/20'
                              : isChecked
                              ? 'bg-primary-950/30 hover:bg-primary-950/40'
                              : 'hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            {/* Checkbox */}
                            <div
                              className={`w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
                                isChecked
                                  ? 'bg-primary-600 border-primary-500 text-white'
                                  : 'border-slate-700 bg-slate-900'
                              }`}
                            >
                              {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                            </div>

                            {/* Name & Phone */}
                            <div className="truncate">
                              <span className="font-semibold text-slate-200">{resident.fullName}</span>
                              <span className="text-slate-500 ml-2">
                                {resident.phone ? resident.phone : 'No phone'}
                              </span>
                            </div>
                          </div>

                          {/* Room Badge */}
                          <div className="flex items-center gap-2 flex-shrink-0">
                            {rInfo.roomNumber ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                                Room {rInfo.roomNumber} {rInfo.bedLabel ? `(${rInfo.bedLabel})` : ''}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-600">Unassigned</span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Broadcast Compose Form */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl p-6">
            <h2 className="text-lg font-bold text-slate-100 mb-2 flex items-center gap-2">
              <Send className="w-4 h-4 text-primary-500" />
              Compose Message
            </h2>
            <p className="text-xs text-slate-400 mb-4">
              {audienceMode === 'all'
                ? `Will be sent to all ${residents.filter(r => r.phone).length} active residents with phone numbers.`
                : `Will be sent only to ${selectedIds.length} selected student${selectedIds.length !== 1 ? 's' : ''}.`}
            </p>

            <form onSubmit={handleBroadcast} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Notice Content
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 resize-none transition-all text-sm leading-relaxed placeholder-slate-600 disabled:opacity-50"
                  placeholder="E.g., Notice: Water supply will be suspended tomorrow from 10 AM to 12 PM for plumbing maintenance."
                  disabled={!isConnected || sending}
                />
              </div>

              {/* Quick Template Pills */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">
                  Quick Templates
                </label>
                <div className="flex flex-wrap gap-2">
                  {templates.map((template, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setBroadcastMessage(template)}
                      disabled={!isConnected || sending}
                      className="text-left text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 py-2 px-3 rounded-xl border border-slate-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {template.length > 36 ? template.substring(0, 36) + '...' : template}
                    </button>
                  ))}
                </div>
              </div>

              {progress && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>Sending broadcast...</span>
                    <span>
                      {progress.current} of {progress.total}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {alert && (
                <div
                  className={`p-3.5 rounded-xl text-xs leading-relaxed border ${
                    alert.type === 'success'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : alert.type === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}
                >
                  {alert.msg}
                </div>
              )}

              <button
                type="submit"
                disabled={
                  !isConnected ||
                  sending ||
                  !broadcastMessage.trim() ||
                  (audienceMode === 'filtered' && selectedIds.length === 0)
                }
                className="w-full flex items-center justify-center space-x-2 bg-primary-600 hover:bg-primary-500 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary-500/20 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {sending ? (
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                    <span>Broadcasting via Meta API...</span>
                  </div>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>
                      {audienceMode === 'all'
                        ? `Send to All Active Residents (${residents.filter(r => r.phone).length})`
                        : selectedIds.length > 0
                        ? `Send to ${selectedIds.length} Selected Student${selectedIds.length > 1 ? 's' : ''}`
                        : 'Select Students to Send'}
                    </span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
