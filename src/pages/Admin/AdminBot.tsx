import { useState } from "react"
import { toast } from "sonner"
import { Plus, Trash2 } from "lucide-react"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { ask } from "@/shared/lib/confirm"
import { Alert, Button, Card, Input, PageSkeleton, PageTop, Row, Section, Segmented, Sheet, Textarea, List } from "@/shared/ui/kit"
import { faDigits } from "@/shared/lib/format"

type Tab = "info" | "channels" | "renewal"

export default function AdminBot() {
  const [tab, setTab] = useState<Tab>("info")
  return (
    <div className="x-page">
      <PageTop title="اطلاعات ربات و تمدید" back="/admin/more" />
      <Segmented<Tab> value={tab} options={[{ value: "info", label: "اطلاعات" }, { value: "channels", label: "کانال‌ها" }, { value: "renewal", label: "تمدید" }]} onChange={setTab} />
      {tab === "renewal" ? <Renewal /> : <Info channels={tab === "channels"} />}
    </div>
  )
}

function Info({ channels }: { channels: boolean }) {
  const { data, error, setData } = useLoad<any>(() => adminGet("/botinfo"))
  const [edit, setEdit] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState("")
  const [ch, setCh] = useState<any>(null)
  const call = async (body: any, ok = "ذخیره شد") => {
    setBusy(body.key || body.action)
    try { setData(await adminPost("/botinfo", body)); toast.success(ok); return true } catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")); return false } finally { setBusy("") }
  }
  if (error) return <Alert tone="bad">دریافت ناموفق بود</Alert>
  if (!data) return <PageSkeleton />
  if (channels) return (
    <>
      <Alert tone="warn">کاربران باید در این کانال‌ها عضو باشند (ربات باید در کانال ادمین باشد).</Alert>
      <Button variant="primary" icon={<Plus size={16} />} full onClick={() => setCh({ channel_id: "", name: "", url: "" })}>افزودن کانال</Button>
      <List>{data.channels.map((c: any) => <Row key={c.id} title={c.name || String(c.id)} sub={`${faDigits(c.id)} · ${c.url || ""}`}
        right={<Button size="sm" variant="danger" icon={<Trash2 size={14} />} onClick={async () => { if (await ask("کانال حذف شود؟")) call({ action: "remove_channel", channel_id: c.id }, "حذف شد") }} />} />)}</List>
      <Sheet open={!!ch} onClose={() => setCh(null)} title="کانال جدید" footer={ch && <Button variant="primary" size="lg" full loading={busy === "add_channel"} onClick={async () => { if (await call({ action: "add_channel", ...ch }, "کانال اضافه شد")) setCh(null) }}>افزودن</Button>}>
        {ch && <>
          <Input label="آیدی عددی کانال (مثل -100123…)" ltr value={ch.channel_id} onChange={(e) => setCh({ ...ch, channel_id: e.target.value })} />
          <Input label="نام نمایشی" value={ch.name} onChange={(e) => setCh({ ...ch, name: e.target.value })} />
          <Input label="لینک کانال" ltr value={ch.url} onChange={(e) => setCh({ ...ch, url: e.target.value })} />
        </>}
      </Sheet>
    </>
  )
  return (
    <>
      {data.fields.map((f: any) => {
        const v = edit[f.key] ?? f.value ?? ""
        const long = f.key === "welcome_text"
        return (
          <Card key={f.key}><div className="x-stack">
            {long ? <Textarea label={f.label} rows={6} value={v} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })} /> : <Input label={f.label} value={v} onChange={(e) => setEdit({ ...edit, [f.key]: e.target.value })} />}
            {edit[f.key] !== undefined && edit[f.key] !== f.value && <Button variant="primary" loading={busy === f.key} onClick={async () => { if (await call({ action: "field", key: f.key, value: edit[f.key] })) { const n = { ...edit }; delete n[f.key]; setEdit(n) } }}>ذخیره</Button>}
          </div></Card>
        )
      })}
      <div className="x-muted">متن خوش‌آمد: می‌توانید از {"{first_name}"} استفاده کنید. ایموجی پرمیوم فقط از داخل ربات قابل تنظیم است.</div>
    </>
  )
}

const MODES = [{ value: "day", label: "روزانه" }, { value: "gb", label: "حجمی" }, { value: "both", label: "هر دو" }]
const NUM: [string, string][] = [["price_day", "قیمت هر روز"], ["price_gb", "قیمت هر گیگ"], ["min_day", "حداقل روز"], ["max_day", "حداکثر روز (۰=نامحدود)"], ["min_gb", "حداقل گیگ"], ["max_gb", "حداکثر گیگ (۰=نامحدود)"]]

function Renewal() {
  const { data, error, setData } = useLoad<any>(() => adminGet("/renewal"))
  const [f, setF] = useState<any>(null)
  const [busy, setBusy] = useState(false)
  if (error) return <Alert tone="bad">دریافت ناموفق بود</Alert>
  if (!data) return <PageSkeleton />
  const save = async () => {
    setBusy(true)
    try { const { id, name, ...values } = f; setData(await adminPost("/renewal", { category_id: id, values })); toast.success("ذخیره شد"); setF(null) }
    catch (e) { toast.error(friendlyErrorMessage(e, "ناموفق بود")) } finally { setBusy(false) }
  }
  return (
    <>
      <Section title="تنظیمات تمدید هر دسته"><List>{data.items.map((c: any) => <Row key={c.id} onClick={() => setF({ ...c })} title={c.name} sub={`${c.mode === "day" ? "روزانه" : c.mode === "gb" ? "حجمی" : "روزانه و حجمی"} · روز ${faDigits(c.price_day)} · گیگ ${faDigits(c.price_gb)}`} />)}</List></Section>
      <Sheet open={!!f} onClose={() => setF(null)} title={f?.name} footer={<Button variant="primary" size="lg" full loading={busy} onClick={save}>ذخیره</Button>}>
        {f && <>
          <Segmented<string> value={f.mode} options={MODES} onChange={(v) => setF({ ...f, mode: v })} />
          {NUM.map(([k, l]) => <Input key={k} label={l} type="number" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} />)}
          <Input label="گزینه‌های روز (با کاما)" ltr value={f.day_options} onChange={(e) => setF({ ...f, day_options: e.target.value })} />
          <Input label="گزینه‌های گیگ (با کاما)" ltr value={f.gb_options} onChange={(e) => setF({ ...f, gb_options: e.target.value })} />
        </>}
      </Sheet>
    </>
  )
}
