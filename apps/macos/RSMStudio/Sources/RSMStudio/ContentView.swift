import SwiftUI
import RSMCore

enum SidebarItem: String, Hashable, CaseIterable {
    case assistant = "Assistant"
    case dashboard = "Tableau de bord"
    case clients = "Clients"
    case calendar = "Calendrier"
    case sessions = "Sessions"
    case projects = "Projets"
    case tracks = "Tracks"
    case quotes = "Devis"
    case invoices = "Factures"
    case analytics = "Analyses"
    case services = "Services"
    case contracts = "Contrats"
    case expenses = "Dépenses"
    case equipment = "Équipement"
    case talents = "Talents"
    case rooms = "Salles"
    case team = "Équipe"
    case time = "Temps"
    case leads = "Prospects"
    case tasks = "Tâches"
    case documents = "Documents"
    case system = "Agenda Mac"
    case settings = "Réglages"

    var icon: String {
        switch self {
        case .assistant: return "sparkles"
        case .dashboard: return "chart.bar.xaxis"
        case .clients: return "person.2"
        case .calendar: return "calendar"
        case .sessions: return "list.bullet.rectangle"
        case .projects: return "music.note.list"
        case .tracks: return "waveform"
        case .quotes: return "doc.plaintext"
        case .invoices: return "doc.text"
        case .analytics: return "chart.line.uptrend.xyaxis"
        case .services: return "list.star"
        case .contracts: return "signature"
        case .expenses: return "cart"
        case .equipment: return "hifispeaker"
        case .talents: return "music.mic"
        case .rooms: return "door.left.hand.open"
        case .team: return "person.3"
        case .time: return "timer"
        case .leads: return "person.crop.circle.badge.questionmark"
        case .tasks: return "checklist"
        case .documents: return "folder"
        case .system: return "calendar.badge.clock"
        case .settings: return "gearshape"
        }
    }
}

struct ContentView: View {
    @Environment(AppModel.self) private var model
    @Environment(\.openWindow) private var openWindow
    @State private var showingSearch = false

    private var selection: SidebarItem? {
        get { model.currentSection }
        nonmutating set { model.currentSection = newValue }
    }

    private let groups: [(String?, [SidebarItem])] = [
        (nil, [.assistant, .dashboard]),
        ("Activité", [.clients, .calendar, .sessions, .projects, .tracks]),
        ("Ventes", [.quotes, .invoices, .analytics, .services, .contracts, .expenses]),
        ("Ressources", [.equipment, .talents, .rooms, .time, .team]),
        ("Pilotage", [.leads, .tasks, .documents]),
        ("Mon Mac", [.system]),
        (nil, [.settings]),
    ]

    var body: some View {
        // Assistant/player panels use `.safeAreaInset` (NOT `.inspector`):
        // `.inspector` conflicts with `.sheet` presentation on macOS 26, and
        // wrapping NavigationSplitView in an HStack breaks dynamic side panels.
        // safeAreaInset is the idiomatic way to attach persistent bars/panels.
        splitView
            .safeAreaInset(edge: .trailing, spacing: 0) {
                HStack(spacing: 0) {
                    if model.chatPanelOpen {
                        Divider()
                        ChatView(compact: true).frame(width: 360)
                    }
                    if model.playerMode == .panel {
                        Divider()
                        AudioPlayerView(compact: true).frame(width: 380)
                    }
                }
            }
            .safeAreaInset(edge: .bottom, spacing: 0) {
                if model.playerMode == .bar {
                    VStack(spacing: 0) { Divider(); MiniPlayerBar() }
                }
            }
    }

