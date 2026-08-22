const { supabaseRequest } = require("./supabase");

const visitMergeWindowMs = 30 * 60 * 1000;

const excludedReportEmails = new Set(["admin@intuisity.com", "kathy@intuisity.com"]);
const ownerTestEmails = new Set([
  "admin@intuisity.com",
  "kathy@intuisity.com",
  "kathy@kathykennedy.biz",
  ...String(process.env.INTUISITY_OWNER_EMAILS || "").split(",").map((email) => email.trim().toLowerCase()).filter(Boolean)
]);
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
  const userProfiles = allProfiles.filter((profile) => profile.email && !isAnonymousVisitorEmail(profile.email));
  const analyticsEvents = allAnalyticsEvents.filter(
    (event) => !isExcludedReportEmail(event.email) && !isLikelyBotEvent(event)
  );
  const dailyResults = allDailyResults.filter((entry) => !isExcludedReportEmail(entry.email));
  const moduleFeedback = allModuleFeedback.filter((entry) => !isExcludedReportEmail(entry.email));
  const friends = allFriends.filter((entry) => !isExcludedReportEmail(entry.email));

  const dateRange = normalizeDateRange(options.startDate, options.endDate);
  const rangedAnalyticsEvents = filterEventsByDateRange(analyticsEvents, dateRange);
  const visitorEvents = buildVisitorEvents(analyticsEvents, profiles);
  const rangedVisitorEvents = filterEventsByDateRange(visitorEvents, dateRange);
  const volume = buildVisitorVolume(visitorEvents, dateRange);
  const visitorTrend = buildVisitorTrend(rangedVisitorEvents);
  const platformBreakdown = buildPlatformBreakdown(rangedVisitorEvents);
  const geographicAreas = buildGeographicAreas(userProfiles);
  const visitorGeographicAreas = buildVisitorGeographicAreas(rangedVisitorEvents.filter((event) => !isOwnerTestEvent(event)), userProfiles);
  const acquisitionSources = buildAcquisitionSources(rangedVisitorEvents.filter((event) => !isOwnerTestEvent(event)));
  const acquisitionDetails = buildAcquisitionDetails(rangedVisitorEvents.filter((event) => !isOwnerTestEvent(event)));
  const ownerTestVisitors = countUniqueVisitors(rangedVisitorEvents.filter(isOwnerTestEvent));
  const audienceUniqueVisitors = countUniqueVisitors(rangedVisitorEvents.filter((event) => !isOwnerTestEvent(event)));
  const rangedModuleEvents = rangedAnalyticsEvents.filter(isModuleTimeEvent);
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
  const userInsights = buildUserInsights({ analyticsEvents: rangedAnalyticsEvents, dailyResults, friends, moduleFeedback, profiles: userProfiles });
  const premiumInterest = buildPremiumInterest(rangedAnalyticsEvents, userProfiles);
  const knownUserCount = countKnownUsers({ analyticsEvents, dailyResults, friends, moduleFeedback, profiles: userProfiles });
  const visitorInsights = buildVisitorInsights(rangedVisitorEvents, userProfiles);

  return {
    totalUsers: knownUserCount,
    totalVisits: countLogicalVisits(rangedVisitorEvents.filter(isSiteVisitEvent)),
    uniqueVisitors: countUniqueVisitors(rangedVisitorEvents),
    audienceUniqueVisitors,
    ownerTestVisitors,
    visitorVolume: volume,
    visitorTrend,
    platformBreakdown,
    geographicAreas,
    visitorGeographicAreas,
    acquisitionSources,
    acquisitionDetails,
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
    premiumInterest,
    userInsights,
    visitorInsights
  };
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

  return reconcileAnonymousVisitors([...analyticsEvents, ...profileEvents]);
}

