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
        /// Per-line VAT rate in percent (parity with the web app). Defaults to
        /// the catalog default when the line is created.
        var taxRate = 20.0
    }

    @State private var clientServerId: Int?
    @State private var projectServerId: Int?
    @State private var lines: [Line] = []
    @State private var isCreating = false
    @State private var errorMessage: String?
    @State private var packageHours = 0.0

    private var clients: [Client] { model.store.clients().filter { $0.serverId != nil } }
    private var vatRates: [VatRate] { model.store.vatRates() }
    private var defaultVatRate: Double { model.store.defaultVatRate() }
    private var subtotal: Double { lines.reduce(0) { $0 + $1.quantity * $1.unitPrice } }
    /// VAT summed per line: Σ(montant_ligne × taux_ligne / 100), rounded to cents.
    /// Matches the server: round(Σ(amount × rate)) / 100 (rate is a percentage).
    private var taxAmount: Double {
        let raw = lines.reduce(0.0) { $0 + $1.quantity * $1.unitPrice * $1.taxRate }
        return (raw).rounded() / 100
    }
    private var total: Double { subtotal + taxAmount }

    private func newLine() -> Line { Line(taxRate: defaultVatRate) }

    /// Currency inherited from the selected client (multi-currency invoicing).
    private var invoiceCurrency: String {
        guard let cid = clientServerId,
              let c = clients.first(where: { $0.serverId == cid }) else { return Money.defaultCode }
        return c.currency
    }

    /// Active prepaid package (with remaining hours) for the selected client.
    private var activePackage: ClientPackage? {
        guard let cid = clientServerId else { return nil }
        return model.store.packages().first {
            $0.clientId == cid && $0.status == "active" && ($0.remaining ?? 0) > 0
        }
    }
    private var projectsForClient: [Project] {
        if let cid = clientServerId { return model.store.projects(clientServerId: cid) }
        return model.store.projects().filter { $0.serverId != nil }
    }

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
                Picker("Projet (optionnel)", selection: $projectServerId) {
                    Text("Aucun").tag(nil as Int?)
                    ForEach(projectsForClient) { project in
                        Text(project.name).tag(project.serverId)
                    }
                }
                Section("Lignes") {
                    ForEach($lines) { $line in
                        HStack {
                            TextField("Description", text: $line.description)
                            TextField("Qté", value: $line.quantity, format: .number).frame(width: 50)
                            TextField("PU €", value: $line.unitPrice, format: .number).frame(width: 70)
                            LineVatPicker(selection: $line.taxRate, rates: vatRates, fallback: defaultVatRate)
                            Button(role: .destructive) {
                                lines.removeAll { $0.id == line.id }
                            } label: { Image(systemName: "minus.circle") }
                            .buttonStyle(.plain)
                            .disabled(lines.count == 1)
                        }
                    }
                    Button { lines.append(newLine()) } label: { Label("Ajouter une ligne", systemImage: "plus.circle") }
                        .buttonStyle(.borderless)
                }
                if let pkg = activePackage, let remaining = pkg.remaining {
                    Section("Forfait prépayé") {
                        Text("« \(pkg.name) » — \(remaining.formatted()) h restantes sur \((pkg.totalHours ?? 0).formatted())")
                            .font(.caption).foregroundStyle(.secondary)
                        Stepper(value: $packageHours, in: 0...remaining, step: 0.5) {
                            Text("Déduire \(packageHours.formatted()) h du forfait")
                        }
                        if packageHours > 0 {
                            Text("Une ligne négative sera ajoutée pour ne pas facturer deux fois les heures prépayées.")
                                .font(.caption2).foregroundStyle(.secondary)
                        }
                    }
                }
                Section {
                    LabeledContent("Devise", value: invoiceCurrency)
                    LabeledContent("Sous-total", value: Money.format(subtotal, code: invoiceCurrency))
                    LabeledContent("TVA", value: Money.format(taxAmount, code: invoiceCurrency))
                    LabeledContent("Total TTC", value: Money.format(total, code: invoiceCurrency))
                    Text("TVA calculée par ligne. Devise héritée du client. Le numéro de facture est attribué par le serveur — création en ligne uniquement.")
                        .font(.caption).foregroundStyle(.secondary)
                }
                if let errorMessage {
                    Text(errorMessage).font(.caption).foregroundStyle(.red)
                }
            }
            .formStyle(.grouped)
            .onAppear { if lines.isEmpty { lines = [newLine()] } }

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
            .map { ["description": $0.description, "quantity": $0.quantity, "unitPrice": $0.unitPrice, "taxRate": $0.taxRate] }
        do {
            let api = APIClient(config: model.config)
            _ = try await api.createInvoice(clientServerId: clientId, items: items, projectServerId: projectServerId,
                                            packageHours: packageHours > 0 ? packageHours : nil,
                                            currency: invoiceCurrency)
            await model.syncNow() // pulls the new invoice + items
            dismiss()
        } catch {
            errorMessage = "Création impossible (hors ligne ?) : \(error.localizedDescription)"
        }
    }
}

