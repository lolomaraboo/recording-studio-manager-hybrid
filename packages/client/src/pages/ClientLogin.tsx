import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { Loader2, Music } from "lucide-react";


export default function ClientLogin() {
  const navigate = useNavigate();
  const [token, setToken] = useState("");


  const loginMutation = trpc.clientAuth.loginWithToken.useMutation({
    onSuccess: (data) => {
      // Stocker le token et les données client
      localStorage.setItem("clientToken", data.token);
      localStorage.setItem("clientData", JSON.stringify(data.client));
      
      alert(`Connexion réussie ! Bienvenue ${data.client.name}`);
      
      navigate("/client/dashboard");
    },
    onError: (error) => {
      alert(`Erreur de connexion : ${error.message}`);
    },
  });

  // Vérifier si un token est dans l'URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const urlToken = params.get("token");
    if (urlToken) {
      setToken(urlToken);
    }
  }, []);

  const handleLogin = () => {
    if (!token) {
      alert("Token manquant : Veuillez entrer votre token d'accès");
      return;
    }

    const orgId = parseInt(localStorage.getItem("selectedOrganizationId") || "1");
    loginMutation.mutate({
      organizationId: orgId,
      token,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Music className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl">Portail Client</CardTitle>
          <CardDescription>
            Accédez à vos sessions, fichiers et factures
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="token">Token d'accès</Label>
            <Input
              id="token"
              type="text"
              placeholder="Entrez votre token d'accès"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleLogin();
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              Vous avez reçu ce token par email
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleLogin}
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connexion...
              </>
            ) : (
              "Se connecter"
            )}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            <p>Vous n'avez pas reçu de token ?</p>
            <p>Contactez votre studio d'enregistrement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
