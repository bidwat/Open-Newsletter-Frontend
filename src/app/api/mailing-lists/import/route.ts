import { NextResponse } from "next/server";
import { importMailingList } from "@/src/lib/api";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const result = await importMailingList(formData);

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
