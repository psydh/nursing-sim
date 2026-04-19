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

  const model = client.getGenerativeModel({ model: "gemini-2.5-flash" }, REQUEST_OPTIONS);

  // Prepend system prompt as first exchange in history
  const systemHistory = [
    { role: "user", parts: [{ text: `[시스템 지침]\n${caseData.systemPrompt}` }] },
    { role: "model", parts: [{ text: "네, 이해했습니다. 지침에 따라 역할을 수행하겠습니다." }] },
  ];

  const history = [
    ...systemHistory,
    ...messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "user" ? "user" : "model",
      parts: [{ text: m.content }],
    })),
  ];

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
