const { supabaseRequest } = require("./_supabase");

const excludedReportEmails = new Set(["admin@intuisity.com", "kathy@intuisity.com"]);
const idleStopMs = 180000;
const reportTimeZone = "America/Los_Angeles";
const moduleOrder = [
  "Challenge 1: Treasure Chest",
  "Challenge 2: Train Your Knowing",
  "Challenge 3: Positivity Practice",
  "Challenge 4: Read the Person",
  "Challenge 5: Daily Astrology Tips",
  "Challenge 6: Remote Viewing Challenge",
  "Results Page"
];

async function buildAdminReport(options = {}) {
  const [allProfiles, allAnalyticsEvents, allDailyResults, allModuleFeedback, allFriends] = await Promise.all([
    selectAll("profiles"),
    selectAll("analytics_events"),
    selectAll("daily_results"),
    selectAll("module_feedback"),
    selectAll("friends")
  ]);
  const profiles = allProfiles.filter((profile) => !isExcludedReportEmail(profile.email));
  const analyticsEvents = allAnalyticsEvents.filter((event) => !isExcludedReportEmail(event.email));
  const dailyResults = allDailyResults.filter((entry) => !isExcludedReportEmail(entry.email));
  const moduleFeedback = allModuleFeedback.filter((entry) => !isExcludedReportEmail(entry.email));
  const friends = allFriends.filter((entry) => !isExcludedReportEmail(entry.email));

  const dateRange = normalizeDateRange(options.startDate, options.endDate);
  const rangedAnalyticsEvents = filterEventsByDateRange(analyticsEvents, dateRange);
  const visitorEvents = coalesceVisitorSessions(buildVisitorEvents(analyticsEvents, profiles));
  const rangedVisitorEvents = filterEventsByDateRange(visitorEvents, dateRange);
  const volume = buildVisitorVolume(visitorEvents, dateRange);
  const todayDate = getPacificDateKey(new Date());
  const todayVisitorEvents = filterEventsSince(visitorEvents, todayDate);
  const visitorTrend = buildVisitorTrend(rangedVisitorEvents);
  const platformBreakdown = buildPlatformBreakdown(rangedVisitorEvents);
  const visitorBreakdown = buildVisitorBreakdown(rangedVisitorEvents);
  const visitorDetails = buildVisitorDetails(rangedVisitorEvents);
  const todayVisitorDetails = buildVisitorDetails(todayVisitorEvents);
  const rangedTrackedEvents = rangedVisitorEvents.filter((event) => event.event_json?.source !== "profiles");
  const rangedModuleEvents = rangedAnalyticsEvents.filter((event) => !isSiteVisitEvent(event));
  const moduleDailyTrend = buildModuleDailyTrend(rangedModuleEvents);

  const moduleTotals = new Map();
  rangedModuleEvents.forEach((event) => {
    const label = event.module_label || "Unknown area";
    const current = moduleTotals.get(label) || {
      moduleId: event.module_id || "",
      moduleLabel: label,
      visits: 0,
      totalMs: 0,
      activeMs: 0,
      averageMs: 0,
      averageActiveMs: 0
    };
    current.visits += 1;
    current.totalMs += Number(event.duration_ms || 0);
    current.activeMs += getActiveDuration(event);
    current.averageMs = Math.round(current.totalMs / current.visits);
    current.averageActiveMs = Math.round(current.activeMs / current.visits);
    moduleTotals.set(label, current);
  });

  const moduleSummaries = [...moduleTotals.values()].sort((a, b) => b.activeMs - a.activeMs || b.totalMs - a.totalMs);
  const totalTimeMs = rangedModuleEvents.reduce((total, event) => total + Number(event.duration_ms || 0), 0);
  const totalActiveTimeMs = rangedModuleEvents.reduce((total, event) => total + getActiveDuration(event), 0);
  const ratings = moduleFeedback.filter((entry) => Number(entry.rating || 0));
  const ratingTotal = ratings.reduce((total, entry) => total + Number(entry.rating || 0), 0);
  const userInsights = buildUserInsights({ analyticsEvents: rangedAnalyticsEvents, dailyResults, friends, moduleFeedback, profiles });
  const knownUserCount = countKnownUsers({ analyticsEvents, dailyResults, friends, moduleFeedback, profiles });

  return {
    totalUsers: knownUserCount,
    totalVisits: rangedTrackedEvents.length,
    uniqueVisitors: countUniqueVisitors(rangedVisitorEvents),
    visitorBreakdown,
    visitorDetails,
    todayDate,
    todayVisitorDetails,
    visitorVolume: volume,
    visitorTrend,
    platformBreakdown,
    moduleDailyTrend,
    dateRange,
    totalTimeMs,
    totalActiveTimeMs,
    averageSessionMs: rangedModuleEvents.length ? Math.round(totalTimeMs / rangedModuleEvents.length) : 0,
    averageActiveSessionMs: rangedModuleEvents.length ? Math.round(totalActiveTimeMs / rangedModuleEvents.length) : 0,
    mostUsedModule: moduleSummaries[0]?.moduleLabel || "No module activity yet",
    moduleSummaries,
    feedbackCount: ratings.length,
    averageRating: ratings.length ? Math.round((ratingTotal / ratings.length) * 10) / 10 : 0,
    improvementResponses: moduleFeedback
      .filter((entry) => entry.improvement)
      .sort((a, b) => new Date(b.saved_at || 0).getTime() - new Date(a.saved_at || 0).getTime())
      .slice(0, 50)
      .map((entry) => ({
        moduleLabel: entry.module_label,
        note: entry.improvement,
        rating: entry.rating,
        email: entry.email,
        savedAt: entry.saved_at
      })),
    userInsights
  };
}

