import SwiftUI
import AppKit

/// Closure injected into modal content so it can dismiss itself (replaces the
/// unreliable `@Environment(\.dismiss)` inside our manual overlays).
private struct ModalDismissKey: EnvironmentKey {
    static let defaultValue: () -> Void = {}
}

extension EnvironmentValues {
    var modalDismiss: () -> Void {
        get { self[ModalDismissKey.self] }
        set { self[ModalDismissKey.self] = newValue }
    }
}

/// Reliable modal presentation as a manual overlay.
///
/// macOS 26 (Tahoe) does NOT reliably dismiss `.sheet` when the controlling
/// binding is cleared from a view nested deep in a NavigationSplitView detail
/// column — the sheet stays up even after `item = nil`. Navigation away closes
/// it (the view unmounts), but a plain "Close" button does not. Presenting the
/// card ourselves via `.overlay` sidesteps the broken sheet machinery: the card
/// is a child view gated by `if`, so clearing the binding removes it instantly.
extension View {
    /// Item-driven modal (mirrors `.sheet(item:)`).
    func modalCard<Item: Identifiable, C: View>(
        item: Binding<Item?>,
        @ViewBuilder content: @escaping (Item) -> C
    ) -> some View {
        overlay {
            if let value = item.wrappedValue {
                ModalBackdrop(onBackgroundTap: { item.wrappedValue = nil }) {
                    content(value)
                        .environment(\.modalDismiss, { item.wrappedValue = nil })
                }
            }
        }
    }

    /// Boolean-driven modal (mirrors `.sheet(isPresented:)`).
    func modalCard<C: View>(
        isPresented: Binding<Bool>,
        @ViewBuilder content: @escaping () -> C
    ) -> some View {
        overlay {
            if isPresented.wrappedValue {
                ModalBackdrop(onBackgroundTap: { isPresented.wrappedValue = false }) {
                    content()
                        .environment(\.modalDismiss, { isPresented.wrappedValue = false })
                }
            }
        }
    }
}

private struct ModalBackdrop<C: View>: View {
    let onBackgroundTap: () -> Void
    @ViewBuilder let content: C

    var body: some View {
        ZStack {
            Rectangle()
                .fill(.black.opacity(0.28))
                .ignoresSafeArea()
                .onTapGesture(perform: onBackgroundTap)
            content
                .background(
                    RoundedRectangle(cornerRadius: 12)
                        .fill(Color(NSColor.windowBackgroundColor))
                        .shadow(color: .black.opacity(0.3), radius: 24, y: 8)
                )
                .clipShape(RoundedRectangle(cornerRadius: 12))
        }
        .transition(.opacity)
    }
}
