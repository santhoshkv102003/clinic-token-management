import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Home, LogOut, Plus, Pencil, Trash2, Star, StarOff,
  SkipForward, RotateCcw, RefreshCw, Search, X, Check,
  MapPin, UserCheck, ShieldCheck, Mail, Lock, Phone
} from "lucide-react";
import {
  fetchClinics, fetchAdminSummary, createClinic, updateClinic,
  deleteClinic, callNextPatient, resetClinicQueue, setFeatured,
  fetchNextClinicId
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";

type FormState = {
  clinicName: string; doctorName: string; city: string; phone: string; address: string; status: string;
  adminName: string; adminEmail: string; adminPassword: string;
};

const EMPTY_FORM: FormState = {
  clinicName:'', doctorName:'', city:'Chennai', phone:'', address:'', status:'Open',
  adminName:'', adminEmail:'', adminPassword:''
};

/**
 * Mirrors backend generateClinicEmail exactly.
 * Strip "Dr."/"Dr"/"Doctor", take first letter of first word + numeric ID.
 * e.g. "Maambalam Health Centre" + "C014" → "m014@gmail.com"
 *      "Dr.Karthi Prime Clinic"  + "C011" → "k011@gmail.com"
 */
export function computeDefaultEmail(clinicName: string, clinicId: string): string {
  const numericId = (clinicId || '').replace(/\D/g, '');
  const name = (clinicName || '').replace(/^(Dr\.|Dr|Doctor)\s*/i, '').trim();
  const firstLetter = (name.charAt(0) || 'c').toLowerCase();
  return `${firstLetter}${numericId}@gmail.com`;
}

export default function AdminPanel() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { token, user, logout } = useAuth();

  const [summary,      setSummary]      = useState<any>(null);
  const [clinics,      setClinics]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editId,       setEditId]       = useState<string|null>(null);
  const [form,         setForm]         = useState<FormState>(EMPTY_FORM);
  const [resetting,    setResetting]    = useState<string|null>(null);
  const [deletingId,   setDeletingId]   = useState<string|null>(null);
  const [busy,         setBusy]         = useState(false);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Open" | "Closed">("ALL");
  // nextClinicId comes from the backend — never computed client-side
  const [nextClinicId, setNextClinicId] = useState<string>('C070');

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [sum, list, nextId] = await Promise.all([
        fetchAdminSummary(token),
        fetchClinics(token),
        fetchNextClinicId(token)
      ]);
      setSummary(sum);
      setClinics(list);
      setNextClinicId(nextId);
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false); };

  const handleClinicNameChange = (val: string) => {
    setForm(prev => {
      const generatedEmail = computeDefaultEmail(val, editId || nextClinicId);
      // If user hasn't typed custom email or if previous email matches old auto-generated pattern
      const prevAuto = computeDefaultEmail(prev.clinicName, editId || nextClinicId);
      const shouldUpdateEmail = !prev.adminEmail || prev.adminEmail === prevAuto;
      return {
        ...prev,
        clinicName: val,
        adminEmail: shouldUpdateEmail ? generatedEmail : prev.adminEmail
      };
    });
  };

  const handleDoctorNameChange = (val: string) => {
    setForm(prev => {
      const shouldUpdateAdminName = !prev.adminName || prev.adminName === prev.doctorName;
      return {
        ...prev,
        doctorName: val,
        adminName: shouldUpdateAdminName ? val : prev.adminName
      };
    });
  };

  const handleSubmit = async () => {
    if (editId) {
      if (!form.clinicName || !form.doctorName) {
        toast({ title: 'Clinic name and doctor required', variant: 'destructive' }); return;
      }
      setBusy(true);
      try {
        await updateClinic(editId, {
          clinicName: form.clinicName,
          doctorName: form.doctorName,
          city:       form.city,
          phone:      form.phone,
          address:    form.address,
          status:     form.status
        }, token!);
        toast({ title: 'Clinic updated ✅' }); resetForm(); load();
      } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
      finally { setBusy(false); }
    } else {
      if (!form.clinicName || !form.doctorName) {
        toast({ title: 'Clinic name and Doctor name required', variant: 'destructive' }); return;
      }
      setBusy(true);
      try {
        // Only send the fields the backend needs — clinicId and email are generated server-side
        const payload = {
          clinicName:    form.clinicName,
          doctorName:    form.doctorName,
          city:          form.city || 'Chennai',
          phone:         form.phone,
          address:       form.address,
          status:        form.status,
          adminName:     form.adminName || form.doctorName,
          adminPassword: form.adminPassword || 'sr1011'
          // adminEmail intentionally omitted — always generated server-side
        };
        const result = await createClinic(payload, token!);
        const createdId = result?.clinic?.clinicId || nextClinicId;
        toast({ title: `Clinic ${createdId} + Admin created ✅` });
        resetForm();
        load();
      } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
      finally { setBusy(false); }
    }
  };

  const handleEdit = (c: any) => {
    setForm({ ...EMPTY_FORM, clinicName: c.clinicName, doctorName: c.doctorName, city: c.city || 'Chennai', phone: c.phone||'', address: c.address||'', status: c.status });
    setEditId(c.clinicId); setShowForm(true);
    window.scrollTo({ top: 150, behavior: 'smooth' });
  };

  const handleDelete = async (clinicId: string) => {
    const ok = window.confirm(
      `⚠️ Delete Clinic ${clinicId}?\n\nThis will remove all queue tokens, delete its admin account, and AUTOMATICALLY REASSIGN/RENUMBER all subsequent clinic numbers (e.g. C001, C002...). Proceed?`
    );
    if (!ok) return;

    setDeletingId(clinicId);
    try {
      await deleteClinic(clinicId, token!);
      toast({ title: `Clinic ${clinicId} deleted & numbers resequenced ✅` });
      await load();
    } catch (e: any) {
      toast({ title: e.message || 'Failed to delete clinic', variant: 'destructive' });
    } finally {
      setDeletingId(null);
    }
  };

  const handleFeatured = async (clinicId: string, current: boolean) => {
    try { await setFeatured(clinicId, !current, token!); load(); }
    catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
  };

  const handleNext = async (clinicId: string) => {
    try { await callNextPatient(clinicId, token!); load(); }
    catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
  };

  const handleReset = async (clinicId: string) => {
    if (resetting !== clinicId) { setResetting(clinicId); setTimeout(() => setResetting(r => r===clinicId?null:r), 3000); return; }
    try { await resetClinicQueue(clinicId, token!); toast({ title: `Queue reset — ${clinicId}` }); setResetting(null); load(); }
    catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
  };

  const handleToggleStatus = async (clinicId: string, current: string) => {
    try { await updateClinic(clinicId, { status: current==='Open'?'Closed':'Open' }, token!); load(); }
    catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
  };

  // Filter clinics by search query and status
  const filteredClinics = clinics.filter(c => {
    const matchesStatus = statusFilter === 'ALL' || c.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesStatus;
    const matchesSearch =
      c.clinicName?.toLowerCase().includes(term) ||
      c.doctorName?.toLowerCase().includes(term) ||
      c.clinicId?.toLowerCase().includes(term) ||
      c.address?.toLowerCase().includes(term);
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="border-b bg-white/95 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold shadow-sm">
              <ShieldCheck className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-slate-800 leading-tight">Super Admin Dashboard</h1>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm"
              onClick={() => {
                setShowForm(true);
                setEditId(null);
                setForm({
                  ...EMPTY_FORM,
                  adminEmail: computeDefaultEmail('', nextClinicId),
                  adminPassword: 'sr1011'
                });
              }}
            >
              <Plus className="w-4 h-4 mr-1.5" /> Add Clinic
            </Button>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} title="Public Home">
              <Home className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }} className="text-red-600 border-red-200 hover:bg-red-50">
              <LogOut className="w-4 h-4 mr-1.5" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Summary Stats Cards */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {[
              { label:'Total Clinics',    val: summary.totalClinics,   cls:'text-primary bg-primary/10' },
              { label:'Open Clinics',     val: summary.openClinics,    cls:'text-emerald-600 bg-emerald-50' },
              { label:'Closed Clinics',   val: summary.closedClinics,  cls:'text-slate-600 bg-slate-100' },
              { label:'Featured',         val: summary.featuredCount,  cls:'text-amber-600 bg-amber-50' },
              { label:'Waiting Patients', val: summary.totalWaiting,   cls:'text-indigo-600 bg-indigo-50' },
              { label:'Completed Today',  val: summary.totalCompleted, cls:'text-emerald-600 bg-emerald-50' },
            ].map(s => (
              <div key={s.label} className="p-3.5 bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-lg mb-1.5 ${s.cls}`}>
                  {s.val}
                </div>
                <div className="text-xs font-medium text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Clinic Form */}
        {showForm && (
          <Card className="mb-8 border-2 border-primary/40 shadow-lg bg-white animate-in fade-in slide-in-from-top-4 duration-300">
            <CardHeader className="pb-3 border-b bg-slate-50/50 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                  {editId ? `Edit Clinic (${editId})` : 'Add New Clinic'}
                  {!editId && (
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                      Assigned ID: {nextClinicId}
                    </Badge>
                  )}
                </CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {editId ? "Update clinic details" : "Creates a new clinic and its dedicated clinic admin login automatically"}
                </p>
              </div>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={resetForm}>
                <X className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Clinic Name *</Label>
                  <Input
                    value={form.clinicName}
                    onChange={e => handleClinicNameChange(e.target.value)}
                    placeholder="e.g. Dr. Hems Clinic or Aura LifeCare"
                    className="h-9"
                  />
                  {!editId && form.clinicName && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1">
                      <Mail className="w-3 h-3 text-primary" /> Auto-assigned email: <span className="font-mono text-primary font-medium">{form.adminEmail || computeDefaultEmail(form.clinicName, nextClinicId)}</span>
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Doctor Name *</Label>
                  <Input
                    value={form.doctorName}
                    onChange={e => handleDoctorNameChange(e.target.value)}
                    placeholder="e.g. Dr. Hems"
                    className="h-9"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Phone Number</Label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      value={form.phone}
                      onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="044-24567800"
                      className="pl-8 h-9"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-slate-700">Clinic Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">🟢 Open</SelectItem>
                      <SelectItem value="Closed">🔴 Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5 sm:col-span-2">
                  <Label className="text-xs font-semibold text-slate-700">Address / Location</Label>
                  <div className="relative">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
                    <Input
                      value={form.address}
                      onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                      placeholder="e.g. 24 Gandhi Road, Chennai"
                      className="pl-8 h-9"
                    />
                  </div>
                </div>
              </div>

              {!editId && (
                <div className="border-t pt-3.5 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
                  <div className="flex items-center gap-1.5 mb-2.5">
                    <UserCheck className="w-4 h-4 text-primary" />
                    <span className="text-xs font-semibold text-slate-800">Clinic Admin Account (Auto-configured)</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Admin Name</Label>
                      <Input
                        value={form.adminName}
                        onChange={e => setForm(f => ({ ...f, adminName: e.target.value }))}
                        placeholder={form.doctorName || "Doctor / Admin name"}
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Admin Login Email</Label>
                      <Input
                        type="email"
                        value={form.adminEmail}
                        onChange={e => setForm(f => ({ ...f, adminEmail: e.target.value.toLowerCase() }))}
                        placeholder={computeDefaultEmail(form.clinicName, nextClinicId)}
                        className="h-8 text-xs bg-white font-mono"
                      />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px] text-muted-foreground">Password (Default: sr1011)</Label>
                      <Input
                        type="password"
                        value={form.adminPassword}
                        onChange={e => setForm(f => ({ ...f, adminPassword: e.target.value }))}
                        placeholder="sr1011"
                        className="h-8 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-2 justify-end pt-1">
                <Button variant="outline" size="sm" onClick={resetForm}><X className="w-4 h-4 mr-1" /> Cancel</Button>
                <Button variant="default" size="sm" onClick={handleSubmit} disabled={busy} className="bg-primary hover:bg-primary/90 shadow">
                  <Check className="w-4 h-4 mr-1.5" /> {busy ? 'Saving...' : editId ? 'Update Clinic' : 'Create Clinic'}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="relative w-full md:w-96">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search clinic by name, doctor, ID (C001), or city..."
              className="pl-9 pr-8 h-9 text-xs bg-slate-50 focus:bg-white transition-colors"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end">
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
              {(['ALL', 'Open', 'Closed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === tab
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab === 'ALL' ? 'All' : tab}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={load} className="h-8 text-xs">
              <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
            </Button>
          </div>
        </div>

        {/* Results Info */}
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs font-semibold text-slate-600">
            Showing <span className="text-primary font-bold">{filteredClinics.length}</span> of {clinics.length} clinics
            {searchTerm && <span className="text-slate-400 ml-1">(filtered by "{searchTerm}")</span>}
          </div>
        </div>

        {/* Clinic Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({length:6}).map((_,i) => <div key={i} className="h-56 bg-slate-200 animate-pulse rounded-xl" />)}
          </div>
        ) : filteredClinics.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-slate-300">
            <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No clinics match your search</p>
            <p className="text-xs text-muted-foreground mt-1">Try searching for a different name, doctor, or clear filters.</p>
            <Button variant="outline" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('ALL'); }} className="mt-3 text-xs">
              Reset Search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredClinics.map(c => {
              const isOpen = c.status === 'Open';
              const isDeleting = deletingId === c.clinicId;

              return (
                <Card
                  key={c.clinicId}
                  className={`border-2 transition-all shadow-sm hover:shadow-md bg-white ${
                    isOpen ? 'border-slate-200 hover:border-primary/40' : 'border-slate-200 bg-slate-50/50 opacity-90'
                  } ${c.featured ? 'ring-2 ring-amber-400/40' : ''}`}
                >
                  <CardHeader className="pb-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                            {c.clinicId}
                          </span>
                          {c.featured && (
                            <Badge className="bg-amber-100 text-amber-800 border-amber-300 text-[10px] py-0">
                              ⭐ Featured
                            </Badge>
                          )}
                        </div>
                        <div className="font-bold text-sm text-slate-900 truncate" title={c.clinicName}>
                          {c.clinicName}
                        </div>
                        <div className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {c.doctorName}
                        </div>
                        {c.address && (
                          <div className="text-[11px] text-slate-400 truncate flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                            <span className="truncate">{c.address}</span>
                          </div>
                        )}
                      </div>
                      <Badge
                        variant={isOpen ? 'default' : 'secondary'}
                        className={`cursor-pointer text-xs font-semibold transition-colors ${
                          isOpen ? 'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200' : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                        }`}
                        onClick={() => handleToggleStatus(c.clinicId, c.status)}
                        title="Click to toggle Open/Closed status"
                      >
                        {c.status}
                      </Badge>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 pt-0">
                    {/* Live Queue Counts */}
                    <div className="grid grid-cols-3 gap-1.5 text-center py-2 px-1 bg-slate-50 rounded-lg border border-slate-100">
                      <div>
                        <div className="font-bold text-base text-primary">{c.currentToken || 0}</div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Serving</div>
                      </div>
                      <div className="border-x border-slate-200">
                        <div className="font-bold text-base text-amber-600">{c.waitingCount || 0}</div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Waiting</div>
                      </div>
                      <div>
                        <div className="font-bold text-base text-emerald-600">{c.completedCount || 0}</div>
                        <div className="text-[10px] uppercase font-semibold text-slate-400">Done</div>
                      </div>
                    </div>

                    {/* Actions Toolbar */}
                    <div className="flex gap-1.5 flex-wrap pt-1">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1 h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
                        onClick={() => handleNext(c.clinicId)}
                        disabled={!isOpen}
                        title="Call Next Patient"
                      >
                        <SkipForward className="w-3.5 h-3.5 mr-1" /> Next
                      </Button>

                      <Button
                        size="sm"
                        variant={resetting === c.clinicId ? 'destructive' : 'outline'}
                        className="h-8 px-2.5"
                        onClick={() => handleReset(c.clinicId)}
                        title="Reset Queue"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-slate-700"
                        onClick={() => handleFeatured(c.clinicId, c.featured)}
                        title={c.featured ? 'Remove from featured' : 'Mark as featured'}
                      >
                        {c.featured ? <StarOff className="w-3.5 h-3.5 text-amber-500" /> : <Star className="w-3.5 h-3.5" />}
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 px-2.5 text-slate-700 hover:text-primary"
                        onClick={() => handleEdit(c)}
                        title="Edit Clinic"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>

                      <Button
                        size="sm"
                        variant="destructive"
                        className="h-8 px-2.5 bg-red-600 hover:bg-red-700"
                        onClick={() => handleDelete(c.clinicId)}
                        disabled={isDeleting}
                        title="Delete Clinic & Resequence Numbers"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      className="w-full text-xs text-slate-500 hover:text-primary h-7"
                      onClick={() => navigate(`/clinic/${c.clinicId}`)}
                    >
                      View Live Display →
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