function buildModuleDailyTrend(events) {
  const dayMap = new Map();
  events.forEach((event) => {
    const date = getEventDateKey(event);
    const label = event.module_label || "Unknown area";
    const dayModules = dayMap.get(date) || new Map();
    const current = dayModules.get(label) || { moduleLabel: label, activeMs: 0, totalMs: 0, visits: 0 };
    current.activeMs += getActiveDuration(event);
    current.totalMs += Number(event.duration_ms || 0);
    current.visits += 1;
    dayModules.set(label, current);
    dayMap.set(date, dayModules);
  });

  return [...dayMap.entries()]
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .slice(-60)
    .map(([date, modules]) => ({
      date,
      modules: [...modules.values()].sort((a, b) => moduleOrder.indexOf(a.moduleLabel) - moduleOrder.indexOf(b.moduleLabel))
    }));
}

function buildVisitorEvents(analyticsEvents, profiles) {
  const profileEvents = profiles
    .filter((profile) => profile.email && !isExcludedReportEmail(profile.email) && !isAnonymousVisitorEmail(profile.email))
    .map((profile) => ({
      email: profile.email,
      module_id: "profile-signup",
      module_label: "Profile Signup",
      started_at: profile.updated_at || new Date().toISOString(),
      recorded_at: profile.updated_at || new Date().toISOString(),
      date: getLocalDateKey(new Date(profile.updated_at || Date.now())),
      duration_ms: 0,
      active_duration_ms: 0,
      event_json: { clientChannel: "desktop-web", deviceCategory: "Desktop Web", source: "profiles" }
    }));

  return [...analyticsEvents, ...profileEvents];
}

function coalesceVisitorSessions(events) {
  const sessionMap = new Map();
  const passthroughEvents = [];

  events.forEach((event) => {
    const sessionId = event.event_json?.siteSessionId || event.event_json?.site_session_id || "";
    if (!sessionId || !isSiteVisitEvent(event)) {
      passthroughEvents.push(event);
      return;
    }

    const visitorKey = getVisitorKey(event) || normalizeEmail(event.email) || "unknown";
    const key = `${visitorKey}:${sessionId}`;
    const current = sessionMap.get(key);
    if (!current) {
      sessionMap.set(key, { ...event, event_json: { ...(event.event_json || {}) } });
      return;
    }

    const nextDuration = Math.max(Number(current.duration_ms || 0), Number(event.duration_ms || 0));
    const nextActiveDuration = Math.max(getActiveDuration(current), getActiveDuration(event));
    const currentRecordedAt = current.recorded_at || current.started_at || "";
    const eventRecordedAt = event.recorded_at || event.started_at || "";
    const eventLocation = getEventLocation(event);

    current.duration_ms = nextDuration;
    current.active_duration_ms = nextActiveDuration;
    current.recorded_at = eventRecordedAt > currentRecordedAt ? eventRecordedAt : currentRecordedAt;
    current.started_at = current.started_at && event.started_at
      ? current.started_at < event.started_at ? current.started_at : event.started_at
      : current.started_at || event.started_at;
    current.event_json = {
      ...(current.event_json || {}),
      ...(event.event_json || {}),
      currentCity: current.event_json?.currentCity || eventLocation.currentCity,
      currentState: current.event_json?.currentState || eventLocation.currentState,
      currentCountry: current.event_json?.currentCountry || eventLocation.currentCountry
    };
    sessionMap.set(key, current);
  });

  return [...passthroughEvents, ...sessionMap.values()];
}

