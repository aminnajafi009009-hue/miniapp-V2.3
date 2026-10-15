import { useEffect, useState } from "react"
import { Ban } from "lucide-react"
import { adminGet, qs } from "@/shared/api/admin"
import { useLoad } from "@/shared/lib/useLoad"
import { Avatar, Button, Chip, Empty, PageSkeleton, PageTop, Row, SearchBox, Tabs, List } from "@/shared/ui/kit"
import { faDigits, num, toman } from "@/shared/lib/format"

const FILTERS = [{ value: "all", label: "همه" }, { value: "customers", label: "مشتریان" }, { value: "wallet", label: "دارای موجودی" }, { value: "blocked", label: "مسدود" }]

export default function AdminUsers() {
  const [q, setQ] = useState("")
  const [dq, setDq] = useState("")
  const [filter, setFilter] = useState("all")
  const [page, setPage] = useState(1)
  useEffect(() => { const t = setTimeout(() => { setDq(q.trim()); setPage(1) }, 350); return () => clearTimeout(t) }, [q])
  const { data, error, reload } = useLoad<any>(() => adminGet(`/users${qs({ q: dq, filter, page })}`), [dq, filter, page])
  return (
    <div className="x-page">
      <PageTop title="کاربران" sub={data ? `${num(data.total)} کاربر` : undefined} back="/admin/more" />
      <SearchBox value={q} onChange={setQ} placeholder="نام، آیدی عددی یا یوزرنیم…" />
      {!dq && <Tabs value={filter} options={FILTERS} onChange={(v) => { setFilter(v); setPage(1) }} />}
      {error ? <Empty title="خطا در دریافت" action={<Button onClick={reload}>تلاش مجدد</Button>} /> : !data ? <PageSkeleton /> : data.items.length === 0 ? <Empty title="کاربری یافت نشد" /> : (
        <List>
          {data.items.map((u: any) => (
            <Row key={u.telegram_id} href={`/admin/users/${u.telegram_id}`} icon={<Avatar name={u.name} size={36} />} title={u.name || u.telegram_id}
              sub={`${faDigits(u.telegram_id)} · خرید ${toman(u.total_purchase)}`}
              right={<span className="x-row-flex">{u.is_blocked && <Chip tone="bad" icon={<Ban size={12} />}>مسدود</Chip>}{u.wallet > 0 && <Chip tone="ok">{num(u.wallet)}</Chip>}</span>} />
          ))}
        </List>
      )}
      {data && !dq && data.total > data.per && (
        <div className="x-row-flex" style={{ justifyContent: "center" }}>
          <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>قبلی</Button>
          <span className="x-sub">{faDigits(page)} / {faDigits(Math.ceil(data.total / data.per))}</span>
          <Button disabled={page * data.per >= data.total} onClick={() => setPage(page + 1)}>بعدی</Button>
        </div>
      )}
    </div>
  )
}
