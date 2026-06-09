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