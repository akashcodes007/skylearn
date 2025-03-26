import OpenAI from "openai";

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || "demo-api-key-for-dev" 
});

// Generate notes from text content
export async function generateNotesFromText(text: string, options: {
  format: string,
  complexity: string,
  generateQuestions: boolean
}) {
  try {
    // Build system prompt based on options
    let systemPrompt = `You are an expert educator creating structured learning notes. 
Format the notes in ${options.format} format at a ${options.complexity} level.
Include key concepts, explanations, and examples.`;

    if (options.generateQuestions) {
      systemPrompt += " Also include 3-5 practice questions with answers at the end.";
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: `Please generate educational notes from the following content:\n\n${text}`
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("Error generating notes:", error);
    throw new Error("Failed to generate notes. Please try again later.");
  }
}

// Analyze student code submission
export async function analyzeCodeSubmission(
  code: string, 
  language: string, 
  problemStatement: string
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are a code reviewer analyzing a student's submission. 
Provide feedback on:
1. Correctness of the solution
2. Time and space complexity analysis
3. Code quality and readability
4. Potential optimizations
Respond in JSON format with these keys: correctness (boolean), timeComplexity (string), spaceComplexity (string), feedback (string), optimizations (array of strings).`
        },
        {
          role: "user",
          content: `Problem statement: ${problemStatement}\n\nLanguage: ${language}\n\nCode submission:\n\`\`\`${language}\n${code}\n\`\`\``
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error analyzing code:", error);
    throw new Error("Failed to analyze code submission. Please try again later.");
  }
}

// Generate AI interviewer questions for mock interviews
export async function generateInterviewQuestions(
  interviewType: string, 
  difficulty: string
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert technical interviewer. Generate a set of interview questions for a ${difficulty} level ${interviewType} interview.
Each question should include:
1. The question text
2. Expected response points
3. Follow-up questions if needed
4. Evaluation criteria
Respond in JSON format with an array of question objects.`
        },
        {
          role: "user",
          content: `Please generate 5 interview questions for a ${difficulty} level ${interviewType} interview.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating interview questions:", error);
    throw new Error("Failed to generate interview questions. Please try again later.");
  }
}

// Generate MCQ questions for tests
export async function generateMCQQuestions(topic: string, count: number) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      messages: [
        {
          role: "system",
          content: `You are an expert educator creating multiple-choice questions. 
Create ${count} questions about ${topic}.
Each question should have 4 options with one correct answer.
Respond in JSON format with an array of question objects, where each object has:
- question: the question text
- options: array of 4 option strings
- correctIndex: index of the correct option (0-3)
- explanation: brief explanation of the correct answer`
        },
        {
          role: "user",
          content: `Generate ${count} multiple-choice questions about ${topic}.`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    return JSON.parse(response.choices[0].message.content);
  } catch (error) {
    console.error("Error generating MCQ questions:", error);
    throw new Error("Failed to generate questions. Please try again later.");
  }
}
