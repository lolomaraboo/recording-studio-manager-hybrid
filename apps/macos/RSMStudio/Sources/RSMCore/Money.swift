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
}
