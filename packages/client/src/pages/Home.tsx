import { useAuth } from "@/_core/hooks/useAuth";
import { PublicAIAssistant } from "@/components/PublicAIAssistant";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getLoginUrl } from "@/const";
import { Link } from "wouter";
import { 
  Music2, Calendar, Users, FileText, BarChart3, 
  Check, ArrowRight, Sparkles, Shield, Zap 
} from "lucide-react";

export default function Home() {
  const { user, isAuthenticated } = useAuth();

  return (
    <>
    <PublicAIAssistant />
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2">
            <Music2 className="h-8 w-8 text-primary" />
            <span className="text-xl font-bold">Recording Studio Manager</span>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground">Bonjour, {user?.name}</span>
                <Button asChild>
                  <Link href="/dashboard">Accéder au Dashboard</Link>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <a href={getLoginUrl()}>Connexion</a>
                </Button>
                <Button asChild>
                  <a href={getLoginUrl()}>Commencer gratuitement</a>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-background via-background to-primary/5">
        <div className="container max-w-6xl">
          <div className="text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              <Sparkles className="h-3 w-3 mr-1" />
              Plateforme SaaS Multi-Tenant
            </Badge>
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
              Gérez votre studio d'enregistrement
              <span className="block text-primary mt-2">avec simplicité et efficacité</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Une solution complète pour gérer vos sessions, clients, équipements et finances. 
              Tout ce dont vous avez besoin pour faire prospérer votre studio.
            </p>
            <div className="flex gap-4 justify-center pt-4">
              {!isAuthenticated && (
                <>
                  <Button size="lg" asChild>
                    <a href={getLoginUrl()}>
                      Commencer gratuitement
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </a>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <a href="#pricing">Voir les tarifs</a>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Fonctionnalités principales</h2>
            <p className="text-muted-foreground">Tout ce dont vous avez besoin pour gérer votre studio</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={<Calendar className="h-8 w-8" />}
              title="Gestion des sessions"
              description="Planifiez et gérez vos sessions d'enregistrement avec un calendrier intuitif"
            />
            <FeatureCard
              icon={<Users className="h-8 w-8" />}
              title="Gestion des clients"
              description="Centralisez toutes les informations de vos clients et leur historique"
            />
            <FeatureCard
              icon={<FileText className="h-8 w-8" />}
              title="Facturation automatique"
              description="Créez et envoyez vos factures en quelques clics"
            />
            <FeatureCard
              icon={<Music2 className="h-8 w-8" />}
              title="Gestion de l'équipement"
              description="Suivez votre matériel et planifiez la maintenance"
            />
            <FeatureCard
              icon={<BarChart3 className="h-8 w-8" />}
              title="Rapports & Analytics"
              description="Analysez vos performances avec des rapports détaillés"
            />
            <FeatureCard
              icon={<Shield className="h-8 w-8" />}
              title="Sécurité & Isolation"
              description="Vos données sont isolées et sécurisées par studio"
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 bg-card/30">
        <div className="container max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Choisissez votre plan</h2>
            <p className="text-muted-foreground">Des tarifs adaptés à tous les studios</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <PricingCard
              name="Free"
              price="0"
              description="Parfait pour commencer"
              features={[
                "1 salle d'enregistrement",
                "10 clients maximum",
                "20 sessions par mois",
                "1 Go de stockage",
                "Facturation basique",
              ]}
              cta="Commencer gratuitement"
              popular={false}
            />
            <PricingCard
              name="Pro"
              price="49"
              description="Pour les studios professionnels"
              features={[
                "5 salles d'enregistrement",
                "100 clients",
                "200 sessions par mois",
                "10 Go de stockage",
                "Gestion de projets",
                "Rapports avancés",
                "Support prioritaire",
              ]}
              cta="Essayer Pro"
              popular={true}
            />
            <PricingCard
              name="Enterprise"
              price="149"
              description="Pour les grands studios"
              features={[
                "Salles illimitées",
                "Clients illimités",
                "Sessions illimitées",
                "100 Go de stockage",
                "Gestion de contrats",
                "API complète",
                "Support dédié",
                "Branding personnalisé",
              ]}
              cta="Essayer Enterprise"
              popular={false}
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-primary/10 to-accent/10">
        <div className="container max-w-4xl text-center">
          <h2 className="text-4xl font-bold mb-4">Prêt à transformer votre studio ?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Rejoignez des centaines de studios qui utilisent déjà notre plateforme
          </p>
          {!isAuthenticated && (
            <Button size="lg" asChild>
              <a href={getLoginUrl()}>
                Commencer gratuitement
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          )}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 bg-card/50">
        <div className="container max-w-6xl">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <Music2 className="h-6 w-6 text-primary" />
              <span className="font-semibold">Recording Studio Manager</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Recording Studio Manager. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Card className="border-border/50 hover:border-primary/50 transition-colors">
      <CardHeader>
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary mb-4">
          {icon}
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
    </Card>
  );
}

function PricingCard({
  name,
  price,
  description,
  features,
  cta,
  popular,
}: {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
  popular: boolean;
}) {
  return (
    <Card className={`relative ${popular ? "border-primary shadow-lg scale-105" : "border-border/50"}`}>
      {popular && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <Badge className="bg-primary text-primary-foreground">
            <Zap className="h-3 w-3 mr-1" />
            Populaire
          </Badge>
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-2xl">{name}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <div className="mt-4">
          <span className="text-4xl font-bold">{price}€</span>
          <span className="text-muted-foreground">/mois</span>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {features.map((feature, i) => (
            <li key={i} className="flex items-start gap-2">
              <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <span className="text-sm">{feature}</span>
            </li>
          ))}
        </ul>
      </CardContent>
      <CardFooter>
        <Button className="w-full" variant={popular ? "default" : "outline"} asChild>
          <a href={getLoginUrl()}>{cta}</a>
        </Button>
      </CardFooter>
    </Card>
  );
}
