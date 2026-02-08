import { NextResponse } from "next/server";
import { copyCampaign } from "@/src/lib/api";

interface CampaignCopyContext {
  params: Promise<{
    campaignId: string;
  }>;
}

export async function POST(request: Request, { params }: CampaignCopyContext) {
  const { campaignId } = await params;
  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign ID" }, { status: 400 });
  }

  const result = await copyCampaign(campaignId);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