/// Compact per-line VAT rate picker used by invoice and quote creation sheets.
/// Offers every active rate from the catalog; if the currently-selected rate is
/// not in the catalog (e.g. legacy default) it is still shown so the value round-trips.
struct LineVatPicker: View {
    @Binding var selection: Double
    let rates: [VatRate]
    let fallback: Double

    private var options: [Double] {
        var values = rates.map(\.rate)
        if !values.contains(selection) { values.append(selection) }
        if values.isEmpty { values = [fallback] }
        return values.sorted()
    }

    var body: some View {
        Picker("TVA", selection: $selection) {
            ForEach(options, id: \.self) { rate in
                Text(label(for: rate)).tag(rate)
            }
        }
        .labelsHidden()
        .frame(width: 80)
    }

    private func label(for rate: Double) -> String {
        "\(formatted(rate)) %"
    }

    private func formatted(_ rate: Double) -> String {
        rate == rate.rounded() ? String(Int(rate)) : String(format: "%.1f", rate)
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
                Text(euro(invoice.total, invoice.currency)).fontWeight(.medium)
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
                                Text("\(item.quantity) × \(euro(item.unitPrice, invoice.currency))")
                                    .font(.caption).foregroundStyle(.secondary)
                                Text(euro(item.amount, invoice.currency)).monospacedDigit()
                            }
                            .padding(.vertical, 3)
                            if item.id != items.last?.id { Divider() }
                        }
                    }
                }

                GroupBox {
                    VStack(spacing: 6) {
                        HStack { Text("Sous-total"); Spacer(); Text(euro(invoice.subtotal, invoice.currency)).monospacedDigit() }
                        HStack { Text("TVA"); Spacer(); Text(euro(invoice.taxAmount, invoice.currency)).monospacedDigit() }
                        Divider()
                        HStack { Text("Total").bold(); Spacer(); Text(euro(invoice.total, invoice.currency)).bold().monospacedDigit() }
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

func euro(_ amount: String, _ code: String? = nil) -> String {
    if let value = Double(amount) {
        return Money.format(value, code: code)
    }
    return amount + " " + (code ?? Money.defaultCode)
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
            draw("\(item.quantity) × \(euro(item.unitPrice, invoice.currency))", x: 0, y: y, size: 10, gray: true, rightAlignedTo: 460)
            draw(euro(item.amount, invoice.currency), x: 0, y: y, rightAlignedTo: 545)
        }

        // Totals
        y -= 14
        context.move(to: CGPoint(x: 50, y: y)); context.addLine(to: CGPoint(x: 545, y: y)); context.strokePath()
        y -= 22
        draw("Sous-total", x: 0, y: y, gray: true, rightAlignedTo: 460)
        draw(euro(invoice.subtotal, invoice.currency), x: 0, y: y, rightAlignedTo: 545)
        y -= 18
        draw("TVA", x: 0, y: y, gray: true, rightAlignedTo: 460)
        draw(euro(invoice.taxAmount, invoice.currency), x: 0, y: y, rightAlignedTo: 545)
        y -= 20
        draw("Total", x: 0, y: y, size: 13, bold: true, rightAlignedTo: 460)
        draw(euro(invoice.total, invoice.currency), x: 0, y: y, size: 13, bold: true, rightAlignedTo: 545)

        draw("Généré par RSM Studio", x: 50, y: 40, size: 8, gray: true)

        NSGraphicsContext.current = nil
        context.endPDFPage()
        context.closePDF()
    }
}
