import SwiftUI
import AppKit
import RSMCore

/// M4 — invoices: list, detail with line items, PDF export.
/// Creation stays server-side for now (invoice numbers are allocated by the
/// server — offline numbering is unsafe, see architecture plan §4.4).
struct InvoicesView: View {
    @Environment(AppModel.self) private var model
    @State private var selectedInvoiceId: String?
    @State private var showingCreate = false

    private var invoices: [Invoice] {
        _ = model.dataVersion
        return model.store.invoices()
    }

    var body: some View {
        HSplitView {
            List(invoices, selection: $selectedInvoiceId) { invoice in
                InvoiceRow(invoice: invoice).tag(invoice.id)
            }
            .frame(minWidth: 300, idealWidth: 340)
            .onAppear { consumeFocus() }
            .onChange(of: model.focusedEntity[.invoices]) { consumeFocus() }

            Group {
                if let id = selectedInvoiceId, let invoice = invoices.first(where: { $0.id == id }) {
                    InvoiceDetailView(invoice: invoice)
                } else {
                    ContentUnavailableView("Sélectionne une facture", systemImage: "doc.text")
                }
            }
            .frame(minWidth: 380, maxWidth: .infinity, maxHeight: .infinity)
        }
        .navigationTitle("Factures")
        .toolbar {
            ToolbarItem {
                Button { showingCreate = true } label: {
                    Label("Nouvelle facture", systemImage: "doc.badge.plus")
                }
            }
        }
        .modalCard(isPresented: $showingCreate) {
            InvoiceCreateSheet()
        }
    }

    private func consumeFocus() {
        if let uuid = model.focusedEntity[.invoices] {
            selectedInvoiceId = uuid
            model.focusedEntity[.invoices] = nil
        }
    }
}

// MARK: - Create sheet (online-only: invoice numbers come from the server)

struct InvoiceCreateSheet: View {
    @Environment(\.modalDismiss) private var dismiss
    @Environment(AppModel.self) private var model

    struct Line: Identifiable {
        let id = UUID()
        var description = ""
        var quantity = 1.0
        var unitPrice = 0.0
    }

    @State private var clientServerId: Int?
    @State private var lines: [Line] = [Line()]
    @State private var isCreating = false
    @State private var errorMessage: String?

    private var clients: [Client] { model.store.clients().filter { $0.serverId != nil } }
    private var subtotal: Double { lines.reduce(0) { $0 + $1.quantity * $1.unitPrice } }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Nouvelle facture").font(.title3).bold().padding()
            Form {
                Picker("Client", selection: $clientServerId) {
                    Text("Choisir…").tag(nil as Int?)
                    ForEach(clients) { client in
                        Text(client.displayName).tag(client.serverId)
                    }
                }
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
                    Button { lines.append(Line()) } label: { Label("Ajouter une ligne", systemImage: "plus.circle") }
                        .buttonStyle(.borderless)
                }
                Section {
                    LabeledContent("Sous-total", value: subtotal.formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR"))))
                    LabeledContent("Total TTC (TVA 20 %)", value: (subtotal * 1.2).formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR"))))
                    Text("Le numéro de facture est attribué par le serveur — création en ligne uniquement.")
                        .font(.caption).foregroundStyle(.secondary)
                }
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
                    if isCreating { ProgressView().controlSize(.small) } else { Text("Créer la facture") }
                }
                .keyboardShortcut(.return)
                .buttonStyle(.borderedProminent)
                .disabled(clientServerId == nil || subtotal <= 0 || isCreating)
            }
            .padding()
        }
        .frame(width: 540, height: 480)
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
            _ = try await api.createInvoice(clientServerId: clientId, items: items)
            await model.syncNow() // pulls the new invoice + items
            dismiss()
        } catch {
            errorMessage = "Création impossible (hors ligne ?) : \(error.localizedDescription)"
        }
    }
}

struct InvoiceRow: View {
    @Environment(AppModel.self) private var model
    let invoice: Invoice

    var body: some View {
        let clientName = invoice.clientId.flatMap { model.store.clientsByServerId()[$0]?.name }
        HStack {
            Image(systemName: "doc.text").foregroundStyle(.tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(invoice.number).fontWeight(.medium).monospaced()
                if let clientName {
                    Text(clientName).font(.caption).foregroundStyle(.secondary)
                }
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 2) {
                Text(euro(invoice.total)).fontWeight(.medium)
                InvoiceStatusBadge(status: invoice.status)
            }
        }
        .padding(.vertical, 2)
    }
}

struct InvoiceStatusBadge: View {
    let status: String

    var body: some View {
        let (label, color): (String, Color) = switch status {
        case "sent": ("Envoyée", .blue)
        case "paid": ("Payée", .green)
        case "overdue": ("En retard", .red)
        case "cancelled": ("Annulée", .secondary)
        default: ("Brouillon", .orange)
        }
        return Text(label)
            .font(.caption2)
            .padding(.horizontal, 6).padding(.vertical, 1)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
    }
}

struct InvoiceDetailView: View {
    @Environment(AppModel.self) private var model
    let invoice: Invoice
    @State private var exportMessage: String?

    private var items: [InvoiceItem] {
        guard let serverId = invoice.serverId else { return [] }
        return model.store.invoiceItems(invoiceServerId: serverId)
    }

    private var client: Client? {
        invoice.clientId.flatMap { model.store.clientsByServerId()[$0] }
    }

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack {
                    VStack(alignment: .leading, spacing: 3) {
                        Text(invoice.number).font(.title2).bold().monospaced()
                        if let client {
                            EntityLink(icon: "person.crop.circle", label: client.displayName) {
                                model.open(.clients, entity: client.id)
                            }
                        }
                    }
                    Spacer()
                    InvoiceStatusBadge(status: invoice.status)
                    Button {
                        exportPDF()
                    } label: {
                        Label("Exporter en PDF", systemImage: "square.and.arrow.up")
                    }
                }

