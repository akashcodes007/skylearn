import OpenAI from 'openai';
import config from './config/config';

// Initialize OpenAI API client
const openai = new OpenAI({ 
  apiKey: config.openai.apiKey || process.env.OPENAI_API_KEY 
});

/**
 * Generate notes from text
 * 
 * Uses OpenAI to generate structured study notes from text
 */
export async function generateNotesFromText(text: string, options: {
  format?: 'markdown' | 'html',
  style?: 'concise' | 'detailed',
  focusAreas?: string[]
} = {}) {
  try {
    const { format = 'markdown', style = 'concise', focusAreas = [] } = options;
    
    let prompt = `Generate ${style} study notes from the following text:\n\n${text}\n\n`;
    
    if (focusAreas.length > 0) {
      prompt += `Focus on these specific areas: ${focusAreas.join(', ')}\n\n`;
    }
    
    prompt += `Output format: ${format === 'markdown' ? 'Markdown' : 'HTML'}`;
    
    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.5,
      max_tokens: 2000
    });
    
    const content = response.choices[0].message.content || '';
    return {
      content,
      format
    };
  } catch (error) {
    console.error('Error generating notes from text:', error);
    throw new Error('Failed to generate notes');
  }
}

/**
 * Analyze code submission
 * 
 * Uses OpenAI to analyze code submissions and provide feedback
 */
export async function analyzeCodeSubmission(
  code: string,
  language: string,
  problemStatement: string
) {
  try {
    const prompt = `
You are a coding expert analyzing a submission for the following problem:

${problemStatement}

Here is the code in ${language}:

\`\`\`${language}
${code}
\`\`\`

Analyze this code and provide feedback in JSON format:
1. Correctness: Is the code likely to work? Are there any logical errors?
2. Efficiency: Analyze time and space complexity. Could it be optimized?
3. Code Style: Is the code well-structured and following best practices?
4. Potential Issues: Any edge cases or bugs that might occur?
5. Improvements: Specific suggestions to improve the solution.

Respond with a JSON object with these keys.
`;

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.3
    });
    
    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : { error: 'Empty response from OpenAI' };
  } catch (error) {
    console.error('Error analyzing code submission:', error);
    throw new Error('Failed to analyze code');
  }
}

/**
 * Generate interview questions
 * 
 * Uses OpenAI to generate mock interview questions
 */
export async function generateInterviewQuestions(
  topic: string,
  difficulty: string,
  count: number = 5
) {
  try {
    const prompt = `
Generate ${count} ${difficulty} level interview questions about ${topic}.

For each question, include:
1. The question itself
2. Expected answer
3. Follow-up questions or hints
4. Key points to look for in the response

Return the response as a JSON array of question objects.
`;

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    
    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : { error: 'Empty response from OpenAI' };
  } catch (error) {
    console.error('Error generating interview questions:', error);
    throw new Error('Failed to generate interview questions');
  }
}

/**
 * Generate MCQ questions
 * 
 * Uses OpenAI to generate multiple choice questions for tests
 */
export async function generateMCQQuestions(topic: string, count: number) {
  try {
    const prompt = `
Generate ${count} multiple-choice questions about ${topic}.

For each question:
1. Include the question text
2. Provide 4 options (A, B, C, D)
3. Indicate the correct answer
4. Include a brief explanation of why the answer is correct

Return the response as a JSON array of question objects with these properties:
- id: (number)
- text: (string) the question text
- options: (array) of 4 answer options
- correctAnswerId: (number) the index of the correct answer (0-3)
- explanation: (string) brief explanation of the correct answer
`;

    const response = await openai.chat.completions.create({
      model: config.openai.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.7
    });
    
    const content = response.choices[0].message.content;
    return content ? JSON.parse(content) : { error: 'Empty response from OpenAI' };
  } catch (error) {
    console.error('Error generating MCQ questions:', error);
    throw new Error('Failed to generate MCQ questions');
  }
}