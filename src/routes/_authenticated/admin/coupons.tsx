import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { createCoupon, deleteCoupon, listCoupons, updateCoupon } from "@/lib/admin.functions";
import { Ticket, Trash2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/coupons")({
  head: () => ({ meta: [{ title: "Admin coupons — Rapid Math" }] }),
  component: AdminCoupons,
});

function AdminCoupons() {
  const listFn = useServerFn(listCoupons);
  const createFn = useServerFn(createCoupon);
  const updateFn = useServerFn(updateCoupon);
  const deleteFn = useServerFn(deleteCoupon);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin", "coupons"], queryFn: () => listFn() });

  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [maxRedemptions, setMaxRedemptions] = useState("");
  const [expiresAt, setExpiresAt] = useState("");

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          code,
          description,
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
          expiresAt: expiresAt || null,
        },
      }),
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(res.message);
        setCode("");
        setDescription("");
        setMaxRedemptions("");
        setExpiresAt("");
        refresh();
      } else toast.error(res.message);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          <Ticket className="h-3.5 w-3.5 text-primary" /> New coupon
        </h2>
        <form
          className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (code.trim().length < 3) return toast.error("Code must be at least 3 characters.");
            create.mutate();
          }}
        >
          <Field label="Code">
            <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="teamlaunch" className={inputCls} />
          </Field>
          <Field label="Description">
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Beta testers" className={inputCls} />
          </Field>
          <Field label="Max uses (optional)">
            <input value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value.replace(/\D/g, ""))} placeholder="Unlimited" className={inputCls} />
          </Field>
          <Field label="Expires (optional)">
            <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={inputCls} />
          </Field>
          <div className="sm:col-span-2 lg:col-span-4">
            <button
              type="submit"
              disabled={create.isPending}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {create.isPending ? "Creating…" : "Create coupon"}
            </button>
            <span className="ml-3 text-xs text-muted-foreground">All coupons grant Pro access.</span>
          </div>
        </form>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm">
          <thead className="border-b border-border text-left text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Description</th>
              <th className="px-4 py-3">Used</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading && <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">Loading…</td></tr>}
            {!isLoading && (data ?? []).length === 0 && (
              <tr><td colSpan={6} className="px-4 py-6 text-muted-foreground">No coupons yet.</td></tr>
            )}
            {(data ?? []).map((c: any) => (
              <tr key={c.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-3 font-mono font-medium">{c.code}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.description || "—"}</td>
                <td className="px-4 py-3 tabular">
                  {c.redemptions}
                  {c.max_redemptions ? ` / ${c.max_redemptions}` : ""}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.expires_at ? String(c.expires_at).slice(0, 10) : "Never"}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={async () => {
                      await updateFn({ data: { id: c.id, active: !c.active } });
                      refresh();
                    }}
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      c.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {c.active ? "Active" : "Disabled"}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={async () => {
                      if (!confirm(`Delete coupon "${c.code}"?`)) return;
                      await deleteFn({ data: { id: c.id } });
                      toast.success("Coupon deleted");
                      refresh();
                    }}
                    className="text-muted-foreground hover:text-destructive"
                    aria-label="Delete coupon"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
