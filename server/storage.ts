import { 
  User, InsertUser, 
  Course, InsertCourse,
  Enrollment, InsertEnrollment,
  Note, InsertNote,
  CodingProblem, InsertCodingProblem,
  Interview, InsertInterview,
  Test, InsertTest,
  UserStats, InsertUserStats
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Modify the interface with CRUD methods needed
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Course operations
  getCourse(id: number): Promise<Course | undefined>;
  getCourses(): Promise<Course[]>;
  createCourse(course: InsertCourse): Promise<Course>;
  
  // Enrollment operations
  getEnrollment(id: number): Promise<Enrollment | undefined>;
  getEnrollmentsByUser(userId: number): Promise<Enrollment[]>;
  createEnrollment(enrollment: InsertEnrollment): Promise<Enrollment>;
  updateEnrollment(id: number, enrollment: Partial<Enrollment>): Promise<Enrollment | undefined>;
  
  // Note operations
  getNote(id: number): Promise<Note | undefined>;
  getNotesByUser(userId: number): Promise<Note[]>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  
  // Coding problem operations
  getCodingProblem(id: number): Promise<CodingProblem | undefined>;
  getCodingProblems(): Promise<CodingProblem[]>;
  createCodingProblem(problem: InsertCodingProblem): Promise<CodingProblem>;
  
  // Interview operations
  getInterview(id: number): Promise<Interview | undefined>;
  getInterviewsByUser(userId: number): Promise<Interview[]>;
  getUpcomingInterviews(userId: number): Promise<Interview[]>;
  createInterview(interview: InsertInterview): Promise<Interview>;
  updateInterview(id: number, interview: Partial<Interview>): Promise<Interview | undefined>;
  deleteInterview(id: number): Promise<boolean>;
  
  // Test operations
  getTest(id: number): Promise<Test | undefined>;
  getTests(): Promise<Test[]>;
  getUpcomingTests(): Promise<Test[]>;
  createTest(test: InsertTest): Promise<Test>;
  updateTest(id: number, test: Partial<Test>): Promise<Test | undefined>;
  
  // User stats operations
  getUserStats(userId: number): Promise<UserStats | undefined>;
  createUserStats(stats: InsertUserStats): Promise<UserStats>;
  updateUserStats(userId: number, stats: Partial<UserStats>): Promise<UserStats | undefined>;
  
  // Session store
  sessionStore: any; // Using 'any' temporarily to fix type errors
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private courses: Map<number, Course>;
  private enrollments: Map<number, Enrollment>;
  private notes: Map<number, Note>;
  private codingProblems: Map<number, CodingProblem>;
  private interviews: Map<number, Interview>;
  private tests: Map<number, Test>;
  private userStats: Map<number, UserStats>;
  
  private userIdCounter: number;
  private courseIdCounter: number;
  private enrollmentIdCounter: number;
  private noteIdCounter: number;
  private codingProblemIdCounter: number;
  private interviewIdCounter: number;
  private testIdCounter: number;
  private userStatsIdCounter: number;
  
  sessionStore: any; // Using 'any' temporarily to fix type errors

  constructor() {
    this.users = new Map();
    this.courses = new Map();
    this.enrollments = new Map();
    this.notes = new Map();
    this.codingProblems = new Map();
    this.interviews = new Map();
    this.tests = new Map();
    this.userStats = new Map();
    
    this.userIdCounter = 1;
    this.courseIdCounter = 1;
    this.enrollmentIdCounter = 1;
    this.noteIdCounter = 1;
    this.codingProblemIdCounter = 1;
    this.interviewIdCounter = 1;
    this.testIdCounter = 1;
    this.userStatsIdCounter = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000
    });
    
    // Initialize with sample data for development
    this.initializeSampleData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    
    // Create default user stats
    await this.createUserStats({
      userId: id,
      learningHours: 0,
      problemsSolved: 0,
      testsCompleted: 0,
      interviewsCompleted: 0
    });
    
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Course operations
  async getCourse(id: number): Promise<Course | undefined> {
    return this.courses.get(id);
  }
  
  async getCourses(): Promise<Course[]> {
    return Array.from(this.courses.values());
  }
  
  async createCourse(insertCourse: InsertCourse): Promise<Course> {
    const id = this.courseIdCounter++;
    const course: Course = { 
      ...insertCourse, 
      id, 
      createdAt: new Date() 
    };
    this.courses.set(id, course);
    return course;
  }

  // Enrollment operations
  async getEnrollment(id: number): Promise<Enrollment | undefined> {
    return this.enrollments.get(id);
  }
  
  async getEnrollmentsByUser(userId: number): Promise<Enrollment[]> {
    return Array.from(this.enrollments.values()).filter(
      (enrollment) => enrollment.userId === userId
    );
  }
  
  async createEnrollment(insertEnrollment: InsertEnrollment): Promise<Enrollment> {
    const id = this.enrollmentIdCounter++;
    const enrollment: Enrollment = { 
      ...insertEnrollment, 
      id, 
      enrolledAt: new Date() 
    };
    this.enrollments.set(id, enrollment);
    return enrollment;
  }
  
  async updateEnrollment(id: number, enrollmentData: Partial<Enrollment>): Promise<Enrollment | undefined> {
    const enrollment = await this.getEnrollment(id);
    if (!enrollment) return undefined;
    
    const updatedEnrollment = { ...enrollment, ...enrollmentData };
    this.enrollments.set(id, updatedEnrollment);
    return updatedEnrollment;
  }

  // Note operations
  async getNote(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }
  
  async getNotesByUser(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values())
      .filter((note) => note.userId === userId)
      .sort((a, b) => {
          const timeA = a.createdAt instanceof Date ? a.createdAt.getTime() : 0;
          const timeB = b.createdAt instanceof Date ? b.createdAt.getTime() : 0;
          return timeB - timeA;
      });
  }
  
  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteIdCounter++;
    const note: Note = { 
      ...insertNote, 
      id, 
      createdAt: new Date() 
    };
    this.notes.set(id, note);
    return note;
  }
  
  async updateNote(id: number, noteData: Partial<Note>): Promise<Note | undefined> {
    const note = await this.getNote(id);
    if (!note) return undefined;
    
    const updatedNote = { ...note, ...noteData };
    this.notes.set(id, updatedNote);
    return updatedNote;
  }
  
  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Coding problem operations
  async getCodingProblem(id: number): Promise<CodingProblem | undefined> {
    return this.codingProblems.get(id);
  }
  
  async getCodingProblems(): Promise<CodingProblem[]> {
    return Array.from(this.codingProblems.values());
  }
  
  async createCodingProblem(insertProblem: InsertCodingProblem): Promise<CodingProblem> {
    const id = this.codingProblemIdCounter++;
    const problem: CodingProblem = { 
      ...insertProblem, 
      id, 
      createdAt: new Date() 
    };
    this.codingProblems.set(id, problem);
    return problem;
  }

  // Interview operations
  async getInterview(id: number): Promise<Interview | undefined> {
    return this.interviews.get(id);
  }
  
  async getInterviewsByUser(userId: number): Promise<Interview[]> {
    return Array.from(this.interviews.values())
      .filter((interview) => interview.userId === userId)
      .sort((a, b) => {
          const timeA = a.scheduledAt instanceof Date ? a.scheduledAt.getTime() : 0;
          const timeB = b.scheduledAt instanceof Date ? b.scheduledAt.getTime() : 0;
          return timeA - timeB;
      });
  }
  
  async getUpcomingInterviews(userId: number): Promise<Interview[]> {
    const now = new Date();
    return Array.from(this.interviews.values())
      .filter((interview) => 
        interview.userId === userId && 
        interview.scheduledAt instanceof Date && interview.scheduledAt > now
      )
      .sort((a, b) => {
        const timeA = a.scheduledAt instanceof Date ? a.scheduledAt.getTime() : 0;
        const timeB = b.scheduledAt instanceof Date ? b.scheduledAt.getTime() : 0;
        return timeA - timeB;
      });
  }
  
  async createInterview(insertInterview: InsertInterview): Promise<Interview> {
    const id = this.interviewIdCounter++;
    const interview: Interview = { 
      ...insertInterview, 
      id, 
      createdAt: new Date() 
    };
    this.interviews.set(id, interview);
    return interview;
  }
  
  async updateInterview(id: number, interviewData: Partial<Interview>): Promise<Interview | undefined> {
    const interview = await this.getInterview(id);
    if (!interview) return undefined;
    
    const updatedInterview = { ...interview, ...interviewData };
    this.interviews.set(id, updatedInterview);
    return updatedInterview;
  }
  
  async deleteInterview(id: number): Promise<boolean> {
    return this.interviews.delete(id);
  }

  // Test operations
  async getTest(id: number): Promise<Test | undefined> {
    return this.tests.get(id);
  }
  
  async getTests(): Promise<Test[]> {
    return Array.from(this.tests.values());
  }
  
  async getUpcomingTests(): Promise<Test[]> {
    const now = new Date();
    return Array.from(this.tests.values())
      .filter((test) => test.scheduledAt && test.scheduledAt > now)
      .sort((a, b) => (a.scheduledAt?.getTime() || 0) - (b.scheduledAt?.getTime() || 0));
  }
  
  async createTest(insertTest: InsertTest): Promise<Test> {
    const id = this.testIdCounter++;
    const test: Test = { 
      ...insertTest, 
      id, 
      createdAt: new Date() 
    };
    this.tests.set(id, test);
    return test;
  }
  
  async updateTest(id: number, testData: Partial<Test>): Promise<Test | undefined> {
    const test = await this.getTest(id);
    if (!test) return undefined;
    
    const updatedTest = { ...test, ...testData };
    this.tests.set(id, updatedTest);
    return updatedTest;
  }

  // User stats operations
  async getUserStats(userId: number): Promise<UserStats | undefined> {
    return Array.from(this.userStats.values()).find(
      (stats) => stats.userId === userId
    );
  }
  
  async createUserStats(insertStats: InsertUserStats): Promise<UserStats> {
    const id = this.userStatsIdCounter++;
    const stats: UserStats = { 
      ...insertStats, 
      id, 
      lastUpdated: new Date() 
    };
    this.userStats.set(id, stats);
    return stats;
  }
  
  async updateUserStats(userId: number, statsData: Partial<UserStats>): Promise<UserStats | undefined> {
    const stats = await this.getUserStats(userId);
    if (!stats) return undefined;
    
    const updatedStats = { 
      ...stats, 
      ...statsData, 
      lastUpdated: new Date() 
    };
    this.userStats.set(stats.id, updatedStats);
    return updatedStats;
  }

  // Sample data initialization for development
  private async initializeSampleData() {
    // Sample courses
    const course1 = await this.createCourse({
      title: "Advanced Data Structures",
      description: "Master advanced data structures: graphs, trees and complex algorithms",
      level: "Intermediate",
      durationHours: 12,
      instructorId: 2, // Will be created later
      coverImage: "advanced-ds.jpg"
    });
    
    const course2 = await this.createCourse({
      title: "System Design Fundamentals",
      description: "Learn how to design scalable systems for millions of users",
      level: "Advanced",
      durationHours: 10,
      instructorId: 2,
      coverImage: "system-design.jpg"
    });
    
    const course3 = await this.createCourse({
      title: "Behavioral Interview Prep",
      description: "Master the art of answering behavioral questions in tech interviews",
      level: "Beginner",
      durationHours: 8,
      instructorId: 3, // Will be created later
      coverImage: "interview-prep.jpg"
    });
    
    // LeetCode-style coding problems with boilerplate code
    await this.createCodingProblem({
      title: "Two Sum",
      description: "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\nYou may assume that each input would have exactly one solution, and you may not use the same element twice.\n\nYou can return the answer in any order.",
      difficulty: "Easy",
      tags: ["Array", "Hash Table"],
      testCases: JSON.stringify([
        {
          id: 1,
          input: [{ name: "nums", value: [2, 7, 11, 15] }, { name: "target", value: 9 }],
          expectedOutput: [0, 1],
          explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."
        },
        {
          id: 2,
          input: [{ name: "nums", value: [3, 2, 4] }, { name: "target", value: 6 }],
          expectedOutput: [1, 2],
          explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."
        },
        {
          id: 3,
          input: [{ name: "nums", value: [3, 3] }, { name: "target", value: 6 }],
          expectedOutput: [0, 1],
          explanation: "Because nums[0] + nums[1] == 6, we return [0, 1]."
        }
      ]),
      boilerplateCode: JSON.stringify({
        python: "def twoSum(nums, target):\n    \"\"\"  \n    :type nums: List[int]\n    :type target: int\n    :rtype: List[int]\n    \"\"\"\n    # Your code here\n    ",
        javascript: "/**\n * @param {number[]} nums\n * @param {number} target\n * @return {number[]}\n */\nvar twoSum = function(nums, target) {\n    // Your code here\n    \n};",
        java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Your code here\n        \n    }\n}",
        cpp: "#include <vector>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        // Your code here\n        \n    }\n};"
      }),
      solutionCode: JSON.stringify({
        python: "def twoSum(nums, target):\n    seen = {}\n    for i, value in enumerate(nums):\n        remaining = target - value\n        if remaining in seen:\n            return [seen[remaining], i]\n        seen[value] = i\n    return []",
        javascript: "var twoSum = function(nums, target) {\n    const seen = {};\n    for (let i = 0; i < nums.length; i++) {\n        const remaining = target - nums[i];\n        if (remaining in seen) {\n            return [seen[remaining], i];\n        }\n        seen[nums[i]] = i;\n    }\n    return [];\n};",
        java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        Map<Integer, Integer> map = new HashMap<>();\n        for (int i = 0; i < nums.length; i++) {\n            int complement = target - nums[i];\n            if (map.containsKey(complement)) {\n                return new int[] { map.get(complement), i };\n            }\n            map.put(nums[i], i);\n        }\n        return new int[0];\n    }\n}",
        cpp: "#include <vector>\n#include <unordered_map>\n\nclass Solution {\npublic:\n    std::vector<int> twoSum(std::vector<int>& nums, int target) {\n        std::unordered_map<int, int> seen;\n        for (int i = 0; i < nums.size(); i++) {\n            int complement = target - nums[i];\n            if (seen.count(complement)) {\n                return {seen[complement], i};\n            }\n            seen[nums[i]] = i;\n        }\n        return {};\n    }\n};"
      })
    });
    
    await this.createCodingProblem({
      title: "Valid Palindrome",
      description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.\n\nGiven a string s, return true if it is a palindrome, or false otherwise.",
      difficulty: "Easy",
      tags: ["String", "Two Pointers"],
      testCases: JSON.stringify([
        {
          id: 1,
          input: [{ name: "s", value: "A man, a plan, a canal: Panama" }],
          expectedOutput: true,
          explanation: "After removing non-alphanumeric characters and converting to lowercase, the string becomes 'amanaplanacanalpanama', which is a palindrome."
        },
        {
          id: 2,
          input: [{ name: "s", value: "race a car" }],
          expectedOutput: false,
          explanation: "After removing non-alphanumeric characters and converting to lowercase, the string becomes 'raceacar', which is not a palindrome."
        },
        {
          id: 3,
          input: [{ name: "s", value: " " }],
          expectedOutput: true,
          explanation: "After removing non-alphanumeric characters, the string becomes '', which is a palindrome."
        }
      ]),
      boilerplateCode: JSON.stringify({
        python: "def isPalindrome(s):\n    \"\"\"\n    :type s: str\n    :rtype: bool\n    \"\"\"\n    # Your code here\n    ",
        javascript: "/**\n * @param {string} s\n * @return {boolean}\n */\nvar isPalindrome = function(s) {\n    // Your code here\n    \n};",
        java: "class Solution {\n    public boolean isPalindrome(String s) {\n        // Your code here\n        \n    }\n}",
        cpp: "class Solution {\npublic:\n    bool isPalindrome(string s) {\n        // Your code here\n        \n    }\n};"
      }),
      solutionCode: JSON.stringify({
        python: "def isPalindrome(s):\n    # Convert to lowercase and keep only alphanumeric characters\n    s = ''.join(c for c in s.lower() if c.isalnum())\n    # Check if the string equals its reverse\n    return s == s[::-1]",
        javascript: "var isPalindrome = function(s) {\n    // Convert to lowercase and keep only alphanumeric characters\n    s = s.toLowerCase().replace(/[^a-z0-9]/g, '');\n    // Check if the string equals its reverse\n    return s === s.split('').reverse().join('');\n};",
        java: "class Solution {\n    public boolean isPalindrome(String s) {\n        // Convert to lowercase and keep only alphanumeric characters\n        String filtered = s.toLowerCase().replaceAll(\"[^a-z0-9]\", \"\");\n        // Check if the string equals its reverse\n        String reversed = new StringBuilder(filtered).reverse().toString();\n        return filtered.equals(reversed);\n    }\n}",
        cpp: "class Solution {\npublic:\n    bool isPalindrome(string s) {\n        string filtered;\n        // Convert to lowercase and keep only alphanumeric characters\n        for (char c : s) {\n            if (isalnum(c)) {\n                filtered += tolower(c);\n            }\n        }\n        // Check if the string equals its reverse\n        string reversed = filtered;\n        reverse(reversed.begin(), reversed.end());\n        return filtered == reversed;\n    }\n};"
      })
    });
    
    await this.createCodingProblem({
      title: "Maximum Subarray",
      description: "Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.\n\nA subarray is a contiguous part of an array.",
      difficulty: "Medium",
      tags: ["Array", "Divide and Conquer", "Dynamic Programming"],
      testCases: JSON.stringify([
        {
          id: 1,
          input: [{ name: "nums", value: [-2, 1, -3, 4, -1, 2, 1, -5, 4] }],
          expectedOutput: 6,
          explanation: "The subarray [4,-1,2,1] has the largest sum 6."
        },
        {
          id: 2,
          input: [{ name: "nums", value: [1] }],
          expectedOutput: 1,
          explanation: "The subarray [1] has the largest sum 1."
        },
        {
          id: 3,
          input: [{ name: "nums", value: [5, 4, -1, 7, 8] }],
          expectedOutput: 23,
          explanation: "The subarray [5,4,-1,7,8] has the largest sum 23."
        }
      ]),
      boilerplateCode: JSON.stringify({
        python: "def maxSubArray(nums):\n    \"\"\"\n    :type nums: List[int]\n    :rtype: int\n    \"\"\"\n    # Your code here\n    ",
        javascript: "/**\n * @param {number[]} nums\n * @return {number}\n */\nvar maxSubArray = function(nums) {\n    // Your code here\n    \n};",
        java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        // Your code here\n        \n    }\n}",
        cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Your code here\n        \n    }\n};"
      }),
      solutionCode: JSON.stringify({
        python: "def maxSubArray(nums):\n    # Kadane's algorithm\n    max_so_far = nums[0]\n    max_ending_here = nums[0]\n    \n    for i in range(1, len(nums)):\n        max_ending_here = max(nums[i], max_ending_here + nums[i])\n        max_so_far = max(max_so_far, max_ending_here)\n        \n    return max_so_far",
        javascript: "var maxSubArray = function(nums) {\n    // Kadane's algorithm\n    let maxSoFar = nums[0];\n    let maxEndingHere = nums[0];\n    \n    for (let i = 1; i < nums.length; i++) {\n        maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);\n        maxSoFar = Math.max(maxSoFar, maxEndingHere);\n    }\n    \n    return maxSoFar;\n};",
        java: "class Solution {\n    public int maxSubArray(int[] nums) {\n        // Kadane's algorithm\n        int maxSoFar = nums[0];\n        int maxEndingHere = nums[0];\n        \n        for (int i = 1; i < nums.length; i++) {\n            maxEndingHere = Math.max(nums[i], maxEndingHere + nums[i]);\n            maxSoFar = Math.max(maxSoFar, maxEndingHere);\n        }\n        \n        return maxSoFar;\n    }\n}",
        cpp: "class Solution {\npublic:\n    int maxSubArray(vector<int>& nums) {\n        // Kadane's algorithm\n        int maxSoFar = nums[0];\n        int maxEndingHere = nums[0];\n        \n        for (int i = 1; i < nums.size(); i++) {\n            maxEndingHere = max(nums[i], maxEndingHere + nums[i]);\n            maxSoFar = max(maxSoFar, maxEndingHere);\n        }\n        \n        return maxSoFar;\n    }\n};"
      })
    });
    
    // Sample tests
    await this.createTest({
      title: "Data Structures Weekly Quiz",
      description: "Weekly assessment on data structures concepts",
      type: "MCQ",
      durationMinutes: 45,
      questions: JSON.parse(`[
        {"question": "Which data structure follows LIFO principle?", "options": ["Queue", "Stack", "Linked List", "Array"], "answer": 1},
        {"question": "What is the time complexity of binary search?", "options": ["O(1)", "O(n)", "O(log n)", "O(n log n)"], "answer": 2}
      ]`),
      scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
    });
    
    await this.createTest({
      title: "Algorithms Coding Challenge",
      description: "Coding assessment on algorithm implementation",
      type: "Coding",
      durationMinutes: 90,
      questions: JSON.parse(`[
        {"question": "Implement a function to find the maximum subarray sum", "testCases": [{"input": [-2,1,-3,4,-1,2,1,-5,4], "output": 6}]},
        {"question": "Implement a function to reverse a linked list", "testCases": [{"input": [1,2,3,4,5], "output": [5,4,3,2,1]}]}
      ]`),
      scheduledAt: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000) // In 4 days
    });
  }
}

export const storage = new MemStorage();