function reconcileAnonymousVisitors(events) {
  const visitorIdToEmail = new Map();
  events.forEach((event) => {
    const email = normalizeEmail(event.email);
    const visitorId = event.event_json?.visitorId || event.event_json?.visitor_id || "";
    if (visitorId && email && !isAnonymousVisitorEmail(email)) visitorIdToEmail.set(String(visitorId), email);
  });
  return events.map((event) => {
    const email = normalizeEmail(event.email);
    const visitorId = event.event_json?.visitorId || event.event_json?.visitor_id || "";
    const signedInEmail = visitorId ? visitorIdToEmail.get(String(visitorId)) : "";
    return signedInEmail && isAnonymousVisitorEmail(email) ? { ...event, email: signedInEmail } : event;
  });
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

async function buildUserInsightsCsv(options = {}) {
  const report = await buildAdminReport(options);
  const headers = [
    "Name",
    "Email",
    "Account Source",
    "Phone",
    "Language",
    "Current City",
    "Current State",
    "Current Country",
    "Age",
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
      row.accountSource,
      row.phone,
      row.language,
      row.currentCity,
      row.currentState,
      row.currentCountry,
      row.age ?? "",
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
      name: resolveProfileField(profile, "name"),
      email,
      accountSource: resolveProfileField(profile, "auth_provider", "authProvider") === "google" ? "Google" : "Email",
      phone: resolveProfileField(profile, "phone"),
      language: resolveProfileField(profile, "language"),
      currentCity: resolveProfileField(profile, "current_city", "currentCity"),
      currentState: resolveProfileField(profile, "current_state", "currentState"),
      currentCountry: resolveProfileField(profile, "current_country", "currentCountry"),
      age: calculateAge(resolveProfileField(profile, "birthdate")),
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

function countKnownUsers(sources) {
  return collectKnownEmails(sources).length;
}

function isLikelyBotEvent(event) {
  const payload = event?.event_json || {};
  const userAgent = String(payload.userAgent || payload.user_agent || "");
  return payload.isLikelyBot === true || /bot|crawler|spider|headless|slurp|bingpreview|facebookexternalhit|whatsapp|discordbot|telegrambot|lighthouse|pagespeed|google-inspectiontool|semrush|ahrefs|mj12bot|dotbot|petalbot|yandex|baidu|duckduckbot|applebot|uptimerobot|vercel-screenshot/i.test(userAgent);
}

function collectKnownEmails({ analyticsEvents = [], dailyResults = [], friends = [], moduleFeedback = [], profiles = [] }) {
  const emails = new Set();
  profiles.forEach((profile) => {
    const email = normalizeEmail(profile.email);
    if (email && !isAnonymousVisitorEmail(email)) emails.add(email);
  });
  [analyticsEvents, dailyResults, moduleFeedback, friends].forEach((rows) => {
    rows.forEach((row) => {
      const email = normalizeEmail(row.email);
      if (email && !isExcludedReportEmail(email) && !isAnonymousVisitorEmail(email)) emails.add(email);
    });
  });
  return [...emails].sort();
}

function buildVisitorInsights(events, profiles) {
  const profileByEmail = new Map(profiles.map((profile) => [normalizeEmail(profile.email), profile]));
  const visitors = new Map();

  events.forEach((event) => {
    const key = getVisitorKey(event);
    if (!key) return;
    const email = normalizeEmail(event.email);
    const anonymous = isAnonymousVisitorEmail(email);
    const profile = anonymous ? null : profileByEmail.get(email);
    const recordedAt = event.recorded_at || event.started_at || "";
    const current = visitors.get(key) || {
      key,
      name: resolveProfileField(profile, "name") || (anonymous ? "Anonymous visitor" : "Signed-in visitor"),
      email: anonymous ? "" : email,
      visitorId: anonymous ? (event.event_json?.visitorId || event.event_json?.visitor_id || email.split("@")[0]) : "",
      platform: getPlatformLabel(normalizePlatformChannel(event.event_json?.clientChannel || event.event_json?.deviceCategory || event.module_id)),
      source: getAcquisitionSource(event).label,
      currentLocation: profile ? [resolveProfileField(profile, "current_city", "currentCity"), resolveProfileField(profile, "current_state", "currentState"), resolveProfileField(profile, "current_country", "currentCountry")].filter(Boolean).join(", ") : "",
      isOwnerTest: isOwnerTestEvent(event),
      visitTimestamps: [],
      eventCount: 0,
      siteTimeMs: 0,
      siteActiveTimeMs: 0,
      legacyTimeMs: 0,
      legacyActiveTimeMs: 0,
      firstSeenAt: recordedAt,
      lastSeenAt: recordedAt
    };
    current.eventCount += 1;
    if (isSiteVisitEvent(event) && recordedAt) current.visitTimestamps.push(recordedAt);
    if (isSiteTimeEvent(event)) {
      current.siteTimeMs += Number(event.duration_ms || 0);
      current.siteActiveTimeMs += getActiveDuration(event);
    } else if (isModuleTimeEvent(event)) {
      current.legacyTimeMs += Number(event.duration_ms || 0);
      current.legacyActiveTimeMs += getActiveDuration(event);
    }
    if (isOwnerTestEvent(event)) current.isOwnerTest = true;
    if (recordedAt && (!current.firstSeenAt || recordedAt < current.firstSeenAt)) {
      current.firstSeenAt = recordedAt;
      current.source = getAcquisitionSource(event).label;
    }
    if (recordedAt && (!current.lastSeenAt || recordedAt > current.lastSeenAt)) current.lastSeenAt = recordedAt;
    visitors.set(key, current);
  });

  return [...visitors.values()]
    .map(({ eventCount, visitTimestamps, siteTimeMs, siteActiveTimeMs, legacyTimeMs, legacyActiveTimeMs, ...visitor }) => ({
      ...visitor,
      visits: countMergedVisitTimestamps(visitTimestamps) || (eventCount ? 1 : 0),
      totalTimeMs: siteTimeMs || legacyTimeMs,
      totalActiveTimeMs: siteActiveTimeMs || legacyActiveTimeMs
    }))
    .sort((a, b) => new Date(b.lastSeenAt || 0).getTime() - new Date(a.lastSeenAt || 0).getTime());
}

async function selectAll(table) {
  return fetchAllPages((offset, pageSize) =>
    supabaseRequest(`/${table}?select=*&limit=${pageSize}&offset=${offset}`)
  );
}

async function fetchAllPages(fetchPage, pageSize = 1000) {
  const rows = [];
  let offset = 0;

  while (true) {
    const page = await fetchPage(offset, pageSize);
    const pageRows = Array.isArray(page) ? page : [];
    rows.push(...pageRows);
    if (pageRows.length < pageSize) return rows;
    offset += pageSize;
  }
}

function buildVisitorVolume(events, dateRange) {
  const today = getReportingDateKey(new Date());
  const weekStart = shiftDateKey(today, -6);
  const monthStart = shiftDateKey(today, -29);

  return {
    today: countUniqueVisitors(filterEventsSince(events, today)),
    week: countUniqueVisitors(events.filter((event) => getEventDateKey(event) >= weekStart)),
    month: countUniqueVisitors(events.filter((event) => getEventDateKey(event) >= monthStart)),
    range: countUniqueVisitors(filterEventsByDateRange(events, dateRange))
  };
}

function buildVisitorTrend(events) {
  const dayMap = new Map();
  events.forEach((event) => {
    const date = getEventDateKey(event);
    const current = dayMap.get(date) || { date, visitEvents: [], visitorEmails: new Set() };
    if (isSiteVisitEvent(event)) current.visitEvents.push(event);
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
      visits: countLogicalVisits(day.visitEvents)
    }));
}

function buildPlatformBreakdown(events) {
  const platformMap = new Map();

  events.forEach((event) => {
    const channel = normalizePlatformChannel(event.event_json?.clientChannel || event.event_json?.deviceCategory || event.module_id);
    const current = platformMap.get(channel) || {
      channel,
      label: getPlatformLabel(channel),
      visitEvents: [],
      visitorEmails: new Set()
    };
    if (isSiteVisitEvent(event)) current.visitEvents.push(event);
    const visitorKey = getVisitorKey(event);
    if (visitorKey) current.visitorEmails.add(visitorKey);
    platformMap.set(channel, current);
  });

  return ["desktop-web", "mobile-web", "app"]
    .map((channel) => platformMap.get(channel) || { channel, label: getPlatformLabel(channel), visitEvents: [], visitorEmails: new Set() })
    .map((entry) => ({
      channel: entry.channel,
      label: entry.label,
      visits: countLogicalVisits(entry.visitEvents),
      uniqueVisitors: entry.visitorEmails.size
    }));
}

function countLogicalVisits(events) {
  const timestampsByVisitor = new Map();
  events.forEach((event) => {
    const key = getVisitorKey(event);
    const timestamp = event.recorded_at || event.started_at || "";
    if (!key || !timestamp) return;
    const timestamps = timestampsByVisitor.get(key) || [];
    timestamps.push(timestamp);
    timestampsByVisitor.set(key, timestamps);
  });
  let visits = 0;
  timestampsByVisitor.forEach((timestamps) => { visits += countMergedVisitTimestamps(timestamps); });
  return visits;
}

function countMergedVisitTimestamps(timestamps) {
  const times = timestamps
    .map((timestamp) => new Date(timestamp).getTime())
    .filter(Number.isFinite)
    .sort((a, b) => a - b);
  if (!times.length) return 0;
  let visits = 1;
  let previous = times[0];
  for (let index = 1; index < times.length; index += 1) {
    if (times[index] - previous > visitMergeWindowMs) visits += 1;
    previous = times[index];
  }
  return visits;
}

function countUniqueVisitors(events) {
  return new Set(events.map(getVisitorKey).filter(Boolean)).size;
}

function filterEventsSince(events, dateKey) {
  return events.filter((event) => getEventDateKey(event) === dateKey);
}

function filterEventsFromDate(events, startDate) {
  const startKey = getLocalDateKey(startDate);
  return events.filter((event) => getEventDateKey(event) >= startKey);
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
  if (event.date) return String(event.date).slice(0, 10);
  return getLocalDateKey(new Date(event.recorded_at || event.started_at || Date.now()));
}

function getLocalDateKey(date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function buildVisitorGeographicAreas(events, profiles) {
  const profileByEmail = new Map(profiles.map((profile) => [normalizeEmail(profile.email), profile]));
  const locationByVisitor = new Map();
  events.forEach((event) => {
    const visitorKey = getVisitorKey(event);
    if (!visitorKey || locationByVisitor.has(visitorKey)) return;
    const requestGeography = event.event_json?.requestGeography || event.event_json?.request_geography || {};
    const email = normalizeEmail(event.email);
    const profile = profileByEmail.get(email);
    const city = String(requestGeography.city || resolveProfileField(profile, "current_city", "currentCity") || "").trim();
    const state = String(requestGeography.region || requestGeography.state || resolveProfileField(profile, "current_state", "currentState") || "").trim();
    const rawCountry = String(requestGeography.country || resolveProfileField(profile, "current_country", "currentCountry") || "").trim();
    const country = getCountryDisplayName(rawCountry);
    if (city || state || country) locationByVisitor.set(visitorKey, { email: `${visitorKey}@visitor.intuisity`, current_city: city, current_state: state, current_country: country });
  });
  const geography = buildGeographicAreas([...locationByVisitor.values()]);
  return {
    cities: geography.cities,
    countries: geography.countries,
    states: geography.states,
    totalVisitors: countUniqueVisitors(events),
    usersWithLocation: geography.usersWithLocation
  };
}

function getCountryDisplayName(country) {
  const cleanCountry = String(country || "").trim();
  if (!/^[A-Za-z]{2}$/.test(cleanCountry)) return cleanCountry;
  try {
    return new Intl.DisplayNames(["en"], { type: "region" }).of(cleanCountry.toUpperCase()) || cleanCountry.toUpperCase();
  } catch {
    return cleanCountry.toUpperCase();
  }
}

function buildAcquisitionSources(events) {
  const firstEventByVisitor = new Map();
  events.forEach((event) => {
    const key = getVisitorKey(event);
    if (!key) return;
    const recordedAt = event.recorded_at || event.started_at || "";
    const current = firstEventByVisitor.get(key);
    if (!current || recordedAt < (current.recorded_at || current.started_at || "")) firstEventByVisitor.set(key, event);
  });
  const sources = new Map();
  firstEventByVisitor.forEach((event) => {
    const source = getAcquisitionSource(event);
    const current = sources.get(source.source) || { ...source, uniqueVisitors: 0 };
    current.uniqueVisitors += 1;
    sources.set(source.source, current);
  });
  return [...sources.values()].sort((a, b) => b.uniqueVisitors - a.uniqueVisitors || a.label.localeCompare(b.label));
}

function getAcquisitionSource(event) {
  const payload = event?.event_json || {};
  const referrer = String(payload.referrer || "").toLowerCase();
  const utmSource = String(payload.utmSource || payload.utm_source || "").trim();
  if (payload.treasureInvite === true || /[?&](treasureInvite=1|challenge=)/i.test(String(payload.landingPath || ""))) return { source: "friend-challenge", label: "Friend/Treasure Chest invite" };
  if (utmSource) return { source: `campaign:${utmSource.toLowerCase()}`, label: `Campaign: ${utmSource}` };
  if (/google\.|bing\.|yahoo\.|duckduckgo\.|ecosia\.|search\.brave\./.test(referrer)) return { source: "search", label: "Search engine" };
  if (/facebook\.|instagram\.|tiktok\.|linkedin\.|twitter\.|x\.com|pinterest\.|youtube\./.test(referrer)) return { source: "social", label: "Social media" };
  if (referrer && !/intuisity\.com/.test(referrer)) return { source: "referral", label: "Other website/referral" };
  const channel = normalizePlatformChannel(payload.clientChannel || payload.deviceCategory || event.module_id);
  if (channel === "app") return { source: "app", label: "Opened the app" };
  return { source: "direct", label: "Direct or unknown" };
}

function buildAcquisitionDetails(events) {
  const firstEventByVisitor = new Map();
  events.forEach((event) => {
    const key = getVisitorKey(event);
    if (!key) return;
    const recordedAt = event.recorded_at || event.started_at || "";
    const current = firstEventByVisitor.get(key);
    if (!current || recordedAt < (current.recorded_at || current.started_at || "")) firstEventByVisitor.set(key, event);
  });
  const details = new Map();
  firstEventByVisitor.forEach((event) => {
    const payload = event.event_json || {};
    const source = getAcquisitionSource(event);
    const referrer = String(payload.referrer || "");
    let referrerHost = "";
    try { referrerHost = referrer ? new URL(referrer).hostname.replace(/^www\./, "") : ""; } catch { referrerHost = ""; }
    const searchLabel = /google\./i.test(referrer) ? "Google search" : /bing\./i.test(referrer) ? "Bing search" : /duckduckgo\./i.test(referrer) ? "DuckDuckGo search" : /yahoo\./i.test(referrer) ? "Yahoo search" : "";
    const detail = {
      source: source.source,
      label: searchLabel || source.label,
      landingPage: String(payload.landingPath || "/").split("?")[0] || "/",
      referrer: referrerHost,
      campaign: String(payload.utmCampaign || payload.utm_campaign || ""),
      keyword: String(payload.utmTerm || payload.utm_term || ""),
      medium: String(payload.utmMedium || payload.utm_medium || "")
    };
    const key = [detail.source, detail.landingPage, detail.referrer, detail.campaign, detail.keyword, detail.medium].join("|").toLowerCase();
    const current = details.get(key) || { ...detail, uniqueVisitors: 0 };
    current.uniqueVisitors += 1;
    details.set(key, current);
  });
  return [...details.values()].sort((a, b) => b.uniqueVisitors - a.uniqueVisitors || a.label.localeCompare(b.label));
}

function buildGeographicAreas(profiles) {
  const uniqueProfiles = new Map();
  profiles.forEach((profile) => {
    const email = normalizeEmail(profile.email);
    if (!email || isExcludedReportEmail(email) || isAnonymousVisitorEmail(email)) return;
    uniqueProfiles.set(email, profile);
  });

  const countries = new Map();
  const states = new Map();
  const cities = new Map();
  let usersWithLocation = 0;

  uniqueProfiles.forEach((profile) => {
    const country = String(resolveProfileField(profile, "current_country", "currentCountry") || "").trim();
    const state = String(resolveProfileField(profile, "current_state", "currentState") || "").trim();
    const city = String(resolveProfileField(profile, "current_city", "currentCity") || "").trim();
    if (!country && !state && !city) return;
    usersWithLocation += 1;
    incrementArea(countries, country);
    incrementArea(states, state ? [state, country].filter(Boolean).join(", ") : "");
    incrementArea(cities, city ? [city, state || country].filter(Boolean).join(", ") : "");
  });

  return {
    cities: rankAreas(cities),
    countries: rankAreas(countries),
    states: rankAreas(states),
    totalUsers: uniqueProfiles.size,
    usersWithLocation
  };
}

function incrementArea(areas, label) {
  const cleanLabel = String(label || "").trim();
  if (!cleanLabel) return;
  const key = cleanLabel.toLocaleLowerCase("en-US");
  const current = areas.get(key) || { count: 0, label: cleanLabel };
  current.count += 1;
  areas.set(key, current);
}

function rankAreas(areas) {
  return [...areas.values()].sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)).slice(0, 20);
}

function buildPremiumInterest(analyticsEvents, profiles) {
  const profileByEmail = new Map(profiles.map((profile) => [normalizeEmail(profile.email), profile]));
  const interestByEmail = new Map();
  analyticsEvents
    .filter((event) => event.module_id === "premium-interest")
    .forEach((event) => {
      const email = normalizeEmail(event.email);
      if (!email || isAnonymousVisitorEmail(email)) return;
      const requestedAt = event.recorded_at || event.started_at || "";
      const existing = interestByEmail.get(email);
      if (existing && existing.requestedAt >= requestedAt) return;
      const profile = profileByEmail.get(email);
      interestByEmail.set(email, {
        email,
        name: event.event_json?.name || resolveProfileField(profile, "name"),
        phone: event.event_json?.phone || resolveProfileField(profile, "phone"),
        requestedAt,
        platform: getPlatformLabel(normalizePlatformChannel(event.event_json?.clientChannel || event.event_json?.deviceCategory || event.module_id))
      });
    });
  return [...interestByEmail.values()].sort((a, b) => new Date(b.requestedAt || 0).getTime() - new Date(a.requestedAt || 0).getTime());
}

function getReportingDateKey(date, timeZone = process.env.INTUISITY_REPORT_TIME_ZONE || "America/Los_Angeles") {
  const parts = new Intl.DateTimeFormat("en-US", {
    day: "2-digit",
    month: "2-digit",
    timeZone,
    year: "numeric"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function shiftDateKey(dateKey, days) {
  const date = new Date(`${dateKey}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return [date.getUTCFullYear(), String(date.getUTCMonth() + 1).padStart(2, "0"), String(date.getUTCDate()).padStart(2, "0")].join("-");
}

function getActiveDuration(event) {
  const fallbackActiveMs = event?.event_json?.activeDurationMs;
  if (event.active_duration_ms != null) return Number(event.active_duration_ms);
  if (fallbackActiveMs != null) return Number(fallbackActiveMs);
  return Number(event.duration_ms || 0);
}

function isExcludedReportEmail(email) {
  return excludedReportEmails.has(normalizeEmail(email));
}

function isModuleTimeEvent(event) {
  return moduleOrder.includes(String(event?.module_label || ""));
}

function isSiteVisitEvent(event) {
  return event?.module_id === "site-visit" || event?.module_label === "Website Visit";
}

function isSiteTimeEvent(event) {
  return event?.module_id === "site-session" || event?.module_label === "Website Session";
}

function isOwnerTestEvent(event) {
  return ownerTestEmails.has(normalizeEmail(event?.email)) || event?.event_json?.isOwnerTest === true;
}

function isAnonymousVisitorEmail(email) {
  return normalizeEmail(email).endsWith("@anonymous.intuisity");
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

function resolveProfileField(profile, columnName, profileJsonName = columnName) {
  const directValue = profile?.[columnName];
  if (directValue !== undefined && directValue !== null && String(directValue).trim()) return directValue;
  const profileJson = profile?.profile_json && typeof profile.profile_json === "object" ? profile.profile_json : {};
  const savedValue = profileJson?.[profileJsonName];
  return savedValue !== undefined && savedValue !== null ? savedValue : "";
}

function calculateAge(birthdate, today = new Date()) {
  const text = String(birthdate || "").trim();
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/) || text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const isoFormat = text.includes("-");
  const year = Number(isoFormat ? match[1] : match[3]);
  const month = Number(isoFormat ? match[2] : match[1]);
  const day = Number(isoFormat ? match[3] : match[2]);
  const parsed = new Date(year, month - 1, day);
  if (parsed.getFullYear() !== year || parsed.getMonth() !== month - 1 || parsed.getDate() !== day || parsed > today) return null;
  let age = today.getFullYear() - year;
  if (today.getMonth() + 1 < month || (today.getMonth() + 1 === month && today.getDate() < day)) age -= 1;
  return age;
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
  buildAcquisitionSources,
  buildAcquisitionDetails,
  buildGeographicAreas,
  buildModuleDailyTrend,
  buildVisitorGeographicAreas,
  buildVisitorInsights,
  buildPremiumInterest,
  buildUserInsightsCsv,
  collectKnownEmails,
  countLogicalVisits,
  fetchAllPages,
  getReportingDateKey,
  reconcileAnonymousVisitors,
  resolveProfileField
};
