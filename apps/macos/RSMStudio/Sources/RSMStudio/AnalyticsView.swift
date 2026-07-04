import SwiftUI
import Charts
import RSMCore

/// Analyses & rapports financiers — entièrement calculés depuis le cache local
/// (fonctionne hors ligne). Parité avec les pages web Analytics / FinancialReports :
/// CA vs dépenses, marge, encaissement, répartition des dépenses, top clients.
struct AnalyticsView: View {
    @Environment(AppModel.self) private var model

    private var invoices: [Invoice] { model.store.invoices() }
    private var expenses: [Expense] { model.store.expenses() }

    private var calendar: Calendar { Calendar.current }
    private var currentYear: Int { calendar.component(.year, from: Date()) }

    private func year(of dateString: String?) -> Int? {
        guard let d = RSMDate.parse(dateString) else { return nil }
        return calendar.component(.year, from: d)
    }

    // MARK: Conversion multi-devises (vers la devise de référence)

    /// Convert an amount to the reference currency using the configured FX rate.
    /// Falls back to the raw amount when no rate is set (approximation flagged
    /// to the user via `missingRateCurrencies`).
    private func ref(_ amount: Double, _ code: String) -> Double {
        Money.convertToReference(amount, from: code) ?? amount
    }

    /// Currencies present in this year's paid invoices that have no FX rate and
    /// aren't the reference — their totals are approximated in converted KPIs.
    private var missingRateCurrencies: [String] {
        let codes = Set(invoices
            .filter { $0.status == "paid" && year(of: $0.issueDate) == currentYear }
            .map { $0.currency })
        return codes.filter { Money.rate(for: $0) == nil }.sorted()
    }

    /// Exact paid revenue grouped by currency (no conversion) — the truthful view.
    private var paidByCurrency: [(code: String, amount: Double)] {
        var b: [String: Double] = [:]
        for inv in invoices where inv.status == "paid" && year(of: inv.issueDate) == currentYear {
            guard let a = Double(inv.total) else { continue }
            b[inv.currency, default: 0] += a
        }
        return b.map { (code: $0.key, amount: $0.value) }.sorted { $0.amount > $1.amount }
    }

    // MARK: KPIs (année courante) — convertis vers la devise de référence

    private var paidThisYear: Double {
        invoices
            .filter { $0.status == "paid" && year(of: $0.issueDate) == currentYear }
            .compactMap { inv in Double(inv.total).map { ref($0, inv.currency) } }.reduce(0, +)
    }
    private var outstanding: Double {
        invoices
            .filter { $0.status == "sent" || $0.status == "overdue" }
            .compactMap { inv in Double(inv.total).map { ref($0, inv.currency) } }.reduce(0, +)
    }
    private var expensesThisYear: Double {
        expenses
            .filter { year(of: $0.expenseDate) == currentYear }
            .compactMap { exp in Double(exp.amount).map { ref($0, exp.currency) } }.reduce(0, +)
    }
    private var margin: Double { paidThisYear - expensesThisYear }
    private var billedThisYear: Double {
        invoices
            .filter { $0.status != "draft" && $0.status != "cancelled" && year(of: $0.issueDate) == currentYear }
            .compactMap { inv in Double(inv.total).map { ref($0, inv.currency) } }.reduce(0, +)
    }
    private var collectionRate: Double {
        billedThisYear > 0 ? (paidThisYear / billedThisYear) * 100 : 0
    }

    // MARK: Séries mensuelles

    struct FlowPoint: Identifiable {
        let id = UUID()
        let month: Date
        let label: String
        let kind: String   // "Revenu" | "Dépense"
        let amount: Double
    }

    private static let monthLabel: DateFormatter = {
        let f = DateFormatter(); f.locale = Locale(identifier: "fr_FR"); f.dateFormat = "MMM"; return f
    }()

    private func monthStart(_ d: Date) -> Date {
        calendar.date(from: calendar.dateComponents([.year, .month], from: d)) ?? d
    }

    private var flowByMonth: [FlowPoint] {
        var revenue: [Date: Double] = [:]
        var spend: [Date: Double] = [:]
        for inv in invoices where inv.status == "paid" {
            guard let d = RSMDate.parse(inv.issueDate), let a = Double(inv.total) else { continue }
            revenue[monthStart(d), default: 0] += ref(a, inv.currency)
        }
        for exp in expenses {
            guard let d = RSMDate.parse(exp.expenseDate), let a = Double(exp.amount) else { continue }
            spend[monthStart(d), default: 0] += ref(a, exp.currency)
        }
        let months = Set(revenue.keys).union(spend.keys).sorted().suffix(6)
        var points: [FlowPoint] = []
        for m in months {
            let label = Self.monthLabel.string(from: m).capitalized
            points.append(FlowPoint(month: m, label: label, kind: "Revenu", amount: revenue[m] ?? 0))
            points.append(FlowPoint(month: m, label: label, kind: "Dépense", amount: spend[m] ?? 0))
        }
        return points
    }

    // MARK: Répartition des dépenses par catégorie (année)

    struct CategoryTotal: Identifiable { let id = UUID(); let category: String; let amount: Double }

    private var expensesByCategory: [CategoryTotal] {
        var buckets: [String: Double] = [:]
        for exp in expenses where year(of: exp.expenseDate) == currentYear {
            guard let a = Double(exp.amount) else { continue }
            buckets[exp.category ?? "Autre", default: 0] += ref(a, exp.currency)
        }
        return buckets.map { CategoryTotal(category: $0.key, amount: $0.value) }
            .sorted { $0.amount > $1.amount }
    }

