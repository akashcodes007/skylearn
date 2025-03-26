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
  sessionStore: session.SessionStore;
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
  
  sessionStore: session.SessionStore;

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
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
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
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
  }
  
  async getUpcomingInterviews(userId: number): Promise<Interview[]> {
    const now = new Date();
    return Array.from(this.interviews.values())
      .filter((interview) => 
        interview.userId === userId && 
        interview.scheduledAt > now
      )
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime());
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
    
    // Sample coding problems
    await this.createCodingProblem({
      title: "Two Sum",
      description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
      difficulty: "Easy",
      tags: ["Arrays", "Hash Table"],
      testCases: JSON.parse(`[
        {"input": {"nums": [2, 7, 11, 15], "target": 9}, "output": [0, 1]},
        {"input": {"nums": [3, 2, 4], "target": 6}, "output": [1, 2]},
        {"input": {"nums": [3, 3], "target": 6}, "output": [0, 1]}
      ]`)
    });
    
    await this.createCodingProblem({
      title: "Valid Parentheses",
      description: "Given a string s containing just the characters '(', ')', '{', '}', '[' and ']', determine if the input string is valid.",
      difficulty: "Easy",
      tags: ["Stack", "String"],
      testCases: JSON.parse(`[
        {"input": {"s": "(){}"}, "output": true},
        {"input": {"s": "([)]"}, "output": false},
        {"input": {"s": "{[]}"}, "output": true}
      ]`)
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
