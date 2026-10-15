import { Send, RefreshCcw, ShieldCheck } from "lucide-react";
import WebApp from "@twa-dev/sdk";
import { Button, Card, Tile } from "@/shared/ui/kit";

interface Props { channels: { name: string; url: string }[]; checking: boolean; onRecheck: () => void }
export default function JoinChannelsGate({ channels, checking, onRecheck }: Props) {
  const open = (url: string) => { try { WebApp.openTelegramLink(url) } catch { WebApp.openLink(url) } }
  return (
    <div className="x-page" style={{ paddingTop: 30 }}>
      <Card hero>
        <div className="x-stack" style={{ alignItems: "center", textAlign: "center", gap: 12 }}>
          <Tile icon={<ShieldCheck size={26} />} size="lg" solid />
          <div className="x-h2">عضویت در کانال‌ها الزامی است</div>
          <p className="x-sub">برای استفاده از امکانات، ابتدا در کانال‌های زیر عضو شوید و سپس «بررسی مجدد» را بزنید.</p>
          <div className="x-stack" style={{ width: "100%" }}>
            {channels.map((c) => <Button key={c.url} full icon={<Send size={16} />} onClick={() => open(c.url)}>{c.name}</Button>)}
          </div>
          <Button variant="primary" full loading={checking} icon={<RefreshCcw size={17} />} onClick={onRecheck}>بررسی مجدد عضویت</Button>
        </div>
      </Card>
    </div>
  )
}