                GroupBox("Lignes") {
                    if items.isEmpty {
                        Text("Aucune ligne synchronisée.").foregroundStyle(.secondary)
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
                        HStack { Text("Sous-total"); Spacer(); Text(euro(invoice.subtotal)).monospacedDigit() }
                        HStack { Text("TVA"); Spacer(); Text(euro(invoice.taxAmount)).monospacedDigit() }
                        Divider()
                        HStack { Text("Total").bold(); Spacer(); Text(euro(invoice.total)).bold().monospacedDigit() }
                    }
                }

                if let exportMessage {
                    Text(exportMessage).font(.caption).foregroundStyle(.green)
                }
            }
            .padding()
        }
    }

    private func exportPDF() {
        let panel = NSSavePanel()
        panel.nameFieldStringValue = "\(invoice.number).pdf"
        panel.allowedContentTypes = [.pdf]
        guard panel.runModal() == .OK, let url = panel.url else { return }
        do {
            try InvoicePDF.render(invoice: invoice, items: items, client: client,
                                  studioName: model.config.organizationName ?? "Studio", to: url)
            exportMessage = "PDF exporté : \(url.lastPathComponent)"
        } catch {
            exportMessage = "Erreur export : \(error.localizedDescription)"
        }
    }
}

func euro(_ amount: String) -> String {
    if let value = Double(amount) {
        return value.formatted(.currency(code: "EUR").locale(Locale(identifier: "fr_FR")))
    }
    return amount + " €"
}

// MARK: - PDF rendering (Core Graphics, A4)

enum InvoicePDF {
    static func render(invoice: Invoice, items: [InvoiceItem], client: Client?, studioName: String, to url: URL) throws {
        let pageRect = CGRect(x: 0, y: 0, width: 595, height: 842) // A4 @72dpi
        var mediaBox = pageRect
        guard let context = CGContext(url as CFURL, mediaBox: &mediaBox, nil) else {
            throw NSError(domain: "InvoicePDF", code: 1, userInfo: [NSLocalizedDescriptionKey: "Impossible de créer le PDF"])
        }
        context.beginPDFPage(nil)

        let nsContext = NSGraphicsContext(cgContext: context, flipped: false)
        NSGraphicsContext.current = nsContext

        func draw(_ text: String, x: CGFloat, y: CGFloat, size: CGFloat = 11, bold: Bool = false, gray: Bool = false, rightAlignedTo: CGFloat? = nil) {
            let font = bold ? NSFont.boldSystemFont(ofSize: size) : NSFont.systemFont(ofSize: size)
            let attributes: [NSAttributedString.Key: Any] = [
                .font: font,
                .foregroundColor: gray ? NSColor.gray : NSColor.black,
            ]
            let string = NSAttributedString(string: text, attributes: attributes)
            var drawX = x
            if let right = rightAlignedTo {
                drawX = right - string.size().width
            }
            string.draw(at: CGPoint(x: drawX, y: y))
        }

        var y: CGFloat = 780
        draw(studioName, x: 50, y: y, size: 20, bold: true)
        y -= 18
        draw("Facture \(invoice.number)", x: 50, y: y, size: 12, gray: true)

        if let client {
            y -= 40
            draw("Facturé à :", x: 50, y: y, size: 10, gray: true)
            y -= 16
            draw(client.name, x: 50, y: y, bold: true)
            if let email = client.email { y -= 14; draw(email, x: 50, y: y, size: 10, gray: true) }
        }

        // Items table
        y -= 40
        draw("Description", x: 50, y: y, size: 10, bold: true, gray: true)
        draw("Qté × PU", x: 0, y: y, size: 10, bold: true, gray: true, rightAlignedTo: 460)
        draw("Montant", x: 0, y: y, size: 10, bold: true, gray: true, rightAlignedTo: 545)
        y -= 6
        context.setStrokeColor(NSColor.lightGray.cgColor)
        context.move(to: CGPoint(x: 50, y: y)); context.addLine(to: CGPoint(x: 545, y: y)); context.strokePath()

        for item in items {
            y -= 20
            draw(String(item.description.prefix(60)), x: 50, y: y)
            draw("\(item.quantity) × \(euro(item.unitPrice))", x: 0, y: y, size: 10, gray: true, rightAlignedTo: 460)
            draw(euro(item.amount), x: 0, y: y, rightAlignedTo: 545)
        }

        // Totals
        y -= 14
        context.move(to: CGPoint(x: 50, y: y)); context.addLine(to: CGPoint(x: 545, y: y)); context.strokePath()
        y -= 22
        draw("Sous-total", x: 0, y: y, gray: true, rightAlignedTo: 460)
        draw(euro(invoice.subtotal), x: 0, y: y, rightAlignedTo: 545)
        y -= 18
        draw("TVA", x: 0, y: y, gray: true, rightAlignedTo: 460)
        draw(euro(invoice.taxAmount), x: 0, y: y, rightAlignedTo: 545)
        y -= 20
        draw("Total", x: 0, y: y, size: 13, bold: true, rightAlignedTo: 460)
        draw(euro(invoice.total), x: 0, y: y, size: 13, bold: true, rightAlignedTo: 545)

        draw("Généré par RSM Studio", x: 50, y: 40, size: 8, gray: true)

        NSGraphicsContext.current = nil
        context.endPDFPage()
        context.closePDF()
    }
}
