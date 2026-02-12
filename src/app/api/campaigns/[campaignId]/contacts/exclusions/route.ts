import { NextResponse } from "next/server";
import { bulkUpdateCampaignContactExclusions } from "@/src/lib/api";

interface CampaignContactsExclusionsContext {
  params: Promise<{
    campaignId: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: CampaignContactsExclusionsContext,
) {
  const { campaignId } = await params;
  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign ID" }, { status: 400 });
  }

  try {
    const body = await request.json();
    if (
      !Array.isArray(body?.contactIds) ||
      typeof body?.exclude !== "boolean"
    ) {
      return NextResponse.json(
        { error: "Invalid exclusions payload" },
        { status: 400 },
      );
    }

    const result = await bulkUpdateCampaignContactExclusions(campaignId, body);

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