    private var splitView: some View {
        NavigationSplitView {
            List(selection: Bindable(model).currentSection) {
                ForEach(Array(groups.enumerated()), id: \.offset) { _, group in
                    if let title = group.0 {
                        Section(title) {
                            ForEach(group.1, id: \.self) { item in
                                Label(item.rawValue, systemImage: item.icon).tag(item)
                            }
                        }
                    } else {
                        ForEach(group.1, id: \.self) { item in
                            Label(item.rawValue, systemImage: item.icon).tag(item)
                        }
                    }
                }
            }
            .navigationSplitViewColumnWidth(min: 190, ideal: 210)
            .safeAreaInset(edge: .bottom) {
                SyncStatusBar()
                    .padding(8)
            }
        } detail: {
            ZStack(alignment: .bottomTrailing) {
                Group {
                    switch selection ?? .assistant {
                    case .assistant: ChatView()
                    case .dashboard: DashboardView()
                    case .clients: ClientsView()
                    case .calendar: CalendarView()
                    case .sessions: SessionsView()
                    case .projects: ProjectsView()
                    case .tracks: TracksView()
                    case .quotes: QuotesView()
                    case .invoices: InvoicesView()
                    case .analytics: AnalyticsView()
                    case .services: ServicesView()
                    case .contracts: ContractsView()
                    case .expenses: ExpensesView()
                    case .equipment: EquipmentView()
                    case .talents: TalentsView()
                    case .rooms: RoomsView()
                    case .team: TeamView()
                    case .time: TimeTrackingView()
                    case .leads: LeadsView()
                    case .tasks: TasksView()
                    case .documents: DocumentsView()
                    case .system: SystemView()
                    case .settings: SettingsView()
                    }
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                // "Minimized" assistant (web-app style): floating bubble,
                // hidden when the assistant is already visible somewhere.
                if selection != .assistant && !model.chatPanelOpen {
                    FloatingAssistantButton {
                        model.chatPanelOpen = true
                    }
                }
            }
        }
        .toolbar {
            ToolbarItemGroup(placement: .primaryAction) {
                Menu {
                    Button {
                        model.chatPanelOpen.toggle()
                    } label: {
                        Label(model.chatPanelOpen ? "Masquer le panneau latéral" : "Panneau latéral",
                              systemImage: "sidebar.right")
                    }
                    Button {
                        openWindow(id: "assistant")
                    } label: {
                        Label("Fenêtre séparée", systemImage: "macwindow.on.rectangle")
                    }
                    Button {
                        selection = .assistant
                        model.chatPanelOpen = false
                    } label: {
                        Label("Plein écran", systemImage: "rectangle.expand.vertical")
                    }
                } label: {
                    Label("Assistant", systemImage: "sparkles")
                }
                .help("Assistant : panneau (⇧⌘A), fenêtre (⌥⌘A) ou plein écran")

                NotificationsBell()

                Button {
                    showingSearch = true
                } label: {
                    Label("Rechercher", systemImage: "magnifyingglass")
                }
                .help("Recherche globale (⇧⌘F)")
                .keyboardShortcut("f", modifiers: [.command, .shift])

                Button {
                    Task { await model.syncNow() }
                } label: {
                    Label("Synchroniser", systemImage: "arrow.triangle.2.circlepath")
                }
                .help("Synchroniser maintenant (⇧⌘R)")
            }
        }
        .modalCard(isPresented: $showingSearch) {
            SearchSheet { section, uuid in
                model.open(section, entity: uuid)
            }
        }
    }
}

// MARK: - Sync status indicator

struct SyncStatusBar: View {
    @Environment(AppModel.self) private var model

    var body: some View {
        HStack(spacing: 6) {
            switch model.phase {
            case .idle:
                Image(systemName: "checkmark.circle.fill").foregroundStyle(.green)
                Text("Synchronisé")
            case .syncing:
                ProgressView().controlSize(.small)
                Text("Synchronisation…")
            case .offline:
                Image(systemName: "wifi.slash").foregroundStyle(.orange)
                Text("Hors ligne")
            case .error(let message):
                Image(systemName: "exclamationmark.triangle.fill").foregroundStyle(.red)
                Text("Erreur").help(message)
            }
            Spacer()
            if model.pendingCount > 0 {
                Text("\(model.pendingCount) en attente")
                    .padding(.horizontal, 6).padding(.vertical, 2)
                    .background(.orange.opacity(0.2), in: Capsule())
            }
        }
        .font(.caption)
        .foregroundStyle(.secondary)
    }
}