async function buildUserInsightsCsv(options = {}) {
  const report = await buildAdminReport(options);
  const headers = [
    "Name",
    "Email",
    "Phone",
    "Language",
    "Current City",
    "Current State",
    "Current Country",
    "Birth Chart Type",
    "Sun Sign",
    "Moon Sign",
    "Rising Sign",
    "Birth Location",
    "Most Clicked Module",
    "Most Clicked Count",
    "Most Time Module",
    "Most Time",
    "Most Active Module",
    "Most Active Time",
    "Total Clicks",
    "Total Time",
    "Total Active Time",
    "Days With Results",
    "Average Score Percent",
    "Average Rating",
    "Comment Count",
    "Saved Friend Count",
    "Last Active"
  ];

  const lines = [
    headers,
    ...report.userInsights.map((row) => [
      row.name,
      row.email,
      row.phone,
      row.language,
      row.currentCity,
      row.currentState,
      row.currentCountry,
      row.birthChartType,
      row.sunSign,
      row.moonSign,
      row.risingSign,
      row.birthLocation,
      row.mostClickedModule,
      row.mostClickedCount,
      row.mostTimeModule,
      formatDuration(row.mostTimeMs),
      row.mostActiveModule,
      formatDuration(row.mostActiveMs),
      row.totalClicks,
      formatDuration(row.totalTimeMs),
      formatDuration(row.totalActiveTimeMs),
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

function buildUserInsights({ analyticsEvents, dailyResults, friends, moduleFeedback, profiles }) {
  const profileByEmail = new Map(profiles.map((profile) => [normalizeEmail(profile.email), profile]));
  const emails = collectKnownEmails({ analyticsEvents, dailyResults, friends, moduleFeedback, profiles });

  return emails.map((email) => {
    const profile = profileByEmail.get(email) || { email };
    const events = analyticsEvents.filter((event) => normalizeEmail(event.email) === email);
    const latestEventLocation = getLatestEventLocation(events);
    const results = dailyResults.filter((entry) => normalizeEmail(entry.email) === email);
    const feedback = moduleFeedback.filter((entry) => normalizeEmail(entry.email) === email);
    const savedFriends = friends.find((entry) => normalizeEmail(entry.email) === email);
    const moduleStats = new Map();

    events.forEach((event) => {
      const label = event.module_label || "Unknown area";
      const current = moduleStats.get(label) || { moduleLabel: label, clicks: 0, totalMs: 0, activeMs: 0 };
      current.clicks += 1;
      current.totalMs += Number(event.duration_ms || 0);
      current.activeMs += getActiveDuration(event);
      moduleStats.set(label, current);
    });

    const sortedByClicks = [...moduleStats.values()].sort((a, b) => b.clicks - a.clicks || b.totalMs - a.totalMs);
    const sortedByTime = [...moduleStats.values()].sort((a, b) => b.totalMs - a.totalMs || b.clicks - a.clicks);
    const sortedByActiveTime = [...moduleStats.values()].sort((a, b) => b.activeMs - a.activeMs || b.clicks - a.clicks);
    const ratings = feedback.filter((entry) => Number(entry.rating || 0) > 0);
    const totalScore = results.reduce((sum, entry) => sum + Number(entry.total || 0), 0);
    const totalPossible = results.reduce((sum, entry) => sum + Number(entry.maximum || 0), 0);

    return {
      ...withProfileLocationFallback({ ...profile, latestEventLocation }),
      name: profile.name || "",
      email,
      phone: profile.phone || "",
      language: profile.language || "",
      birthChartType: profile.birth_chart_type || profile.birth_chart_json?.calculationType || "",
      sunSign: profile.sun_sign || profile.birth_chart_json?.sunSign || "",
      moonSign: profile.moon_sign || profile.birth_chart_json?.moonSign || "",
      risingSign: profile.rising_sign || profile.birth_chart_json?.risingSign || "",
      birthLocation: profile.birth_location_label || profile.birth_chart_json?.locationLabel || "",
      totalClicks: events.length,
      totalTimeMs: events.reduce((sum, event) => sum + Number(event.duration_ms || 0), 0),
      totalActiveTimeMs: events.reduce((sum, event) => sum + getActiveDuration(event), 0),
      mostClickedModule: sortedByClicks[0]?.moduleLabel || "No clicks yet",
      mostClickedCount: sortedByClicks[0]?.clicks || 0,
      mostTimeModule: sortedByTime[0]?.moduleLabel || "No time yet",
      mostTimeMs: sortedByTime[0]?.totalMs || 0,
      mostActiveModule: sortedByActiveTime[0]?.moduleLabel || "No active time yet",
      mostActiveMs: sortedByActiveTime[0]?.activeMs || 0,
      daysWithResults: results.length,
      averageScorePercent: totalPossible ? Math.round((totalScore / totalPossible) * 100) : 0,
      averageRating: ratings.length
        ? Math.round((ratings.reduce((sum, entry) => sum + Number(entry.rating || 0), 0) / ratings.length) * 10) / 10
        : 0,
      commentCount: feedback.filter((entry) => String(entry.improvement || "").trim()).length,
      savedFriendCount: Array.isArray(savedFriends?.friends) ? savedFriends.friends.length : 0,
      lastActiveAt: events.length
        ? events.map((event) => event.recorded_at || event.started_at).sort().at(-1)
        : profile.updated_at
    };
  }).sort((a, b) => new Date(b.lastActiveAt || 0).getTime() - new Date(a.lastActiveAt || 0).getTime());
}

function selectAll(table) {
  return supabaseRequest(`/${table}?select=*`);
}

function countKnownUsers(sources) {
  return collectKnownEmails(sources).length;
}

function withProfileLocationFallback(profile) {
  const fallback = getLocationFromTimeZone(profile.time_zone || profile.profile_json?.timeZone || "");
  return {
    currentCity: profile.current_city || profile.profile_json?.currentCity || profile.latestEventLocation?.currentCity || fallback.currentCity,
    currentState: profile.current_state || profile.profile_json?.currentState || profile.latestEventLocation?.currentState || fallback.currentState,
    currentCountry: profile.current_country || profile.profile_json?.currentCountry || profile.latestEventLocation?.currentCountry || fallback.currentCountry
  };
}

function getLatestEventLocation(events) {
  return [...events]
    .sort((a, b) => new Date(b.recorded_at || b.started_at || 0).getTime() - new Date(a.recorded_at || a.started_at || 0).getTime())
    .map(getEventLocation)
    .find((location) => location.currentCity || location.currentState || location.currentCountry) || {};
}

function getEventLocation(event) {
  return {
    currentCity: event.event_json?.currentCity || event.event_json?.city || "",
    currentState: event.event_json?.currentState || event.event_json?.region || event.event_json?.state || "",
    currentCountry: event.event_json?.currentCountry || event.event_json?.country || ""
  };
}

function getLocationFromTimeZone(timeZone) {
  const timeZoneMap = {
    "America/Los_Angeles": { currentCity: "Los Angeles", currentState: "California", currentCountry: "United States" },
    "America/Denver": { currentCity: "Denver", currentState: "Colorado", currentCountry: "United States" },
    "America/Chicago": { currentCity: "Chicago", currentState: "Illinois", currentCountry: "United States" },
    "America/New_York": { currentCity: "New York", currentState: "New York", currentCountry: "United States" },
    "America/Phoenix": { currentCity: "Phoenix", currentState: "Arizona", currentCountry: "United States" },
    "America/Anchorage": { currentCity: "Anchorage", currentState: "Alaska", currentCountry: "United States" },
    "Pacific/Honolulu": { currentCity: "Honolulu", currentState: "Hawaii", currentCountry: "United States" },
    "Europe/London": { currentCity: "London", currentState: "", currentCountry: "United Kingdom" },
    "Europe/Paris": { currentCity: "Paris", currentState: "", currentCountry: "France" },
    "Asia/Tokyo": { currentCity: "Tokyo", currentState: "", currentCountry: "Japan" },
    "Australia/Sydney": { currentCity: "Sydney", currentState: "New South Wales", currentCountry: "Australia" }
  };
  if (timeZoneMap[timeZone]) return timeZoneMap[timeZone];

  const parts = String(timeZone || "").split("/");
  return {
    currentCity: (parts[parts.length - 1] || "").replace(/_/g, " "),
    currentState: "",
    currentCountry: ""
  };
}

function collectKnownEmails({ analyticsEvents = [], dailyResults = [], friends = [], moduleFeedback = [], profiles = [] }) {
  const emails = new Set();
  [profiles, analyticsEvents, dailyResults, moduleFeedback, friends].forEach((rows) => {
    rows.forEach((row) => {
      const email = normalizeEmail(row.email);
      if (email && !isExcludedReportEmail(email) && !isAnonymousVisitorEmail(email)) emails.add(email);
    });
  });
  return [...emails].sort();
}

function buildVisitorVolume(events, dateRange) {
  const today = getPacificDateKey(new Date());
  const weekStart = addDaysToDateKey(today, -6);
  const monthStart = addDaysToDateKey(today, -29);

  return {
    today: countUniqueVisitors(filterEventsSince(events, today)),
    week: countUniqueVisitors(filterEventsFromDate(events, weekStart)),
    month: countUniqueVisitors(filterEventsFromDate(events, monthStart)),
    range: countUniqueVisitors(filterEventsByDateRange(events, dateRange))
  };
}

function buildVisitorTrend(events) {
  const dayMap = new Map();
  events.forEach((event) => {
    const date = getEventDateKey(event);
    const current = dayMap.get(date) || { date, visitCount: 0, visitorEmails: new Set() };
    current.visitCount += 1;
    const visitorKey = getVisitorKey(event);
    if (visitorKey) current.visitorEmails.add(visitorKey);
    dayMap.set(date, current);
  });

  return [...dayMap.values()]
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(-60)
    .map((day) => ({
      date: day.date,
      uniqueVisitors: day.visitorEmails.size,
      visits: day.visitCount
    }));
}

function buildPlatformBreakdown(events) {
  const platformMap = new Map();

  events.forEach((event) => {
    const channel = normalizePlatformChannel(event.event_json?.clientChannel || event.event_json?.deviceCategory || event.module_id);
    const current = platformMap.get(channel) || {
      channel,
      label: getPlatformLabel(channel),
      visits: 0,
      visitorEmails: new Set()
    };
    current.visits += 1;
    const visitorKey = getVisitorKey(event);
    if (visitorKey) current.visitorEmails.add(visitorKey);
    platformMap.set(channel, current);
  });

  return ["desktop-web", "mobile-web", "app"]
    .map((channel) => platformMap.get(channel) || { channel, label: getPlatformLabel(channel), visits: 0, visitorEmails: new Set() })
    .map((entry) => ({
      channel: entry.channel,
      label: entry.label,
      visits: entry.visits,
      uniqueVisitors: entry.visitorEmails.size
    }));
}

function buildVisitorBreakdown(events) {
  const signedInVisitors = new Set();
  const anonymousVisitors = new Set();
  const profileSignups = new Set();

  events.forEach((event) => {
    const email = normalizeEmail(event.email);
    const visitorKey = getVisitorKey(event);

    if (event.module_id === "profile-signup" && email && !isAnonymousVisitorEmail(email)) {
      profileSignups.add(email);
    }

    if (!visitorKey) return;
    if (email && !isAnonymousVisitorEmail(email)) {
      signedInVisitors.add(email);
    } else {
      anonymousVisitors.add(visitorKey);
    }
  });

  return {
    signedIn: signedInVisitors.size,
    anonymous: anonymousVisitors.size,
    profileSignups: profileSignups.size,
    totalUnique: new Set([...signedInVisitors, ...anonymousVisitors]).size
  };
}

function buildVisitorDetails(events) {
  const visitorMap = new Map();

  events.forEach((event) => {
    const visitorKey = getVisitorKey(event);
    if (!visitorKey) return;

    const email = normalizeEmail(event.email);
    const signedIn = Boolean(email && !isAnonymousVisitorEmail(email));
    const channel = normalizePlatformChannel(event.event_json?.clientChannel || event.event_json?.deviceCategory || event.module_id);
    const moduleLabel = event.module_label || getPlatformLabel(channel);
    const current = visitorMap.get(visitorKey) || {
      id: visitorKey,
      displayName: signedIn ? email : "Anonymous visitor",
      email: signedIn ? email : "",
      type: signedIn ? "Signed in" : "Anonymous",
      platform: getPlatformLabel(channel),
      currentCity: "",
      currentState: "",
      currentCountry: "",
      visits: 0,
      totalMs: 0,
      activeMs: 0,
      firstSeenAt: event.recorded_at || event.started_at || "",
      lastSeenAt: event.recorded_at || event.started_at || "",
      moduleCounts: new Map()
    };

    current.visits += 1;
    current.totalMs += Number(event.duration_ms || 0);
    current.activeMs += getActiveDuration(event);
    const eventLocation = getEventLocation(event);
    current.currentCity = current.currentCity || eventLocation.currentCity;
    current.currentState = current.currentState || eventLocation.currentState;
    current.currentCountry = current.currentCountry || eventLocation.currentCountry;
    if ((event.recorded_at || event.started_at || "") < current.firstSeenAt) current.firstSeenAt = event.recorded_at || event.started_at || "";
    if ((event.recorded_at || event.started_at || "") > current.lastSeenAt) current.lastSeenAt = event.recorded_at || event.started_at || "";
    current.moduleCounts.set(moduleLabel, (current.moduleCounts.get(moduleLabel) || 0) + 1);
    visitorMap.set(visitorKey, current);
  });

  return [...visitorMap.values()]
    .sort((a, b) => new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime())
    .slice(0, 100)
    .map((visitor) => {
      const favoriteModule = [...visitor.moduleCounts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] || "Website visit";
      return {
        id: visitor.id,
        displayName: visitor.displayName,
        email: visitor.email,
        type: visitor.type,
        platform: visitor.platform,
        currentCity: visitor.currentCity,
        currentState: visitor.currentState,
        currentCountry: visitor.currentCountry,
        visits: visitor.visits,
        totalMs: visitor.totalMs,
        activeMs: visitor.activeMs,
        firstSeenAt: visitor.firstSeenAt,
        lastSeenAt: visitor.lastSeenAt,
        favoriteModule
      };
    });
}

function countUniqueVisitors(events) {
  return new Set(events.map(getVisitorKey).filter(Boolean)).size;
}

function filterEventsSince(events, dateKey) {
  return events.filter((event) => getEventDateKey(event) === dateKey);
}

function filterEventsFromDate(events, startDate) {
  return events.filter((event) => getEventDateKey(event) >= startDate);
}

function filterEventsByDateRange(events, dateRange) {
  return events.filter((event) => {
    const dateKey = getEventDateKey(event);
    return (!dateRange.startDate || dateKey >= dateRange.startDate) && (!dateRange.endDate || dateKey <= dateRange.endDate);
  });
}

function normalizeDateRange(startDate, endDate) {
  const normalizedStart = normalizeDateKey(startDate);
  const normalizedEnd = normalizeDateKey(endDate);
  return {
    startDate: normalizedStart,
    endDate: normalizedEnd && normalizedStart && normalizedEnd < normalizedStart ? normalizedStart : normalizedEnd
  };
}

function normalizeDateKey(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
}

function getEventDateKey(event) {
  return getPacificDateKey(new Date(event.recorded_at || event.started_at || event.date || Date.now()));
}

function getLocalDateKey(date) {
  return getPacificDateKey(date);
}

function getPacificDateKey(date) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    day: "2-digit",
    month: "2-digit",
    timeZone: reportTimeZone,
    year: "numeric"
  }).formatToParts(date).reduce((next, part) => {
    if (part.type !== "literal") next[part.type] = part.value;
    return next;
  }, {});
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function addDaysToDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, "0"),
    String(date.getUTCDate()).padStart(2, "0")
  ].join("-");
}

