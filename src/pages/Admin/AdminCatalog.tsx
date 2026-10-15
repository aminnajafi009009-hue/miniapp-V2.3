import { useState } from "react"
import { toast } from "sonner"
import { FolderPlus, Plus, Trash2 } from "lucide-react"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { ask } from "@/shared/lib/confirm"
import MappingSheet from "./MappingSheet"
import { Alert, Button, Card, Input, PageSkeleton, PageTop, Row, Sheet, List, Empty } from "@/shared/ui/kit"
import { faDigits, toman } from "@/shared/lib/format"

export default function AdminCatalog() {
  const { data, error, reload } = useLoad<any>(() => adminGet("/catalog"))
  const [plan, setPlan] = useState<any>(null)
  const [cat, setCat] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  const [mapFor, setMapFor] = useState<any>(null)
  const run = async (fn: () => Promise<any>, ok: string, done: () => void) => {
    setBusy(true)
    try { await fn(); toast.success(ok); done(); await reload() } catch (e) { toast.error(friendlyErrorMessage(e, "عملیات ناموفق بود")) } finally { setBusy(false) }
  }
  const savePlan = () => run(() => plan.key
    ? adminPost(`/catalog/plan/${plan.key}`, { name: plan.name, price: Number(plan.price), days: Number(plan.days), volume_gb: Number(plan.volume_gb), user_limit: Number(plan.user_limit) })
    : adminPost("/catalog/plan", { category_id: plan.category_id, name: plan.name, price: Number(plan.price), days: Number(plan.days), volume_gb: Number(plan.volume_gb), user_limit: Number(plan.user_limit) }), "ذخیره شد", () => setPlan(null))
  const delPlan = async () => { if (await ask(`پلن «${plan.name}» حذف شود؟`)) run(() => adminPost(`/catalog/plan/${plan.key}/delete`), "حذف شد", () => setPlan(null)) }
  const saveCat = () => run(() => cat.id ? adminPost(`/catalog/category/${cat.id}`, { name: cat.name }) : adminPost("/catalog/category", { name: cat.name }), "ذخیره شد", () => setCat(null))
  const delCat = async () => { if (await ask(`دسته «${cat.name}» حذف شود؟`)) run(() => adminPost(`/catalog/category/${cat.id}/delete`), "حذف شد", () => setCat(null)) }
  const set = (k: string, v: string) => setPlan({ ...plan, [k]: v })
  return (
    <div className="x-page">
      <PageTop title="دسته‌ها و پلن‌ها" back="/admin/more" right={<Button size="sm" icon={<FolderPlus size={15} />} onClick={() => setCat({ name: "" })}>دسته</Button>} />
      <Alert>نگاشت پلن‌ها به پنل VPN از داخل ربات انجام می‌شود؛ اینجا نام، قیمت، حجم و مدت را مدیریت می‌کنید.</Alert>
      {error ? <Alert tone="bad">دریافت ناموفق بود</Alert> : !data ? <PageSkeleton /> : data.categories.length === 0 ? <Empty title="دسته‌ای ندارید" /> : data.categories.map((c: any) => (
        <section key={c.id} className="x-stack">
          <div className="x-sec"><span onClick={() => setCat({ id: c.id, name: c.name })} style={{ cursor: "pointer" }}>{c.name}</span>
            <Button size="sm" icon={<Plus size={14} />} onClick={() => setPlan({ category_id: c.id, name: "", price: "", days: "30", volume_gb: "", user_limit: "0" })}>پلن</Button></div>
          {c.plans.length === 0 ? <Card flat><div className="x-muted">پلنی ندارد</div></Card> : <List>{c.plans.map((p: any) => <Row key={p.key} onClick={() => setPlan({ ...p, price: String(p.price), days: String(p.days), volume_gb: String(p.volume_gb), user_limit: String(p.user_limit) })} title={p.name} sub={`${p.volume_gb ? faDigits(p.volume_gb) + " گیگ" : "حجم ∞"} · ${p.days ? faDigits(p.days) + " روز" : "زمان ∞"}`} right={<b className="num">{toman(p.price)}</b>} />)}</List>}
        </section>
      ))}
      <Sheet open={!!plan} onClose={() => setPlan(null)} title={plan?.key ? "ویرایش پلن" : "پلن جدید"} footer={plan && <><Button variant="primary" size="lg" full loading={busy} onClick={savePlan}>ذخیره</Button>{plan.key && <Button full onClick={() => setMapFor({ scope: "vip_plan", id: plan.id, name: plan.name })}>نگاشت پنل این پلن</Button>}{plan.key && <Button variant="danger" full icon={<Trash2 size={15} />} onClick={delPlan}>حذف پلن</Button>}</>}>
        {plan && <>
          <Input label="نام پلن" value={plan.name} onChange={(e) => set("name", e.target.value)} />
          <Input label="قیمت (تومان)" type="number" value={plan.price} onChange={(e) => set("price", e.target.value)} />
          <div className="x-grid c2"><Input label="حجم (گیگ، ۰=نامحدود)" type="number" value={plan.volume_gb} onChange={(e) => set("volume_gb", e.target.value)} /><Input label="مدت (روز، ۰=نامحدود)" type="number" value={plan.days} onChange={(e) => set("days", e.target.value)} /></div>
          <Input label="محدودیت کاربر هم‌زمان (۰=نامحدود)" type="number" value={plan.user_limit} onChange={(e) => set("user_limit", e.target.value)} />
        </>}
      </Sheet>
      <Sheet open={!!cat} onClose={() => setCat(null)} title={cat?.id ? "ویرایش دسته" : "دسته‌ی جدید"} footer={cat && <><Button variant="primary" size="lg" full loading={busy} disabled={!cat.name.trim()} onClick={saveCat}>ذخیره</Button>{cat.id && <Button full onClick={() => setMapFor({ scope: "vip_category", id: cat.id, name: cat.name })}>نگاشت پنل این دسته</Button>}{cat.id && <Button variant="danger" full icon={<Trash2 size={15} />} onClick={delCat}>حذف دسته (فقط اگر خالی باشد)</Button>}</>}>
        {cat && <Input label="نام دسته" value={cat.name} onChange={(e) => setCat({ ...cat, name: e.target.value })} />}
      </Sheet>
      {mapFor && <MappingSheet open scope={mapFor.scope} scopeId={mapFor.id} title={mapFor.name} onClose={() => setMapFor(null)} />}
    </div>
  )
}
