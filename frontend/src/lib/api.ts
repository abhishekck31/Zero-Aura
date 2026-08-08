import type { FeedResponse } from "@/types/card";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "http://localhost:4000";

interface FetchFeedOptions {
  limit?: number;
  /**
   * Bypass the backend's card cache and regenerate. Costs API quota, so this
   * is reserved for an explicit user action rather than ordinary page loads.
   */
  refresh?: boolean;
  signal?: AbortSignal;
}

/**
 * Fetch a full deck in one round trip.
 *
 * The backend degrades to its curated deck internally, so a resolved response
 * always contains cards — `source` tells us how many were model-generated.
 */
export async function fetchFeed({
  limit = 6,
  refresh = false,
  signal,
}: FetchFeedOptions = {}): Promise<FeedResponse> {
  const query = new URLSearchParams({
    limit: String(limit),
    refresh: String(refresh),
  });

  const response = await fetch(`${API_BASE}/api/cards/feed?${query}`, {
    ...(signal ? { signal } : {}),
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(
      `Feed request failed (${response.status}). Is the API running on ${API_BASE}?`,
    );
  }

  return (await response.json()) as FeedResponse;
}

export { API_BASE };
