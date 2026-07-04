import Foundation

/// Centralised currency formatting so every view respects the studio's
/// configured currency instead of a hard-coded EUR. The default code is
/// persisted in UserDefaults and editable from Settings; individual amounts
/// can still override it when a row carries its own `currency` column
/// (invoices, expenses, clients…).
public enum Money {
    private static let key = "rsm.defaultCurrency"

    /// Studio default currency (ISO 4217). Defaults to EUR.
    public static var defaultCode: String {
        get { UserDefaults.standard.string(forKey: key) ?? "EUR" }
        set { UserDefaults.standard.set(newValue, forKey: key) }
    }

    /// Common currencies offered in the settings picker.
    public static let supported: [(code: String, label: String)] = [
        ("EUR", "€ Euro"),
        ("USD", "$ Dollar US"),
        ("GBP", "£ Livre sterling"),
        ("CHF", "CHF Franc suisse"),
        ("CAD", "$ Dollar canadien"),
        ("JPY", "¥ Yen"),
        ("AUD", "$ Dollar australien"),
    ]

    private static let locale = Locale(identifier: "fr_FR")

    /// Format a numeric amount with the given (or default) currency code.
    public static func format(_ amount: Double, code: String? = nil) -> String {
        amount.formatted(.currency(code: code ?? defaultCode).locale(locale))
    }

    /// Format a decimal-string amount (as stored by the backend) safely.
    public static func format(_ amount: String?, code: String? = nil) -> String {
        format(Double(amount ?? "") ?? 0, code: code)
    }

    // MARK: - Multi-currency conversion (manual FX rates)

    private static let ratesKey = "rsm.fxRates"

    /// Manual FX rates: how many units of the reference currency (defaultCode)
    /// one unit of the given currency is worth. Reference currency is always 1.
    /// Stored as a [code: rate] map in UserDefaults, edited from Settings.
    public static var rates: [String: Double] {
        get { (UserDefaults.standard.dictionary(forKey: ratesKey) as? [String: Double]) ?? [:] }
        set { UserDefaults.standard.set(newValue, forKey: ratesKey) }
    }

    /// Rate to convert 1 unit of `code` into the reference currency.
    /// Returns 1 for the reference currency, the stored rate if set, else nil.
    public static func rate(for code: String) -> Double? {
        let c = code.uppercased()
        if c == defaultCode.uppercased() { return 1 }
        return rates[c]
    }

    /// Convert an amount from `code` into the reference currency, if a rate exists.
    public static func convertToReference(_ amount: Double, from code: String) -> Double? {
        guard let r = rate(for: code) else { return nil }
        return amount * r
    }
}
