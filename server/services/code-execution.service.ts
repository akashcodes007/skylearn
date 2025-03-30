import { exec, ExecOptions } from 'child_process';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { promisify } from 'util';
import config from '../config/config';
import { analyzeCodeSubmission } from '../openai';

const execAsync = promisify(exec);

// Define supported languages
export const SUPPORTED_LANGUAGES = ['javascript', 'python', 'java', 'cpp'];

// Define language specific file extensions
const FILE_EXTENSIONS: Record<string, string> = {
  javascript: 'js',
  python: 'py',
  java: 'java',
  cpp: 'cpp'
};

// Define command templates for each language
const EXECUTION_COMMANDS: Record<string, string> = {
  javascript: 'node {file}',
  python: 'python3 {file}',
  java: 'javac {file} && java {className}',
  cpp: 'g++ {file} -o {executable} && ./{executable}'
};

// Define timeout for code execution (ms)
const EXECUTION_TIMEOUT = config.codeExecution.timeout;

/**
 * Code Execution Service
 * 
 * Provides methods for executing code
 */
export class CodeExecutionService {
  /**
   * Execute code and return the result
   */
  static async executeCode(
    code: string,
    language: string,
    input?: string
  ): Promise<{ output: string; error?: string }> {
    // Validate language
    if (!SUPPORTED_LANGUAGES.includes(language)) {
      throw new Error(`Unsupported language: ${language}`);
    }

    // Create a temporary directory for the code
    const tempDir = join('/tmp', 'code-execution', Date.now().toString());
    await mkdir(tempDir, { recursive: true });

    // Determine file name and path
    const fileExt = FILE_EXTENSIONS[language];
    const fileName = `solution.${fileExt}`;
    const filePath = join(tempDir, fileName);

    try {
      // Write code to file
      await writeFile(filePath, code);

      // Prepare execution command
      let command = EXECUTION_COMMANDS[language]
        .replace('{file}', filePath)
        .replace('{className}', 'Solution')
        .replace('{executable}', join(tempDir, 'solution'));

      // Execute code with timeout
      const options: ExecOptions = {
        timeout: EXECUTION_TIMEOUT
      };
      
      // If input is provided, we'll need to handle it separately
      // (input is not a valid option for execAsync)
      const { stdout, stderr } = await execAsync(command, options);

      return {
        output: stdout,
        error: stderr || undefined
      };
    } catch (error) {
      return {
        output: '',
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }

  /**
   * Test code against test cases
   */
  static async testCode(
    code: string,
    language: string,
    testCases: any[]
  ): Promise<{ passed: boolean; results: any[] }> {
    // Parse test cases if they're a string
    const parsedTestCases = typeof testCases === 'string'
      ? JSON.parse(testCases)
      : testCases;

    // Track results
    const results = [];
    let allPassed = true;

    // Run each test case
    for (const testCase of parsedTestCases) {
      try {
        // Format input based on language
        const formattedInput = this.formatTestInput(testCase.input, language);
        
        // Execute code with test input
        const { output, error } = await this.executeCode(code, language, formattedInput);
        
        if (error) {
          results.push({
            ...testCase,
            passed: false,
            error,
            actualOutput: null
          });
          allPassed = false;
          continue;
        }
        
        // Parse output and compare with expected output
        const parsedOutput = this.parseOutput(output, language);
        const passed = this.compareOutputs(parsedOutput, testCase.expectedOutput);
        
        results.push({
          ...testCase,
          passed,
          actualOutput: parsedOutput,
          error: undefined
        });
        
        if (!passed) {
          allPassed = false;
        }
      } catch (error) {
        results.push({
          ...testCase,
          passed: false,
          error: error instanceof Error ? error.message : String(error),
          actualOutput: null
        });
        allPassed = false;
      }
    }

    return {
      passed: allPassed,
      results
    };
  }

  /**
   * Analyze code using OpenAI
   */
  static async analyzeCode(
    code: string,
    language: string,
    problemStatement: string
  ): Promise<any> {
    return analyzeCodeSubmission(code, language, problemStatement);
  }

  /**
   * Format test input based on language
   */
  private static formatTestInput(input: any, language: string): string {
    // Convert input to string in language-specific format
    switch (language) {
      case 'javascript':
        return JSON.stringify(input);
      case 'python':
        return JSON.stringify(input);
      case 'java':
      case 'cpp':
        return JSON.stringify(input);
      default:
        return JSON.stringify(input);
    }
  }

  /**
   * Parse output from execution
   */
  private static parseOutput(output: string, language: string): any {
    // Try to parse output as JSON, fallback to string
    try {
      return JSON.parse(output.trim());
    } catch (e) {
      return output.trim();
    }
  }

  /**
   * Compare actual output with expected output
   */
  private static compareOutputs(actual: any, expected: any): boolean {
    // Handle array outputs
    if (Array.isArray(actual) && Array.isArray(expected)) {
      if (actual.length !== expected.length) return false;
      return actual.every((val, idx) => this.compareOutputs(val, expected[idx]));
    }
    
    // Handle object outputs
    if (typeof actual === 'object' && actual !== null && 
        typeof expected === 'object' && expected !== null) {
      const actualKeys = Object.keys(actual);
      const expectedKeys = Object.keys(expected);
      if (actualKeys.length !== expectedKeys.length) return false;
      return actualKeys.every(key => this.compareOutputs(actual[key], expected[key]));
    }
    
    // Handle primitive outputs
    return actual === expected;
  }
}