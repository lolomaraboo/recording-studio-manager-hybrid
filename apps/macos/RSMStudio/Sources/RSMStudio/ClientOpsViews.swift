import SwiftUI
import AppKit
import RSMCore

// ============================================================================
// Pilotage côté studio des features client-facing :
//   • Paiements   — suivi encaissements / statut des factures
//   • Portail     — accès des clients à leur espace en ligne
//   • Réservations — demandes de réservation venues du portail
//
// La page vue par le client reste web ; ici c'est le pilotage interne, en
// natif, branché sur les données déjà synchronisées (invoices, clients,
// sessions) via localUpdate → syncNow.
// ============================================================================

private func opsCurrencySymbol(_ code: String) -> String {
    switch code.uppercased() {
    case "EUR": return "€"
    case "USD": return "$"
    case "GBP": return "£"
    case "CHF": return "CHF"
    case "CAD": return "$"
    case "JPY": return "¥"
    case "AUD": return "$"
    default: return code.uppercased()
    }
}

private func opsClientMap(_ model: AppModel) -> [Int: String] {
    var map: [Int: String] = [:]
    for c in model.store.clients() { if let id = c.serverId { map[id] = c.name } }
    return map
}

private struct OpsBadge: View {
    let label: String
    let color: Color
    var body: some View {
        Text(label)
            .font(.caption2).fontWeight(.medium)
            .padding(.horizontal, 8).padding(.vertical, 3)
            .background(color.opacity(0.15))
            .foregroundStyle(color)
            .clipShape(Capsule())
    }
}

// MARK: - Paiements

struct PaymentsView: View {
    @Environment(AppModel.self) private var model
    @State private var payingInvoice: Invoice?

    private var invoices: [Invoice] {
        _ = model.dataVersion
        return model.store.invoices()
    }
    private var clientMap: [Int: String] { _ = model.dataVersion; return opsClientMap(model) }

    private var paidTotalLabel: String { totalsLabel(invoices.filter { $0.status == "paid" }) }
    private var pendingTotalLabel: String { totalsLabel(invoices.filter { $0.status == "sent" || $0.status == "overdue" }) }

