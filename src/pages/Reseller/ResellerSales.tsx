import { useState } from "react"
import { resellerGet, qs } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Button, Chip, Empty, PageSkeleton, PageTop, Row, Section, Segmented, List } from "@/shared/ui/kit"
import { faDigits, jalaliDate, num } from "@/shared/lib/format"

export default function ResellerSales() {
  const [tab, setTab] = useState<"mine" | "customers">("mine")
  const [page, setPage] = useState(1)
  const { data, error, reload } = useLoad<any>(() => resellerGet(`/sales${qs({ page })}`), [page])
  return (
    <div className="x-stack">
      <PageTop title="فروش و سفارش‌ها" />
      <Segmented<"mine" | "customers"> value={tab} options={[{ value: "mine", label: "خریدهای من" }, { value: "customers", label: "خرید مشتریان" }]} onChange={setTab} />
      {error ? <Alert tone="bad">دریافت ناموفق بود <Button size="sm" onClick={reload}>تلاش مجدد</Button></Alert> : !data ? <PageSkeleton /> : tab === "mine" ? (
        data.items.length === 0 ? <Empty title="هنوز سفارشی ثبت نشده" /> : <>
          <List>{data.items.map((o: any) => <Row key={o.id} chevron={false} title={o.plan_name} sub={jalaliDate(o.created_at, true)} right={<span className="x-stack" style={{ gap: 2, alignItems: "flex-end" }}><b className="num">{num(o.price)}</b><Chip tone={["completed", "paid", "active", "fulfilled"].includes(o.status) ? "ok" : "warn"}>{o.status}</Chip></span>} />)}</List>
          {data.total > data.per && <div className="x-row-flex" style={{ justifyContent: "center" }}><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</Button><span className="x-sub">{faDigits(page)}</span><Button disabled={page * data.per >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button></div>}
        </>
      ) : (
        <Section>{data.customer_orders.length === 0 ? <Empty title="مشتریان شما هنوز خریدی نداشته‌اند" /> : <List>{data.customer_orders.map((o: any) => <Row key={o.id} chevron={false} title={o.plan_name} sub={`${o.user_name} · ${jalaliDate(o.created_at, true)}`} right={<b className="num">{num(o.price)}</b>} />)}</List>}</Section>
      )}
    </div>
  )
}
