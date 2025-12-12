import { Injectable, Logger } from '@nestjs/common';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { ChatRequestDto } from './dtos/req/chat.dto';
import { ChatResponseDto } from './dtos/res/chat-response.dto';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY is not configured');
      throw new Error(
        'GEMINI_API_KEY is not configured in environment variables',
      );
    }
    this.genAI = new GoogleGenerativeAI(apiKey);

    // Khởi tạo model với system instruction
    // Sử dụng gemini-2.5-flash - nhanh, ổn định và có sẵn
    this.model = this.genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: `You are 'Gem', a friendly AI tutor for elementary students (grades 1-5) learning English.

LANGUAGE RULES:
- Reply in the SAME language as the user's question
- Keep responses SHORT (1-2 sentences max)
- Use simple, encouraging language
- NO emojis in responses

TRANSLATION RULES:
- Reply with ONLY the translated word
- DO NOT add anything else
- DO NOT explain or apologize

Correct examples:
Q: "Cat nghia la gi?" -> A: "con meo"
Q: "Con meo tieng Anh?" -> A: "cat"
Q: "dog la gi?" -> A: "con cho"

Wrong examples - DO NOT DO:
"Cat tieng Viet la con meo"
"cat: con meo"
"Xin loi, toi..."

SYSTEM QUERY RULES:
- I will provide database data in the conversation
- You MUST use the EXACT data provided, do NOT make up information
- When I provide "User's name: X", reply using X directly (not "User")
- When I provide statistics, report them accurately
- Be concise and natural: "You learned 5 words", "Bạn đã học 3 bài"
- IMPORTANT: "exercises" = "bài tập" or "bài luyện tập" (NOT "bài học")`,
    });

    this.logger.log('ChatService initialized with gemini-2.0-flash');
    this.logger.warn(
      'IMPORTANT: Your API key cannot access models via v1beta API. Please get a new API key from https://aistudio.google.com/app/apikey',
    );
  }

  // ============ DATABASE QUERY METHODS ============

  /**
   * Get user's lesson completion statistics
   */
  private async getUserLessonProgress(userId: number) {
    const totalAttempts = await this.prisma.attempt.count({
      where: { userId },
    });

    const completedLessons = await this.prisma.attempt.count({
      where: {
        userId,
        isCompleted: true,
      },
    });

    const totalLessons = await this.prisma.lesson.count({
      where: { status: 'PUBLISHED' },
    });

    return {
      completedLessons,
      totalLessons,
      totalAttempts,
    };
  }

  /**
   * Get topic/unit information
   */
  private async getTopicInfo(topicId: number, userId: number) {
    const topic = await this.prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        lessons: {
          where: { status: 'PUBLISHED' },
        },
      },
    });

    if (!topic) return null;

    // Count completed lessons in this topic
    const completedInTopic = await this.prisma.attempt.count({
      where: {
        userId,
        isCompleted: true,
        lesson: {
          topicId,
        },
      },
    });

    return {
      id: topic.id,
      title: topic.title,
      description: topic.description,
      totalLessons: topic.lessons.length,
      completedLessons: completedInTopic,
      grade: topic.grade,
    };
  }

  /**
   * Get user's overall statistics
   */
  private async getUserStats(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        xp: true,
        streakDays: true,
        grade: true,
      },
    });

    return user;
  }

  /**
   * Get all topics/units for user's grade
   */
  private async getTopicsByGrade(grade: string) {
    const topics = await this.prisma.topic.findMany({
      where: {
        grade: grade as any, // Type cast since grade comes from User table
        isActive: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        lessons: {
          where: { status: 'PUBLISHED' },
          select: { id: true },
        },
      },
    });

    return topics.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      lessonCount: t.lessons.length,
    }));
  }

  /**
   * Get sentences from a specific topic
   */
  private async getSentencesByTopic(topicId: number) {
    const sentences = await this.prisma.sentenceImage.findMany({
      where: { topicId },
      include: {
        sentences: {
          where: { isActive: true },
          select: {
            id: true,
            text: true,
            meaningVi: true,
            order: true,
          },
          orderBy: { order: 'asc' },
        },
      },
      orderBy: { order: 'asc' },
    });

    return sentences.flatMap((si) =>
      si.sentences.map((s) => ({
        text: s.text,
        meaningVi: s.meaningVi,
      })),
    );
  }

  /**
   * Get flashcards (vocabulary) from a specific topic
   */
  private async getFlashcardsByTopic(topicId: number) {
    const flashcards = await this.prisma.flashcard.findMany({
      where: {
        topicId,
        isActive: true,
      },
      select: {
        id: true,
        term: true,
        phonetic: true,
        meaningVi: true,
        order: true,
      },
      orderBy: { order: 'asc' },
    });

    return flashcards.map((f) => ({
      term: f.term,
      phonetic: f.phonetic,
      meaningVi: f.meaningVi,
    }));
  }

  /**
   * Get user's learning progress for a specific topic
   */
  private async getUserProgressByTopic(userId: number, topicId: number) {
    // Get flashcard progress
    const flashcardProgress = await this.prisma.learningProgress.findMany({
      where: {
        userId,
        contentType: 'FLASHCARD',
        flashcard: {
          topicId,
        },
      },
      include: {
        flashcard: {
          select: {
            term: true,
            meaningVi: true,
          },
        },
      },
    });

    // Get sentence progress
    const sentenceProgress = await this.prisma.learningProgress.findMany({
      where: {
        userId,
        contentType: 'SENTENCE',
        sentence: {
          sentenceImage: {
            topicId,
          },
        },
      },
      include: {
        sentence: {
          select: {
            text: true,
            meaningVi: true,
          },
        },
      },
    });

    return {
      flashcards: flashcardProgress,
      sentences: sentenceProgress,
      totalFlashcards: flashcardProgress.length,
      totalSentences: sentenceProgress.length,
      masteredFlashcards: flashcardProgress.filter((p) => p.isMastered).length,
      masteredSentences: sentenceProgress.filter((p) => p.isMastered).length,
    };
  }

  // ============ INTENT DETECTION ============

  /**
   * Detect if user is asking a system query
   */
  private isSystemQuery(message: string): boolean {
    const systemPatterns = [
      // Vietnamese patterns - Learning progress
      /học (được )?bao nhiêu (từ|câu)/i,
      /đã học (được )?bao nhiêu/i,
      /học (được )?\d+ từ/i,
      /tiến độ (của )?(tôi|mình)/i,
      /đã master (được )?bao nhiêu/i,
      /hoàn thành (được )?bao nhiêu (từ|câu|bài)/i,

      // Vietnamese patterns - General
      /học (được )?bao nhiêu bài/i,
      /có bao nhiêu bài/i,
      /có bao nhiêu (unit|topic|chủ đề)/i,
      /bao nhiêu (unit|topic|chủ đề)/i,
      /unit .+ (học về|về) (cái )?gì/i,
      /unit .+ (có )?(là )?gì/i,
      /unit .+ (có|gồm) (những )?câu (nào|gì)/i,
      /unit .+ (có )?mấy câu/i, // "unit 9 có mấy câu"
      /unit .+ (có|gồm) (những )?sentence/i,
      /unit .+ (có|gồm) (những )?(từ vựng|từ|flashcard|vocabulary)/i,
      /unit .+ (có )?mấy (từ vựng|từ|flashcard)/i, // "unit 9 có mấy từ vựng"
      /unit .+ (có )?mấy bài (tập|luyện tập)/i, // "unit 9 có mấy bài tập"
      /(hoàn thành|đã làm|đã học) mấy bài (tập|luyện tập).*(unit|topic)/i, // "hoàn thành mấy bài tập trong unit 10"
      /còn mấy bài (tập|luyện tập).*(chưa|không)/i, // "còn mấy bài tập chưa hoàn thành"

      // Exercise performance/score queries
      /(dạng )?bài (tập|luyện tập) nào.*(điểm|cao|thấp|tốt|kém)/i, // "bài tập nào tôi đạt điểm cao nhất"
      /(dạng )?bài (tập|luyện tập).*(nhiều|ít) điểm/i, // "dạng bài tập nào tôi đạt nhiều điểm nhất"
      /đạt điểm.*bài (tập|luyện tập)/i, // "đạt điểm cao nhất ở bài tập nào"

      /(các )?câu (trong|ở) unit/i,
      /sentences? (trong|ở|của) unit/i,
      /(các )?(từ vựng|từ|flashcard|vocabulary) (trong|ở|của) unit/i,

      // Statistics
      /(xp|điểm) của (tôi|mình)/i,
      /streak (của )?(tôi|mình)/i,
      /đã học unit nào/i,
      /unit nào (đã|rồi) học/i,
      /unit nào (chưa|chưa) học/i,
      /unit nào (tôi|mình) (đã|chưa) học/i,
      /which units? (have I )?(learned|completed)/i,
      /which units? (haven't I|not) (learned|completed)/i,
      /unit nào (dễ|khó) nhất/i,
      /unit nào (chưa )?hoàn thành/i,

      // Personal info
      /tên (tôi|mình) là gì/i,
      /tuổi (tôi|mình)/i,
      /lớp (tôi|mình)/i,

      // English patterns - Learning progress
      /how many (words|sentences) (have I )?learned/i,
      /how many (words|sentences) mastered/i,
      /my (learning )?progress/i,

      // English patterns - General
      /how many lessons (have I|did I)/i,
      /how many (lessons|units)/i,
      /what is unit .+ about/i,
      /what sentences? in unit/i,
      /sentences? in unit/i,
      /unit .+ sentences?/i,
      /what (vocabulary|words|flashcards?) in unit/i,
      /(vocabulary|words|flashcards?) in unit/i,
      /unit .+ (vocabulary|words|flashcards?)/i,

      // Statistics
      /my (xp|points|score)/i,
      /my streak/i,
      /my name/i,
      /my age/i,
      /my grade/i,
      /which unit.+(easiest|hardest)/i,
      /incomplete units/i,
    ];

    return systemPatterns.some((pattern) => pattern.test(message.trim()));
  }

  /**
   * Fetch relevant system data based on user query
   */
  private async fetchSystemData(
    userId: number,
    message: string,
  ): Promise<string> {
    const msg = message.toLowerCase();
    let contextData = '';

    // ALWAYS include user's name for personalization
    const userForName = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });
    if (userForName?.name) {
      contextData += `User's name: ${userForName.name}\n\n`;
    }

    // Get user stats for most queries
    const stats = await this.getUserStats(userId);
    if (!stats) return '';

    // ========== PERSONAL INFO QUERIES (must check first) ==========

    // Name query
    if (msg.includes('tên') || msg.includes('name')) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
      });
      if (user?.name) {
        contextData += `User's name: ${user.name}\n`;
      }
    }

    // Age query
    if (msg.includes('tuổi') || msg.includes('age')) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { dob: true },
      });
      if (user?.dob) {
        const age = new Date().getFullYear() - new Date(user.dob).getFullYear();
        contextData += `User's age: ${age} years old\n`;
      }
    }

    // Grade query
    if (msg.includes('lớp') || msg.includes('grade')) {
      contextData += `User's grade: ${stats.grade}\n`;
    }

    // XP query
    if (msg.includes('xp') || msg.includes('điểm')) {
      contextData += `User's XP: ${stats.xp}\n`;
    }

    // Streak query
    if (msg.includes('streak') || msg.includes('chuỗi')) {
      contextData += `User's streak: ${stats.streakDays} days\n`;
    }

    // General learning progress query (without unit specification)
    if (
      msg.includes('học') &&
      (msg.includes('bao nhiêu') || msg.includes('how many')) &&
      (msg.includes('từ') ||
        msg.includes('câu') ||
        msg.includes('word') ||
        msg.includes('sentence')) &&
      !msg.includes('unit')
    ) {
      // Query total learning progress across all topics in user's grade
      const userGradeTopics = await this.prisma.topic.findMany({
        where: { grade: stats.grade },
        select: { id: true },
      });

      const topicIds = userGradeTopics.map((t) => t.id);

      if (msg.includes('từ') || msg.includes('word')) {
        const totalWords = await this.prisma.learningProgress.count({
          where: {
            userId,
            contentType: 'FLASHCARD',
            flashcard: {
              topicId: { in: topicIds },
            },
          },
        });

        const masteredWords = await this.prisma.learningProgress.count({
          where: {
            userId,
            contentType: 'FLASHCARD',
            isMastered: true,
            flashcard: {
              topicId: { in: topicIds },
            },
          },
        });

        contextData += `\nTotal Learning Progress:\n`;
        contextData += `- Learned ${totalWords} words\n`;
        contextData += `- Mastered ${masteredWords} words\n`;
      }

      if (msg.includes('câu') || msg.includes('sentence')) {
        const totalSentences = await this.prisma.learningProgress.count({
          where: {
            userId,
            contentType: 'SENTENCE',
            sentence: {
              sentenceImage: {
                topicId: { in: topicIds },
              },
            },
          },
        });

        const masteredSentences = await this.prisma.learningProgress.count({
          where: {
            userId,
            contentType: 'SENTENCE',
            isMastered: true,
            sentence: {
              sentenceImage: {
                topicId: { in: topicIds },
              },
            },
          },
        });

        contextData += `\nTotal Sentence Progress:\n`;
        contextData += `- Learned ${totalSentences} sentences\n`;
        contextData += `- Mastered ${masteredSentences} sentences\n`;
      }
    }

    // Lesson progress query
    if (
      msg.includes('bao nhiêu bài') ||
      msg.includes('how many lessons') ||
      (msg.includes('tiến độ') &&
        !msg.includes('từ') &&
        !msg.includes('câu')) ||
      (msg.includes('progress') &&
        !msg.includes('word') &&
        !msg.includes('sentence'))
    ) {
      const progress = await this.getUserLessonProgress(userId);
      contextData += `Completed exercises: ${progress.completedLessons} out of ${progress.totalLessons}\n`;
      contextData += `Total attempts: ${progress.totalAttempts}\n`;
    }

    // Exercise completion in specific unit
    const exerciseMatch = msg.match(/unit (\d+|[a-z]+)/i);
    const isExerciseQuery =
      (msg.includes('hoàn thành') ||
        msg.includes('đã làm') ||
        msg.includes('còn')) &&
      (msg.includes('bài tập') || msg.includes('bài luyện tập'));

    if (exerciseMatch && isExerciseQuery) {
      const unitId = exerciseMatch[1].toLowerCase();

      // Find topic by title containing unit number
      const topic = await this.prisma.topic.findFirst({
        where: {
          title: { contains: unitId, mode: 'insensitive' },
          grade: stats.grade,
        },
        select: {
          id: true,
          title: true,
          lessons: {
            select: { id: true },
          },
        },
      });

      if (topic) {
        const totalExercises = topic.lessons.length;

        // Count completed exercises
        const completedCount = await this.prisma.attempt.count({
          where: {
            userId,
            isCompleted: true,
            lesson: { topicId: topic.id },
          },
        });

        const remaining = totalExercises - completedCount;

        contextData += `\nExercise Progress for ${topic.title}:\n`;
        contextData += `- Completed: ${completedCount} exercises\n`;
        contextData += `- Remaining: ${remaining} exercises\n`;
        contextData += `- Total: ${totalExercises} exercises\n`;
      }
    }
    // General exercise completion (all units)
    else if (isExerciseQuery && !exerciseMatch) {
      // Get all topics in user's grade
      const allTopics = await this.prisma.topic.findMany({
        where: { grade: stats.grade, isActive: true },
        select: {
          id: true,
          lessons: { select: { id: true } },
        },
      });

      const totalExercises = allTopics.reduce(
        (sum, t) => sum + t.lessons.length,
        0,
      );

      // Count all completed exercises
      const topicIds = allTopics.map((t) => t.id);
      const completedCount = await this.prisma.attempt.count({
        where: {
          userId,
          isCompleted: true,
          lesson: { topicId: { in: topicIds } },
        },
      });

      const remaining = totalExercises - completedCount;

      contextData += `\nOverall Exercise Progress:\n`;
      contextData += `- Completed: ${completedCount} exercises\n`;
      contextData += `- Remaining: ${remaining} exercises\n`;
      contextData += `- Total: ${totalExercises} exercises in grade ${stats.grade}\n`;
    }

    // Exercise performance/score queries
    const isTypeScoreQuery =
      msg.includes('dạng') &&
      msg.includes('điểm') &&
      (msg.includes('cao') ||
        msg.includes('thấp') ||
        msg.includes('nhiều') ||
        msg.includes('ít')) &&
      msg.includes('bài tập');

    const isLessonScoreQuery =
      !msg.includes('dạng') &&
      (msg.includes('bài tập') || msg.includes('bài luyện tập')) &&
      msg.includes('điểm') &&
      (msg.includes('cao') ||
        msg.includes('thấp') ||
        msg.includes('nhiều') ||
        msg.includes('ít'));

    // Query for specific lesson with highest/lowest score
    if (isLessonScoreQuery) {
      const isHighest =
        msg.includes('cao') || msg.includes('nhiều') || msg.includes('tốt');

      const attempt = await this.prisma.attempt.findFirst({
        where: {
          userId,
          isCompleted: true,
          lesson: {
            topic: {
              grade: stats.grade, // ✅ FILTER BY USER'S GRADE
            },
          },
        },
        include: {
          lesson: {
            include: {
              topic: { select: { title: true } },
            },
          },
        },
        orderBy: {
          totalScore: isHighest ? 'desc' : 'asc',
        },
      });

      if (attempt) {
        contextData += `\n${isHighest ? 'Highest' : 'Lowest'} Scoring Lesson:\n`;
        contextData += `- Lesson: ${attempt.lesson.title}\n`;
        contextData += `- Unit: ${attempt.lesson.topic.title}\n`;
        contextData += `- Score: ${attempt.totalScore} points\n`;
      }
    }
    // Query for exercise type with highest/lowest avg score
    else if (isTypeScoreQuery) {
      // Get all attempts with exercise type info
      const attempts = await this.prisma.attempt.findMany({
        where: {
          userId,
          isCompleted: true,
        },
        include: {
          lesson: {
            include: {
              exercises: {
                select: { type: true },
              },
            },
          },
        },
      });

      // Group by exercise type and calculate average scores
      const typeScores = new Map<string, { total: number; count: number }>();

      attempts.forEach((attempt) => {
        attempt.lesson.exercises.forEach((ex) => {
          const type = ex.type;
          const current = typeScores.get(type) || { total: 0, count: 0 };
          typeScores.set(type, {
            total: current.total + attempt.totalScore,
            count: current.count + 1,
          });
        });
      });

      // Calculate averages and sort
      const avgScores = Array.from(typeScores.entries()).map(
        ([type, data]) => ({
          type,
          avgScore: data.total / data.count,
          count: data.count,
        }),
      );

      avgScores.sort((a, b) => b.avgScore - a.avgScore);

      if (avgScores.length > 0) {
        const highest = avgScores[0];
        const lowest = avgScores[avgScores.length - 1];

        contextData += `\nExercise Performance by Type:\n`;
        contextData += `- Highest: ${highest.type} (avg ${highest.avgScore.toFixed(1)} points, ${highest.count} attempts)\n`;
        if (avgScores.length > 1) {
          contextData += `- Lowest: ${lowest.type} (avg ${lowest.avgScore.toFixed(1)} points, ${lowest.count} attempts)\n`;
        }
      }
    }

    // Unit/Topic count query
    if (
      (msg.includes('bao nhiêu') &&
        (msg.includes('unit') ||
          msg.includes('topic') ||
          msg.includes('chủ đề'))) ||
      (msg.includes('how many') &&
        (msg.includes('unit') || msg.includes('topic')))
    ) {
      const topics = await this.prisma.topic.findMany({
        where: {
          grade: stats.grade,
          isActive: true,
        },
      });
      contextData += `\nTotal units in grade ${stats.grade}: ${topics.length}\n`;
    }

    // Vocabulary/Flashcard query
    if (
      msg.includes('từ vựng') ||
      msg.includes('từ') ||
      msg.includes('flashcard') ||
      msg.includes('vocabulary') ||
      msg.includes('word')
    ) {
      // Extract topic/unit name or number
      const unitMatch = msg.match(/unit\s+(\d+|[a-z\s]+)/i);
      if (unitMatch) {
        const unitIdentifier = unitMatch[1].trim();

        // Try to find topic by ID or title (FILTER BY USER'S GRADE)
        let topic = null;
        if (/^\d+$/.test(unitIdentifier)) {
          topic = await this.prisma.topic.findFirst({
            where: {
              id: parseInt(unitIdentifier),
              grade: stats.grade, // FILTER BY GRADE
            },
          });
        } else {
          topic = await this.prisma.topic.findFirst({
            where: {
              title: {
                contains: unitIdentifier,
                mode: 'insensitive',
              },
              grade: stats.grade, // FILTER BY GRADE
            },
          });
        }

        if (topic) {
          // Check if asking about learned words or all words
          const isLearnedQuery =
            msg.includes('đã học') ||
            msg.includes('học được') ||
            msg.includes('learned') ||
            msg.includes('mastered');

          if (isLearnedQuery) {
            // Show user's learning progress
            const progress = await this.getUserProgressByTopic(
              userId,
              topic.id,
            );
            contextData += `\nLearning Progress for Unit ${topic.title}:\n`;
            contextData += `- Learned ${progress.totalFlashcards} words\n`;
            contextData += `- Mastered ${progress.masteredFlashcards} words\n`;

            if (progress.flashcards.length > 0) {
              contextData += `\nWords you've learned:\n`;
              progress.flashcards.forEach((p, i) => {
                const status = p.isMastered ? '✓ Mastered' : 'Learning';
                contextData += `${i + 1}. ${p.flashcard?.term} - ${p.flashcard?.meaningVi} (${status})\n`;
              });
            }
          } else {
            // Show all words in unit
            const flashcards = await this.getFlashcardsByTopic(topic.id);
            if (flashcards.length > 0) {
              contextData += `\nVocabulary in Unit ${topic.title} (${flashcards.length} words):\n`;
              flashcards.forEach((f, i) => {
                const phonetic = f.phonetic ? ` /${f.phonetic}/` : '';
                contextData += `${i + 1}. ${f.term}${phonetic} - ${f.meaningVi}\n`;
              });
            }
          }
        }
      }
    }

    // Sentence query - "Unit X có những câu nào" (grouped by sentenceImage)
    if (msg.includes('câu') || msg.includes('sentence')) {
      // Extract topic/unit name or number
      const unitMatch = msg.match(/unit\s+(\d+|[a-z\s]+)/i);
      if (unitMatch) {
        const unitIdentifier = unitMatch[1].trim();

        // Try to find topic by ID or title (FILTER BY USER'S GRADE)
        let topic = null;
        if (/^\d+$/.test(unitIdentifier)) {
          topic = await this.prisma.topic.findFirst({
            where: {
              id: parseInt(unitIdentifier),
              grade: stats.grade, // FILTER BY GRADE
            },
          });
        } else {
          topic = await this.prisma.topic.findFirst({
            where: {
              title: {
                contains: unitIdentifier,
                mode: 'insensitive',
              },
              grade: stats.grade, // FILTER BY GRADE
            },
          });
        }

        if (topic) {
          // Check if asking about learned sentences or all sentences
          const isLearnedQuery =
            msg.includes('đã học') ||
            msg.includes('học được') ||
            msg.includes('learned') ||
            msg.includes('mastered');

          if (isLearnedQuery) {
            // Show user's learning progress for sentences
            const progress = await this.getUserProgressByTopic(
              userId,
              topic.id,
            );
            contextData += `\nSentence Learning Progress for Unit ${topic.title}:\n`;
            contextData += `- Learned ${progress.totalSentences} sentences\n`;
            contextData += `- Mastered ${progress.masteredSentences} sentences\n`;

            if (progress.sentences.length > 0) {
              contextData += `\nSentences you've learned:\n`;
              progress.sentences.forEach((p, i) => {
                const status = p.isMastered ? '✓ Mastered' : 'Learning';
                contextData += `${i + 1}. "${p.sentence?.text}" - ${p.sentence?.meaningVi} (${status})\n`;
              });
            }
          } else {
            // Get sentence images with their sentences
            const sentenceImages = await this.prisma.sentenceImage.findMany({
              where: { topicId: topic.id },
              include: {
                sentences: {
                  where: { isActive: true },
                  select: {
                    id: true,
                    text: true,
                    meaningVi: true,
                    order: true,
                  },
                  orderBy: { order: 'asc' },
                },
              },
              orderBy: { order: 'asc' },
            });

            if (sentenceImages.length > 0) {
              contextData += `\nSentences in Unit ${topic.title}:\n`;
              sentenceImages.forEach((si, imageIndex) => {
                contextData += `\nImage ${imageIndex + 1}:\n`;
                si.sentences.forEach((s, sentenceIndex) => {
                  contextData += `  ${sentenceIndex + 1}. "${s.text}" - ${s.meaningVi}\n`;
                });
              });
            }
          }
        }
      }
    }

    // Topic/Unit query
    if (
      msg.includes('unit') ||
      msg.includes('topic') ||
      msg.includes('chủ đề')
    ) {
      // Check if asking about learned/unlearned units
      const isLearnedQuery =
        msg.includes('đã học') ||
        msg.includes('learned') ||
        msg.includes('completed');
      const isUnlearnedQuery =
        msg.includes('chưa học') ||
        msg.includes("haven't") ||
        msg.includes('not learned') ||
        msg.includes('incomplete');

      if (isLearnedQuery || isUnlearnedQuery) {
        // Get all topics in user's grade
        const allTopics = await this.prisma.topic.findMany({
          where: { grade: stats.grade, isActive: true },
          select: { id: true, title: true, description: true },
          orderBy: { order: 'asc' },
        });

        // For each topic, check if ALL flashcards AND ALL sentences are mastered
        const learnedTopicIds: number[] = [];

        for (const topic of allTopics) {
          // Get all flashcards in this topic
          const flashcards = await this.prisma.flashcard.findMany({
            where: { topicId: topic.id, isActive: true },
            select: { id: true },
          });

          // Get all sentences in this topic
          const sentenceImages = await this.prisma.sentenceImage.findMany({
            where: { topicId: topic.id },
            include: {
              sentences: {
                where: { isActive: true },
                select: { id: true },
              },
            },
          });
          const sentences = sentenceImages.flatMap((si) => si.sentences);

          // Get user's mastered items
          const masteredFlashcards =
            await this.prisma.learningProgress.findMany({
              where: {
                userId,
                contentType: 'FLASHCARD',
                isMastered: true,
                flashcardId: { in: flashcards.map((f) => f.id) },
              },
              select: { flashcardId: true },
            });

          const masteredSentences = await this.prisma.learningProgress.findMany(
            {
              where: {
                userId,
                contentType: 'SENTENCE',
                isMastered: true,
                sentenceId: { in: sentences.map((s) => s.id) },
              },
              select: { sentenceId: true },
            },
          );

          // Topic is learned only if ALL flashcards AND ALL sentences are mastered
          const allFlashcardsMastered =
            flashcards.length > 0 &&
            flashcards.every((f) =>
              masteredFlashcards.some((mf) => mf.flashcardId === f.id),
            );

          const allSentencesMastered =
            sentences.length > 0 &&
            sentences.every((s) =>
              masteredSentences.some((ms) => ms.sentenceId === s.id),
            );

          if (allFlashcardsMastered && allSentencesMastered) {
            learnedTopicIds.push(topic.id);
          }
        }

        if (isLearnedQuery) {
          const learnedTopics = allTopics.filter((t) =>
            learnedTopicIds.includes(t.id),
          );
          if (learnedTopics.length > 0) {
            contextData += `\nUnits you have learned (${learnedTopics.length}):\n`;
            learnedTopics.forEach((t, i) => {
              contextData += `${i + 1}. ${t.title}\n`;
            });
          } else {
            contextData += `\nYou haven't completed any units yet.\n`;
          }
        }

        if (isUnlearnedQuery) {
          const unlearnedTopics = allTopics.filter(
            (t) => !learnedTopicIds.includes(t.id),
          );
          if (unlearnedTopics.length > 0) {
            contextData += `\nUnits you haven't learned yet (${unlearnedTopics.length}):\n`;
            unlearnedTopics.forEach((t, i) => {
              contextData += `${i + 1}. ${t.title}\n`;
            });
          } else {
            contextData += `\nYou have completed all units!\n`;
          }
        }
      } else {
        // General topic/unit list query
        const topics = await this.getTopicsByGrade(stats.grade);
        contextData += `\nAvailable units for grade ${stats.grade}:\n`;
        topics.forEach((t) => {
          contextData += `- ${t.title}: ${t.description || 'No description'} (${t.lessonCount} exercises)\n`;
        });
      }
    }

    return contextData;
  }

  // ============ AI METHODS ============

  async generateText(prompt: string): Promise<string> {
    try {
      this.logger.log(`Generating text for prompt: ${prompt}`);

      const result = await this.model.generateContent(prompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error calling Gemini API:', error);
      return 'Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Hãy thử lại nhé!';
    }
  }

  async sendMessage(
    userId: number,
    dto: ChatRequestDto,
  ): Promise<ChatResponseDto> {
    // Lấy lịch sử chat gần đây (10 tin nhắn cuối)
    const history = await this.prisma.chatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Đảo ngược để có thứ tự đúng (cũ -> mới)
    const messages = history.reverse().map((h) => ({
      role: h.role,
      content: h.content,
    }));

    // Thêm tin nhắn hiện tại
    messages.push({
      role: 'user',
      content: dto.message,
    });

    let aiResponse: string;
    let translation: ChatResponseDto['translation'];

    // PRIORITY ORDER:
    // 1. System queries (personal info, stats, etc.) - MUST BE FIRST
    // 2. Translation requests
    // 3. General conversation

    // 1. Check for system queries FIRST
    if (this.isSystemQuery(dto.message)) {
      const systemData = await this.fetchSystemData(userId, dto.message);

      // Inject system data into conversation context
      const enhancedMessage = `User question: ${dto.message}\n\nSystem Data:\n${systemData}\n\nPlease answer the user's question using this data. Be concise and friendly.`;

      messages[messages.length - 1].content = enhancedMessage;
      aiResponse = await this.callAI(messages);
    }
    // 2. Check for translation requests
    else if (this.isTranslationRequest(dto.message)) {
      const word = this.extractWord(dto.message);
      translation = await this.translateWord(word);
      aiResponse = this.formatTranslationResponse(translation);
      // DON'T return translation object - it causes duplicate display in UI
      translation = undefined;
    }
    // 3. General conversation
    else {
      aiResponse = await this.callAI(messages);
    }

    // Lưu lịch sử
    await this.prisma.chatHistory.createMany({
      data: [
        { userId, role: 'user', content: dto.message },
        { userId, role: 'ai', content: aiResponse },
      ],
    });

    return {
      response: aiResponse,
      translation,
    };
  }

  private isTranslationRequest(message: string): boolean {
    const msg = message.trim().toLowerCase();

    // EXCLUDE personal info queries (must check FIRST)
    const personalKeywords = [
      'tên tôi',
      'tên mình',
      'my name',
      'tuổi tôi',
      'tuổi mình',
      'my age',
      'lớp tôi',
      'lớp mình',
      'my grade',
      'xp tôi',
      'xp mình',
      'my xp',
      'streak tôi',
      'streak mình',
      'my streak',
      'học được',
      'đã học',
      'learned',
      'mastered',
      'bao nhiêu',
      'how many',
    ];

    if (personalKeywords.some((keyword) => msg.includes(keyword))) {
      return false; // NOT a translation request
    }

    const patterns = [
      /what (is|does) .+ mean/i,
      /nghĩa của .+ là gì/i,
      /nghĩa .+/i,
      /dịch .+/i,
      /translate .+/i,
      /.+ nghĩa là gì/i, // Safe now because personal keywords filtered
      /.+ là gì/i, // Safe now because personal keywords filtered
      /^[a-zA-Z]+$/i, // Single English word
      /^[\u00C0-\u1EF9\s]+$/i, // Vietnamese word(s)
    ];

    return patterns.some((pattern) => pattern.test(message.trim()));
  }

  private extractWord(message: string): string {
    const msg = message.trim();

    // Pattern: "X nghĩa là gì" or "X là gì" → extract X
    const wordMatch = msg.match(/^([^\s]+)\s+(nghĩa là gì|là gì)/i);
    if (wordMatch) return wordMatch[1].trim();

    // Pattern: "nghĩa của X" or "dịch X" or "translate X"
    const match = msg.match(
      /(?:nghĩa của|nghĩa|dịch|translate|mean)\s+["']?([\w\u00C0-\u1EF9\s]+)["']?/i,
    );
    if (match) return match[1].trim();

    // Pattern: "X là gì" with longer X
    const isWhatMatch = msg.match(
      /^([\w\u00C0-\u1EF9\s]+)\s+(là gì|nghĩa là gì)/i,
    );
    if (isWhatMatch) return isWhatMatch[1].trim();

    // If just 1-2 words, take the whole message
    if (msg.split(/\s+/).length <= 2) return msg;

    return msg;
  }

  private async translateWord(
    word: string,
  ): Promise<ChatResponseDto['translation']> {
    // Gọi AI để dịch từ - CHỈ TRẢ NGHĨA CỰC NGẮN GỌN
    const prompt = `You are a dictionary. Translate "${word}" to ${this.isVietnamese(word) ? 'English' : 'Vietnamese'}.

CRITICAL: Reply with ONLY the translation (1-4 words max).

Vietnamese Translation Rules:
- Animals: use classifier "con" (cat → con mèo, dog → con chó)
- Objects/Things: use classifier "cái" (pot → cái nồi, pen → cái bút)
- Fruits: use classifier "quả" (apple → quả táo)
- Vehicles: no classifier or use "xe" (bike → xe đạp, car → xe ô tô)

Examples:
Input: "cat" → Output: "con mèo"
Input: "dog" → Output: "con chó"
Input: "pot" → Output: "cái nồi"
Input: "pen" → Output: "cái bút"
Input: "apple" → Output: "quả táo"
Input: "bike" → Output: "xe đạp"
Input: "xe đạp" → Output: "bicycle"
Input: "con mèo" → Output: "cat"
Input: "cái nồi" → Output: "pot"`;

    const aiResponse = await this.callAI([{ role: 'user', content: prompt }]);

    // Làm sạch response - chỉ giữ lại nghĩa thuần túy
    let cleanResponse = aiResponse
      .trim()
      .replace(/^["'`()\[\]{}]|["'`()\[\]{}]$/g, '') // Bỏ mọi dấu bao quanh
      .replace(/^(Output:|Answer:|Translation:)\s*/i, '') // Bỏ prefix
      .split(/[.\n]/)[0] // Chỉ lấy trước dấu chấm hoặc xuống dòng
      .trim();

    // Nếu vẫn dài, chỉ lấy 3 từ đầu
    const words = cleanResponse.split(/\s+/);
    if (words.length > 3) {
      cleanResponse = words.slice(0, 3).join(' ');
    }

    return {
      word,
      meaning: cleanResponse,
    };
  }

  private isVietnamese(text: string): boolean {
    // Kiểm tra có ký tự tiếng Việt không
    return /[\u00C0-\u1EF9]/.test(text);
  }

  private formatTranslationResponse(
    translation: ChatResponseDto['translation'],
  ): string {
    if (!translation) return '';
    // Just return the meaning - AI will format it naturally
    return translation.meaning;
  }

  private async callAI(
    messages: { role: string; content: string }[],
  ): Promise<string> {
    try {
      // Tạo prompt từ lịch sử tin nhắn
      const conversationHistory = messages
        .map(
          (msg) =>
            `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`,
        )
        .join('\n');

      const result = await this.model.generateContent(conversationHistory);
      const response = result.response;
      return response.text();
    } catch (error) {
      this.logger.error('Error calling AI with history:', error);
      return 'Xin lỗi, tôi gặp lỗi khi xử lý câu hỏi của bạn. Hãy thử lại nhé!';
    }
  }

  async getChatHistory(userId: number, limit = 50) {
    return this.prisma.chatHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  async clearChatHistory(userId: number) {
    await this.prisma.chatHistory.deleteMany({
      where: { userId },
    });
  }
}
