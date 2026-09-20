import { NextResponse } from "next/server";
import { synthesizeCurriculum, SynthesisParams } from "@/lib/bringe-ai-engine";
import { config } from "@/lib/config";

export async function POST(request: Request) {
  try {
    const body: SynthesisParams = await request.json();

    // If AI is configured and has an API key, we can try calling OpenAI
    if (config.ai.enabled && config.ai.apiKey) {
      try {
        const prompt = `You are a university exam analysis engine. Synthesize an evidence-based Exam Eve OS curriculum for the course "${body.subject}" focusing on "${body.area}" for department "${body.department}".
Exam in ${body.examHoursRemaining} hours, available study time ${body.studyBudgetHours} hours, pass mark target ${body.passMarkTarget}%.
Question style: ${body.questionStyle}.
Return 5 high-yield topics (2 Must Know with >=75% past exam recurrence, 2 Should Know with 50-74% recurrence, 1 Skip for Now with low ROI).
For each topic, provide full details matching the schema: id, name, subtopic, durationMins, tier, sourceTag, pastExamFreq, predictedMarks, confidence, highSchoolAnalogy, collegeRigor, keyPoints, commonGotcha, misconceptionDiagnosis, mustWriteKeywords, formulaBoundary, deductionTraps, fadedExample (title, step1_full, step2_faded, step3_independent), flashcards (front, back), mcq (question, options, correctIndex, explanation), writingQuestion (prompt, maxMarks, markingCriteria, sampleModelAnswer).
Do NOT include emojis. Return pure JSON only.`;

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
            temperature: 0.3,
          }),
        });

        if (response.ok) {
          const data = await response.json();
          const content = data.choices?.[0]?.message?.content;
          if (content) {
            const parsed = JSON.parse(content);
            const topics = Array.isArray(parsed) ? parsed : parsed.topics || parsed.data;
            if (Array.isArray(topics) && topics.length >= 3) {
              return NextResponse.json({
                success: true,
                source: "live_llm",
                topics,
              });
            }
          }
        }
      } catch (llmErr) {
        console.warn("LLM API call bypassed or quota exhausted, switching to semantic synthesis engine:", llmErr);
      }
    }

    // Fallback or Primary: Deep Domain-Adaptive Semantic Synthesis Engine
    const topics = synthesizeCurriculum(body);

    return NextResponse.json({
      success: true,
      source: "semantic_synthesis_engine",
      topics,
    });
  } catch (error) {
    console.error("Error in /api/bringe/synthesize:", error);
    return NextResponse.json(
      { success: false, error: "Failed to synthesize curriculum" },
      { status: 500 }
    );
  }
}
