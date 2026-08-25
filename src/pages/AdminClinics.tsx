import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { fetchClinics, createClinic, updateClinic, deleteClinic } from "@/services/api";

export default function AdminClinics() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clinics, setClinics]   = useState<any[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editId,   setEditId]   = useState<string | null>(null);

  const [form, setForm] = useState({ clinicId: "", clinicName: "", doctorName: "", status: "Open" });

  useEffect(() => {
    if (localStorage.getItem("adminLoggedIn") !== "true") navigate("/admin");
    load();
  }, []);

  const load = async () => {
    try { setClinics(await fetchClinics()); }
    catch { toast({ title: "Failed to load clinics", variant: "destructive" }); }
    finally { setLoading(false); }
  };

  const resetForm = () => { setForm({ clinicId: "", clinicName: "", doctorName: "", status: "Open" }); setEditId(null); setShowForm(false); };

  const handleSubmit = async () => {
    if (!form.clinicId || !form.clinicName || !form.doctorName) {
      toast({ title: "All fields required", variant: "destructive" }); return;
    }
    try {
      if (editId) {
        await updateClinic(editId, { clinicName: form.clinicName, doctorName: form.doctorName, status: form.status });
        toast({ title: "Clinic updated ✅" });
      } else {
        await createClinic(form);
        toast({ title: "Clinic added ✅" });
      }
      resetForm(); load();
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  const handleEdit = (c: any) => {
    setForm({ clinicId: c.clinicId, clinicName: c.clinicName, doctorName: c.doctorName, status: c.status });
    setEditId(c.clinicId); setShowForm(true);
  };

  const handleDelete = async (clinicId: string) => {
    if (!confirm(`Delete ${clinicId}? This will also delete all tokens.`)) return;
    try { await deleteClinic(clinicId); toast({ title: "Clinic deleted" }); load(); }
    catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
  };

  return (
    <div className="min-h-screen"
      style={{ backgroundImage: "url('/DeWatermark.ai_1752809220809.jpeg')", backgroundSize: "cover", backgroundPosition: "center" }}>
      <div className="min-h-screen bg-white/80">
        <header className="border-b bg-white/90 sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => navigate("/admin/panel")}><ArrowLeft className="w-4 h-4 mr-1" />Back</Button>
            <h1 className="text-xl font-bold flex-1">Manage Clinics</h1>
            <Button variant="medical" size="sm" onClick={() => { resetForm(); setShowForm(true); }}>
              <Plus className="w-4 h-4 mr-1" /> Add Clinic
            </Button>
          </div>
        </header>

        <div className="container mx-auto px-4 py-6 max-w-4xl">
          {/* Add/Edit Form */}
          {showForm && (
            <Card className="mb-6 border-2 border-primary/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{editId ? "Edit Clinic" : "Add New Clinic"}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label>Clinic ID (e.g. C021)</Label>
                    <Input value={form.clinicId} onChange={e => setForm(f => ({ ...f, clinicId: e.target.value.toUpperCase() }))} placeholder="C021" disabled={!!editId} />
                  </div>
                  <div className="space-y-1">
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={v => setForm(f => ({ ...f, status: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Open">Open</SelectItem>
                        <SelectItem value="Closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label>Clinic Name</Label>
                    <Input value={form.clinicName} onChange={e => setForm(f => ({ ...f, clinicName: e.target.value }))} placeholder="Hospital / Clinic name" />
                  </div>
                  <div className="space-y-1">
                    <Label>Doctor Name</Label>
                    <Input value={form.doctorName} onChange={e => setForm(f => ({ ...f, doctorName: e.target.value }))} placeholder="Dr. Name" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="medical" onClick={handleSubmit}><Check className="w-4 h-4 mr-1" />{editId ? "Update" : "Create"}</Button>
                  <Button variant="outline" onClick={resetForm}><X className="w-4 h-4 mr-1" />Cancel</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Clinic list */}
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 bg-muted animate-pulse rounded-xl" />)}</div>
          ) : (
            <div className="space-y-3">
              {clinics.map(c => (
                <div key={c.clinicId} className="flex items-center justify-between p-4 bg-white rounded-xl border-2 border-border/40 hover:border-primary/20 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary text-sm">{c.clinicId}</div>
                    <div>
                      <div className="font-semibold">{c.clinicName}</div>
                      <div className="text-sm text-muted-foreground">{c.doctorName}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={c.status === "Open" ? "default" : "secondary"} className={c.status === "Open" ? "bg-success/10 text-success border-success/30 text-xs" : "text-xs"}>{c.status}</Badge>
                        <span className="text-xs text-muted-foreground">{c.waitingCount} waiting</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleEdit(c)}><Pencil className="w-4 h-4" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(c.clinicId)}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
