import { useState } from "react";
import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Music2, Loader2, CheckCircle2 } from "lucide-react";

const onboardingSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères").max(200),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string().default("Europe/Paris"),
  currency: z.string().default("EUR"),
  language: z.string().default("fr"),
});

type OnboardingFormData = z.infer<typeof onboardingSchema>;

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      timezone: "Europe/Paris",
      currency: "EUR",
      language: "fr",
    },
  });

  const createOrgMutation = trpc.organizations.create.useMutation({
    onSuccess: (data) => {
      toast.success("Studio créé avec succès !", {
        description: `Votre sous-domaine: ${data.subdomain}.manus.space`,
      });
      setStep(3);
      setTimeout(() => {
        setLocation("/dashboard");
      }, 2000);
    },
    onError: (error) => {
      toast.error("Erreur lors de la création", {
        description: error.message,
      });
    },
  });

  const onSubmit = (data: OnboardingFormData) => {
    createOrgMutation.mutate(data);
  };

  const timezone = watch("timezone");
  const currency = watch("currency");
  const language = watch("language");

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-background to-primary/5">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Music2 className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Bienvenue sur Recording Studio Manager</CardTitle>
          <CardDescription>Créons votre studio en quelques étapes</CardDescription>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center gap-2">
              <StepIndicator number={1} active={step >= 1} completed={step > 1} />
              <div className={`h-0.5 w-12 ${step > 1 ? "bg-primary" : "bg-border"}`} />
              <StepIndicator number={2} active={step >= 2} completed={step > 2} />
              <div className={`h-0.5 w-12 ${step > 2 ? "bg-primary" : "bg-border"}`} />
              <StepIndicator number={3} active={step >= 3} completed={step > 3} />
            </div>
          </div>

          {step === 1 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Informations de base</h3>
                <p className="text-sm text-muted-foreground">
                  Commencez par nous donner quelques informations sur votre studio
                </p>
              </div>

              <form onSubmit={handleSubmit(() => setStep(2))} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nom du studio *</Label>
                  <Input
                    id="name"
                    placeholder="Pro Audio Studio Paris"
                    {...register("name")}
                    className={errors.name ? "border-destructive" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+33 1 23 45 67 89"
                    {...register("phone")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Adresse</Label>
                  <Input
                    id="address"
                    placeholder="123 rue de la Musique"
                    {...register("address")}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">Ville</Label>
                    <Input id="city" placeholder="Paris" {...register("city")} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Pays</Label>
                    <Input id="country" placeholder="FR" maxLength={2} {...register("country")} />
                  </div>
                </div>

                <div className="flex justify-end pt-4">
                  <Button type="submit">Continuer</Button>
                </div>
              </form>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">Préférences</h3>
                <p className="text-sm text-muted-foreground">
                  Configurez vos préférences régionales
                </p>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Fuseau horaire</Label>
                  <Select value={timezone} onValueChange={(value) => setValue("timezone", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Europe/Paris">Europe/Paris (GMT+1)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (GMT-5)</SelectItem>
                      <SelectItem value="America/Los_Angeles">America/Los_Angeles (GMT-8)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="currency">Devise</Label>
                  <Select value={currency} onValueChange={(value) => setValue("currency", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EUR">EUR (€)</SelectItem>
                      <SelectItem value="USD">USD ($)</SelectItem>
                      <SelectItem value="GBP">GBP (£)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Langue</Label>
                  <Select value={language} onValueChange={(value) => setValue("language", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-between pt-4">
                  <Button type="button" variant="outline" onClick={() => setStep(1)}>
                    Retour
                  </Button>
                  <Button type="submit" disabled={createOrgMutation.isPending}>
                    {createOrgMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Création...
                      </>
                    ) : (
                      "Créer mon studio"
                    )}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6 py-8">
              <div className="flex justify-center">
                <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <CheckCircle2 className="h-10 w-10 text-primary" />
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Studio créé avec succès !</h3>
                <p className="text-muted-foreground">
                  Redirection vers votre dashboard...
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StepIndicator({ number, active, completed }: { number: number; active: boolean; completed: boolean }) {
  return (
    <div
      className={`h-10 w-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
        completed
          ? "bg-primary text-primary-foreground"
          : active
          ? "bg-primary/20 text-primary border-2 border-primary"
          : "bg-muted text-muted-foreground"
      }`}
    >
      {completed ? <CheckCircle2 className="h-5 w-5" /> : number}
    </div>
  );
}
