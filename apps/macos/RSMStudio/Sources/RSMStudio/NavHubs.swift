import SwiftUI
import RSMCore

// Nesting sub-entities under their parent section (IA audit 2026):
//  • Réservations is a state of a Session → segment inside Sessions.
//  • Tracks are children of a Project → segment inside Projets.
// Keeps the sidebar to 5 operational spaces instead of scattering children at
// the top level.

private struct HubSegment: View {
    let a: String
    let b: String
    @Binding var tab: Int
    var body: some View {
        VStack(spacing: 0) {
            Picker("", selection: $tab) {
                Text(a).tag(0)
                Text(b).tag(1)
            }
            .pickerStyle(.segmented)
            .labelsHidden()
            .frame(maxWidth: 320)
            .padding(.horizontal, 12)
            .padding(.top, 8)
            .padding(.bottom, 6)
            Divider()
        }
    }
}

struct SessionsHub: View {
    @State private var tab = 0
    var body: some View {
        VStack(spacing: 0) {
            HubSegment(a: "Sessions", b: "Réservations", tab: $tab)
            if tab == 0 {
                SessionsView()
            } else {
                BookingRequestsView()
            }
        }
    }
}

struct ProjectsHub: View {
    @State private var tab = 0
    var body: some View {
        VStack(spacing: 0) {
            HubSegment(a: "Projets", b: "Tracks", tab: $tab)
            if tab == 0 {
                ProjectsView()
            } else {
                TracksView()
            }
        }
    }
}
