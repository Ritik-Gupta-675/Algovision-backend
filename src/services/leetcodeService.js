/**
 * LeetCode profile & stats via public GraphQL API with mock fallback.
 */

const LEETCODE_GRAPHQL = 'https://leetcode.com/graphql';

const PROFILE_QUERY = `
  query userPublicProfile($username: String!) {
    matchedUser(username: $username) {
      username
      profile {
        ranking
        userAvatar
        reputation
        starRating
      }
      submitStats: submitStatsGlobal {
        acSubmissionNum {
          difficulty
          count
          submissions
        }
      }
      userCalendar {
        submissionCalendar
      }
    }
  }
`;

const CONTEST_QUERY = `
  query userContestRanking($username: String!) {
    userContestRanking(username: $username) {
      rating
      globalRanking
      topPercentage
    }
  }
`;

const SUBMISSIONS_QUERY = `
  query recentSubmissions($username: String!) {
    recentSubmissionList(username: $username, limit: 10) {
      title
      titleSlug
      timestamp
      statusDisplay
      lang
    }
  }
`;

const TOPIC_STATS_QUERY = `
  query skillStats($username: String!) {
    matchedUser(username: $username) {
      tagProblemCounts {
        advanced {
          tagName
          problemsSolved
        }
        intermediate {
          tagName
          problemsSolved
        }
        fundamental {
          tagName
          problemsSolved
        }
      }
    }
  }
`;

async function graphqlRequest(query, variables) {
  const response = await fetch(LEETCODE_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'AlgoVision/1.0',
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`LeetCode API returned ${response.status}`);
  }

  const json = await response.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message || 'LeetCode GraphQL error');
  }
  return json.data;
}

