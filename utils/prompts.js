export const generateQuestionsPrompt = (
  quizTitle,
  numberOfQuestions = 1,
) => `
You are an expert quiz generator.

Generate exactly ${numberOfQuestions} multiple-choice questions based on the quiz title: "${quizTitle}".

Requirements:
1. Each question must be relevant to the quiz title.
2. Each question must have exactly 4 options.
3. One option must be the correct answer.
4. The correct answer MUST appear inside the options array.
5. Do not include explanations.
6. Do not include markdown.
7. Return ONLY valid JSON.
8. Do not wrap the response inside code blocks.

Response format:

{
  "questions": [
    {
      "question": "Question text",
      "options": [
        "Option A",
        "Option B",
        "Option C",
        "Option D"
      ],
      "answer": "Correct option text"
    }
  ]
}
`;

export const explainAnswerPrompt = (question, answers, correctAnswer) => {
  return `
  You are an expert educational assistant.

Analyze the following multiple-choice question and explain why the correct answer is correct.

Question:
"${question}"

Options:
${JSON.stringify(answers, null, 2)}

Correct Answer:
"${correctAnswer}"

Requirements:

1. Explain clearly why the correct answer is correct.
2. Keep the explanation concise (2-5 sentences).
3. Use simple educational language.
4. Do not explain why every wrong option is wrong unless necessary.
5. Do not include markdown.
6. Return ONLY valid JSON.
7. Do not wrap the response inside code blocks.

Response format:

{
"question": "${question}",
"correctAnswer": "${correctAnswer}",
"explanation": "Explanation of why the answer is correct."
}
`
}

export const generateResourcesPrompt = (
  roadmapTitle,
  sectionTitle,
  sectionDescription,
  sectionDifficulty = "Beginner" | "Intermediate" | "Advanced" | "Expert",
  resourceType = "video" | "article" | "course",
  resourceCount = 1
) => {
  return `You are an expert learning resource curator.

Generate exactly ${resourceCount} learning resources for the following roadmap section.

Roadmap Title:
  "${roadmapTitle}"

Section Title:
  "${sectionTitle}"

Section Description:
  "${sectionDescription}"

  Difficulty:
  "${sectionDifficulty}"

Required Resource Type:
  "${resourceType}"

  Requirements:

  1. Generate exactly ${resourceCount} resources.
2. Every resource MUST have the type "${resourceType}".
3. Resource type must be one of:

   * "video"
    * "article"
    * "course"
  4. Resources must be directly relevant to the section topic.
5. Resources must match the specified difficulty level.
6. Use reputable and trustworthy sources.
7. Do not generate duplicate resources.
8. Every resource must contain:

   * title
    * type
    * url
  9. URLs must be valid and publicly accessible.
10. Do not include explanations.
11. Do not include markdown.
12. Return ONLY valid JSON.
13. Do not wrap the response inside code blocks.

Response format:

  {
    "resources": [
      {
        "title": "Resource title",
        "type": "${resourceType}",
        "url": "https://example.com"
      }
    ]
  }

}`
}