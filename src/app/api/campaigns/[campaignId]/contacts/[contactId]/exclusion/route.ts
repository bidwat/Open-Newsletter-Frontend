import { NextResponse } from "next/server";
import { updateCampaignContactExclusion } from "@/src/lib/api";

interface CampaignContactExclusionContext {
  params: Promise<{
    campaignId: string;
    contactId: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: CampaignContactExclusionContext,
) {
  const { campaignId, contactId } = await params;
  if (!campaignId || !contactId) {
    return NextResponse.json(
      { error: "Missing campaign or contact ID" },
      { status: 400 },
    );
  }

  try {
    const body = await request.json();
    if (typeof body?.excluded !== "boolean") {
      return NextResponse.json(
        { error: "Missing excluded flag" },
        { status: 400 },
      );
    }

    const result = await updateCampaignContactExclusion(
      campaignId,
      contactId,
      body.excluded,
    );

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
