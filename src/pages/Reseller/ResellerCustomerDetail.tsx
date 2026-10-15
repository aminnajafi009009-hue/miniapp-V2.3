import { useState } from "react"
import { useParams } from "react-router-dom"
import { toast } from "sonner"
import { MessageSquare, Server } from "lucide-react"
import { resellerGet, resellerPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Avatar, Button, Card, Chip, Empty, KV, PageSkeleton, PageTop, Row, Section, Sheet, Textarea, List } from "@/shared/ui/kit"
import { faDigits, jalaliDate, num, toman } from "@/shared/lib/format"

export default function ResellerCustomerDetail() {
  const { tid = "" } = useParams()
  const { data, error } = useLoad<any>(() => resellerGet(`/customers/${tid}`), [tid])
  const [open, setOpen] = useState(false); const [text, setText] = useState(""); const [busy, setBusy] = useState(false)
  if (error) return <div className="x-stack"><PageTop title="مشتری" back="/reseller/customers" /><Alert tone="bad">مشتری پیدا نشد.</Alert></div>
  if (!data) return <div className="x-stack"><PageTop title="مشتری" back="/reseller/customers" /><PageSkeleton /></div>
  const c = data.customer
  const send = async () => { setBusy(true); try { const r = await resellerPost(`/customers/${tid}/message`, { text }); toast[r.sent ? "success" : "warning"](r.sent ? "پیام ارسال شد" : "پیام به کاربر نرسید"); setOpen(false); setText("") } catch (e) { toast.error(friendlyErrorMessage(e, "ارسال ناموفق بود")) } finally { setBusy(false) } }
  return (
    <div className="x-stack">
      <PageTop title={c.name} sub={faDigits(c.telegram_id)} back="/reseller/customers" />
      <Card hero><div className="x-row-flex"><Avatar name={c.name} size={50} /><div className="x-grow"><div className="x-h2">{c.name}</div><div className="x-muted">عضویت: {jalaliDate(c.joined)}</div></div>{c.is_blocked && <Chip tone="bad">مسدود</Chip>}</div>
        <div className="x-divider" /><KV k="مجموع خرید" v={toman(c.total_purchase)} /></Card>
      <Button icon={<MessageSquare size={16} />} onClick={() => setOpen(true)}>ارسال پیام</Button>
      <Section title="سرویس‌ها">{data.services.length === 0 ? <Empty title="سرویسی ندارد" /> : <List>{data.services.map((s: any) => <Row key={s.id} chevron={false} icon={<Server size={18} />} tone="violet" title={s.plan} sub={s.expiry ? `انقضا: ${jalaliDate(s.expiry)}` : "بدون انقضا"} right={s.disabled ? <Chip tone="bad">غیرفعال</Chip> : undefined} />)}</List>}</Section>
      <Section title="سفارش‌ها">{data.orders.length === 0 ? <Empty title="سفارشی ندارد" /> : <List>{data.orders.map((o: any) => <Row key={o.id} chevron={false} title={o.plan_name} sub={jalaliDate(o.created_at)} right={<b className="num">{num(o.price)}</b>} />)}</List>}</Section>
      <Sheet open={open} onClose={() => setOpen(false)} title="پیام به مشتری" footer={<Button variant="primary" size="lg" full loading={busy} disabled={!text.trim()} onClick={send}>ارسال</Button>}><Textarea rows={5} value={text} onChange={(e) => setText(e.target.value)} /></Sheet>
    </div>
  )
}
