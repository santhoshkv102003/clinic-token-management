import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check, Search, MapPin, Mail, RefreshCw } from "lucide-react";
import { fetchClinics, createClinic, updateClinic, deleteClinic, fetchNextClinicId } from "@/services/api";
import { useAuth } from "@/context/AuthContext";
import { computeDefaultEmail } from "./AdminPanel";

export default function AdminClinics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { token, isSuperAdmin } = useAuth();

  const [clinics,      setClinics]      = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [editId,       setEditId]       = useState<string | null>(null);
  const [searchTerm,   setSearchTerm]   = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "Open" | "Closed">("ALL");
  const [busy,         setBusy]         = useState(false);
  // nextClinicId fetched from backend — never computed client-side
  const [nextClinicId, setNextClinicId] = useState<string>('C070');

  const [form, setForm] = useState({
    clinicId: "",
    clinicName: "",
    doctorName: "",
    city: "Chennai",
    phone: "",
    address: "",
    status: "Open",
    adminName: "",
    adminEmail: "",
    adminPassword: "sr1011"
  });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      setLoading(true);
      const [data, nextId] = await Promise.all([
        fetchClinics(token || ''),
        fetchNextClinicId(token || '')
      ]);
      setClinics(data);
      setNextClinicId(nextId);
    } catch {
      toast({ title: "Failed to load clinics", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({
      clinicId: "",
      clinicName: "",
      doctorName: "",
      city: "Chennai",
      phone: "",
      address: "",
      status: "Open",
      adminName: "",
      adminEmail: "",
      adminPassword: "sr1011"
    });
    setEditId(null);
    setShowForm(false);
  };

  const handleClinicNameChange = (val: string) => {
    const targetCid = editId || nextClinicId;
    const generatedEmail = computeDefaultEmail(val, targetCid);
    const prevAuto = computeDefaultEmail(form.clinicName, targetCid);
    const shouldUpdateEmail = !form.adminEmail || form.adminEmail === prevAuto;

    setForm(f => ({
      ...f,
      clinicName: val,
      adminEmail: shouldUpdateEmail ? generatedEmail : f.adminEmail
    }));
  };

  const handleDoctorNameChange = (val: string) => {
    const shouldUpdateAdminName = !form.adminName || form.adminName === form.doctorName;
    setForm(f => ({
      ...f,
      doctorName: val,
      adminName: shouldUpdateAdminName ? val : f.adminName
    }));
  };

  const handleSubmit = async () => {
    if (!form.clinicName || !form.doctorName) {
      toast({ title: "Clinic Name and Doctor Name required", variant: "destructive" });
      return;
    }
    setBusy(true);
    try {
      if (editId) {
        await updateClinic(editId, {
          clinicName: form.clinicName,
          doctorName: form.doctorName,
          city:       form.city,
          phone:      form.phone,
          address:    form.address,
          status:     form.status
        }, token || '');
        toast({ title: "Clinic updated ✅" });
      } else {
        // Do NOT send clinicId or adminEmail — always generated server-side
        const payload = {
          clinicName:    form.clinicName,
          doctorName:    form.doctorName,
          city:          form.city || 'Chennai',
          phone:         form.phone,
          address:       form.address,
          status:        form.status,
          adminName:     form.adminName || form.doctorName,
          adminPassword: form.adminPassword || "sr1011"
        };
        const result = await createClinic(payload, token || '');
        const createdId = result?.clinic?.clinicId || nextClinicId;
        toast({ title: `Clinic ${createdId} added ✅` });
      }
      resetForm();
      load();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    } finally {
      setBusy(false);
    }
  };

  const handleEdit = (c: any) => {
    setForm({
      clinicId: c.clinicId,
      clinicName: c.clinicName,
      doctorName: c.doctorName,
      city: c.city || "Chennai",
      phone: c.phone || "",
      address: c.address || "",
      status: c.status,
      adminName: c.doctorName || "",
      adminEmail: computeDefaultEmail(c.clinicName, c.clinicId),
      adminPassword: ""
    });
    setEditId(c.clinicId);
    setShowForm(true);
  };

  const handleDelete = async (clinicId: string) => {
    if (!confirm(`Delete ${clinicId}? This will remove its tokens and automatically renumber remaining clinics.`)) return;
    try {
      await deleteClinic(clinicId, token || undefined);
      toast({ title: "Clinic deleted & numbers resequenced ✅" });
      load();
    } catch (e: any) {
      toast({ title: e.message, variant: "destructive" });
    }
  };

  const filteredClinics = clinics.filter(c => {
    const matchesStatus = statusFilter === "ALL" || c.status === statusFilter;
    const term = searchTerm.toLowerCase().trim();
    if (!term) return matchesStatus;
    return (
      matchesStatus &&
      (c.clinicName?.toLowerCase().includes(term) ||
        c.doctorName?.toLowerCase().includes(term) ||
        c.clinicId?.toLowerCase().includes(term) ||
        c.address?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b bg-white/90 backdrop-blur sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
            </Button>
            <h1 className="text-lg font-bold text-slate-800">Manage Clinics</h1>
          </div>
          <Button
            variant="default"
            size="sm"
            className="bg-primary hover:bg-primary/90 shadow-sm"
            onClick={() => { resetForm(); setShowForm(true); }}
          >
            <Plus className="w-4 h-4 mr-1" /> Add Clinic
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-4xl">
        {/* Add/Edit Form */}
        {showForm && (
          <Card className="mb-6 border-2 border-primary/30 shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                {editId ? `Edit Clinic (${editId})` : "Add New Clinic"}
                {!editId && (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs">
                    Assigned ID: {nextClinicId}
                  </Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Clinic Name *</Label>
                  <Input
                    value={form.clinicName}
                    onChange={e => handleClinicNameChange(e.target.value)}
                    placeholder="e.g. Dr. Hems Clinic"
                  />
                  {!editId && form.clinicName && (
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1">
                      <Mail className="w-3 h-3 text-primary" /> Auto email: <span className="font-mono text-primary font-medium">{form.adminEmail || computeDefaultEmail(form.clinicName, nextClinicId)}</span>
                    </p>
                  )}
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Doctor Name *</Label>
                  <Input
                    value={form.doctorName}
                    onChange={e => handleDoctorNameChange(e.target.value)}
                    placeholder="e.g. Dr. Hems"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Status</Label>
                  <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Open">🟢 Open</SelectItem>
                      <SelectItem value="Closed">🔴 Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs font-semibold">Phone</Label>
                  <Input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="044-24567800"
                  />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs font-semibold">Address / Location</Label>
                  <Input
                    value={form.address}
                    onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                    placeholder="Address, City"
                  />
                </div>
              </div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" size="sm" onClick={resetForm}><X className="w-4 h-4 mr-1" />Cancel</Button>
                <Button variant="default" size="sm" onClick={handleSubmit} disabled={busy} className="bg-primary hover:bg-primary/90">
                  <Check className="w-4 h-4 mr-1" />{busy ? "Saving..." : editId ? "Update" : "Create"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search & Filter */}
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm mb-4 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <Input
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search clinic name, doctor, ID..."
              className="pl-9 h-8 text-xs bg-slate-50"
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <div className="flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-xs">
              {(['ALL', 'Open', 'Closed'] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    statusFilter === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
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

        {/* Clinic list */}
        {loading ? (
          <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
        ) : filteredClinics.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border">
            <p className="text-sm font-semibold text-slate-600">No clinics found</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredClinics.map(c => (
              <div key={c.clinicId} className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200 hover:border-primary/30 transition-all shadow-sm">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center font-bold text-primary text-sm flex-shrink-0">
                    {c.clinicId}
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{c.clinicName}</div>
                    <div className="text-xs text-slate-500">{c.doctorName}</div>
                    {c.address && (
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                        <MapPin className="w-3 h-3 text-slate-400" /> {c.address}
                      </div>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={c.status === "Open" ? "default" : "secondary"} className={c.status === "Open" ? "bg-emerald-100 text-emerald-700 text-[10px]" : "text-[10px]"}>
                        {c.status}
                      </Badge>
                      <span className="text-[11px] text-muted-foreground">{c.waitingCount || 0} waiting</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-2">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(c)}><Pencil className="w-4 h-4" /></Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(c.clinicId)}><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
