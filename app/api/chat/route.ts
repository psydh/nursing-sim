import { GoogleGenerativeAI } from "@google/generative-ai";
import { CASES } from "@/lib/cases";

const client = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const REQUEST_OPTIONS = { apiVersion: "v1" };

export async function POST(request: Request) {
  const { caseId, messages } = await request.json();

  const caseData = CASES[caseId];
  if (!caseData) {
    return Response.json({ error: "케이스를 찾을 수 없습니다" }, { status: 404 });
  }

  const model = client.getGenerativeModel(
    { model: "gemini-1.5-flash", systemInstruction: caseData.systemPrompt },
    REQUEST_OPTIONS
  );

  const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
    role: m.role === "user" ? "user" : "model",
    parts: [{ text: m.content }],
  }));

  const lastMessage = messages[messages.length - 1].content;

  const chat = model.startChat({ history });
  const result = await chat.sendMessageStream(lastMessage);

  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) {
          controller.enqueue(new TextEncoder().encode(text));
        }
      }
      controller.close();
    },
  });

  return new Response(readable, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
