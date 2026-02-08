import { NextResponse } from "next/server";
import { deleteCampaign, fetchCampaign, updateCampaign } from "@/src/lib/api";

interface CampaignRouteContext {
  params: Promise<{
    campaignId: string;
  }>;
}

export async function GET(request: Request, { params }: CampaignRouteContext) {
  const { campaignId } = await params;
  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign ID" }, { status: 400 });
  }

  const result = await fetchCampaign(campaignId);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}

export async function PUT(request: Request, { params }: CampaignRouteContext) {
  try {
    const { campaignId } = await params;
    if (!campaignId) {
      return NextResponse.json(
        { error: "Missing campaign ID" },
        { status: 400 },
      );
    }

    const body = await request.json();
    const result = await updateCampaign(campaignId, body);

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

export async function DELETE(
  request: Request,
  { params }: CampaignRouteContext,
) {
  const { campaignId } = await params;
  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign ID" }, { status: 400 });
  }

  const result = await deleteCampaign(campaignId);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
