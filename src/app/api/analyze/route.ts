import { NextRequest, NextResponse } from "next/server";
import { analyzeAnySensors, getOverallStatus } from "@/lib/anomaly-detector";
import { matchFailures } from "@/lib/failure-matcher";
import { getRecommendations } from "@/lib/recommender";
import type { AnalysisResult } from "@/lib/types";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { asset, sensors } = body as {
      asset: string;
      sensors: Record<string, number>;
    };

    if (!asset || !sensors) {
      return NextResponse.json(
        { error: "Missing 'asset' or 'sensors' in request body" },
        { status: 400 }
      );
    }

    const alerts = analyzeAnySensors(asset, sensors);
    const overallStatus = getOverallStatus(alerts);
    const failures = matchFailures(asset, alerts);
    const recommendations = getRecommendations(asset, alerts);

    const result: AnalysisResult = {
      asset,
      overallStatus,
      alerts,
      failures,
      recommendations,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analyze error:", error);
    return NextResponse.json(
      { error: "Analysis failed" },
      { status: 500 }
    );
  }
}
