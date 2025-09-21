import { useEffect } from "react";
import { Check, Bot, MessagesSquare, KeySquare, CalendarCheck, Gauge, MapPinned, Shield, Infinity as InfinityIcon, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function Mission() {
  useEffect(() => { document.title = "Mission • HostSuite AI"; }, []);

  return (
    <div className="container mx-auto max-w-6xl px-4 py-10">
      {/* HERO */}
      <section className="mb-12">
        <Badge className="mb-3 bg-orange-600 hover:bg-orange-700">La nostra missione</Badge>
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-gray-900 mb-4">
          HostSuite AI — Il <span className="text-orange-600">General Manager digitale</span> per gli Affitti Brevi
        </h1>
        <p className="text-lg text-gray-600 max-w-3xl">
          Non un altro tool, ma il <strong>cervello operativo</strong> che orchestra messaggi, check-in, accessi, pulizie, prezzi e upsell.
          Un'unica interfaccia semplice in stile Airbnb. Dalla prenotazione alla recensione.
        </p>

        <div className="mt-6 flex gap-3">
          <Link to="/pricing">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">Vedi i piani</Button>
          </Link>
          <a href="/host-login">
            <Button variant="outline">Inizia (Host)</Button>
          </a>
        </div>
      </section>

      {/* COSA FA IN PAROLE SEMPLICI */}
      <section className="grid md:grid-cols-2 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MessagesSquare className="h-5 w-5 text-orange-600" /> Messaggi multi-canale</CardTitle>
            <CardDescription>OTA, email, WhatsApp — dal pre-check-in al promemoria recensione.</CardDescription>
          </CardHeader>
          <CardContent className="text-gray-600">Template smart, inbox unica, automazioni e sentiment.</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><KeySquare className="h-5 w-5 text-orange-600" /> Check-in + Tassa + Accessi</CardTitle>
            <CardDescription>Accesso digitale consentito solo se tutto è in regola.</CardDescription>
          </CardHeader>
          <CardContent className="text-gray-600">Flusso guidato per ospiti, ricevute e registri automatici.</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CalendarCheck className="h-5 w-5 text-orange-600" /> Pulizie e Turnover</CardTitle>
            <CardDescription>Calendario, checklist, foto post-servizio e notifiche live.</CardDescription>
          </CardHeader>
          <CardContent className="text-gray-600">Assegnazioni automatiche e SLA trasparente.</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Gauge className="h-5 w-5 text-orange-600" /> Prezzi dinamici semplificati</CardTitle>
            <CardDescription>Min/Med/Max con AI che reagisce a domanda, eventi e meteo.</CardDescription>
          </CardHeader>
          <CardContent className="text-gray-600">Potenza da pro, semplicità da Airbnb.</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPinned className="h-5 w-5 text-orange-600" /> Guest Dashboard (iTraveller)</CardTitle>
            <CardDescription>Guida digitale, consigli GPS e upsell acquistabili in app.</CardDescription>
          </CardHeader>
          <CardContent className="text-gray-600">Esperienza ospite che converte e fidelizza.</CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-5 w-5 text-orange-600" /> Channel Manager nativo</CardTitle>
            <CardDescription>Via Channex.io — niente software esterni.</CardDescription>
          </CardHeader>
          <CardContent className="text-gray-600">Calendari sempre allineati senza frizioni.</CardContent>
        </Card>
      </section>

      {/* PERCHÉ SIAMO DIVERSI */}
      <section className="mb-12">
        <h2 className="text-2xl md:text-3xl font-bold mb-3">Perché HostSuite AI è diversa</h2>
        <p className="text-gray-700 max-w-3xl mb-4">
          I competitor coprono <em>pezzi</em>: calendario, pulizie, accessi, guide. <strong>Nessuno</strong> ha costruito il
          <span className="font-semibold"> General Manager AI</span> che integra tutto in un unico flusso operativo.
        </p>
        <ul className="grid md:grid-cols-2 gap-3 text-gray-700">
          <li className="flex items-start gap-2"><Check className="mt-1 h-5 w-5 text-orange-600" /> Messaggi → Check-in → Accessi collegati: l'ospite entra solo se tutto è in regola.</li>
          <li className="flex items-start gap-2"><Check className="mt-1 h-5 w-5 text-orange-600" /> Pulizie con checklist e foto → host e addetti sempre sincronizzati.</li>
          <li className="flex items-start gap-2"><Check className="mt-1 h-5 w-5 text-orange-600" /> Prezzi dinamici min/medio/max → controllo semplice, adattamento smart.</li>
          <li className="flex items-start gap-2"><Check className="mt-1 h-5 w-5 text-orange-600" /> Guide locali e upsell digitali → più ricavi per soggiorno.</li>
        </ul>
      </section>

      {/* ONE-LINER */}
      <section className="rounded-2xl border bg-orange-50 p-6">
        <div className="flex items-start gap-3">
          <Sparkles className="h-6 w-6 text-orange-600 mt-1" />
          <blockquote className="text-lg md:text-xl text-gray-900 font-semibold">
            "Gli altri hanno fatto tool per gestire pezzi singoli. Noi stiamo costruendo il <span className="text-orange-600">cervello operativo</span> che governa l'intero affitto breve: dalla prenotazione all'accesso, fino alla recensione."
          </blockquote>
        </div>
        <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
          <Shield className="h-4 w-4" /> GDPR-ready • <InfinityIcon className="h-4 w-4" /> Scalabile • Onboarding veloce
        </div>
      </section>
    </div>
  );
}