function getActiveDuration(event) {
  const durationMs = Number(event.duration_ms || 0);
  if (event.active_duration_ms === undefined || event.active_duration_ms === null) {
    return Math.min(durationMs, idleStopMs);
  }
  return Math.min(durationMs, Number(event.active_duration_ms || 0));
}

function isExcludedReportEmail(email) {
  return excludedReportEmails.has(normalizeEmail(email));
}

function isAnonymousVisitorEmail(email) {
  return normalizeEmail(email).endsWith("@anonymous.intuisity");
}

function isSiteVisitEvent(event) {
  return event.module_id === "site-visit" || event.module_id === "profile-signup" || event.module_id === "login" || event.module_label === "Website Visit" || event.module_label === "Profile Signup" || event.module_label === "Login";
}

function getVisitorKey(event) {
  const email = normalizeEmail(event.email);
  if (email) return email;
  const visitorId = event.event_json?.visitorId || event.event_json?.visitor_id || "";
  return visitorId ? `anonymous:${visitorId}` : "";
}

function normalizePlatformChannel(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized.includes("app") || normalized.includes("reactnative")) return "app";
  if (normalized.includes("mobile")) return "mobile-web";
  return "desktop-web";
}

function getPlatformLabel(channel) {
  if (channel === "app") return "App";
  if (channel === "mobile-web") return "Mobile Web";
  return "Desktop Web";
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
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

module.exports = {
  buildAdminReport,
  buildUserInsightsCsv
};
