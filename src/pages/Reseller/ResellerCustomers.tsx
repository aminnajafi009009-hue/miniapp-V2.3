import { useEffect, useState } from "react"
import { resellerGet, qs } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Alert, Avatar, Button, Chip, Empty, PageSkeleton, PageTop, Row, SearchBox, List } from "@/shared/ui/kit"
import { faDigits, num } from "@/shared/lib/format"

export default function ResellerCustomers() {
  const [q, setQ] = useState(""); const [dq, setDq] = useState(""); const [page, setPage] = useState(1)
  useEffect(() => { const t = setTimeout(() => { setDq(q.trim()); setPage(1) }, 350); return () => clearTimeout(t) }, [q])
  const { data, error, reload } = useLoad<any>(() => resellerGet(`/customers${qs({ q: dq, page })}`), [dq, page])
  return (
    <div className="x-stack">
      <PageTop title="مشتریان" sub={data ? `${num(data.total)} نفر` : undefined} />
      <SearchBox value={q} onChange={setQ} placeholder="جستجوی نام یا آیدی…" />
      {error ? <Alert tone="bad">دریافت ناموفق بود <Button size="sm" onClick={reload}>تلاش مجدد</Button></Alert> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="هنوز مشتری ندارید" sub="لینک دعوت خود را برای مشتری‌ها بفرستید." /> : (
        <List>{data.items.map((c: any) => <Row key={c.telegram_id} href={`/reseller/customers/${c.telegram_id}`} icon={<Avatar name={c.name} size={36} />} title={c.name} sub={`${faDigits(c.telegram_id)} · ${faDigits(c.services)} سرویس`} right={<Chip tone={c.total_purchase > 0 ? "ok" : undefined}>{num(c.total_purchase)}</Chip>} />)}</List>
      )}
      {data && data.total > data.per && <div className="x-row-flex" style={{ justifyContent: "center" }}><Button disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</Button><span className="x-sub">{faDigits(page)}</span><Button disabled={page * data.per >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button></div>}
    </div>
  )
}
