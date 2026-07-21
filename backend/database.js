const fs = require("fs");
const path = require("path");

const dataDir = path.join(__dirname, "data");
const databasePath = path.join(dataDir, "intuisity-db.json");

const emptyDatabase = {
  profiles: {},
  dailyAnswers: [],
  dailyResults: [],
  analyticsEvents: [],
  moduleFeedback: [],
  friends: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

function ensureDatabase() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }
  if (!fs.existsSync(databasePath)) {
    writeDatabase(emptyDatabase);
  }
}

function readDatabase() {
  ensureDatabase();
  try {
    return JSON.parse(fs.readFileSync(databasePath, "utf8"));
  } catch {
    writeDatabase(emptyDatabase);
    return { ...emptyDatabase };
  }
}

function writeDatabase(database) {
  const nextDatabase = {
    ...database,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(databasePath, JSON.stringify(nextDatabase, null, 2));
  return nextDatabase;
}

function upsertProfile(profile) {
  const database = readDatabase();
  const email = normalizeEmail(profile.email);
  if (!email) return database;

  database.profiles[email] = {
    ...profile,
    email,
    updatedAt: new Date().toISOString()
  };
  return writeDatabase(database);
}

function saveDailyAnswers(payload) {
  const database = readDatabase();
  const email = normalizeEmail(payload.email);
  if (!email) return database;

  const date = payload.date || getDateKey();
  database.dailyAnswers = [
    ...database.dailyAnswers.filter((entry) => !(entry.email === email && entry.date === date)),
    {
      email,
      date,
      answers: payload.answers || {},
      updatedAt: new Date().toISOString()
    }
  ];
  return writeDatabase(database);
}

function saveDailyResult(payload) {
  const database = readDatabase();
  const email = normalizeEmail(payload.email);
  if (!email) return database;

  const date = payload.date || getDateKey();
  database.dailyResults = [
    ...database.dailyResults.filter((entry) => !(entry.email === email && entry.date === date)),
    {
      email,
      date,
      modules: payload.modules || [],
      total: Number(payload.total || 0),
      maximum: Number(payload.maximum || 0),
      updatedAt: new Date().toISOString()
    }
  ];
  return writeDatabase(database);
}

function addAnalyticsEvent(event) {
  const database = readDatabase();
  const email = normalizeEmail(event.email);
  if (!email) return database;

  database.analyticsEvents = [
    ...database.analyticsEvents,
    {
      ...event,
      email,
      recordedAt: new Date().toISOString()
    }
  ].slice(-5000);
  return writeDatabase(database);
}

function saveModuleFeedback(payload) {
  const database = readDatabase();
  const email = normalizeEmail(payload.email);
  if (!email) return database;

  const savedAt = payload.savedAt || new Date().toISOString();
  const incoming = Object.entries(payload.feedback || {}).flatMap(([moduleLabel, value]) => {
    const rating = Number(value.rating || 0);
    const improvement = String(value.improvement || "").trim();
    if (!rating && !improvement) return [];
    return [{
      email,
      moduleLabel,
      rating,
      improvement,
      savedAt: value.updatedAt || savedAt
    }];
  });

  const existing = database.moduleFeedback.filter((entry) => (
    entry.email !== email || !incoming.some((next) => next.moduleLabel === entry.moduleLabel)
  ));
  database.moduleFeedback = [...existing, ...incoming];
  return writeDatabase(database);
}

function saveFriends(payload) {
  const database = readDatabase();
  const email = normalizeEmail(payload.email);
  if (!email) return database;

  database.friends = [
    ...database.friends.filter((entry) => entry.email !== email),
    {
      email,
      friends: payload.friends || [],
      updatedAt: new Date().toISOString()
    }
  ];
  return writeDatabase(database);
}

function getAdminReport() {
  const database = readDatabase();
  const moduleTotals = new Map();

  database.analyticsEvents.forEach((event) => {
    const current = moduleTotals.get(event.moduleLabel) || {
      moduleId: event.moduleId,
      moduleLabel: event.moduleLabel,
      visits: 0,
      totalMs: 0,
      averageMs: 0
    };
    current.visits += 1;
    current.totalMs += Number(event.durationMs || 0);
    current.averageMs = Math.round(current.totalMs / current.visits);
    moduleTotals.set(event.moduleLabel, current);
  });

  const moduleSummaries = [...moduleTotals.values()].sort((a, b) => b.totalMs - a.totalMs);
  const totalTimeMs = database.analyticsEvents.reduce((total, event) => total + Number(event.durationMs || 0), 0);
  const ratings = database.moduleFeedback.filter((entry) => entry.rating);
  const ratingTotal = ratings.reduce((total, entry) => total + Number(entry.rating || 0), 0);

  return {
    totalUsers: Object.keys(database.profiles).length,
    totalVisits: database.analyticsEvents.length,
    totalTimeMs,
    averageSessionMs: database.analyticsEvents.length ? Math.round(totalTimeMs / database.analyticsEvents.length) : 0,
    mostUsedModule: moduleSummaries[0]?.moduleLabel || "No module activity yet",
    moduleSummaries,
    feedbackCount: ratings.length,
    averageRating: ratings.length ? Math.round((ratingTotal / ratings.length) * 10) / 10 : 0,
    improvementResponses: database.moduleFeedback
      .filter((entry) => entry.improvement)
      .sort((a, b) => new Date(b.savedAt || 0).getTime() - new Date(a.savedAt || 0).getTime())
      .slice(0, 50)
      .map((entry) => ({
        moduleLabel: entry.moduleLabel,
        note: entry.improvement,
        rating: entry.rating,
        email: entry.email,
        savedAt: entry.savedAt
      })),
    userInsights: getUserInsights(database)
  };
}

function getUserInsights(database = readDatabase()) {
  return Object.values(database.profiles).map((profile) => {
    const email = normalizeEmail(profile.email);
    const events = database.analyticsEvents.filter((event) => event.email === email);
    const dailyResults = database.dailyResults.filter((entry) => entry.email === email);
    const feedback = database.moduleFeedback.filter((entry) => entry.email === email);
    const friends = database.friends.find((entry) => entry.email === email);
    const moduleStats = new Map();

    events.forEach((event) => {
      const label = event.moduleLabel || "Unknown area";
      const current = moduleStats.get(label) || { moduleLabel: label, clicks: 0, totalMs: 0 };
      current.clicks += 1;
      current.totalMs += Number(event.durationMs || 0);
      moduleStats.set(label, current);
    });

    const sortedByClicks = [...moduleStats.values()].sort((a, b) => b.clicks - a.clicks || b.totalMs - a.totalMs);
    const sortedByTime = [...moduleStats.values()].sort((a, b) => b.totalMs - a.totalMs || b.clicks - a.clicks);
    const ratings = feedback.filter((entry) => Number(entry.rating || 0) > 0);
    const totalScore = dailyResults.reduce((sum, entry) => sum + Number(entry.total || 0), 0);
    const totalPossible = dailyResults.reduce((sum, entry) => sum + Number(entry.maximum || 0), 0);

    return {
      name: profile.name || "",
      email,
      phone: profile.phone || "",
      language: profile.language || "",
      currentCity: profile.currentCity || "",
      currentState: profile.currentState || "",
      currentCountry: profile.currentCountry || "",
      birthCity: profile.birthCity || "",
      birthState: profile.birthState || "",
      birthCountry: profile.birthCountry || "",
      totalClicks: events.length,
      totalTimeMs: events.reduce((sum, event) => sum + Number(event.durationMs || 0), 0),
      mostClickedModule: sortedByClicks[0]?.moduleLabel || "No clicks yet",
      mostClickedCount: sortedByClicks[0]?.clicks || 0,
      mostTimeModule: sortedByTime[0]?.moduleLabel || "No time yet",
      mostTimeMs: sortedByTime[0]?.totalMs || 0,
      daysWithResults: dailyResults.length,
      averageScorePercent: totalPossible ? Math.round((totalScore / totalPossible) * 100) : 0,
      averageRating: ratings.length
        ? Math.round((ratings.reduce((sum, entry) => sum + Number(entry.rating || 0), 0) / ratings.length) * 10) / 10
        : 0,
      commentCount: feedback.filter((entry) => String(entry.improvement || "").trim()).length,
      savedFriendCount: Array.isArray(friends?.friends) ? friends.friends.length : 0,
      lastActiveAt: events.length
        ? events.map((event) => event.recordedAt || event.startedAt).sort().at(-1)
        : profile.updatedAt,
      moduleBreakdown: sortedByTime
    };
  }).sort((a, b) => new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime());
}

function getUserInsightsCsv() {
  const rows = getUserInsights();
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Language",
    "Current City",
    "Current State",
    "Current Country",
    "Most Clicked Module",
    "Most Clicked Count",
    "Most Time Module",
    "Most Time",
    "Total Clicks",
    "Total Time",
    "Days With Results",
    "Average Score Percent",
    "Average Rating",
    "Comment Count",
    "Saved Friend Count",
    "Last Active"
  ];

  const lines = [
    headers,
    ...rows.map((row) => [
      row.name,
      row.email,
      row.phone,
      row.language,
      row.currentCity,
      row.currentState,
      row.currentCountry,
      row.mostClickedModule,
      row.mostClickedCount,
      row.mostTimeModule,
      formatDuration(row.mostTimeMs),
      row.totalClicks,
      formatDuration(row.totalTimeMs),
      row.daysWithResults,
      row.averageScorePercent,
      row.averageRating,
      row.commentCount,
      row.savedFriendCount,
      row.lastActiveAt || ""
    ])
  ];

  return lines.map((line) => line.map(escapeCsvValue).join(",")).join("\n");
}

function escapeCsvValue(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function formatDuration(milliseconds) {
  if (!milliseconds) return "0s";
  const totalSeconds = Math.max(1, Math.round(milliseconds / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return minutes ? `${minutes}m ${seconds}s` : `${seconds}s`;
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function getDateKey() {
  return new Date().toISOString().slice(0, 10);
}

module.exports = {
  addAnalyticsEvent,
  getAdminReport,
  getUserInsightsCsv,
  readDatabase,
  saveDailyAnswers,
  saveDailyResult,
  saveFriends,
  saveModuleFeedback,
  upsertProfile
};
