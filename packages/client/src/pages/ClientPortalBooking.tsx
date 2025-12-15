/**
 * CLIENT PORTAL - Page de réservation
 * 
 * Permet aux clients de :
 * - Voir les créneaux disponibles dans un calendrier
 * - Sélectionner une salle
 * - Choisir un type de session
 * - Réserver un créneau (demande de réservation)
 */

import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Clock, MapPin, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { fr } from "date-fns/locale";

export default function ClientPortalBooking() {
  const navigate = useNavigate();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedRoom, setSelectedRoom] = useState<string>("");
  const [selectedStartTime, setSelectedStartTime] = useState<string>("");
  const [selectedEndTime, setSelectedEndTime] = useState<string>("");
  const [sessionType, setSessionType] = useState<string>("recording");
  const [notes, setNotes] = useState<string>("");

  // Récupérer les créneaux disponibles pour la date sélectionnée
  const { data: availableSlots, isLoading: slotsLoading } = trpc.clientPortal.getAvailableSlots.useQuery({
    roomId: selectedRoom ? parseInt(selectedRoom) : undefined,
    startDate: startOfDay(selectedDate).toISOString(),
    endDate: endOfDay(selectedDate).toISOString(),
  });

  const requestBookingMutation = trpc.clientPortal.requestBooking.useMutation({
    onSuccess: () => {
      toast.success("Demande de réservation envoyée", {
        description: "Le studio va examiner votre demande et vous confirmera rapidement.",
      });
      navigate("/client-portal");
    },
    onError: (error) => {
      toast.error("Erreur lors de la réservation", {
        description: error.message,
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedRoom || !selectedStartTime || !selectedEndTime) {
      toast.error("Veuillez remplir tous les champs requis");
      return;
    }

    // Construire les dates complètes
    const startDateTime = new Date(selectedDate);
    const [startHour, startMinute] = selectedStartTime.split(":").map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(selectedDate);
    const [endHour, endMinute] = selectedEndTime.split(":").map(Number);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    if (endDateTime <= startDateTime) {
      toast.error("L'heure de fin doit être après l'heure de début");
      return;
    }

    requestBookingMutation.mutate({
      roomId: parseInt(selectedRoom),
      startTime: startDateTime.toISOString(),
      endTime: endDateTime.toISOString(),
      sessionType: sessionType as "recording" | "mixing" | "mastering" | "rehearsal",
      notes,
    });
  };

  // Générer les options d'heures (de 8h à 22h par tranches de 30 min)
  const timeOptions: string[] = [];
  for (let hour = 8; hour <= 22; hour++) {
    timeOptions.push(`${hour.toString().padStart(2, "0")}:00`);
    if (hour < 22) {
      timeOptions.push(`${hour.toString().padStart(2, "0")}:30`);
    }
  }

  // Vérifier si un créneau est disponible
  const isSlotAvailable = (roomId: number, startTime: string, endTime: string): boolean => {
    if (!availableSlots?.bookedSlots) return true;

    const startDateTime = new Date(selectedDate);
    const [startHour, startMinute] = startTime.split(":").map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);

    const endDateTime = new Date(selectedDate);
    const [endHour, endMinute] = endTime.split(":").map(Number);
    endDateTime.setHours(endHour, endMinute, 0, 0);

    return !availableSlots.bookedSlots.some((slot: any) => {
      if (slot.roomId !== roomId) return false;

      const slotStart = new Date(slot.startTime);
      const slotEnd = new Date(slot.endTime);

      // Vérifier s'il y a chevauchement
      return (
        (startDateTime >= slotStart && startDateTime < slotEnd) ||
        (endDateTime > slotStart && endDateTime <= slotEnd) ||
        (startDateTime <= slotStart && endDateTime >= slotEnd)
      );
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Link to="/client-portal">
            <Button variant="ghost" size="sm" className="mb-2">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au portail
            </Button>
          </Link>
          <h1 className="text-2xl font-bold">Réserver une Session</h1>
          <p className="text-sm text-muted-foreground">
            Sélectionnez une date, une salle et un créneau horaire
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Calendrier */}
          <Card>
            <CardHeader>
              <CardTitle>Sélectionner une date</CardTitle>
              <CardDescription>Choisissez le jour de votre session</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => date && setSelectedDate(date)}
                disabled={(date) => date < new Date()}
                locale={fr}
                className="rounded-md border"
              />
            </CardContent>
          </Card>

          {/* Formulaire de réservation */}
          <Card>
            <CardHeader>
              <CardTitle>Détails de la réservation</CardTitle>
              <CardDescription>
                Date sélectionnée : {format(selectedDate, "EEEE d MMMM yyyy", { locale: fr })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Salle */}
                <div className="space-y-2">
                  <Label htmlFor="room">Salle *</Label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger id="room">
                      <SelectValue placeholder="Sélectionner une salle" />
                    </SelectTrigger>
                    <SelectContent>
                      {slotsLoading ? (
                        <SelectItem value="loading" disabled>
                          Chargement...
                        </SelectItem>
                      ) : availableSlots?.rooms && availableSlots.rooms.length > 0 ? (
                        availableSlots.rooms.map((room: any) => (
                          <SelectItem key={room.id} value={room.id.toString()}>
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4" />
                              {room.name} - {room.hourlyRate}€/h
                            </div>
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>
                          Aucune salle disponible
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                {/* Type de session */}
                <div className="space-y-2">
                  <Label htmlFor="sessionType">Type de session *</Label>
                  <Select value={sessionType} onValueChange={setSessionType}>
                    <SelectTrigger id="sessionType">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recording">Enregistrement</SelectItem>
                      <SelectItem value="mixing">Mixage</SelectItem>
                      <SelectItem value="mastering">Mastering</SelectItem>
                      <SelectItem value="rehearsal">Répétition</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Heure de début */}
                <div className="space-y-2">
                  <Label htmlFor="startTime">Heure de début *</Label>
                  <Select value={selectedStartTime} onValueChange={setSelectedStartTime}>
                    <SelectTrigger id="startTime">
                      <SelectValue placeholder="Sélectionner l'heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Heure de fin */}
                <div className="space-y-2">
                  <Label htmlFor="endTime">Heure de fin *</Label>
                  <Select value={selectedEndTime} onValueChange={setSelectedEndTime}>
                    <SelectTrigger id="endTime">
                      <SelectValue placeholder="Sélectionner l'heure" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeOptions.map((time) => (
                        <SelectItem key={time} value={time}>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {time}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Vérification de disponibilité */}
                {selectedRoom && selectedStartTime && selectedEndTime && (
                  <div className="p-4 rounded-lg border border-border bg-muted">
                    {isSlotAvailable(parseInt(selectedRoom), selectedStartTime, selectedEndTime) ? (
                      <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></span>
                        Créneau disponible
                      </p>
                    ) : (
                      <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-red-600 dark:bg-red-400"></span>
                        Créneau déjà réservé - Veuillez choisir un autre horaire
                      </p>
                    )}
                  </div>
                )}

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    placeholder="Informations complémentaires sur votre session..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                {/* Bouton de soumission */}
                <Button
                  type="submit"
                  className="w-full"
                  disabled={
                    requestBookingMutation.isPending ||
                    !selectedRoom ||
                    !selectedStartTime ||
                    !selectedEndTime ||
                    !isSlotAvailable(parseInt(selectedRoom), selectedStartTime, selectedEndTime)
                  }
                >
                  {requestBookingMutation.isPending ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <CalendarIcon className="h-4 w-4 mr-2" />
                      Envoyer la demande de réservation
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                  Votre demande sera examinée par le studio. Vous recevrez une confirmation par email.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Sessions déjà réservées pour cette date */}
        {availableSlots?.bookedSlots && availableSlots.bookedSlots.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Créneaux déjà réservés</CardTitle>
              <CardDescription>
                Sessions programmées pour le {format(selectedDate, "d MMMM yyyy", { locale: fr })}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {availableSlots.bookedSlots.map((slot: any, index: number) => {
                  const room = availableSlots.rooms.find((r: any) => r.id === slot.roomId);
                  return (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 border border-border rounded-lg bg-muted"
                    >
                      <div className="flex items-center gap-3">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{room?.name || "Salle inconnue"}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        {format(new Date(slot.startTime), "HH:mm")} -{" "}
                        {format(new Date(slot.endTime), "HH:mm")}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
