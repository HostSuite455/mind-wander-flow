import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Plan = {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number; // sconto annuale incluso
  ctaHref: string;
  highlight?: boolean;
  features: Array<{ label: string; included: boolean }>;
};

const plans: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    priceMonthly: 29,
    priceYearly: 290, // 2 mesi gratis
    ctaHref: "/host-login",
    features: [
      { label: "Inbox unificata (OTA + email + WhatsApp)", included: true },
      { label: "Check-in online + tassa di soggiorno", included: true },
      { label: "Accessi digitali collegati al check-in", included: true },
      { label: "Pulizie: calendario e checklist", included: true },
      { label: "Prezzi dinamici min/medio/max", included: true },
      { label: "Guest Dashboard (iTraveller)", included: true },
      { label: "Channel Manager nativo (Channex)", included: true },
      { label: "Automazioni avanzate e AI templates", included: false },
      { label: "Assistenza prioritaria", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    priceMonthly: 79,
    priceYearly: 790,
    ctaHref: "/host-login",
    highlight: true,
    features: [
      { label: "Tutto di Starter", included: true },
      { label: "Automazioni AI avanzate (flussi condizionali)", included: true },
      { label: "Reportistica ricavi e performance", included: true },
      { label: "Upsell in-app e pagamenti link-to-pay", included: true },
      { label: "Integrazione SMS", included: true },
      { label: "Assistenza prioritaria", included: true },
    ],
  },
  {
    id: "scale",
    name: "Scale",
    priceMonthly: 199,
    priceYearly: 1990,
    ctaHref: "/host-login",
    features: [
      { label: "Tutto di Pro", included: true },
      { label: "SLA dedicato e onboarding assistito", included: true },
      { label: "Permessi granulari team & cleaning partner", included: true },
      { label: "API / Webhooks e data export", included: true },
      { label: "Supporto multilocation e brand", included: true },
    ],
  },
];

export default function Pricing() {
  const [yearly, setYearly] = useState(true);
  useEffect(() => { document.title = "Pricing • HostSuite AI"; }, []);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* HERO */}
      <section className="mb-8">
        <Badge className="mb-3 bg-orange-600 hover:bg-orange-700">Prezzi semplici</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-3">
          Prezzi trasparenti. Potenza da Pro.
        </h1>
        <p className="text-gray-600 max-w-3xl">
          Un'unica piattaforma per messaggi, check-in, accessi, pulizie, prezzi dinamici e guest dashboard. Nessun vincolo, puoi cancellare quando vuoi.
        </p>

        {/* Toggle Monthly/Yearly */}
        <div className="mt-6 inline-flex items-center rounded-xl border p-1">
          <button
            className={`px-4 py-2 rounded-lg text-sm ${!yearly ? "bg-orange-600 text-white" : "text-gray-700"}`}
            onClick={() => setYearly(false)}
          >
            Mensile
          </button>
          <button
            className={`px-4 py-2 rounded-lg text-sm ${yearly ? "bg-orange-600 text-white" : "text-gray-700"}`}
            onClick={() => setYearly(true)}
          >
            Annuale <span className="ml-1 opacity-80">(-~2 mesi)</span>
          </button>
        </div>
      </section>

      {/* PLANS */}
      <section className="grid md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const price = yearly ? p.priceYearly : p.priceMonthly;
          const suffix = yearly ? " /anno" : " /mese";
          return (
            <Card key={p.id} className={`${p.highlight ? "border-orange-300 shadow-md" : ""}`}>
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span>{p.name}</span>
                  {p.highlight && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-md">Consigliato</span>}
                </CardTitle>
                <CardDescription>Per {p.id === "starter" ? "iniziare senza pensieri" : p.id === "pro" ? "host evoluti e property manager" : "operatori che crescono"}.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-4">
                  <span className="text-3xl font-extrabold tracking-tight">€{price}</span>
                  <span className="text-gray-600">{suffix}</span>
                </div>
                <a href={p.ctaHref}>
                  <Button className="w-full mb-4 bg-orange-600 hover:bg-orange-700 text-white">Prova ora</Button>
                </a>
                <ul className="space-y-2 text-sm">
                  {p.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-gray-700">
                      {f.included ? <Check className="h-4 w-4 text-green-600 mt-0.5" /> : <X className="h-4 w-4 text-gray-300 mt-0.5" />}
                      <span className={f.included ? "" : "opacity-60 line-through"}>{f.label}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold mb-4">Domande frequenti</h2>
        <div className="grid md:grid-cols-2 gap-6 text-gray-700">
          <div>
            <h3 className="font-semibold mb-1">È previsto un periodo di prova?</h3>
            <p>Sì, puoi iniziare e cancellare quando vuoi. Nessun lock-in.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Posso collegare i miei canali OTA?</h3>
            <p>Sì, il channel manager nativo (via Channex.io) sincronizza calendari e disponibilità.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Come funziona la parte check-in e accessi?</h3>
            <p>Il check-in online e la tassa di soggiorno abilitano automaticamente le chiavi smart: l'ospite entra solo se tutto è in regola.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-1">Siete GDPR-ready?</h3>
            <p>Sì. Archiviazione sicura, data export su richiesta e permessi granulari per i collaboratori.</p>
          </div>
        </div>
      </section>

      {/* CTA FINALE */}
      <section className="mt-12 rounded-2xl border bg-orange-50 p-6 flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold">Pronto a mettere il pilota automatico?</h3>
          <p className="text-gray-700">Prova HostSuite AI: il tuo General Manager digitale per gli affitti brevi.</p>
        </div>
        <a href="/host-login">
          <Button className="bg-orange-600 hover:bg-orange-700 text-white">Inizia (Host)</Button>
        </a>
      </section>
    </div>
  );
}
