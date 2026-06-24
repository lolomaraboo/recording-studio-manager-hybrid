import SwiftUI
import RSMCore

/// Week-grid calendar: 7 day columns, 8h→22h, session blocks colored by room.
struct CalendarView: View {
    @Environment(AppModel.self) private var model
    @State private var weekStart: Date = CalendarView.startOfWeek(Date())

    private static let dayStartHour = 8
    private static let dayEndHour = 22
    private static let hourHeight: CGFloat = 44

    static func startOfWeek(_ date: Date) -> Date {
        var calendar = Calendar.current
        calendar.firstWeekday = 2 // Monday
        let components = calendar.dateComponents([.yearForWeekOfYear, .weekOfYear], from: date)
        return calendar.date(from: components) ?? date
    }

    private var days: [Date] {
        (0..<7).compactMap { Calendar.current.date(byAdding: .day, value: $0, to: weekStart) }
    }

    private var sessions: [StudioSession] {
        _ = model.dataVersion
        return model.store.studioSessions().filter { $0.status != "cancelled" }
    }

    var body: some View {
        VStack(spacing: 0) {
            weekHeader
            Divider()
            ScrollView {
                HStack(alignment: .top, spacing: 0) {
                    hourGutter
                    ForEach(days, id: \.self) { day in
                        DayColumn(day: day, sessions: sessionsFor(day),
                                  startHour: Self.dayStartHour, hourHeight: Self.hourHeight,
                                  roomColors: roomColors)
                            .frame(maxWidth: .infinity)
                            .overlay(alignment: .leading) { Divider().frame(maxHeight: .infinity) }
                    }
                }
            }
        }
        .navigationTitle("Calendrier")
        .toolbar {
            ToolbarItemGroup {
                Button { shift(-1) } label: { Image(systemName: "chevron.left") }
                Button("Aujourd'hui") { weekStart = Self.startOfWeek(Date()) }
                Button { shift(1) } label: { Image(systemName: "chevron.right") }
            }
        }
    }

    private var weekHeader: some View {
        HStack(spacing: 0) {
            Color.clear.frame(width: 44)
            ForEach(days, id: \.self) { day in
                VStack(spacing: 2) {
                    Text(day.formatted(.dateTime.weekday(.abbreviated)).capitalized)
                        .font(.caption).foregroundStyle(.secondary)
                    Text(day.formatted(.dateTime.day()))
                        .font(.headline)
                        .foregroundStyle(Calendar.current.isDateInToday(day) ? Color.accentColor : .primary)
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 6)
            }
        }
    }

    private var hourGutter: some View {
        VStack(spacing: 0) {
            ForEach(Self.dayStartHour..<Self.dayEndHour, id: \.self) { hour in
                Text("\(hour)h")
                    .font(.caption2).foregroundStyle(.secondary)
                    .frame(width: 44, height: Self.hourHeight, alignment: .topTrailing)
                    .padding(.trailing, 4)
            }
        }
    }

    private func sessionsFor(_ day: Date) -> [StudioSession] {
        let calendar = Calendar.current
        return sessions.filter { session in
            guard let start = session.startTime, let end = session.endTime else { return false }
            let dayStart = calendar.startOfDay(for: day)
            guard let dayEnd = calendar.date(byAdding: .day, value: 1, to: dayStart) else { return false }
            return start < dayEnd && end > dayStart // overlaps the day (lockouts span days)
        }
    }

    private var roomColors: [Int: Color] {
        let palette: [Color] = [.blue, .purple, .orange, .teal, .pink, .indigo]
        var colors: [Int: Color] = [:]
        for (index, room) in model.store.roomsList().enumerated() {
            if let id = room.serverId { colors[id] = palette[index % palette.count] }
        }
        return colors
    }

    private func shift(_ weeks: Int) {
        if let newStart = Calendar.current.date(byAdding: .weekOfYear, value: weeks, to: weekStart) {
            weekStart = newStart
        }
    }
}

private struct DayColumn: View {
    @Environment(AppModel.self) private var model
    let day: Date
    let sessions: [StudioSession]
    let startHour: Int
    let hourHeight: CGFloat
    let roomColors: [Int: Color]

    private var columnHeight: CGFloat { CGFloat(22 - startHour) * hourHeight }

    var body: some View {
        ZStack(alignment: .topLeading) {
            // Hour lines
            VStack(spacing: 0) {
                ForEach(startHour..<22, id: \.self) { _ in
                    Rectangle().fill(.clear)
                        .frame(height: hourHeight)
                        .overlay(alignment: .top) { Divider().opacity(0.4) }
                }
            }
            // Session blocks
            ForEach(sessions) { session in
                block(session)
            }
        }
        .frame(height: columnHeight)
    }

    @ViewBuilder
    private func block(_ session: StudioSession) -> some View {
        let calendar = Calendar.current
        let dayStart = calendar.startOfDay(for: day).addingTimeInterval(TimeInterval(startHour * 3600))
        let dayEnd = calendar.startOfDay(for: day).addingTimeInterval(22 * 3600)
        let start = max(session.startTime ?? dayStart, dayStart)
        let end = min(session.endTime ?? dayEnd, dayEnd)

        if end > start {
            let yOffset = CGFloat(start.timeIntervalSince(dayStart) / 3600) * hourHeight
            let height = max(CGFloat(end.timeIntervalSince(start) / 3600) * hourHeight, 18)
            let color = session.roomId.flatMap { roomColors[$0] } ?? .gray
            let clientName = session.clientId.flatMap { model.store.clientsByServerId()[$0]?.name }

            VStack(alignment: .leading, spacing: 1) {
                Text(session.title).font(.caption).bold().lineLimit(2)
                if let clientName, height > 40 {
                    Text(clientName).font(.caption2).opacity(0.85).lineLimit(1)
                }
            }
            .padding(4)
            .frame(maxWidth: .infinity, alignment: .leading)
            .frame(height: height, alignment: .top)
            .background(
                RoundedRectangle(cornerRadius: 5)
                    .fill(color.opacity(session.status == "conflict" ? 0.9 : 0.7))
            )
            .overlay(alignment: .topTrailing) {
                if session.status == "conflict" {
                    Image(systemName: "exclamationmark.triangle.fill")
                        .font(.caption2).foregroundStyle(.yellow).padding(2)
                }
            }
            .foregroundStyle(.white)
            .padding(.horizontal, 2)
            .offset(y: yOffset)
            .help("\(session.title) — \(session.bookingType)")
        }
    }
}
