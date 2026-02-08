import { NextResponse } from "next/server";
import {
  createCampaign,
  fetchCampaigns,
  type CampaignDraftPayload,
} from "@/src/lib/api";

export async function GET() {
  const result = await fetchCampaigns();

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function POST(request: Request) {
  try {
    const body: CampaignDraftPayload = await request.json();
    const result = await createCampaign(body);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
