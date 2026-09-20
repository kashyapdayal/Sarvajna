import { NextResponse } from "next/server";
import { evaluateStudentAnswer, EvaluationParams } from "@/lib/bringe-ai-engine";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  try {
    const body: EvaluationParams = await request.json();

    // If AI is configured and has an API key, we can try calling OpenAI
    if (config.ai.enabled && config.ai.apiKey) {
      try {
        const prompt = `You are a strict university examination evaluator.
Question: "${body.topic.writingQuestion.prompt}" (Max Marks: ${body.topic.writingQuestion.maxMarks})
Marking Criteria: ${JSON.stringify(body.topic.writingQuestion.markingCriteria)}
Essential Keywords: ${JSON.stringify(body.topic.mustWriteKeywords)}
Student Written Answer:
"${body.writtenText}"
Student Reported Confidence: ${body.confidenceLevel}

Grade the student response strictly. Return JSON with:
marksAwarded (number between 1.0 and ${body.topic.writingQuestion.maxMarks}),
maxMarks (${body.topic.writingQuestion.maxMarks}),
scoreRatio (number between 0.0 and 1.0),
strengths (array of strings),
penalties (array of strings),
feedbackAdvice (string),
graspingInsight (string),
misconceptionDiagnosis (string diagnosing the exact conceptual error, 60-second explanation),
illusionDetected (boolean, true if confidence was high but scoreRatio < 0.65),
confidenceReported ("${body.confidenceLevel}")
Do NOT use emojis. Return pure JSON only.`;

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${config.ai.apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            if (typeof parsed.marksAwarded === "number") {
              return NextResponse.json({
                success: true,
                source: "live_llm",
                evaluation: parsed,
              });
            }
          }
        }
      } catch (llmErr) {
        console.warn("Evaluation LLM call bypassed, using semantic evaluation engine:", llmErr);
      }
    }

    // Fallback or Primary: Semantic Evaluation Engine
    const evaluation = evaluateStudentAnswer(body);

    return NextResponse.json({
      success: true,
      source: "semantic_evaluation_engine",
      evaluation,
    });
  } catch (error) {
    console.error("Error in /api/bringe/evaluate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to evaluate answer" },
      { status: 500 }
    );
  }
}
