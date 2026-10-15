import { useEffect, useMemo, useState, type ReactNode } from "react"
import { useLocation } from "react-router-dom"
import { toast } from "sonner"
import { Clock, Database, Layers, RefreshCw, Type, Wallet as WalletIcon, CreditCard, Wrench } from "lucide-react"
import { getCustomBuildLimits } from "@/shared/api/services"
import { cbCardInfo, cbCardReceipt, cbQuote, cbWallet, fetchCustomBuildOptions, type RenewMode } from "@/shared/api/purchase"
import type { CustomBuildLimits, CustomBuildOrderType, MapOption } from "@/shared/api/types"
import { ApiError, friendlyErrorMessage } from "@/shared/api/client"
import { Alert, Button, Card, Input, KV, PageSkeleton, PageTop, Section, Tile } from "@/shared/ui/kit"
import { CardInfoCard, ChoiceCard, DoneScreen, ReceiptPicker, StickyBar } from "@/shared/ui/purchase"
import { faDigits, toman } from "@/shared/lib/format"

type Step = "options" | "form" | "checkout" | "card-pay" | "done"
const LATIN = /^[A-Za-z0-9]+$/
interface NavState { orderType?: CustomBuildOrderType; targetConfigId?: number; planLabel?: string }

export default function CustomBuildPage() {
  const st = ((useLocation().state as NavState) || {})
  const orderType: CustomBuildOrderType = st.orderType === "renew" ? "renew" : "new"
  const [baseLimits, setLimits] = useState<CustomBuildLimits | null>(null)
  const [options, setOptions] = useState<MapOption[]>([])
  const [option, setOption] = useState<MapOption | null>(null)
  const [step, setStep] = useState<Step>("form")
  const [volume, setVolume] = useState(0)
  const [days, setDays] = useState(0)
  const [name, setName] = useState("")
  const [nameErr, setNameErr] = useState("")
  const [mode, setMode] = useState<RenewMode>("both")
  const [price, setPrice] = useState<number | null>(null)
  const [quoting, setQuoting] = useState(false)
  const [busy, setBusy] = useState(false)
  const [card, setCard] = useState<{ card_number: string; card_holder: string; price: number; invoice_id?: number; expires_at?: string } | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    (async () => {
      try {
        const l = await getCustomBuildLimits()
        setLimits(l); setVolume(l.min_gb); setDays(l.min_days)
        if (orderType === "new") {
          const opts = await fetchCustomBuildOptions()
          setOptions(opts)
          if (opts.length === 1) setOption(opts[0])
          else if (opts.length > 1) setStep("options")
        }
      } catch { setFailed(true) }
    })()
  }, [orderType])

  // هر گزینه (پلن نگاشت‌شده) قیمت و محدوده‌ی خودش را دارد؛ مقادیر خالی از تنظیم عمومی می‌آید
  const limits = useMemo<CustomBuildLimits | null>(() => {
    if (!baseLimits) return null
    if (!option) return baseLimits
    const pick = <K extends keyof CustomBuildLimits>(k: K): number => (option[k] as number | undefined) ?? baseLimits[k]
    return { min_gb: pick("min_gb"), max_gb: pick("max_gb"), min_days: pick("min_days"), max_days: pick("max_days"), price_per_gb: pick("price_per_gb"), price_per_30_days: pick("price_per_30_days") }
  }, [baseLimits, option])
  useEffect(() => { if (limits && orderType === "new") { setVolume(limits.min_gb); setDays(limits.min_days) } }, [option]) // eslint-disable-line react-hooks/exhaustive-deps

  const needVol = !(orderType === "renew" && mode === "time")
  const needDays = !(orderType === "renew" && mode === "volume")
  const ready = (!needVol || !!volume) && (!needDays || !!days)

  useEffect(() => {
    if (!limits || !ready) return
    setQuoting(true)
    const t = setTimeout(() => {
      cbQuote(volume, days, orderType, orderType === "renew" ? mode : undefined, option?.num)
        .then((r) => setPrice(r.price)).catch(() => setPrice(null)).finally(() => setQuoting(false))
    }, 300)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [volume, days, limits, mode, orderType, option])

  const canGo = useMemo(() => ready && (orderType !== "new" || (!!name.trim() && LATIN.test(name.trim()))), [ready, orderType, name])
  const base = () => ({ volumeGb: volume, days, name: orderType === "new" ? name.trim() : undefined, orderType, renewMode: orderType === "renew" ? mode : undefined, targetConfigId: st.targetConfigId, optionNum: option?.num })

  if (failed) return <div className="x-page"><PageTop title="سرویس سفارشی" back="/" /><Alert tone="bad">دریافت تنظیمات ساخت سرویس ناموفق بود.</Alert></div>
  if (!limits) return <div className="x-page"><PageTop title="سرویس سفارشی" back="/" /><PageSkeleton /></div>

  const title = orderType === "renew" ? "تمدید سرویس" : "سرویس سفارشی"
  const priceText = quoting ? "…" : price != null ? toman(price) : "—"

  async function wallet() {
    setBusy(true)
    try { await cbWallet(base()); toast.success("پرداخت موفق! سرویس شما به‌زودی ساخته می‌شود."); setStep("done") }
    catch (e) {
      const c = (e as ApiError).code
      toast.error(c === "insufficient_balance" ? "موجودی کیف پول کافی نیست" : c === "orders_closed" ? "بخش سفارشات موقتاً بسته است" : friendlyErrorMessage(e, "خطا در ثبت سفارش"))
    } finally { setBusy(false) }
  }
  async function startCard() {
    setBusy(true)
    try { setCard(await cbCardInfo(base())); setFile(null); setStep("card-pay") }
    catch (e) { toast.error(friendlyErrorMessage(e, "خطا در دریافت اطلاعات پرداخت")) } finally { setBusy(false) }
  }
  async function receipt() {
    if (!file) return
    setBusy(true)
    try { await cbCardReceipt({ ...base(), file, invoiceId: card?.invoice_id }); toast.success("رسید ارسال شد؛ پس از تأیید ادمین سرویس ساخته می‌شود"); setStep("done") }
    catch (e) { toast.error(friendlyErrorMessage(e, "خطا در ارسال رسید")) } finally { setBusy(false) }
  }
  function goCheckout() {
    if (orderType === "new" && !LATIN.test(name.trim())) { setNameErr("فقط حروف انگلیسی و عدد، بدون فاصله (مثال: aminvpn1)"); return }
    setNameErr(""); setStep("checkout")
  }

  if (step === "done") return <div className="x-page"><DoneScreen text="سرویس شما پس از بررسی ساخته و ارسال می‌شود." /></div>

  if (step === "options") return (
    <div className="x-page">
      <PageTop title={title} sub="یکی از گزینه‌ها را انتخاب کنید" back="/" />
      <div className="x-stack">
        {options.map((o) => <ChoiceCard key={o.num} icon={<Layers size={19} />} title={o.name} sub={o.price_per_gb != null ? `هر گیگ ${toman(o.price_per_gb)} · ${faDigits(o.min_gb ?? 0)}–${faDigits(o.max_gb ?? 0)} گیگ · ${faDigits(o.min_days ?? 0)}–${faDigits(o.max_days ?? 0)} روز` : undefined} on={option?.num === o.num} onClick={() => { setOption(o); setStep("form") }} />)}
      </div>
    </div>
  )

  if (step === "card-pay" && card) return (
    <div className="x-page">
      <PageTop title="پرداخت کارت‌به‌کارت" back={false} />
      <CardInfoCard cardNumber={card.card_number} holder={card.card_holder} price={card.price} expiresAt={card.expires_at}
        onExpire={() => { toast.error("مهلت پرداخت این فاکتور به پایان رسید. دوباره سفارش دهید."); setCard(null); setStep("checkout") }} />
      <ReceiptPicker file={file} onChange={setFile} />
      <StickyBar>
        <Button variant="primary" size="lg" full disabled={!file} loading={busy} onClick={receipt}>ارسال رسید برای تأیید</Button>
        <Button variant="ghost" full onClick={() => setStep("checkout")}>بازگشت</Button>
      </StickyBar>
    </div>
  )

  if (step === "checkout") return (
    <div className="x-page">
      <PageTop title="تأیید سفارش" back={false} />
      <Card hero>
        {option && <KV k="گزینه" v={option.name} />}
        {st.planLabel && <KV k="سرویس" v={st.planLabel} />}
        {needVol && <KV k="حجم" v={`${faDigits(volume)} گیگابایت`} />}
        {needDays && <KV k="مدت" v={`${faDigits(days)} روز`} />}
        {orderType === "new" && <KV k="نام سرویس" v={<span dir="ltr">{name.trim()}</span>} />}
        <div className="x-divider" />
        <KV k="قیمت نهایی" v={<b>{priceText}</b>} />
      </Card>
      <StickyBar>
        <Button variant="primary" size="lg" full icon={<WalletIcon size={17} />} loading={busy} onClick={wallet}>پرداخت از کیف پول</Button>
        <Button full icon={<CreditCard size={17} />} loading={busy} onClick={startCard}>کارت‌به‌کارت</Button>
        <Button variant="ghost" full onClick={() => setStep("form")}>بازگشت</Button>
      </StickyBar>
    </div>
  )

  const modes: { v: RenewMode; l: string; icon: ReactNode; set: () => void }[] = [
    { v: "time", l: "تمدید زمان — حداقل ۳۰ روز", icon: <Clock size={19} />, set: () => { setMode("time"); setVolume(0); setDays(Math.max(30, limits.min_days)) } },
    { v: "volume", l: "تمدید حجم — حداقل ۵ گیگ", icon: <Database size={19} />, set: () => { setMode("volume"); setVolume(5); setDays(0) } },
    { v: "both", l: "تمدید حجم و زمان", icon: <RefreshCw size={19} />, set: () => { setMode("both"); setVolume(limits.min_gb); setDays(limits.min_days) } },
  ]

  return (
    <div className="x-page">
      <PageTop title={title} sub={st.planLabel} back={true} />
      <Card hero>
        <div className="x-row-flex"><Tile tone="info" icon={<Wrench size={20} />} />
          <div className="x-grow"><div className="x-h3">{option?.name || "ساخت دلخواه"}</div>
            <div className="x-muted">هر گیگ {toman(limits.price_per_gb)} + هر ۳۰ روز {toman(limits.price_per_30_days)}</div></div></div>
      </Card>
      {orderType === "renew" && <Section title="نوع تمدید"><div className="x-stack">{modes.map((m) => <ChoiceCard key={m.v} icon={m.icon} title={m.l} on={mode === m.v} onClick={m.set} />)}</div></Section>}
      {needVol && <Card><div className="x-stack" style={{ gap: 6 }}>
        <div className="x-row-flex"><Database size={16} /><span className="x-grow x-h3">حجم</span><b className="num">{faDigits(volume)} گیگ</b></div>
        <input className="x-range" type="range" min={orderType === "renew" && mode === "volume" ? 5 : limits.min_gb} max={limits.max_gb} value={volume} onChange={(e) => setVolume(Number(e.target.value))} />
        <div className="x-muted">بین {faDigits(limits.min_gb)} تا {faDigits(limits.max_gb)} گیگابایت</div></div></Card>}
      {needDays && <Card><div className="x-stack" style={{ gap: 6 }}>
        <div className="x-row-flex"><Clock size={16} /><span className="x-grow x-h3">مدت</span><b className="num">{faDigits(days)} روز</b></div>
        <input className="x-range" type="range" min={orderType === "renew" && mode === "time" ? 30 : limits.min_days} max={limits.max_days} value={days} onChange={(e) => setDays(Number(e.target.value))} />
        <div className="x-muted">بین {faDigits(limits.min_days)} تا {faDigits(limits.max_days)} روز</div></div></Card>}
      {orderType === "new" && <Input label="نام سرویس (فقط لاتین، بدون فاصله)" ltr placeholder="aminvpn1" icon={<Type size={16} />} value={name} error={nameErr}
        onChange={(e) => { setName(e.target.value); setNameErr("") }} />}
      <StickyBar>
        <div className="x-row-flex"><span className="x-grow x-sub">قیمت تخمینی</span><b className="num">{priceText}</b></div>
        <Button variant="primary" size="lg" full disabled={!canGo} onClick={goCheckout}>ادامه</Button>
        {options.length > 1 && orderType === "new" && <Button variant="ghost" full onClick={() => setStep("options")}>تغییر گزینه</Button>}
      </StickyBar>
    </div>
  )
}
