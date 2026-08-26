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
  SkipForward, RotateCcw, RefreshCw, Building2, Users,
  CheckCircle, X, Check
} from "lucide-react";
import {
  fetchClinics, fetchAdminSummary, createClinic, updateClinic,
  deleteClinic, callNextPatient, resetClinicQueue, setFeatured
} from "@/services/api";
import { useAuth } from "@/context/AuthContext";

type FormState = {
  clinicName: string; doctorName: string; phone: string; address: string; status: string;
  adminName: string; adminEmail: string; adminPassword: string;
};

const EMPTY_FORM: FormState = {
  clinicName:'', doctorName:'', phone:'', address:'', status:'Open',
  adminName:'', adminEmail:'', adminPassword:''
};

export default function AdminPanel() {
  const navigate  = useNavigate();
  const { toast } = useToast();
  const { token, user, logout } = useAuth();

  const [summary,   setSummary]   = useState<any>(null);
  const [clinics,   setClinics]   = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [showForm,  setShowForm]  = useState(false);
  const [editId,    setEditId]    = useState<string|null>(null);
  const [form,      setForm]      = useState<FormState>(EMPTY_FORM);
  const [resetting, setResetting] = useState<string|null>(null);
  const [busy,      setBusy]      = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    if (!token) return;
    try {
      setLoading(true);
      const [sum, list] = await Promise.all([fetchAdminSummary(token), fetchClinics(token)]);
      setSummary(sum); setClinics(list);
    } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm(EMPTY_FORM); setEditId(null); setShowForm(false); };

  const handleSubmit = async () => {
    if (editId) {
      if (!form.clinicName || !form.doctorName) {
        toast({ title: 'Clinic name and doctor required', variant: 'destructive' }); return;
      }
      setBusy(true);
      try {
        await updateClinic(editId, { clinicName: form.clinicName, doctorName: form.doctorName, phone: form.phone, address: form.address, status: form.status }, token!);
        toast({ title: 'Clinic updated ✅' }); resetForm(); load();
      } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
      finally { setBusy(false); }
    } else {
      if (!form.clinicName || !form.doctorName) {
        toast({ title: 'Clinic name and Doctor name required', variant: 'destructive' }); return;
      }
      setBusy(true);
      try {
        await createClinic(form, token!);
        toast({ title: 'Clinic + admin created ✅' }); resetForm(); load();
      } catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
      finally { setBusy(false); }
    }
  };

  const handleEdit = (c: any) => {
    setForm({ ...EMPTY_FORM, clinicName: c.clinicName, doctorName: c.doctorName, phone: c.phone||'', address: c.address||'', status: c.status });
    setEditId(c.clinicId); setShowForm(true);
  };

  const handleDelete = async (clinicId: string) => {
    if (!confirm(`Delete ${clinicId}? This removes all tokens and the clinic admin.`)) return;
    try { await deleteClinic(clinicId, token!); toast({ title: 'Clinic deleted' }); load(); }
    catch (e: any) { toast({ title: e.message, variant: 'destructive' }); }
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b bg-white sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex-1">
            <h1 className="font-bold text-lg">Super Admin Dashboard</h1>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={() => { setShowForm(true); setEditId(null); setForm(EMPTY_FORM); }}>
            <Plus className="w-4 h-4 mr-1" /> Add Clinic
          </Button>
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}><Home className="w-4 h-4" /></Button>
          <Button variant="outline" size="sm" onClick={() => { logout(); navigate('/'); }}>
            <LogOut className="w-4 h-4 mr-1" /> Logout
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-6xl">
        {/* Summary */}
        {summary && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8">
            {[
              { label:'Total Clinics',    val: summary.totalClinics,   cls:'text-primary' },
              { label:'Open',             val: summary.openClinics,    cls:'text-success' },
              { label:'Closed',           val: summary.closedClinics,  cls:'text-muted-foreground' },
              { label:'Featured',         val: summary.featuredCount,  cls:'text-warning' },
              { label:'Waiting',          val: summary.totalWaiting,   cls:'text-accent' },
              { label:'Completed Today',  val: summary.totalCompleted, cls:'text-success' },
            ].map(s => (
              <div key={s.label} className="text-center p-3 bg-white rounded-xl border shadow-sm">
                <div className={`text-2xl font-bold ${s.cls}`}>{s.val}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Add / Edit Form */}
        {showForm && (
          <Card className="mb-6 border-2 border-primary/30">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{editId ? `Edit ${editId}` : 'Add New Clinic'}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Clinic Name *</Label>
                  <Input value={form.clinicName} onChange={e => setForm(f=>({...f,clinicName:e.target.value}))} placeholder="Thiru Hospital Clinic" />
                </div>
                <div className="space-y-1">
                  <Label>Doctor Name *</Label>
                  <Input value={form.doctorName} onChange={e => setForm(f=>({...f,doctorName:e.target.value}))} placeholder="Dr. Kumar" />
                </div>
                <div className="space-y-1">
                  <Label>Phone</Label>
                  <Input value={form.phone} onChange={e => setForm(f=>({...f,phone:e.target.value}))} placeholder="04xx-xxxxxx" />
                </div>
                <div className="space-y-1">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f=>({...f,status:v}))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">Open</SelectItem>
                      <SelectItem value="Closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label>Address</Label>
                  <Input value={form.address} onChange={e => setForm(f=>({...f,address:e.target.value}))} placeholder="123 Main Street, City" />
                </div>
              </div>

              {!editId && (
                <>
                  <div className="border-t pt-3">
                    <p className="text-sm font-medium mb-3 text-muted-foreground">Clinic Admin Account (Optional - Auto generated if left blank)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label>Admin Name</Label>
                        <Input value={form.adminName} onChange={e => setForm(f=>({...f,adminName:e.target.value}))} placeholder="" />
                      </div>
                      <div className="space-y-1">
                        <Label>Admin Email</Label>
                        <Input type="email" value={form.adminEmail} onChange={e => setForm(f=>({...f,adminEmail:e.target.value}))} placeholder="" />
                      </div>
                      <div className="space-y-1">
                        <Label>Password</Label>
                        <Input type="password" value={form.adminPassword} onChange={e => setForm(f=>({...f,adminPassword:e.target.value}))} placeholder="" />
                      </div>
                    </div>
                  </div>
                </>
              )}

              <div className="flex gap-2">
                <Button variant="medical" onClick={handleSubmit} disabled={busy}>
                  <Check className="w-4 h-4 mr-1" /> {busy ? 'Saving...' : editId ? 'Update' : 'Create Clinic'}
                </Button>
                <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-1" /> Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Clinic list */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">All Clinics</h2>
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4 mr-1" /> Refresh</Button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({length:6}).map((_,i) => <div key={i} className="h-52 bg-muted animate-pulse rounded-xl" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {clinics.map(c => {
              const isOpen = c.status === 'Open';
              return (
                <Card key={c.clinicId} className={`border-2 ${isOpen ? 'border-primary/20' : 'border-muted'} ${c.featured ? 'ring-2 ring-warning/30' : ''}`}>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-semibold text-sm leading-tight">{c.clinicName}</div>
                        <div className="text-xs text-muted-foreground">{c.doctorName} • {c.clinicId}</div>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={isOpen ? 'default' : 'secondary'}
                          className={`cursor-pointer text-xs ${isOpen ? 'bg-success/10 text-success border-success/30' : ''}`}
                          onClick={() => handleToggleStatus(c.clinicId, c.status)}
                        >
                          {c.status}
                        </Badge>
                        {c.featured && <Badge className="bg-warning/10 text-warning border-warning/30 text-xs">⭐ Featured</Badge>}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="p-2 bg-primary/5 rounded-lg">
                        <div className="font-bold text-primary">{c.currentToken||0}</div>
                        <div className="text-[10px] text-muted-foreground">Serving</div>
                      </div>
                      <div className="p-2 bg-accent/5 rounded-lg">
                        <div className="font-bold text-accent">{c.waitingCount||0}</div>
                        <div className="text-[10px] text-muted-foreground">Waiting</div>
                      </div>
                      <div className="p-2 bg-muted/30 rounded-lg">
                        <div className="font-bold">{c.completedCount||0}</div>
                        <div className="text-[10px] text-muted-foreground">Done</div>
                      </div>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      <Button size="sm" variant="medical" className="flex-1" onClick={() => handleNext(c.clinicId)} disabled={!isOpen}>
                        <SkipForward className="w-3.5 h-3.5 mr-1" /> Next
                      </Button>
                      <Button size="sm" variant={resetting===c.clinicId?'destructive':'outline'} onClick={() => handleReset(c.clinicId)}>
                        <RotateCcw className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleFeatured(c.clinicId, c.featured)}
                        title={c.featured ? 'Remove from featured' : 'Set as featured'}>
                        {c.featured ? <StarOff className="w-3.5 h-3.5 text-warning" /> : <Star className="w-3.5 h-3.5" />}
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(c)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(c.clinicId)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <Button variant="ghost" size="sm" className="w-full text-xs" onClick={() => navigate(`/clinic/${c.clinicId}`)}>
                      View Public Page →
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
