import { NextResponse } from "next/server";
import { importMailingListTo } from "@/src/lib/api";

interface MailingListRouteContext {
  params: Promise<{
    listId: string;
  }>;
}

export async function POST(
  request: Request,
  { params }: MailingListRouteContext,
) {
  const { listId } = await params;
  if (!listId) {
    return NextResponse.json({ error: "Missing list ID" }, { status: 400 });
  }

  try {
    const formData = await request.formData();
    const result = await importMailingListTo(listId, formData);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status },
      );
    }

    return NextResponse.json(result.data, { status: result.status });
  } catch (error) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
}
