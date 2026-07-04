import SwiftUI
import Charts
import RSMCore

/// Q3 — at-a-glance studio dashboard, computed from the local cache
/// (works fully offline) with Swift Charts.
struct DashboardView: View {
    @Environment(AppModel.self) private var model

    private var invoices: [Invoice] { model.store.invoices() }
    private var sessions: [StudioSession] { model.store.studioSessions() }

    /// Convert to the reference currency (falls back to raw when no rate set).
    private func ref(_ amount: Double, _ code: String) -> Double {
        Money.convertToReference(amount, from: code) ?? amount
    }

    private var paidTotal: Double {
        invoices.filter { $0.status == "paid" }
            .compactMap { inv in Double(inv.total).map { ref($0, inv.currency) } }.reduce(0, +)
    }
    private var outstandingTotal: Double {
        invoices.filter { $0.status == "sent" || $0.status == "overdue" }
            .compactMap { inv in Double(inv.total).map { ref($0, inv.currency) } }.reduce(0, +)
    }
    /// Distinct currencies used by non-EUR invoices (to flag conversion in the UI).
    private var usesMultipleCurrencies: Bool {
        Set(invoices.filter { $0.status != "draft" && $0.status != "cancelled" }.map { $0.currency }).count > 1
    }
    private var upcomingSessions: [StudioSession] {
        let now = Date()
        let horizon = now.addingTimeInterval(7 * 24 * 3600)
        return sessions
            .filter { ($0.startTime ?? .distantPast) >= now && ($0.startTime ?? .distantPast) <= horizon && $0.status == "scheduled" }
            .sorted { ($0.startTime ?? .distantPast) < ($1.startTime ?? .distantPast) }
    }
    private var unpaidInvoices: [Invoice] {
        invoices.filter { $0.status == "sent" || $0.status == "overdue" }
    }

    struct MonthRevenue: Identifiable {
        let id = UUID()
        let month: String
        let monthDate: Date
        let amount: Double
        let paid: Bool
    }

    private var revenueByMonth: [MonthRevenue] {
        let parser = ISO8601DateFormatter()
        let parserFraction: ISO8601DateFormatter = {
            let f = ISO8601DateFormatter()
            f.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
            return f
        }()
        let calendar = Calendar.current
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "fr_FR")
        formatter.dateFormat = "MMM"

        var buckets: [Date: (paid: Double, pending: Double)] = [:]
        for invoice in invoices where invoice.status != "cancelled" && invoice.status != "draft" {
            guard let dateText = invoice.issueDate,
                  let date = parserFraction.date(from: dateText) ?? parser.date(from: dateText),
                  let month = calendar.date(from: calendar.dateComponents([.year, .month], from: date)),
                  let amount = Double(invoice.total) else { continue }
            var bucket = buckets[month] ?? (0, 0)
            let converted = ref(amount, invoice.currency)
            if invoice.status == "paid" { bucket.paid += converted } else { bucket.pending += converted }
            buckets[month] = bucket
        }

        return buckets.keys.sorted().suffix(6).flatMap { month -> [MonthRevenue] in
            let bucket = buckets[month]!
            let label = formatter.string(from: month).capitalized
            return [
                MonthRevenue(month: label, monthDate: month, amount: bucket.paid, paid: true),
                MonthRevenue(month: label, monthDate: month, amount: bucket.pending, paid: false),
            ]
        }
    }

    var body: some View {
        // Re-compute on every sync
        let _ = model.dataVersion

        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // KPI cards
                HStack(spacing: 12) {
                    KPICard(title: "CA encaissé", value: euroD(paidTotal), icon: "eurosign.circle.fill", color: .green)
                    KPICard(title: "En attente", value: euroD(outstandingTotal), icon: "hourglass.circle.fill", color: .orange)
                    KPICard(title: "Sessions à 7 jours", value: "\(upcomingSessions.count)", icon: "calendar.circle.fill", color: .blue)
                    KPICard(title: "Clients actifs", value: "\(model.store.clients().filter(\.isActive).count)", icon: "person.crop.circle.fill", color: .purple)
                }

                if usesMultipleCurrencies {
                    Text("Montants convertis en \(Money.defaultCode) selon les taux configurés. Détail par devise dans Analyses.")
                        .font(.caption).foregroundStyle(.secondary)
                }

                if !revenueByMonth.isEmpty {
                    GroupBox("Facturation par mois") {
                        Chart(revenueByMonth) { entry in
                            BarMark(
                                x: .value("Mois", entry.month),
                                y: .value("Montant", entry.amount)
                            )
                            .foregroundStyle(by: .value("Statut", entry.paid ? "Encaissé" : "En attente"))
                        }
                        .chartForegroundStyleScale(["Encaissé": Color.green, "En attente": Color.orange])
                        .frame(height: 180)
                        .padding(.top, 6)
                    }
                }

                HStack(alignment: .top, spacing: 12) {
                    GroupBox("Prochaines sessions") {
                        if upcomingSessions.isEmpty {
                            Text("Rien de prévu cette semaine.").foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        } else {
                            VStack(alignment: .leading, spacing: 6) {
                                ForEach(upcomingSessions.prefix(5)) { session in
                                    HStack {
                                        Image(systemName: "clock").font(.caption).foregroundStyle(.blue)
                                        VStack(alignment: .leading, spacing: 1) {
                                            Text(session.title).font(.callout)
                                            if let start = session.startTime {
                                                Text(start.formatted(.dateTime.weekday(.wide).day().hour().minute()))
                                                    .font(.caption).foregroundStyle(.secondary)
                                            }
                                        }
                                        Spacer()
                                    }
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)

                    GroupBox("Factures à encaisser") {
                        if unpaidInvoices.isEmpty {
                            Text("Tout est encaissé 🎉").foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        } else {
                            VStack(alignment: .leading, spacing: 6) {
                                ForEach(unpaidInvoices.prefix(5)) { invoice in
                                    HStack {
                                        Text(invoice.number).font(.callout.monospaced())
                                        if let client = invoice.clientId.flatMap({ model.store.clientsByServerId()[$0] }) {
                                            Text(client.name).font(.caption).foregroundStyle(.secondary)
                                        }
                                        Spacer()
                                        Text(euro(invoice.total, invoice.currency)).font(.callout).monospacedDigit()
                                    }
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .padding()
        }
        .navigationTitle("Tableau de bord")
    }

    private func euroD(_ value: Double) -> String {
        value.formatted(.currency(code: Money.defaultCode).locale(Locale(identifier: "fr_FR")).precision(.fractionLength(0)))
    }
}

struct KPICard: View {
    let title: String
    let value: String
    let icon: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            HStack {
                Image(systemName: icon).foregroundStyle(color)
                Text(title).font(.caption).foregroundStyle(.secondary)
            }
            Text(value).font(.title2).bold().monospacedDigit()
        }
        .padding(12)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.quaternary.opacity(0.5), in: RoundedRectangle(cornerRadius: 10))
    }
}
