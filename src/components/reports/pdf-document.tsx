import { Font, Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica" },
    { src: "Helvetica-Bold", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0a0a0a",
  },
  header: {
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: "#525252",
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    marginTop: 16,
    marginBottom: 8,
  },
  table: {
    display: "flex",
    width: "100%",
    borderWidth: 1,
    borderColor: "#e5e5e5",
    marginBottom: 16,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tableHeaderCell: {
    padding: 6,
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#525252",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
  },
  tableCell: {
    padding: 6,
    fontSize: 10,
  },
  colDate: { width: "30%" },
  colType: { width: "35%" },
  colHours: { width: "35%" },
  reportText: {
    fontSize: 10,
    lineHeight: 1.6,
    marginTop: 4,
  },
  statusRow: {
    flexDirection: "row",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
  },
  statusLabel: {
    fontSize: 9,
    color: "#737373",
    width: "30%",
  },
  statusValue: {
    fontSize: 10,
    width: "70%",
  },
  commentBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: "#fefce8",
    borderWidth: 1,
    borderColor: "#fde68a",
    borderRadius: 4,
  },
  commentTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#92400e",
    marginBottom: 4,
  },
  commentText: {
    fontSize: 10,
    color: "#78350f",
  },
});

const STATUS_LABELS: Record<string, string> = {
  draft: "Entwurf",
  submitted: "Eingereicht",
  approved: "Genehmigt",
  rejected: "Abgelehnt",
  needs_revision: "Überarbeitung erforderlich",
};

const DAY_TYPE_LABELS: Record<string, string> = {
  company: "Betrieb",
  vocational_school: "Berufsschule",
  vacation: "Urlaub",
  other: "Sonstiges",
};

interface DailyEntryData {
  id?: string;
  date: string;
  dayType: string;
  hours: number;
  minutes: number;
}

interface ReportData {
  calendarWeek: number;
  calendarYear: number;
  weekStartDate: string;
  weekEndDate: string;
  reportText: string | null;
  status: string;
  submittedAt: string | null;
  reviewedAt: string | null;
  reviewComment: string | null;
  trainee?: { name: string; profession?: { name: string } | null } | null;
  reviewedBy?: { name: string } | null;
  dailyEntries: DailyEntryData[];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDayName(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("de-DE", { weekday: "long" });
}

export function PdfDocument({ report }: { report: ReportData }) {
  const traineeName = report.trainee?.name || "Unbekannt";
  const profession = report.trainee?.profession?.name;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>Wochenbericht</Text>
          <Text style={styles.subtitle}>
            KW {report.calendarWeek}/{report.calendarYear}
          </Text>
          <Text style={styles.subtitle}>
            {formatDate(report.weekStartDate)} – {formatDate(report.weekEndDate)}
          </Text>
          <Text style={styles.subtitle}>
            {traineeName}
            {profession ? ` | ${profession}` : ""}
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Tageseinträge</Text>
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderCell, styles.colDate]}>Tag</Text>
            <Text style={[styles.tableHeaderCell, styles.colType]}>Tagestyp</Text>
            <Text style={[styles.tableHeaderCell, styles.colHours]}>Stunden</Text>
          </View>
          {report.dailyEntries.map((entry, i) => (
            <View key={entry.id || i} style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.colDate]}>
                {formatDayName(entry.date)}, {formatDate(entry.date)}
              </Text>
              <Text style={[styles.tableCell, styles.colType]}>
                {DAY_TYPE_LABELS[entry.dayType] || entry.dayType}
              </Text>
              <Text style={[styles.tableCell, styles.colHours]}>
                {entry.hours}h {entry.minutes > 0 ? `${entry.minutes}min` : ""}
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Berichtstext</Text>
        <Text style={styles.reportText}>
          {report.reportText || "Kein Berichtstext vorhanden."}
        </Text>

        {report.reviewComment && (
          <View style={styles.commentBox}>
            <Text style={styles.commentTitle}>Kommentar des Prüfers</Text>
            <Text style={styles.commentText}>{report.reviewComment}</Text>
          </View>
        )}

        <View style={styles.statusRow}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.statusValue}>{STATUS_LABELS[report.status] || report.status}</Text>
        </View>

        {report.submittedAt && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Eingereicht am</Text>
            <Text style={styles.statusValue}>{formatDate(report.submittedAt)}</Text>
          </View>
        )}

        {report.reviewedAt && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Geprüft am</Text>
            <Text style={styles.statusValue}>{formatDate(report.reviewedAt)}</Text>
          </View>
        )}

        {report.reviewedBy && (
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Geprüft von</Text>
            <Text style={styles.statusValue}>{report.reviewedBy.name}</Text>
          </View>
        )}
      </Page>
    </Document>
  );
}
