import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, MessageSquare, Clock, CheckCircle, User } from "lucide-react";
import HostNavbar from "@/components/HostNavbar";

// Dummy unanswered questions data
const unansweredQuestions = [
  {
    id: "1",
    question: "Come posso regolare la temperatura del riscaldamento?",
    guestCode: "SIENA001",
    property: "Casa Siena Centro",
    createdAt: "2024-03-15 14:30",
    status: "pending"
  },
  {
    id: "2",
    question: "C'è un supermercato aperto la domenica nelle vicinanze?",
    guestCode: "ROMA002",
    property: "Appartamento Roma",
    createdAt: "2024-03-15 11:15",
    status: "pending"
  },
  {
    id: "3",
    question: "Posso lasciare i bagagli dopo il check-out?",
    guestCode: "SIENA003",
    property: "Casa Siena Centro", 
    createdAt: "2024-03-14 16:45",
    status: "resolved"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge className="bg-yellow-100 text-yellow-800">In Attesa</Badge>;
    case "resolved":
      return <Badge className="bg-green-100 text-green-800">Risolto</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const HostUnansweredQuestions = () => {
  return (
    <div className="min-h-screen bg-background">
      <HostNavbar />
      <div className="pt-20 container max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-hostsuite-primary mb-2">Domande Senza Risposta</h1>
          <p className="text-hostsuite-text">Gestisci le domande degli ospiti che necessitano di una risposta manuale</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Domande in Attesa</p>
                  <p className="text-2xl font-bold text-yellow-600">2</p>
                </div>
                <Clock className="w-8 h-8 text-yellow-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Risolte Oggi</p>
                  <p className="text-2xl font-bold text-green-600">5</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500/60" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-hostsuite-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-hostsuite-text">Tempo Medio Risposta</p>
                  <p className="text-2xl font-bold text-hostsuite-primary">1.2h</p>
                </div>
                <MessageSquare className="w-8 h-8 text-hostsuite-primary/60" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Questions List */}
        <Card className="border-hostsuite-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-hostsuite-primary">
              <HelpCircle className="w-6 h-6" />
              Domande Recenti
            </CardTitle>
            <CardDescription>
              Domande degli ospiti che richiedono la tua attenzione
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {unansweredQuestions.map((question) => (
                <div 
                  key={question.id}
                  className="p-4 border border-hostsuite-primary/20 rounded-lg hover:bg-hostsuite-primary/5 transition-colors"
                >
                  <div className="flex flex-col gap-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusBadge(question.status)}
                          <span className="text-sm text-hostsuite-text">
                            {question.createdAt}
                          </span>
                        </div>
                        <h3 className="font-medium text-hostsuite-primary mb-2">
                          {question.question}
                        </h3>
                        <div className="flex items-center gap-4 text-sm text-hostsuite-text">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            Guest Code: {question.guestCode}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            {question.property}
                          </div>
                        </div>
                      </div>
                      
                      {question.status === "pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" disabled>
                            Rispondi
                          </Button>
                          <Button size="sm" variant="outline" disabled>
                            Aggiungi a FAQ
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {unansweredQuestions.length === 0 && (
                <div className="text-center py-8">
                  <HelpCircle className="w-12 h-12 text-hostsuite-primary/30 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-hostsuite-text mb-2">
                    Nessuna domanda in sospeso
                  </h3>
                  <p className="text-hostsuite-text/60">
                    Tutte le domande degli ospiti hanno ricevuto risposta
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HostUnansweredQuestions;