import { NextResponse } from "next/server";
import { docClient, TABLE_NAME } from "@/lib/dynamo/client";
import { GetCommand } from "@aws-sdk/lib-dynamodb";

export async function GET() {
  try {
    await docClient.send(
      new GetCommand({
        TableName: TABLE_NAME,
        Key: { PK: "HEALTH", SK: "CHECK" },
      })
    );
    return NextResponse.json({ status: "ok", dynamodb: "connected" });
  } catch {
    return NextResponse.json(
      { status: "error", dynamodb: "disconnected" },
      { status: 503 }
    );
  }
}
