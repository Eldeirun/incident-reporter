import {
  BadGatewayException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import Groq from 'groq-sdk';
import { Repository } from 'typeorm';
import { Incident } from '../incidents/incident.entity';

interface InsightPayload {
  headline: string;
  summary: string;
  priorities: string[];
  patterns: string[];
  recommendations: string[];
}

export interface AnalyticsInsights {
  generatedAt: string;
  metrics: {
    activeIncidents: number;
    resolvedToday: number;
    averageResponseMinutes: number | null;
    topLocation: { name: string; count: number } | null;
    mostReported: { type: string; count: number } | null;
    longestRunning: { type: string; ageMinutes: number } | null;
    highestPriority: {
      type: string;
      severity: string;
      address: string | null;
    } | null;
  };
  insight: InsightPayload;
}

@Injectable()
export class AiInsightsService {
  constructor(
    @InjectRepository(Incident)
    private readonly incidentsRepository: Repository<Incident>,
    private readonly configService: ConfigService,
  ) {}

  async generateInsights(): Promise<AnalyticsInsights> {
    const incidents = await this.incidentsRepository.find();
    const metrics = this.calculateMetrics(incidents);
    const apiKey = this.configService.get<string>('GROQ_API_KEY');

    if (!apiKey) {
      throw new ServiceUnavailableException(
        'AI insights are not configured. Set GROQ_API_KEY on the backend.',
      );
    }

    const model = this.configService.get<string>(
      'GROQ_MODEL',
      'openai/gpt-oss-120b',
    );
    const snapshot = [...incidents]
      .sort((a, b) => {
        if (a.status !== b.status) return a.status === 'active' ? -1 : 1;
        return b.createdAt.getTime() - a.createdAt.getTime();
      })
      .slice(0, 100)
      .map((incident) => ({
        id: incident.id,
        type: incident.type,
        severity: incident.severity,
        description: incident.description,
        address: incident.address,
        reportCount: incident.reportCount,
        resolveCount: incident.resolveCount,
        status: incident.status,
        createdAt: incident.createdAt,
        resolvedAt: incident.resolvedAt,
      }));

    try {
      const groq = new Groq({ apiKey });
      const response = await groq.chat.completions.create({
        model,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content:
              'You are an operations analyst assisting a police dispatcher. Analyze the current situation first: active incidents, their age, severity, location, and report/resolve signals. Do not require incidents reported today; if today has no new activity, use existing active incidents and historical data to explain what is happening now. If there are no active incidents, clearly say the situation is currently quiet and use available historical data for context. Return only JSON with string fields headline and summary, plus string arrays priorities, patterns, and recommendations. Be concise, evidence-based, and never invent facts. Recommendations must be operational and safety-conscious.',
          },
          {
            role: 'user',
            content: JSON.stringify({
              analysisDate: new Date().toISOString(),
              currentSituation: {
                activeIncidents: metrics.activeIncidents,
                longestRunningIncident: metrics.longestRunning,
                highestPriorityIncident: metrics.highestPriority,
              },
              dailyActivity: {
                resolvedToday: metrics.resolvedToday,
                averageResponseMinutes: metrics.averageResponseMinutes,
              },
              metrics,
              incidents: snapshot,
            }),
          },
        ],
      });

      const content = response.choices?.[0]?.message?.content;
      if (!content) throw new Error('The AI provider returned no content');
      const insight = this.parseInsight(content);

      return { generatedAt: new Date().toISOString(), metrics, insight };
    } catch (error) {
      if (error instanceof BadGatewayException) throw error;
      throw new BadGatewayException(
        'The AI provider could not generate incident insights. Try again shortly.',
      );
    }
  }

  private calculateMetrics(
    incidents: Incident[],
  ): AnalyticsInsights['metrics'] {
    const now = Date.now();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const active = incidents.filter((incident) => incident.status === 'active');
    const resolvedToday = incidents.filter(
      (incident) => incident.resolvedAt && incident.resolvedAt >= today,
    );
    const locations = new Map<string, number>();
    active.forEach((incident) => {
      const location =
        incident.address ||
        `${Number(incident.lat).toFixed(3)}, ${Number(incident.lon).toFixed(3)}`;
      locations.set(location, (locations.get(location) ?? 0) + 1);
    });
    const topLocationEntry = [...locations.entries()].sort(
      (a, b) => b[1] - a[1],
    )[0];
    const mostReportedIncident = [...incidents].sort(
      (a, b) => b.reportCount - a.reportCount,
    )[0];
    const longestRunningIncident = [...active].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    )[0];
    const highestPriorityIncident = [...active].sort(
      (a, b) => this.priorityScore(b) - this.priorityScore(a),
    )[0];
    const responseTimes = resolvedToday
      .filter((incident) => incident.resolvedAt)
      .map(
        (incident) =>
          (incident.resolvedAt!.getTime() - incident.createdAt.getTime()) /
          60000,
      )
      .filter((minutes) => minutes >= 0);

    return {
      activeIncidents: active.length,
      resolvedToday: resolvedToday.length,
      averageResponseMinutes: responseTimes.length
        ? Math.round(
            responseTimes.reduce((sum, value) => sum + value, 0) /
              responseTimes.length,
          )
        : null,
      topLocation: topLocationEntry
        ? { name: topLocationEntry[0], count: topLocationEntry[1] }
        : null,
      mostReported: mostReportedIncident
        ? {
            type: mostReportedIncident.type,
            count: mostReportedIncident.reportCount,
          }
        : null,
      longestRunning: longestRunningIncident
        ? {
            type: longestRunningIncident.type,
            ageMinutes: Math.max(
              0,
              Math.round(
                (now - longestRunningIncident.createdAt.getTime()) / 60000,
              ),
            ),
          }
        : null,
      highestPriority: highestPriorityIncident
        ? {
            type: highestPriorityIncident.type,
            severity: highestPriorityIncident.severity,
            address: highestPriorityIncident.address,
          }
        : null,
    };
  }

  private priorityScore(incident: Incident): number {
    const severity =
      { Severe: 4, High: 3, Medium: 2, Low: 1 }[incident.severity] ?? 0;
    return severity * 100 + incident.reportCount * 2 + incident.resolveCount;
  }

  private parseInsight(content: string): InsightPayload {
    const cleaned = content.replace(/^```json\s*|\s*```$/g, '').trim();
    let parsed: Partial<InsightPayload>;
    try {
      parsed = JSON.parse(cleaned) as Partial<InsightPayload>;
    } catch {
      throw new BadGatewayException(
        'The AI provider returned invalid insight data.',
      );
    }

    if (
      typeof parsed.headline !== 'string' ||
      typeof parsed.summary !== 'string' ||
      !Array.isArray(parsed.priorities) ||
      !Array.isArray(parsed.patterns) ||
      !Array.isArray(parsed.recommendations) ||
      [
        ...parsed.priorities,
        ...parsed.patterns,
        ...parsed.recommendations,
      ].some((item) => typeof item !== 'string')
    ) {
      throw new BadGatewayException(
        'The AI provider returned an incomplete insight.',
      );
    }

    return {
      headline: parsed.headline,
      summary: parsed.summary,
      priorities: parsed.priorities,
      patterns: parsed.patterns,
      recommendations: parsed.recommendations,
    };
  }
}
