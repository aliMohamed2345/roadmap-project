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