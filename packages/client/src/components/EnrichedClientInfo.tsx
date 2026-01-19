import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2 } from "lucide-react";

interface Phone {
  type: string;
  number: string;
}

interface Email {
  type: string;
  email: string;
}

interface Website {
  type: string;
  url: string;
}

interface CustomField {
  label: string;
  type: string;
  value: any;
}

interface Contact {
  id: number;
  firstName: string;
  lastName: string;
  title?: string;
  email?: string;
  phone?: string;
  isPrimary: boolean;
}

interface Client {
  id: number;
  type?: string;
  firstName?: string;
  lastName?: string;
  middleName?: string;
  prefix?: string;
  suffix?: string;
  avatarUrl?: string;
  logoUrl?: string;
  phones?: Phone[];
  emails?: Email[];
  websites?: Website[];
  street?: string;
  postalCode?: string;
  region?: string;
  birthday?: string;
  gender?: string;
  customFields?: CustomField[];
}

interface EnrichedClientInfoProps {
  client: Client;
  isEditing: boolean;
  onUpdate: (data: Partial<Client>) => void;
  contacts?: Contact[];
  onAddContact?: (contact: Omit<Contact, "id">) => void;
  onDeleteContact?: (id: number) => void;
}

export function EnrichedClientInfo({
  client,
  isEditing,
  onUpdate,
  contacts = [],
  onAddContact,
  onDeleteContact,
}: EnrichedClientInfoProps) {
  const addPhone = () => {
    const phones = [...(client.phones || []), { type: "mobile", number: "" }];
    onUpdate({ phones });
  };

  const removePhone = (index: number) => {
    const phones = (client.phones || []).filter((_, i) => i !== index);
    onUpdate({ phones });
  };

  const updatePhone = (index: number, field: keyof Phone, value: string) => {
    const phones = [...(client.phones || [])];
    phones[index] = { ...phones[index], [field]: value };
    onUpdate({ phones });
  };

  const addEmail = () => {
    const emails = [...(client.emails || []), { type: "work", email: "" }];
    onUpdate({ emails });
  };

  const removeEmail = (index: number) => {
    const emails = (client.emails || []).filter((_, i) => i !== index);
    onUpdate({ emails });
  };

  const updateEmail = (index: number, field: keyof Email, value: string) => {
    const emails = [...(client.emails || [])];
    emails[index] = { ...emails[index], [field]: value };
    onUpdate({ emails });
  };

  const addCustomField = () => {
    const customFields = [...(client.customFields || []), { label: "", type: "text", value: "" }];
    onUpdate({ customFields });
  };

  const removeCustomField = (index: number) => {
    const customFields = (client.customFields || []).filter((_, i) => i !== index);
    onUpdate({ customFields });
  };

  const updateCustomField = (index: number, field: keyof CustomField, value: any) => {
    const customFields = [...(client.customFields || [])];
    customFields[index] = { ...customFields[index], [field]: value };
    onUpdate({ customFields });
  };

  return (
    <div className="space-y-6">
      {/* Multiple Phones Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Téléphones</CardTitle>
          {isEditing && (
            <Button variant="outline" size="sm" onClick={addPhone}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {(client.phones || []).map((phone, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={phone.type}
                onChange={(e) => updatePhone(index, "type", e.target.value)}
                disabled={!isEditing}
                className="w-32 px-3 py-2 border rounded"
              >
                <option value="mobile">Mobile</option>
                <option value="work">Travail</option>
                <option value="home">Domicile</option>
              </select>
              <Input
                value={phone.number}
                onChange={(e) => updatePhone(index, "number", e.target.value)}
                placeholder="Numéro"
                disabled={!isEditing}
                className="flex-1"
              />
              {isEditing && (
                <Button variant="ghost" size="sm" onClick={() => removePhone(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Multiple Emails Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Emails</CardTitle>
          {isEditing && (
            <Button variant="outline" size="sm" onClick={addEmail}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {(client.emails || []).map((email, index) => (
            <div key={index} className="flex gap-2">
              <select
                value={email.type}
                onChange={(e) => updateEmail(index, "type", e.target.value)}
                disabled={!isEditing}
                className="w-32 px-3 py-2 border rounded"
              >
                <option value="work">Travail</option>
                <option value="personal">Personnel</option>
                <option value="other">Autre</option>
              </select>
              <Input
                type="email"
                value={email.email}
                onChange={(e) => updateEmail(index, "email", e.target.value)}
                placeholder="Email"
                disabled={!isEditing}
                className="flex-1"
              />
              {isEditing && (
                <Button variant="ghost" size="sm" onClick={() => removeEmail(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Contacts Section (for companies/groups) */}
      {client.type === "company" && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Contacts</CardTitle>
            {isEditing && onAddContact && (
              <Button variant="outline" size="sm" onClick={() => {
                // This would open a dialog to add contact
                const firstName = prompt("Prénom:");
                const lastName = prompt("Nom:");
                if (firstName && lastName) {
                  onAddContact({
                    firstName,
                    lastName,
                    title: "",
                    email: "",
                    phone: "",
                    isPrimary: false,
                  });
                }
              }}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter contact
              </Button>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {contacts.map((contact) => (
              <Card key={contact.id} className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-semibold">
                      {contact.firstName} {contact.lastName}
                      {contact.isPrimary && (
                        <Badge variant="default" className="ml-2">Principal</Badge>
                      )}
                    </div>
                    {contact.title && (
                      <div className="text-sm text-muted-foreground">{contact.title}</div>
                    )}
                    <div className="text-sm mt-1">
                      {contact.email && <div>{contact.email}</div>}
                      {contact.phone && <div>{contact.phone}</div>}
                    </div>
                  </div>
                  {isEditing && onDeleteContact && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteContact(contact.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Custom Fields Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Champs personnalisés</CardTitle>
          {isEditing && (
            <Button variant="outline" size="sm" onClick={addCustomField}>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          )}
        </CardHeader>
        <CardContent className="space-y-2">
          {(client.customFields || []).map((field, index) => (
            <div key={index} className="flex gap-2">
              <Input
                value={field.label}
                onChange={(e) => updateCustomField(index, "label", e.target.value)}
                placeholder="Nom du champ"
                disabled={!isEditing}
                className="w-48"
              />
              <select
                value={field.type}
                onChange={(e) => updateCustomField(index, "type", e.target.value)}
                disabled={!isEditing}
                className="w-32 px-3 py-2 border rounded"
              >
                <option value="text">Texte</option>
                <option value="number">Nombre</option>
                <option value="date">Date</option>
                <option value="url">URL</option>
              </select>
              <Input
                value={field.value}
                onChange={(e) => updateCustomField(index, "value", e.target.value)}
                placeholder="Valeur"
                disabled={!isEditing}
                className="flex-1"
              />
              {isEditing && (
                <Button variant="ghost" size="sm" onClick={() => removeCustomField(index)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
