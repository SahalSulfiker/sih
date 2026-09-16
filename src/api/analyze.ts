import type { AnalysisResponse, AnalyzeRequest, ApiError } from "@/types/analysis";
import { buildMockAnalysis } from "@/data/mockAnalysis";

/**
 * Single toggle to switch the entire app from mock data to the real
 * backend. Components never call fetch() directly — they call
 * `analyzeVoyage()` below, so flipping this constant (or wiring it to an
 * env var) is the only change needed to go live.
 *
 * To switch to the real API:
 *   1. Set NEXT_PUBLIC_USE_MOCK_DATA=false in your environment, or
 *   2. Set USE_MOCK_DATA = false below.
 */
export const USE_MOCK_DATA =
  process.env.NEXT_PUBLIC_USE_MOCK_DATA === "false" ? false : true;

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

export class AnalyzeApiError extends Error implements ApiError {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "AnalyzeApiError";
    this.code = code;
  }
}

function simulateNetworkDelay(ms = 2600) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Validates the request client-side before it ever reaches the network
 * layer, so the backend never has to reject malformed payloads.
 */
function validateRequest(request: AnalyzeRequest): string | null {
  if (!request.quantity_mt || request.quantity_mt <= 0) {
    return "Cargo quantity must be greater than zero.";
  }
  if (!request.required_date) {
    return "Required delivery date is missing.";
  }
  const deliveryDate = new Date(request.required_date);
  if (Number.isNaN(deliveryDate.getTime())) {
    return "Required delivery date is invalid.";
  }
  return null;
}

/**
 * Analyzes a voyage request and returns the full decision-support
 * response. This is the ONLY function UI components should call —
 * it hides whether the data comes from mocks or the live backend.
 */
export async function analyzeVoyage(
  request: AnalyzeRequest
): Promise<AnalysisResponse> {
  const validationError = validateRequest(request);
  if (validationError) {
    throw new AnalyzeApiError(validationError, "invalid_input");
  }

  if (USE_MOCK_DATA) {
    await simulateNetworkDelay();
    return buildMockAnalysis(request);
  }

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    throw new AnalyzeApiError(
      "Unable to reach the analysis service. Check your connection and try again.",
      "network_error"
    );
  }

  if (!res.ok) {
    let message = "Unable to analyze this voyage. Please try again.";

    try {
      const errorData = (await res.json()) as {
        detail?: string | { message?: string };
        message?: string;
      };

      if (typeof errorData.detail === "string") {
        message = errorData.detail;
      } else if (
        errorData.detail &&
        typeof errorData.detail === "object" &&
        typeof errorData.detail.message === "string"
      ) {
        message = errorData.detail.message;
      } else if (typeof errorData.message === "string") {
        message = errorData.message;
      }
    } catch {
      // Keep the generic message if the backend does not return JSON.
    }

    throw new AnalyzeApiError(
      message,
      `http_${res.status}`
    );
  }

  const data = (await res.json()) as Partial<AnalysisResponse>;

  if (!data.forecast || !data.summary || !data.vessel_recommendations) {
    throw new AnalyzeApiError(
      "The analysis service returned an incomplete response.",
      "partial_response"
    );
  }

  return data as AnalysisResponse;
}
