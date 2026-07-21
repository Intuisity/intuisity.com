const http = require("http");
const {
  addAnalyticsEvent,
  getAdminReport,
  getUserInsightsCsv,
  readDatabase,
  saveDailyAnswers,
  saveDailyResult,
  saveFriends,
  saveModuleFeedback,
  upsertProfile
} = require("./database");

const port = Number(process.env.INTUISITY_API_PORT || 4000);
const adminToken = process.env.INTUISITY_ADMIN_TOKEN || "";

const routes = {
  "GET /api/health": () => ({ status: "ok", service: "intuisity-backend" }),
  "GET /api/admin/report": () => getAdminReport(),
  "GET /api/admin/user-insights.csv": () => ({
    body: getUserInsightsCsv(),
    contentType: "text/csv; charset=utf-8",
    filename: "intuisity-user-insights.csv"
  }),
  "GET /api/admin/database": () => readDatabase(),
  "POST /api/profiles": (body) => {
    upsertProfile(body.profile || body);
    return { ok: true };
  },
  "POST /api/daily-answers": (body) => {
    saveDailyAnswers(body);
    return { ok: true };
  },
  "POST /api/daily-results": (body) => {
    saveDailyResult(body);
    return { ok: true };
  },
  "POST /api/analytics/module-time": (body) => {
    addAnalyticsEvent(body);
    return { ok: true };
  },
  "POST /api/module-feedback": (body) => {
    saveModuleFeedback(body);
    return { ok: true };
  },
  "POST /api/friends": (body) => {
    saveFriends(body);
    return { ok: true };
  }
};

const server = http.createServer(async (request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type");
  response.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (request.method === "OPTIONS") {
    response.writeHead(204);
    response.end();
    return;
  }

  const routeKey = `${request.method} ${new URL(request.url, `http://${request.headers.host}`).pathname}`;
  const route = routes[routeKey];

  if (!route) {
    sendJson(response, 404, { error: "Route not found" });
    return;
  }

  if (routeKey.startsWith("GET /api/admin/") && !isAuthorizedAdminRequest(request)) {
    sendJson(response, 403, { error: "Admin access only" });
    return;
  }

  try {
    const body = request.method === "POST" ? await readJsonBody(request) : {};
    sendResponse(response, 200, await route(body));
  } catch (error) {
    sendJson(response, 500, {
      error: "Backend error",
      message: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

server.listen(port, () => {
  console.log(`Intuisity backend running at http://localhost:${port}`);
});

function isAuthorizedAdminRequest(request) {
  if (adminToken) {
    const bearerToken = request.headers.authorization?.replace(/^Bearer\s+/i, "");
    return request.headers["x-intuisity-admin-token"] === adminToken || bearerToken === adminToken;
  }

  return ["127.0.0.1", "::1", "::ffff:127.0.0.1"].includes(request.socket.remoteAddress);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let rawBody = "";
    request.on("data", (chunk) => {
      rawBody += chunk;
      if (rawBody.length > 1_000_000) {
        reject(new Error("Request body is too large"));
      }
    });
    request.on("end", () => {
      try {
        resolve(rawBody ? JSON.parse(rawBody) : {});
      } catch {
        reject(new Error("Invalid JSON body"));
      }
    });
    request.on("error", reject);
  });
}

function sendResponse(response, status, payload) {
  if (payload?.contentType) {
    response.writeHead(status, {
      "Content-Type": payload.contentType,
      "Content-Disposition": payload.filename ? `attachment; filename="${payload.filename}"` : "attachment"
    });
    response.end(payload.body || "");
    return;
  }
  sendJson(response, status, payload);
}

function sendJson(response, status, payload) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(payload));
}
