import { NextResponse } from "next/server";
import { sendCampaign } from "@/src/lib/api";

interface CampaignSendContext {
  params: Promise<{
    campaignId: string;
  }>;
}

export async function POST(request: Request, { params }: CampaignSendContext) {
  const { campaignId } = await params;
  if (!campaignId) {
    return NextResponse.json({ error: "Missing campaign ID" }, { status: 400 });
  }

  const result = await sendCampaign(campaignId);

  if (result.error) {
    return NextResponse.json(
      { error: result.error },
      { status: result.status },
    );
  }

  return NextResponse.json(result.data, { status: result.status });
}