    var body: some View {
        Group {
            if invoices.isEmpty {
                StudioEmptyState(title: "Aucune facture", systemImage: "creditcard",
                                 message: "Le suivi des paiements apparaîtra ici dès qu'une facture existe.")
            } else {
                List {
                    Section {
                        HStack(spacing: 24) {
                            statCard("Encaissé", paidTotalLabel, .green)
                            statCard("En attente", pendingTotalLabel, .orange)
                        }
                        .listRowInsets(EdgeInsets(top: 8, leading: 8, bottom: 8, trailing: 8))
                    }
                    Section("Factures") {
                        ForEach(invoices) { inv in
                            StudioRow(icon: "doc.text",
                                      title: "\(inv.number) · \(clientName(inv.clientId))",
                                      subtitle: "\(inv.total) \(opsCurrencySymbol(inv.currency))") {
                                paymentBadge(inv.status)
                            }
                            .contextMenu {
                                Button("Enregistrer un paiement…") { payingInvoice = inv }
                                Divider()
                                Button("Marquer payée") { setStatus(inv, "paid", markPaid: true) }
                                Button("Marquer envoyée") { setStatus(inv, "sent") }
                                Button("Marquer en retard") { setStatus(inv, "overdue") }
                                Divider()
                                Text("Lien de paiement Stripe : demande à l'assistant « génère un lien de paiement pour \(inv.number) »")
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Paiements")
        .modalCard(item: $payingInvoice) { inv in
            RecordPaymentSheet(invoice: inv) { payload, fullyPaid in
                _ = try? model.store.localInsert(table: "payments", payload: payload)
                if fullyPaid {
                    let iso = ISO8601DateFormatter().string(from: Date())
                    try? model.store.localUpdate(table: "invoices", uuid: inv.id, changes: ["status": "paid", "paid_at": iso])
                }
                Task { await model.syncNow() }
            }
        }
    }

    private func clientName(_ id: Int?) -> String { id.flatMap { clientMap[$0] } ?? "Client" }

    private func totalsLabel(_ list: [Invoice]) -> String {
        var byCur: [String: Double] = [:]
        for i in list { byCur[i.currency, default: 0] += Double(i.total) ?? 0 }
        if byCur.isEmpty { return "0" }
        return byCur.map { "\(String(format: "%.2f", $0.value)) \(opsCurrencySymbol($0.key))" }
            .sorted().joined(separator: " · ")
    }

    private func statCard(_ label: String, _ value: String, _ color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label).font(.caption).foregroundStyle(.secondary)
            Text(value).font(.title3).fontWeight(.semibold).foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }

    @ViewBuilder private func paymentBadge(_ status: String) -> some View {
        switch status {
        case "paid": OpsBadge(label: "Payée", color: .green)
        case "sent": OpsBadge(label: "Envoyée", color: .blue)
        case "overdue": OpsBadge(label: "En retard", color: .orange)
        case "cancelled": OpsBadge(label: "Annulée", color: .red)
        default: OpsBadge(label: "Brouillon", color: .gray)
        }
    }

    private func setStatus(_ inv: Invoice, _ status: String, markPaid: Bool = false) {
        var changes: [String: Any] = ["status": status]
        if markPaid {
            let iso = ISO8601DateFormatter().string(from: Date())
            changes["paid_at"] = iso
        }
        try? model.store.localUpdate(table: "invoices", uuid: inv.id, changes: changes)
        Task { await model.syncNow() }
    }
}

/// Record a payment received by ANY method — Stripe is optional.
struct RecordPaymentSheet: View {
    let invoice: Invoice
    let onRecord: (_ payload: [String: Any], _ fullyPaid: Bool) -> Void

    @State private var amount: String
    @State private var method = "bank_transfer"
    @State private var reference = ""
    @State private var notes = ""

    init(invoice: Invoice, onRecord: @escaping (_ payload: [String: Any], _ fullyPaid: Bool) -> Void) {
        self.invoice = invoice
        self.onRecord = onRecord
        _amount = State(initialValue: invoice.total)
    }

    var body: some View {
        StudioFormSheet(
            title: "Paiement — \(invoice.number)", confirmLabel: "Enregistrer",
            confirmDisabled: (Double(amount.replacingOccurrences(of: ",", with: ".")) ?? 0) <= 0,
            height: 420,
            onConfirm: {
                let value = Double(amount.replacingOccurrences(of: ",", with: ".")) ?? 0
                var payload: [String: Any] = [
                    "invoice_id": invoice.serverId as Any,
                    "client_id": invoice.clientId as Any,
                    "amount": String(value),
                    "currency": invoice.currency,
                    "payment_date": ISO8601DateFormatter().string(from: Date()),
                    "payment_method": method,
                    "status": "succeeded",
                ]
                if !reference.isEmpty { payload["reference_number"] = reference }
                if !notes.isEmpty { payload["notes"] = notes }
                let total = Double(invoice.total) ?? 0
                onRecord(payload, value + 1e-6 >= total && total > 0)
            }
        ) {
            LabeledContent("Montant (\(opsCurrencySymbol(invoice.currency)))") {
                TextField("", text: $amount).multilineTextAlignment(.trailing).frame(width: 120)
            }
            Picker("Moyen de paiement", selection: $method) {
                Text("Virement").tag("bank_transfer")
                Text("Espèces").tag("cash")
                Text("Chèque").tag("check")
                Text("Carte (terminal)").tag("card")
                Text("PayPal").tag("paypal")
                Text("Stripe").tag("stripe")
                Text("Autre").tag("other")
            }
            TextField("Référence (n° chèque, réf. virement…)", text: $reference)
            TextField("Notes", text: $notes, axis: .vertical).lineLimit(2...4)
        }
    }
}

// MARK: - Portail client

struct ClientPortalView: View {
    @Environment(AppModel.self) private var model

    private var clients: [Client] {
        _ = model.dataVersion
        return model.store.clients()
    }
    private var enabledCount: Int { clients.filter { $0.portalAccess }.count }

    var body: some View {
        Group {
            if clients.isEmpty {
                StudioEmptyState(title: "Aucun client", systemImage: "person.badge.key",
                                 message: "Active l'accès au portail pour permettre à un client de suivre ses projets, factures et réservations en ligne.")
            } else {
                List {
                    Section {
                        Text("\(enabledCount) client\(enabledCount > 1 ? "s" : "") avec accès au portail sur \(clients.count)")
                            .font(.caption).foregroundStyle(.secondary)
                    }
                    Section("Clients") {
                        ForEach(clients) { client in
                            StudioRow(icon: "person.crop.circle",
                                      title: client.name,
                                      subtitle: client.email ?? "Pas d'email") {
                                OpsBadge(label: client.portalAccess ? "Accès activé" : "Désactivé",
                                         color: client.portalAccess ? .green : .gray)
                            }
                            .contextMenu {
                                if client.portalAccess {
                                    Button("Désactiver l'accès portail") { setAccess(client, false) }
                                } else {
                                    Button("Activer l'accès portail") { setAccess(client, true) }
                                }
                                if let email = client.email {
                                    Button("Copier l'email") { copy(email) }
                                    Button("Inviter (via l'assistant)") {
                                        copy("Invite \(client.name) au portail client et envoie-lui le lien d'accès")
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        .navigationTitle("Portail client")
    }

    private func setAccess(_ client: Client, _ enabled: Bool) {
        try? model.store.localUpdate(table: "clients", uuid: client.id, changes: ["portal_access": enabled])
        Task { await model.syncNow() }
    }

    private func copy(_ s: String) {
        NSPasteboard.general.clearContents()
        NSPasteboard.general.setString(s, forType: .string)
    }
}

// MARK: - Réservations (demandes venues du portail)

struct BookingRequestsView: View {
    @Environment(AppModel.self) private var model

    private var bookings: [StudioSession] {
        _ = model.dataVersion
        // Réservations = sessions à venir ou en attente (pilotage des demandes portail).
        return model.store.studioSessions()
            .filter { $0.status == "scheduled" || $0.status == "in_progress" }
            .sorted { ($0.startTime ?? .distantFuture) < ($1.startTime ?? .distantFuture) }
    }
    private var clientMap: [Int: String] { _ = model.dataVersion; return opsClientMap(model) }
    private var roomMap: [Int: String] {
        _ = model.dataVersion
        var m: [Int: String] = [:]
        for r in model.store.roomsList() { if let id = r.serverId { m[id] = r.name } }
        return m
    }

    var body: some View {
        Group {
            if bookings.isEmpty {
                StudioEmptyState(title: "Aucune réservation en attente", systemImage: "calendar.badge.clock",
                                 message: "Les réservations créées par les clients depuis le portail s'affichent ici pour être confirmées ou refusées.")
            } else {
                List(bookings) { b in
                    StudioRow(icon: "calendar.badge.clock",
                              title: "\(b.title) · \(clientName(b.clientId))",
                              subtitle: subtitle(b)) {
                        OpsBadge(label: b.status == "in_progress" ? "Confirmée" : "À confirmer",
                                 color: b.status == "in_progress" ? .green : .orange)
                    }
                    .contextMenu {
                        Button("Confirmer la réservation") { setStatus(b, "in_progress") }
                        Button("Marquer terminée") { setStatus(b, "completed") }
                        Button("Refuser / annuler", role: .destructive) { setStatus(b, "cancelled") }
                    }
                }
            }
        }
        .navigationTitle("Réservations")
    }

    private func clientName(_ id: Int?) -> String { id.flatMap { clientMap[$0] } ?? "Client" }

    private func subtitle(_ b: StudioSession) -> String {
        var parts: [String] = []
        if let rid = b.roomId, let rn = roomMap[rid] { parts.append(rn) }
        if let start = b.startTime {
            let f = DateFormatter(); f.locale = Locale(identifier: "fr_FR"); f.dateFormat = "d MMM yyyy · HH:mm"
            parts.append(f.string(from: start))
        }
        return parts.joined(separator: " · ")
    }

    private func setStatus(_ b: StudioSession, _ status: String) {
        try? model.store.localUpdate(table: "sessions", uuid: b.id, changes: ["status": status])
        Task { await model.syncNow() }
    }
}
