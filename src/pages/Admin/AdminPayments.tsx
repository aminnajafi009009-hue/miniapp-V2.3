import { useState } from "react"
import { toast } from "sonner"
import { adminGet, adminPost } from "@/shared/api/admin"
import { friendlyErrorMessage } from "@/shared/api/client"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Card, Input, PageSkeleton, PageTop, Section, Switch, Chip } from "@/shared/ui/kit"

export default function AdminPayments() {
  const { data, error, setData } = useLoad<any>(() => adminGet("/payments"))
  const [busy, setBusy] = useState("")
  const [card, setCard] = useState<any>(null)
  const [wallet, setWallet] = useState<any>(null)
  const [online, setOnline] = useState<any>(null)
  const send = async (section: string, values: any) => {
    setBusy(section + (values.symbol || ""))
    try { const r = await adminPost("/payments", { section, values }); setData(r); setCard(null); setWallet(null); setOnline(null); toast.success("ذخیره شد") }
    catch (e) { toast.error(friendlyErrorMessage(e, "ذخیره ناموفق بود")) } finally { setBusy("") }
  }
  if (error) return <div className="x-page"><PageTop title="روش‌های پرداخت" back="/admin/more" /><Alert tone="bad">دریافت ناموفق بود</Alert></div>
  if (!data) return <div className="x-page"><PageTop title="روش‌های پرداخت" back="/admin/more" /><PageSkeleton /></div>
  const c = card ?? data.card, w = wallet ?? data.wallet, o = online ?? data.online
  return (
    <div className="x-page">
      <PageTop title="روش‌های پرداخت" back="/admin/more" />
      <Section title="کارت‌به‌کارت"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={c.enabled} onChange={(v) => send("card", { enabled: v })} /></div>
        <Input label="شماره کارت" ltr inputMode="numeric" value={c.card_number} onChange={(e) => setCard({ ...c, card_number: e.target.value })} />
        <Input label="نام صاحب کارت" value={c.owner_name} onChange={(e) => setCard({ ...c, owner_name: e.target.value })} />
        <Input label="بانک" value={c.bank_name} onChange={(e) => setCard({ ...c, bank_name: e.target.value })} />
        {card && <Button variant="primary" loading={busy === "card"} onClick={() => send("card", { card_number: card.card_number, owner_name: card.owner_name, bank_name: card.bank_name })}>ذخیره‌ی کارت</Button>}
      </div></Card></Section>
      <Section title="درگاه آنلاین"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={o.enabled} onChange={(v) => send("online", { enabled: v })} /></div>
        <div className="x-row-flex"><span className="x-grow">تأیید خودکار</span><Switch checked={o.auto_confirm} onChange={(v) => send("online", { auto_confirm: v })} /></div>
        <Input label="حداقل مبلغ (تومان)" type="number" value={o.min_amount} onChange={(e) => setOnline({ ...o, min_amount: e.target.value })} />
        <div className="x-row-flex"><span className="x-grow">لینک پرداخت تلگرامی</span><Switch checked={!!o.use_telegram_link} onChange={(v) => send("online", { use_telegram_link: v })} /></div>
        <div className="x-row-flex"><span className="x-grow">حالت سازگار DDBot</span><Switch checked={!!o.use_ddbot_compat} onChange={(v) => send("online", { use_ddbot_compat: v })} /></div>
        <Input label="توکن بیزینس (خالی = بدون تغییر)" ltr placeholder={o.token_hint || (o.env_token ? "از env" : "")} value={o.new_token || ""} onChange={(e) => setOnline({ ...o, new_token: e.target.value })} />
        <Input label="آدرس بازگشت (Redirect)" ltr value={o.redirect_url || ""} onChange={(e) => setOnline({ ...o, redirect_url: e.target.value })} />
        <Input label="آدرس کال‌بک (Callback)" ltr value={o.callback_url || ""} onChange={(e) => setOnline({ ...o, callback_url: e.target.value })} />
        {online && <Button variant="primary" loading={busy === "online"} onClick={() => send("online", { min_amount: online.min_amount, redirect_url: online.redirect_url, callback_url: online.callback_url, ...(online.new_token ? { business_token: online.new_token } : {}) })}>ذخیره</Button>}
      </div></Card></Section>
      <Section title="شارژ کیف پول"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">فعال</span><Switch checked={w.enabled} onChange={(v) => send("wallet", { enabled: v })} /></div>
        <div className="x-grid c2"><Input label="حداقل شارژ" type="number" value={w.min_charge} onChange={(e) => setWallet({ ...w, min_charge: e.target.value })} /><Input label="حداکثر شارژ" type="number" value={w.max_charge} onChange={(e) => setWallet({ ...w, max_charge: e.target.value })} /></div>
        <Input label="درصد هدیه‌ی شارژ" type="number" value={w.gift_percent} onChange={(e) => setWallet({ ...w, gift_percent: e.target.value })} />
        {wallet && <Button variant="primary" loading={busy === "wallet"} onClick={() => send("wallet", { min_charge: wallet.min_charge, max_charge: wallet.max_charge, gift_percent: wallet.gift_percent })}>ذخیره</Button>}
      </div></Card></Section>
      <Section title="ارز دیجیتال"><Card><div className="x-stack">
        <div className="x-row-flex"><span className="x-grow">کل بخش ارز دیجیتال</span><Switch checked={data.crypto.master} onChange={(v) => send("crypto_master", { enabled: v })} /></div>
        {data.crypto.items.map((x: any) => <div key={x.symbol} className="x-row-flex"><div className="x-grow"><div className="x-h3">{x.name} <span className="x-muted">{x.symbol} · {x.network}</span></div><div className="x-muted">{x.has_wallet ? "آدرس کیف پول ثبت شده" : <Chip tone="warn">آدرس کیف پول ثبت نشده</Chip>}</div></div><Switch checked={x.enabled} onChange={(v) => send("crypto", { symbol: x.symbol, enabled: v })} /></div>)}
      </div></Card></Section>
    </div>
  )
}
