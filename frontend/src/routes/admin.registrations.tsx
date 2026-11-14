import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Download, ExternalLink, Mail, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  deleteAdminTeam,
  getAdminRegistrations,
  sendAdminTeamEmail,
  updateAdminReviewStatus,
  updateAdminTeam,
  updateAdminTeamStatus,
} from "@/lib/api";

import { AdminShell } from "@/components/admin/admin-shell";
import { StatusChip, SystemLabel } from "@/components/site/bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

type Registration = {
  id: string;
  r_id: string;
  player_id?: string;
  team_name: string;
  team_leader_name?: string;
  leader_name?: string;
  email: string;
  phone: string;
  college_organization?: string;
  college?: string;
  team_size: number;
  additional_members?: string[];
  status: "pending" | "approved" | "rejected";
  review_status?: "pending" | "shortlisted" | "rejected";
  registration_status?: string;
  admin_notes?: string | null;
  preferred_domain: string | null;
  created_at: string;
  payment_status?: string;
  payment_id?: string;
  payment_order_id?: string;
  payment_amount?: number;
  idea_drive_link?: string | null;
  ppt_url?: string | null;
};

export const Route = createFileRoute("/admin/registrations")({
  head: () => ({
    meta: [
      { title: "Registrations — APEX 1.0 Admin" },
      { name: "description", content: "Review, shortlist, and export APEX 1.0 registrations." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Registrations — APEX 1.0 Admin" },
      { property: "og:description", content: "Team registration management." },
    ],
  }),
  component: () => (
    <AdminShell title="Registrations">
      <Registrations />
    </AdminShell>
  ),
});

function Registrations() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [teamSizeFilter, setTeamSizeFilter] = useState<string>("all");
  const [reviewFilter, setReviewFilter] = useState<string>("all");
  const [paymentStatus, setPaymentStatus] = useState<string>("all");
  const [editing, setEditing] = useState<Registration | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "registrations"],
    queryFn: async (): Promise<Registration[]> => {
      try {
        const teams = await getAdminRegistrations();
        return (teams ?? []) as Registration[];
      } catch (backendErr) {
        // Fallback to direct supabase client
        const { data, error } = await supabase
          .from("apex_registrations")
          .select("*")
          .order("created_at", { ascending: false });
        if (error) {
          const { data: legacyData, error: legacyErr } = await supabase
            .from("teams")
            .select("*")
            .order("created_at", { ascending: false });
          if (legacyErr) throw backendErr;
          return (legacyData ?? []) as Registration[];
        }
        return (data ?? []) as Registration[];
      }
    },
  });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin", "registrations"] });
    void qc.invalidateQueries({ queryKey: ["admin", "teams"] });
  };

  const setReviewMutation = useMutation({
    mutationFn: async ({
      id,
      next,
    }: {
      id: string;
      next: "pending" | "shortlisted" | "rejected";
    }) => {
      try {
        await updateAdminReviewStatus(id, { review_status: next });
      } catch {
        const legacyStatus = next === "shortlisted" ? "approved" : next;
        await updateAdminTeamStatus(id, legacyStatus);
      }
    },
    onSuccess: () => {
      toast.success("REVIEW STATUS UPDATED");
      invalidate();
    },
    onError: (e: Error) => toast.error("STATUS UPDATE FAILED", { description: e.message }),
  });

  const saveEdit = useMutation({
    mutationFn: async (team: Registration) => {
      const leader = team.team_leader_name || team.leader_name;
      const college = team.college_organization || team.college;
      try {
        await updateAdminTeam(team.id, {
          team_name: team.team_name,
          leader_name: leader,
          team_leader_name: leader,
          email: team.email,
          phone: team.phone,
          college: college,
          college_organization: college,
          team_size: team.team_size,
          review_status: team.review_status,
          status: team.review_status === "shortlisted" ? "approved" : team.review_status || team.status,
          admin_notes: team.admin_notes,
          preferred_domain: team.preferred_domain,
        });
      } catch {
        const { error } = await supabase
          .from("teams")
          .update({
            team_name: team.team_name,
            leader_name: leader,
            email: team.email,
            phone: team.phone,
            college: college,
            team_size: team.team_size,
            status: team.review_status === "shortlisted" ? "approved" : team.review_status || team.status,
            preferred_domain: team.preferred_domain,
          })
          .eq("id", team.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("REGISTRATION UPDATED");
      setEditing(null);
      invalidate();
    },
    onError: (e: Error) => toast.error("UPDATE FAILED", { description: e.message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      try {
        await deleteAdminTeam(id);
      } catch {
        const { error } = await supabase.from("teams").delete().eq("id", id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("REGISTRATION DELETED");
      invalidate();
    },
    onError: (e: Error) => toast.error("DELETE FAILED", { description: e.message }),
  });

  const rows = (data ?? []).filter((t) => {
    const leader = t.team_leader_name || t.leader_name || "";
    const college = t.college_organization || t.college || "";
    const rId = t.r_id || t.player_id || "";
    const currentReview = t.review_status || (t.status === "approved" ? "shortlisted" : t.status);

    const matchesSize = teamSizeFilter === "all" || String(t.team_size) === teamSizeFilter;
    const matchesReview = reviewFilter === "all" || currentReview === reviewFilter;
    const matchesPayment = paymentStatus === "all" || (t.payment_status || "paid") === paymentStatus;
    const matchesSearch =
      `${t.team_name} ${leader} ${t.email} ${college} ${rId} ${t.preferred_domain ?? ""}`
        .toLowerCase()
        .includes(q.trim().toLowerCase());

    return matchesSize && matchesReview && matchesPayment && matchesSearch;
  });

  const exportCsv = () => {
    const header = [
      "r_id",
      "team_name",
      "team_leader_name",
      "email",
      "phone",
      "college_organization",
      "team_size",
      "preferred_domain",
      "review_status",
      "payment_status",
      "payment_id",
      "payment_order_id",
      "payment_amount",
      "idea_drive_link",
      "admin_notes",
      "created_at",
    ];
    const csv = [
      header.join(","),
      ...rows.map((r) =>
        header
          .map((h) => {
            let val = (r as any)[h];
            if (h === "r_id") val = r.r_id || r.player_id;
            if (h === "team_leader_name") val = r.team_leader_name || r.leader_name;
            if (h === "college_organization") val = r.college_organization || r.college;
            if (h === "review_status") val = r.review_status || (r.status === "approved" ? "shortlisted" : r.status);
            if (h === "idea_drive_link") val = r.idea_drive_link || r.ppt_url;
            return `"${String(val ?? "").replace(/"/g, '""')}"`;
          })
          .join(","),
      ),
    ].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "apex-registrations.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      <div className="glass-panel grid gap-3 rounded-xl p-4 sm:p-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))_auto] items-center">
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="SEARCH R_ID, TEAM, LEADER, EMAIL"
          aria-label="Search registrations"
          className="font-mono text-xs tracking-[0.12em] h-10 w-full col-span-1 sm:col-span-2 lg:col-span-1"
        />
        <Select value={teamSizeFilter} onValueChange={setTeamSizeFilter}>
          <SelectTrigger className="w-full h-10" aria-label="Filter by team size">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ALL SIZES</SelectItem>
            <SelectItem value="1">1 MEMBER</SelectItem>
            <SelectItem value="2">2 MEMBERS</SelectItem>
            <SelectItem value="3">3 MEMBERS</SelectItem>
            <SelectItem value="4">4 MEMBERS</SelectItem>
          </SelectContent>
        </Select>
        <Select value={reviewFilter} onValueChange={setReviewFilter}>
          <SelectTrigger className="w-full h-10" aria-label="Filter by review status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ALL REVIEWS</SelectItem>
            <SelectItem value="pending">PENDING</SelectItem>
            <SelectItem value="shortlisted">SHORTLISTED</SelectItem>
            <SelectItem value="rejected">REJECTED</SelectItem>
          </SelectContent>
        </Select>
        <Select value={paymentStatus} onValueChange={setPaymentStatus}>
          <SelectTrigger className="w-full h-10" aria-label="Filter by payment">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">ALL PAYMENTS</SelectItem>
            <SelectItem value="paid">PAID</SelectItem>
            <SelectItem value="pending">PENDING</SelectItem>
            <SelectItem value="failed">FAILED</SelectItem>
          </SelectContent>
        </Select>
        <Button
          onClick={exportCsv}
          variant="outline"
          className="bg-transparent font-mono text-xs tracking-[0.16em] w-full sm:w-auto h-10 col-span-1 sm:col-span-2 lg:col-span-1"
        >
          <Download className="mr-2 h-4 w-4" /> EXPORT CSV
        </Button>
      </div>

      <div className="glass-panel overflow-x-auto rounded-xl p-3 sm:p-5">
        <table className="w-full min-w-[950px] border-collapse text-left">
          <thead>
            <tr className="border-b border-border/70">
              {[
                "R_ID",
                "TEAM",
                "LEADER",
                "EMAIL",
                "COLLEGE",
                "MEMBERS",
                "DOMAIN",
                "REVIEW",
                "PAYMENT",
                "PRESENTATION",
                "REGISTERED AT",
                "ACTIONS",
              ].map((h) => (
                <th key={h} className="pb-3 pr-4">
                  <SystemLabel>{h}</SystemLabel>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={12} className="py-6">
                  <Skeleton className="h-24 w-full" />
                </td>
              </tr>
            ) : (
              rows.map((t) => {
                const rId = t.r_id || t.player_id || "APEX-PENDING";
                const leader = t.team_leader_name || t.leader_name || "";
                const college = t.college_organization || t.college || "";
                const driveLink = t.idea_drive_link || t.ppt_url || "";
                const currentReview =
                  t.review_status || (t.status === "approved" ? "shortlisted" : t.status || "pending");

                return (
                  <tr key={t.id} className="border-b border-border/40 text-sm">
                    <td className="py-3 pr-4 font-mono text-xs text-primary font-bold">
                      <div className="flex items-center gap-1.5">
                        <span className="truncate max-w-[140px]" title={rId}>
                          {rId}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(rId);
                            toast.success("R_ID copied");
                          }}
                          className="opacity-50 hover:opacity-100 transition-opacity"
                          title="Copy R_ID"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-4 font-display font-bold tracking-[0.08em]">
                      {t.team_name}
                    </td>
                    <td className="py-3 pr-4">{leader}</td>
                    <td className="py-3 pr-4 text-muted-foreground">{t.email}</td>
                    <td className="py-3 pr-4 text-muted-foreground max-w-[150px] truncate" title={college}>
                      {college || "—"}
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs">{t.team_size}</td>
                    <td className="py-3 pr-4 font-mono text-xs text-muted-foreground">
                      {t.preferred_domain || "Open"}
                    </td>
                    <td className="py-3 pr-4">
                      <StatusChip
                        status={
                          currentReview === "shortlisted"
                            ? "approved"
                            : (currentReview as any) || "pending"
                        }
                      />
                    </td>
                    <td className="py-3 pr-4">
                      <StatusChip status={(t.payment_status as any) || "paid"} />
                    </td>
                    <td className="py-3 pr-4">
                      {driveLink ? (
                        <a
                          href={driveLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={`View Presentation for ${t.team_name} (${rId})`}
                          className="inline-flex items-center gap-1.5 rounded-md border border-border/60 bg-card/40 px-2.5 py-1 font-mono text-xs text-muted-foreground transition hover:border-primary/50 hover:text-primary hover:bg-primary/10 whitespace-nowrap"
                        >
                          <ExternalLink className="h-3 w-3" />
                          <span>View Presentation</span>
                        </a>
                      ) : (
                        <span className="font-mono text-xs text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="py-3 pr-4 font-mono text-[0.7rem] text-muted-foreground whitespace-nowrap">
                      {new Date(t.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex gap-1.5">
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label="Shortlist team"
                          title="Shortlist team"
                          className="h-8 w-8 bg-transparent hover:text-emerald-400 hover:border-emerald-400/50"
                          onClick={() => setReviewMutation.mutate({ id: t.id, next: "shortlisted" })}
                        >
                          <Check className="h-3.5 w-3.5 text-accent-3" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label="Reject team"
                          title="Reject team"
                          className="h-8 w-8 bg-transparent hover:text-primary hover:border-primary/50"
                          onClick={() => setReviewMutation.mutate({ id: t.id, next: "rejected" })}
                        >
                          <X className="h-3.5 w-3.5 text-primary" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label="Edit registration"
                          title="Edit details & notes"
                          className="h-8 w-8 bg-transparent"
                          onClick={() => setEditing(t)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label="Send confirmation email"
                          title={`Send confirmation email to ${t.email}`}
                          className="h-8 w-8 bg-transparent hover:text-cyan-400 hover:border-cyan-400/50"
                          onClick={async () => {
                            toast.loading(`Sending confirmation email to ${t.email}...`, {
                              id: `email_${t.id}`,
                            });
                            try {
                              const res = await sendAdminTeamEmail(t.id, true);
                              if (res?.success) {
                                toast.success(`Confirmation email sent to ${t.email}!`, {
                                  id: `email_${t.id}`,
                                });
                              } else {
                                toast.error(res?.error || "Failed to send email", {
                                  id: `email_${t.id}`,
                                });
                              }
                            } catch {
                              toast.error("Failed to trigger email", { id: `email_${t.id}` });
                            }
                          }}
                        >
                          <Mail className="h-3.5 w-3.5 text-cyan-400" />
                        </Button>
                        <Button
                          size="icon"
                          variant="outline"
                          aria-label="Delete registration"
                          title="Delete registration"
                          className="h-8 w-8 bg-transparent hover:text-red-400 hover:border-red-400/50"
                          onClick={() => {
                            if (confirm(`Delete ${t.team_name}?`)) remove.mutate(t.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-primary" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
        {!isLoading && rows.length === 0 ? (
          <p className="py-10 text-center system-label">NO REGISTRATIONS MATCH THIS FILTER</p>
        ) : null}
      </div>

      <Dialog open={Boolean(editing)} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">EDIT REGISTRATION</DialogTitle>
          </DialogHeader>
          {editing ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label className="system-label">TEAM NAME</Label>
                <Input
                  className="mt-1.5"
                  value={editing.team_name ?? ""}
                  onChange={(e) => setEditing({ ...editing, team_name: e.target.value })}
                />
              </div>
              <div>
                <Label className="system-label">LEADER NAME</Label>
                <Input
                  className="mt-1.5"
                  value={editing.team_leader_name || editing.leader_name || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      team_leader_name: e.target.value,
                      leader_name: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label className="system-label">EMAIL</Label>
                <Input
                  className="mt-1.5"
                  value={editing.email ?? ""}
                  onChange={(e) => setEditing({ ...editing, email: e.target.value })}
                />
              </div>
              <div>
                <Label className="system-label">PHONE</Label>
                <Input
                  className="mt-1.5"
                  value={editing.phone ?? ""}
                  onChange={(e) => setEditing({ ...editing, phone: e.target.value })}
                />
              </div>
              <div>
                <Label className="system-label">COLLEGE / ORGANIZATION</Label>
                <Input
                  className="mt-1.5"
                  value={editing.college_organization || editing.college || ""}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      college_organization: e.target.value,
                      college: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <Label className="system-label">DOMAIN</Label>
                <Input
                  className="mt-1.5"
                  value={editing.preferred_domain ?? ""}
                  onChange={(e) => setEditing({ ...editing, preferred_domain: e.target.value })}
                />
              </div>
              <div>
                <Label className="system-label">REVIEW STATUS</Label>
                <Select
                  value={
                    editing.review_status ||
                    (editing.status === "approved" ? "shortlisted" : editing.status || "pending")
                  }
                  onValueChange={(v) =>
                    setEditing({
                      ...editing,
                      review_status: v as Registration["review_status"],
                      status: v === "shortlisted" ? "approved" : (v as any),
                    })
                  }
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">PENDING</SelectItem>
                    <SelectItem value="shortlisted">SHORTLISTED</SelectItem>
                    <SelectItem value="rejected">REJECTED</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2">
                <Label className="system-label">ADMIN EVALUATION NOTES</Label>
                <Textarea
                  className="mt-1.5 font-mono text-xs"
                  placeholder="Private evaluation feedback, reviewer comments, or score notes..."
                  rows={3}
                  value={editing.admin_notes ?? ""}
                  onChange={(e) => setEditing({ ...editing, admin_notes: e.target.value })}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button
              onClick={() => editing && saveEdit.mutate(editing)}
              disabled={saveEdit.isPending}
              className="font-mono text-xs tracking-[0.18em]"
            >
              SAVE CHANGES
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
