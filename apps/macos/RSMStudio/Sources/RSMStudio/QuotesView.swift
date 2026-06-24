import SwiftUI
import RSMCore

/// Q2 — quotes: list, detail (FSM status), creation with server numbering,
/// status transitions (draft→sent→accepted/rejected).
struct QuotesView: View {
    @Environment(AppModel.self) private var model
    @State private var selectedQuoteId: String?
    @State private var showingCreate = false

    private var quotes: [Quote] {
        _ = model.dataVersion
        return model.store.quotes()
    }

    var body: some View {
        HSplitView {
            List(quotes, selection: $selectedQuoteId) { quote in
                QuoteRow(quote: quote).tag(quote.id)
            }
            .frame(minWidth: 300, idealWidth: 340)
            .onAppear { consumeFocus() }
            .onChange(of: model.focusedEntity[.quotes]) { consumeFocus() }

            Group {
                if let id = selectedQuoteId, let quote = quotes.first(where: { $0.id == id }) {
                    QuoteDetailView(quote: quote)
                } else {
                    ContentUnavailableView("Sélectionne un devis", systemImage: "doc.plaintext")
                }
            }
            .frame(minWidth: 380, maxWidth: .infinity, maxHeight: .infinity)
        }
        .navigationTitle("Devis")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: {
                    Label("Nouveau devis", systemImage: "doc.badge.plus")
                }
            }
        }
        .modalCard(isPresented: $showingCreate) { QuoteCreateSheet() }
    }

    private func consumeFocus() {
        if let uuid = model.focusedEntity[.quotes] {
            selectedQuoteId = uuid
            model.focusedEntity[.quotes] = nil
        }
    }
}

struct QuoteRow: View {
    @Environment(AppModel.self) private var model
    let quote: Quote

    var body: some View {
        let clientName = quote.clientId.flatMap { model.store.clientsByServerId()[$0]?.name }
        HStack {
            Image(systemName: "doc.plaintext").foregroundStyle(.tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(quote.number).fontWeight(.medium).monospaced()
                if let clientName {
                    Text(clientName).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(euro(quote.total)).fontWeight(.medium)
                QuoteStatusBadge(status: quote.status)
            }
        }
        .padding(.vertical, 2)
    }
}

struct QuoteStatusBadge: View {
    let status: String

    var body: some View {
        let (label, color): (String, Color) = switch status {
        case "sent": ("Envoyé", .blue)
        case "accepted": ("Accepté", .green)
        case "rejected": ("Refusé", .red)
        case "expired": ("Expiré", .secondary)
        case "cancelled": ("Annulé", .secondary)
        case "converted_to_project": ("→ Projet", .purple)
        default: ("Brouillon", .orange)
        }
        return Text(label)
            .font(.caption2)
            .padding(.horizontal, 6).padding(.vertical, 1)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }
}

struct QuoteDetailView: View {
    @Environment(AppModel.self) private var model
    let quote: Quote

    private var items: [QuoteItem] {
        guard let serverId = quote.serverId else { return [] }
        return model.store.quoteItems(quoteServerId: serverId)
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(quote.number).font(.title2).bold().monospaced()
                        if let client = quote.clientId.flatMap({ model.store.clientsByServerId()[$0] }) {
                            EntityLink(icon: "person.crop.circle", label: client.displayName) {
                                model.open(.clients, entity: client.id)
                            }
                        }
                        if let projectId = quote.convertedToProjectId,
                           let project = model.store.projects().first(where: { $0.serverId == projectId }) {
                            EntityLink(icon: "music.note.list", label: "Projet : \(project.name)") {
                                model.open(.projects, entity: project.id)
                            }
                        }
                    }
                    Spacer()
                    QuoteStatusBadge(status: quote.status)
                    statusActions
                }

                GroupBox("Lignes") {
                    if items.isEmpty {
                        Text("Aucune ligne.").foregroundStyle(.secondary)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    } else {
                        ForEach(items) { item in
                            HStack {
                                Text(item.description)
                                Spacer()
                                Text("\(item.quantity) × \(euro(item.unitPrice))")
                                    .font(.caption).foregroundStyle(.secondary)
                                Text(euro(item.amount)).monospacedDigit()
                            }
                            .padding(.vertical, 3)
                            if item.id != items.last?.id { Divider() }
                        }
                    }
                }