    // MARK: Top clients (CA encaissé année)

    struct ClientTotal: Identifiable { let id = UUID(); let name: String; let amount: Double }

    private var topClients: [ClientTotal] {
        let byId = model.store.clientsByServerId()
        var buckets: [Int: Double] = [:]
        for inv in invoices where inv.status == "paid" && year(of: inv.issueDate) == currentYear {
            guard let cid = inv.clientId, let a = Double(inv.total) else { continue }
            buckets[cid, default: 0] += ref(a, inv.currency)
        }
        return buckets.map { ClientTotal(name: byId[$0.key]?.displayName ?? "Client #\($0.key)", amount: $0.value) }
            .sorted { $0.amount > $1.amount }
            .prefix(5).map { $0 }
    }

    var body: some View {
        let _ = model.dataVersion
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                HStack(spacing: 12) {
                    KPICard(title: "CA encaissé \(currentYear)", value: euroD(paidThisYear), icon: "eurosign.circle.fill", color: .green)
                    KPICard(title: "Dépenses \(currentYear)", value: euroD(expensesThisYear), icon: "cart.circle.fill", color: .red)
                    KPICard(title: "Marge", value: euroD(margin), icon: "chart.line.uptrend.xyaxis.circle.fill", color: margin >= 0 ? .blue : .orange)
                    KPICard(title: "Taux d'encaissement", value: "\(Int(collectionRate)) %", icon: "percent", color: .purple)
                }

                if paidByCurrency.count > 1 || (paidByCurrency.first.map { $0.code != Money.defaultCode } ?? false) {
                    GroupBox("CA encaissé par devise (\(currentYear))") {
                        VStack(alignment: .leading, spacing: 6) {
                            ForEach(paidByCurrency, id: \.code) { row in
                                HStack {
                                    Text(row.code).monospaced()
                                    Spacer()
                                    Text(Money.format(row.amount, code: row.code)).monospacedDigit()
                                    if row.code != Money.defaultCode, let c = Money.convertToReference(row.amount, from: row.code) {
                                        Text("≈ \(euroD(c))").font(.caption).foregroundStyle(.secondary)
                                    }
                                }
                                .font(.callout)
                            }
                            Divider()
                            HStack {
                                Text("Total converti").bold()
                                Spacer()
                                Text(euroD(paidThisYear)).bold().monospacedDigit()
                            }
                            if !missingRateCurrencies.isEmpty {
                                Text("⚠︎ Taux manquant pour \(missingRateCurrencies.joined(separator: ", ")) — comptées à valeur faciale dans le total. Renseigne les taux dans Réglages.")
                                    .font(.caption).foregroundStyle(.orange)
                            } else {
                                Text("Total converti vers \(Money.defaultCode) selon les taux configurés dans Réglages.")
                                    .font(.caption).foregroundStyle(.secondary)
                            }
                        }
                    }
                }

                if !flowByMonth.isEmpty {
                    GroupBox("Revenus vs dépenses (6 mois)") {
                        Chart(flowByMonth) { point in
                            BarMark(x: .value("Mois", point.label), y: .value("Montant", point.amount))
                                .position(by: .value("Type", point.kind))
                                .foregroundStyle(by: .value("Type", point.kind))
                        }
                        .chartForegroundStyleScale(["Revenu": Color.green, "Dépense": Color.red])
                        .frame(height: 200)
                        .padding(.top, 6)
                    }
                }

                HStack(alignment: .top, spacing: 12) {
                    GroupBox("Dépenses par catégorie (\(currentYear))") {
                        if expensesByCategory.isEmpty {
                            Text("Aucune dépense cette année.").foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        } else {
                            VStack(alignment: .leading, spacing: 6) {
                                ForEach(expensesByCategory) { row in
                                    HStack {
                                        Text(categoryLabel(row.category))
                                        Spacer()
                                        Text(euroD(row.amount)).monospacedDigit().foregroundStyle(.secondary)
                                    }
                                    .font(.callout)
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)

                    GroupBox("Top clients (\(currentYear))") {
                        if topClients.isEmpty {
                            Text("Aucun encaissement cette année.").foregroundStyle(.secondary)
                                .frame(maxWidth: .infinity, alignment: .leading)
                        } else {
                            VStack(alignment: .leading, spacing: 6) {
                                ForEach(topClients) { row in
                                    HStack {
                                        Text(row.name).lineLimit(1)
                                        Spacer()
                                        Text(euroD(row.amount)).monospacedDigit().foregroundStyle(.secondary)
                                    }
                                    .font(.callout)
                                }
                            }
                        }
                    }
                    .frame(maxWidth: .infinity)
                }

                GroupBox("En attente d'encaissement") {
                    HStack {
                        Image(systemName: "hourglass.circle.fill").foregroundStyle(.orange)
                        Text("Factures envoyées / en retard")
                        Spacer()
                        Text(euroD(outstanding)).font(.title3).bold().monospacedDigit()
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Analyses")
    }

    private func euroD(_ value: Double) -> String {
        value.formatted(.currency(code: Money.defaultCode).locale(Locale(identifier: "fr_FR")).precision(.fractionLength(0)))
    }

    private func categoryLabel(_ raw: String) -> String {
        switch raw {
        case "equipment": "Équipement"
        case "software": "Logiciels"
        case "rent": "Loyer"
        case "utilities": "Charges"
        case "marketing": "Marketing"
        case "travel": "Déplacements"
        case "supplies": "Fournitures"
        case "subcontractor": "Sous-traitance"
        default: raw.capitalized
        }
    }
}
