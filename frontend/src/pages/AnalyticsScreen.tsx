import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSettings } from "../context/SettingsContext";
import api, { AnalyticsInsights } from "../services/api";

const lightTheme = {
  canvas: "#F2F6F5",
  surface: "#FFFFFF",
  ink: "#173B3A",
  muted: "#6B7E7C",
  softMuted: "#8EA09D",
  line: "#DCE8E5",
  teal: "#247A78",
  tealSoft: "#E4F1EF",
  coral: "#D86658",
  coralSoft: "#FBE8E4",
  amber: "#C89432",
  amberSoft: "#FFF3D9",
  severe: "#725A76",
  severeSoft: "#F0EAF1",
};

const darkTheme = {
  ...lightTheme,
  canvas: "#122322",
  surface: "#1C3230",
  ink: "#EAF4F1",
  muted: "#A8BFBB",
  softMuted: "#7F9D98",
  line: "#31504C",
  teal: "#67C1B5",
  tealSoft: "#244844",
  coral: "#F28B7D",
  coralSoft: "#4B2B29",
  amber: "#E2B75B",
  amberSoft: "#4A3C20",
  severe: "#B99ABC",
  severeSoft: "#3B3040",
};

export default function AnalyticsScreen() {
  const navigation = useNavigation<any>();
  const { darkMode } = useSettings();
  const theme = darkMode ? darkTheme : lightTheme;
  const [data, setData] = useState<AnalyticsInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadInsights = () => {
    setIsLoading(true);
    setError(null);
    api
      .get<AnalyticsInsights>("/analytics/insights")
      .then((response) => setData(response.data))
      .catch((requestError) => {
        const message = requestError.response?.data?.message;
        setError(
          typeof message === "string"
            ? message
            : "Insights could not be generated. Try again shortly.",
        );
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const metrics = data?.metrics;
  const summaryMetrics = metrics
    ? [
        {
          label: "Active incidents",
          value: String(metrics.activeIncidents),
          detail: "Currently open",
          tone: "teal",
        },
        {
          label: "Resolved today",
          value: String(metrics.resolvedToday),
          detail: "Closed since midnight",
          tone: "coral",
        },
        {
          label: "Average response",
          value:
            metrics.averageResponseMinutes === null
              ? "—"
              : `${metrics.averageResponseMinutes} min`,
          detail: "Resolved incidents today",
          tone: "amber",
        },
      ]
    : [];

  const detailMetrics = metrics
    ? [
        {
          label: "Location with most incidents",
          value: metrics.topLocation?.name ?? "No active locations",
          detail: metrics.topLocation
            ? `${metrics.topLocation.count} incident(s)`
            : "",
        },
        {
          label: "Most reported incident",
          value: metrics.mostReported?.type ?? "No incidents",
          detail: metrics.mostReported
            ? `${metrics.mostReported.count} confirmations`
            : "",
        },
        {
          label: "Longest-running incident",
          value: metrics.longestRunning?.type ?? "No active incidents",
          detail: metrics.longestRunning
            ? `${metrics.longestRunning.ageMinutes} min active`
            : "",
        },
      ]
    : [];

  return (
    <View style={[styles.container, { backgroundColor: theme.canvas }]}>
      <View
        style={[
          styles.header,
          { backgroundColor: theme.surface, borderBottomColor: theme.line },
        ]}
      >
        <TouchableOpacity
          accessibilityLabel="Go back to incidents"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={[styles.backText, { color: theme.teal }]}>‹</Text>
        </TouchableOpacity>
        <View style={styles.headerCopy}>
          <Text style={[styles.title, { color: theme.ink }]}>
            Incident analytics
          </Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Police operations · Today
          </Text>
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.notice,
            { backgroundColor: theme.tealSoft, borderColor: theme.line },
          ]}
        >
          <View style={styles.noticeHeader}>
            <Text style={[styles.noticeLabel, { color: theme.teal }]}>
              AI OPERATIONS BRIEF
            </Text>
            <TouchableOpacity onPress={loadInsights} disabled={isLoading}>
              <Text style={[styles.refreshText, { color: theme.teal }]}>
                Refresh
              </Text>
            </TouchableOpacity>
          </View>
          {isLoading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color={theme.teal} />
              <Text style={[styles.noticeText, { color: theme.ink }]}>
                Analyzing current incidents...
              </Text>
            </View>
          ) : error ? (
            <Text style={[styles.noticeText, { color: theme.coral }]}>
              {error}
            </Text>
          ) : (
            <Text style={[styles.noticeText, { color: theme.ink }]}>
              Generated{" "}
              {data ? new Date(data.generatedAt).toLocaleTimeString() : ""}
            </Text>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
          TODAY AT A GLANCE
        </Text>
        <View style={styles.summaryGrid}>
          {summaryMetrics.map((metric) => (
            <View
              key={metric.label}
              style={[
                styles.summaryCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
              ]}
            >
              <View
                style={[
                  styles.metricAccent,
                  {
                    backgroundColor:
                      theme[metric.tone as "teal" | "coral" | "amber"],
                  },
                ]}
              />
              <Text style={[styles.metricLabel, { color: theme.muted }]}>
                {metric.label}
              </Text>
              <Text style={[styles.metricValue, { color: theme.ink }]}>
                {metric.value}
              </Text>
              <Text style={[styles.metricDetail, { color: theme.softMuted }]}>
                {metric.detail}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
          INCIDENT PATTERNS
        </Text>
        <View
          style={[
            styles.detailList,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          {detailMetrics.map((metric, index) => (
            <View
              key={metric.label}
              style={[
                styles.detailRow,
                index < detailMetrics.length - 1 && {
                  borderBottomColor: theme.line,
                  borderBottomWidth: 1,
                },
              ]}
            >
              <View style={styles.detailCopy}>
                <Text style={[styles.detailLabel, { color: theme.muted }]}>
                  {metric.label}
                </Text>
                <Text style={[styles.detailValue, { color: theme.ink }]}>
                  {metric.value}
                </Text>
              </View>
              <Text style={[styles.detailMeta, { color: theme.teal }]}>
                {metric.detail}
              </Text>
            </View>
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: theme.muted }]}>
          SEVERITY WATCH
        </Text>
        <View
          style={[
            styles.severityCard,
            { backgroundColor: theme.surface, borderColor: theme.line },
          ]}
        >
          <View style={styles.severityHeader}>
            <View>
              <Text style={[styles.detailLabel, { color: theme.muted }]}>
                Most severe incident of the day
              </Text>
              <Text style={[styles.severityTitle, { color: theme.ink }]}>
                {metrics?.highestPriority?.type ?? "No active incidents"}
              </Text>
            </View>
            <View
              style={[
                styles.severityBadge,
                { backgroundColor: theme.severeSoft },
              ]}
            >
              <Text style={[styles.severityBadgeText, { color: theme.severe }]}>
                {metrics?.highestPriority?.severity?.toUpperCase() ?? "NO DATA"}
              </Text>
            </View>
          </View>
          <Text style={[styles.severityDescription, { color: theme.muted }]}>
            {metrics?.highestPriority?.address ??
              "Priority is ranked using severity, confirmations, and resolution votes."}
          </Text>
        </View>

        {data && (
          <>
            <Text style={[styles.sectionLabel, { color: theme.muted }]}>
              AI ASSESSMENT
            </Text>
            <View
              style={[
                styles.insightCard,
                { backgroundColor: theme.surface, borderColor: theme.line },
              ]}
            >
              <Text style={[styles.insightHeadline, { color: theme.ink }]}>
                {data.insight.headline}
              </Text>
              <Text style={[styles.insightSummary, { color: theme.muted }]}>
                {data.insight.summary}
              </Text>
              <InsightList
                title="Priorities"
                items={data.insight.priorities}
                color={theme.coral}
                textColor={theme.ink}
              />
              <InsightList
                title="Patterns"
                items={data.insight.patterns}
                color={theme.teal}
                textColor={theme.ink}
              />
              <InsightList
                title="Recommendations"
                items={data.insight.recommendations}
                color={theme.amber}
                textColor={theme.ink}
              />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function InsightList({
  title,
  items,
  color,
  textColor,
}: {
  title: string;
  items: string[];
  color: string;
  textColor: string;
}) {
  if (!items.length) return null;
  return (
    <View style={styles.insightList}>
      <Text style={[styles.insightListTitle, { color }]}>{title}</Text>
      {items.map((item, index) => (
        <Text
          key={`${title}-${index}`}
          style={[styles.insightItem, { color: textColor }]}
        >
          • {item}
        </Text>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  backButton: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
  },
  backText: { fontSize: 34, lineHeight: 34 },
  headerCopy: { flex: 1, marginLeft: 6 },
  headerSpacer: { width: 34 },
  title: { fontSize: 21, fontWeight: "800" },
  subtitle: { fontSize: 12, marginTop: 2 },
  content: { padding: 16, paddingBottom: 32 },
  notice: { borderWidth: 1, borderRadius: 8, padding: 14, marginBottom: 22 },
  noticeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  noticeLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 5,
  },
  noticeText: { fontSize: 13, lineHeight: 18 },
  refreshText: { fontSize: 12, fontWeight: "800" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    marginBottom: 9,
  },
  summaryGrid: { flexDirection: "row", gap: 8, marginBottom: 22 },
  summaryCard: {
    flex: 1,
    minHeight: 136,
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  metricAccent: { width: 24, height: 4, borderRadius: 2, marginBottom: 12 },
  metricLabel: { fontSize: 12, lineHeight: 16, minHeight: 32 },
  metricValue: { fontSize: 22, fontWeight: "800", marginTop: 8 },
  metricDetail: { fontSize: 11, lineHeight: 15, marginTop: 4 },
  detailList: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    marginBottom: 22,
  },
  detailRow: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  detailCopy: { flex: 1, paddingRight: 10 },
  detailLabel: { fontSize: 12, lineHeight: 16 },
  detailValue: { fontSize: 16, fontWeight: "800", marginTop: 3 },
  detailMeta: {
    maxWidth: 120,
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
  },
  severityCard: { borderWidth: 1, borderRadius: 8, padding: 15 },
  severityHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  severityTitle: { fontSize: 17, fontWeight: "800", marginTop: 4 },
  severityBadge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    marginLeft: 10,
  },
  severityBadgeText: { fontSize: 10, fontWeight: "800" },
  severityDescription: { fontSize: 12, lineHeight: 18, marginTop: 14 },
  insightCard: { borderWidth: 1, borderRadius: 8, padding: 15 },
  insightHeadline: { fontSize: 18, fontWeight: "800", lineHeight: 23 },
  insightSummary: { fontSize: 13, lineHeight: 19, marginTop: 8 },
  insightList: { marginTop: 16 },
  insightListTitle: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  insightItem: { fontSize: 13, lineHeight: 19, marginBottom: 5 },
});
