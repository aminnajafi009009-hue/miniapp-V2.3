import { useEffect, useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Input, PageSkeleton, PageTop, Section, Segmented, Switch } from "@/shared/ui/kit"

export default function AdminSettings() {
  const { data, error, reload } = useLoad<any>(() => adminGet("/settings"))
  const [cb, setCb] = useState<any>(null)
  const [ft, setFt] = useState<any>(null)
  const [ref, setRef] = useState<any>(null)
  const [ann, setAnn] = useState("")
  const [busy, setBusy] = useState("")
  useEffect(() => { if (data) { setCb({ ...data.custom_build, enabled: data.custom_build_enabled }); setFt({ ...data.free_test }); setRef({ ...data.referral }); setAnn(data.announcement || "") } }, [data])
  const send = async (k: string, path: string, body: any) => {
    setBusy(k)
    try { await adminPost(path, body); toast.success("ذخیره شد"); await reload() } catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy("") }
  }
  if (error) return <div className="x-page"><PageTop title="تنظیمات فروش" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data || !cb) return <div className="x-page"><PageTop title="تنظیمات فروش" back="/admin/more" /><PageSkeleton /></div>
  const ucb = (k: string, v: any) => setCb({ ...cb, [k]: v })
  const uft = (k: string, v: any) => setFt({ ...ft, [k]: v })
  return (
    <div className="x-page">
      <PageTop title="تنظیمات فروش" back="/admin/more" />
      <Section title="اعلان صفحه‌ی اصلی"><Card><div className="x-stack">
        <Input label="متن اعلان (خالی = بدون اعلان)" value={ann} maxLength={300} onChange={(e) => setAnn(e.target.value)} />
        <Button variant="primary" loading={busy === "ann"} onClick={() => send("ann", "/settings/announcement", { text: ann })}>ذخیره</Button>
      </div></Card></Section>
      <Section title="سرویس سفارشی"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={cb.enabled} onChange={(v) => ucb("enabled", v)} /></div>
        <div className="x-grid c2"><Input label="قیمت هر گیگ" type="number" value={cb.price_per_gb} onChange={(e) => ucb("price_per_gb", e.target.value)} /><Input label="قیمت هر ۳۰ روز" type="number" value={cb.price_per_30_days} onChange={(e) => ucb("price_per_30_days", e.target.value)} /></div>
        <div className="x-grid c2"><Input label="حداقل گیگ" type="number" value={cb.min_gb} onChange={(e) => ucb("min_gb", e.target.value)} /><Input label="حداکثر گیگ" type="number" value={cb.max_gb} onChange={(e) => ucb("max_gb", e.target.value)} /></div>
        <div className="x-grid c2"><Input label="حداقل روز" type="number" value={cb.min_days} onChange={(e) => ucb("min_days", e.target.value)} /><Input label="حداکثر روز" type="number" value={cb.max_days} onChange={(e) => ucb("max_days", e.target.value)} /></div>
        <Button variant="primary" loading={busy === "cb"} onClick={() => send("cb", "/settings/custom-build", cb)}>ذخیره</Button>
      </div></Card></Section>
      <Section title="تست رایگان (پیش‌فرض)"><Card><div className="x-stack">
        <div className="x-grid c2"><Input label="حجم (گیگ)" type="number" step="0.1" value={ft.volume_gb} onChange={(e) => uft("volume_gb", e.target.value)} /><Input label="مدت" type="number" value={ft.duration_value} onChange={(e) => uft("duration_value", e.target.value)} /></div>
        <Segmented<string> value={ft.duration_unit || "days"} options={[{ value: "days", label: "روز" }, { value: "hours", label: "ساعت" }]} onChange={(v) => uft("duration_unit", v)} />
        <Input label="قیمت (تومان)" type="number" value={ft.price} onChange={(e) => uft("price", e.target.value)} />
        <Button variant="primary" loading={busy === "ft"} onClick={() => send("ft", "/settings/free-test", ft)}>ذخیره</Button>
        <div className="x-muted">چند تست از پنل‌های مختلف را از داخل ربات نگاشت می‌کنید.</div>
      </div></Card></Section>
      <Section title="دعوت از دوستان"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">حداقل حجم خرید برای پاداش</span><Switch checked={ref.min_volume_enabled} onChange={(v) => setRef({ ...ref, min_volume_enabled: v })} /></div>
        {ref.min_volume_enabled && <Input label="حداقل حجم (گیگ)" type="number" value={ref.min_volume_gb} onChange={(e) => setRef({ ...ref, min_volume_gb: e.target.value })} />}
        <div className="x-row-flex"><span className="x-grow">فقط خرید پولی</span><Switch checked={ref.paid_purchase_required} onChange={(v) => setRef({ ...ref, paid_purchase_required: v })} /></div>
        <Input label="مبلغ پاداش (تومان)" type="number" value={ref.reward_amount} onChange={(e) => setRef({ ...ref, reward_amount: e.target.value })} />
        <div className="x-row-flex"><span className="x-grow">قفل پاداش با خروج از کانال</span><Switch checked={ref.channel_leave_lock_enabled} onChange={(v) => setRef({ ...ref, channel_leave_lock_enabled: v })} /></div>
        <Button variant="primary" loading={busy === "ref"} onClick={() => send("ref", "/settings/referral", { min_volume_enabled: ref.min_volume_enabled, min_volume_gb: Number(ref.min_volume_gb), paid_purchase_required: ref.paid_purchase_required, reward_amount: Number(ref.reward_amount), channel_leave_lock_enabled: ref.channel_leave_lock_enabled })}>ذخیره</Button>
      </div></Card></Section>
    </div>
  )
}
