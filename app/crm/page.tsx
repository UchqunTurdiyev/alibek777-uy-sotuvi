import type { Metadata } from "next";
import { currentUser, crmEnabled } from "@/lib/crm-auth";
import { storeEnabled } from "@/lib/store";
import { site } from "@/lib/site";
import CrmLogin from "@/components/crm/CrmLogin";
import CrmBoard from "@/components/crm/CrmBoard";
import "./crm.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `CRM — ${site.brand}`,
  robots: { index: false, follow: false },
};

export default async function CrmPage() {
  if (!crmEnabled()) {
    return (
      <main className="crm-setup">
        <h1>CRM sozlanmagan</h1>
        <p>
          Vercel → Settings → Environment Variables bo&apos;limiga <code>CRM_PASSWORD</code> va <code>MONGODB_URI</code>{" "}
          qo&apos;shing, keyin qayta deploy qiling.
        </p>
      </main>
    );
  }

  const user = await currentUser();
  if (!user) return <CrmLogin brand={site.brand} />;

  return <CrmBoard user={user.name} brand={site.brand} dbReady={storeEnabled} />;
}