                GroupBox {
                    VStack(spacing: 6) {
                        HStack { Text("Sous-total"); Spacer(); Text(euro(quote.subtotal)).monospacedDigit() }
                        HStack { Text("TVA"); Spacer(); Text(euro(quote.taxAmount)).monospacedDigit() }
                        Divider()
                        HStack { Text("Total").bold(); Spacer(); Text(euro(quote.total)).bold().monospacedDigit() }
                    }
                }

                Text("Validité : \(quote.validityDays) jours")
                    .font(.caption).foregroundStyle(.secondary)
            }
            .padding()
        }
    }

    @ViewBuilder
    private var statusActions: some View {
        switch quote.status {
        case "draft":
            Button("Marquer envoyé") { setStatus("sent") }
        case "sent":
            Button("Accepté") { setStatus("accepted") }.tint(.green)
            Button("Refusé") { setStatus("rejected") }.tint(.red)
        default:
            EmptyView()
        }
    }

    private func setStatus(_ status: String) {
        var changes: [String: Any] = ["status": status]
        let now = ISO8601DateFormatter().string(from: Date())
        if status == "sent" { changes["sent_at"] = now }
        if status == "accepted" || status == "rejected" { changes["responded_at"] = now }
        try? model.store.localUpdate(table: "quotes", uuid: quote.id, changes: changes)
        Task { await model.syncNow() }
    }
}

// MARK: - Create sheet (server numbering, online)

struct QuoteCreateSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    @Environment(AppModel.self) private var model

    @State private var clientServerId: Int?
    @State private var lines: [InvoiceCreateSheet.Line] = [.init()]
    @State private var validityDays = 30
    @State private var isCreating = false
    @State private var errorMessage: String?

    private var clients: [Client] { model.store.clients().filter { $0.serverId != nil } }
    private var subtotal: Double { lines.reduce(0) { $0 + $1.quantity * $1.unitPrice } }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Nouveau devis").font(.title3).bold().padding()
            Form {
                Picker("Client", selection: $clientServerId) {
                    Text("Choisir…").tag(nil as Int?)
                    ForEach(clients) { client in
                        Text(client.displayName).tag(client.serverId)
                    }
                }
                Stepper("Validité : \(validityDays) jours", value: $validityDays, in: 7...120, step: 1)
                Section("Lignes") {
                    ForEach($lines) { $line in
                        HStack {
                            TextField("Description", text: $line.description)
                            TextField("Qté", value: $line.quantity, format: .number).frame(width: 50)
                            TextField("PU €", value: $line.unitPrice, format: .number).frame(width: 70)
                            Button(role: .destructive) {
                                lines.removeAll { $0.id == line.id }
                            } label: { Image(systemName: "minus.circle") }
                            .buttonStyle(.plain)
                            .disabled(lines.count == 1)
                        }
                    }
                    Button { lines.append(.init()) } label: { Label("Ajouter une ligne", systemImage: "plus.circle") }
                        .buttonStyle(.borderless)
                }
                LabeledContent("Total TTC (TVA 20 %)", value: (subtotal * 1.2).formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR"))))
                if let errorMessage {
                    Text(errorMessage).font(.caption).foregroundStyle(.red)
                }
            }
            .formStyle(.grouped)

            HStack {
                Spacer()
                Button("Annuler") { dismiss() }.keyboardShortcut(.escape)
                Button {
                    Task { await create() }
                } label: {
                    if isCreating { ProgressView().controlSize(.small) } else { Text("Créer le devis") }
                }
                .keyboardShortcut(.return)
                .buttonStyle(.borderedProminent)
                .disabled(clientServerId == nil || subtotal <= 0 || isCreating)
            }
            .padding()
        }
        .frame(width: 540, height: 500)
    }

    private func create() async {
        guard let clientId = clientServerId else { return }
        isCreating = true
        errorMessage = nil
        defer { isCreating = false }
        let items: [[String: Any]] = lines
            .filter { !$0.description.isEmpty }
            .map { ["description": $0.description, "quantity": $0.quantity, "unitPrice": $0.unitPrice] }
        do {
            let api = APIClient(config: model.config)
            _ = try await api.createQuote(clientServerId: clientId, items: items, validityDays: validityDays)
            await model.syncNow()
            dismiss()
        } catch {
            errorMessage = "Création impossible (hors ligne ?) : \(error.localizedDescription)"
        }
    }
}