function parseSubmissionCalendar(calendarStr) {
  if (!calendarStr) return { streakDays: [], currentStreak: 0, maxStreak: 0 };
  try {
    const calendar = JSON.parse(calendarStr);
    const days = Object.entries(calendar)
      .map(([ts, count]) => ({
        date: new Date(parseInt(ts, 10) * 1000).toISOString().split('T')[0],
        count: Number(count),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    let current = 0;
    let max = 0;
    let run = 0;
    const today = new Date().toISOString().split('T')[0];
    const daySet = new Set(days.filter((d) => d.count > 0).map((d) => d.date));

    for (let i = 0; i < 365; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      if (daySet.has(key)) {
        run++;
        max = Math.max(max, run);
        if (i === 0 || (i > 0 && run === i + 1 && daySet.has(today))) current = run;
      } else if (i === 0) {
        run = 0;
      } else {
        break;
      }
    }

    return { streakDays: days.slice(-90), currentStreak: current, maxStreak: max };
  } catch {
    return { streakDays: [], currentStreak: 0, maxStreak: 0 };
  }
}

function mapDifficultyStats(acSubmissionNum) {
  const stats = { easy: 0, medium: 0, hard: 0, total: 0 };
  for (const item of acSubmissionNum || []) {
    const d = (item.difficulty || '').toLowerCase();
    const count = item.count || 0;
    if (d === 'easy') stats.easy = count;
    else if (d === 'medium') stats.medium = count;
    else if (d === 'hard') stats.hard = count;
    stats.total += count;
  }
  return stats;
}

function buildTopicPerformance(tagProblemCounts) {
  const topics = [];
  const buckets = ['fundamental', 'intermediate', 'advanced'];
  for (const bucket of buckets) {
    for (const tag of tagProblemCounts?.[bucket] || []) {
      topics.push({
        topic: tag.tagName,
        solved: tag.problemsSolved || 0,
        level: bucket,
      });
    }
  }
  return topics.sort((a, b) => a.solved - b.solved);
}

function getMockProfile(username) {
  const seed = username.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const easy = 45 + (seed % 30);
  const medium = 80 + (seed % 40);
  const hard = 25 + (seed % 20);
  return {
    username,
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${username}`,
    ranking: 10000 + (seed % 50000),
    reputation: 100 + (seed % 500),
    contestRating: 1400 + (seed % 600),
    contestRanking: 5000 + (seed % 20000),
    stats: { easy, medium, hard, total: easy + medium + hard },
    currentStreak: 3 + (seed % 14),
    maxStreak: 15 + (seed % 30),
    streakDays: generateMockStreakDays(seed),
    recentSubmissions: [
      { title: 'Two Sum', slug: 'two-sum', status: 'Accepted', lang: 'python', timestamp: Date.now() / 1000 - 86400 },
      { title: 'Valid Parentheses', slug: 'valid-parentheses', status: 'Accepted', lang: 'javascript', timestamp: Date.now() / 1000 - 172800 },
      { title: 'Merge Intervals', slug: 'merge-intervals', status: 'Accepted', lang: 'cpp', timestamp: Date.now() / 1000 - 259200 },
    ],
    topicPerformance: [
      { topic: 'Array', solved: 42, level: 'fundamental' },
      { topic: 'Dynamic Programming', solved: 12, level: 'intermediate' },
      { topic: 'Graph', solved: 8, level: 'intermediate' },
      { topic: 'Tree', solved: 18, level: 'fundamental' },
      { topic: 'Sliding Window', solved: 6, level: 'intermediate' },
      { topic: 'Greedy', solved: 10, level: 'intermediate' },
    ],
    mock: true,
  };
}

function generateMockStreakDays(seed) {
  const days = [];
  for (let i = 89; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const active = (seed + i) % 3 !== 0;
    days.push({
      date: d.toISOString().split('T')[0],
      count: active ? 1 + ((seed + i) % 4) : 0,
    });
  }
  return days;
}

class LeetcodeService {
  async fetchProfile(username) {
    try {
      const [profileData, contestData, submissionsData, topicData] = await Promise.all([
        graphqlRequest(PROFILE_QUERY, { username }),
        graphqlRequest(CONTEST_QUERY, { username }).catch(() => null),
        graphqlRequest(SUBMISSIONS_QUERY, { username }).catch(() => null),
        graphqlRequest(TOPIC_STATS_QUERY, { username }).catch(() => null),
      ]);

      const user = profileData?.matchedUser;
      if (!user) {
        return { success: false, error: `User "${username}" not found on LeetCode` };
      }

      const stats = mapDifficultyStats(user.submitStats?.acSubmissionNum);
      const { streakDays, currentStreak, maxStreak } = parseSubmissionCalendar(
        user.userCalendar?.submissionCalendar
      );

      const contest = contestData?.userContestRanking;
      const submissions = (submissionsData?.recentSubmissionList || []).map((s) => ({
        title: s.title,
        slug: s.titleSlug,
        status: s.statusDisplay,
        lang: s.lang,
        timestamp: s.timestamp,
      }));

      const topicPerformance = buildTopicPerformance(
        topicData?.matchedUser?.tagProblemCounts
      );

      return {
        success: true,
        profile: {
          username: user.username,
          avatar: user.profile?.userAvatar || '',
          ranking: user.profile?.ranking ?? null,
          reputation: user.profile?.reputation ?? 0,
          contestRating: contest?.rating ?? null,
          contestRanking: contest?.globalRanking ?? null,
          stats,
          currentStreak,
          maxStreak,
          streakDays,
          recentSubmissions: submissions,
          topicPerformance,
          mock: false,
        },
      };
    } catch (error) {
      console.warn('LeetCode API failed, using mock data:', error.message);
      return {
        success: true,
        profile: getMockProfile(username),
        warning: 'Using demo data — LeetCode API unavailable. Connect again later for live stats.',
      };
    }
  }

  async fetchStats(username) {
    const result = await this.fetchProfile(username);
    if (!result.success) return result;
    const { profile } = result;
    return {
      success: true,
      stats: profile.stats,
      streak: {
        current: profile.currentStreak,
        max: profile.maxStreak,
        days: profile.streakDays,
      },
      topicPerformance: profile.topicPerformance,
      mock: profile.mock,
      warning: result.warning,
    };
  }

  parseProblemInput({ url, statement, title, description }) {
    if (url) {
      const slugMatch = url.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
      if (slugMatch) {
        return {
          title: title || slugMatch[1].replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
          slug: slugMatch[1],
          description: statement || description || '',
          url,
        };
      }
    }
    return {
      title: title || 'Custom Problem',
      description: statement || description || '',
      url: url || null,
    };
  }
}

module.exports = new LeetcodeService();
