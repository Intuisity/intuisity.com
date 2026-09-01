const handlers = {
  "birth-location": require("../server/birth-location-api"),
  "person-portrait": require("../server/person-portrait-api"),
  "module-feedback": require("../server/module-feedback-api"),
  "public-config": require("../server/public-config-api"),
  "account-deletion": require("../server/account-deletion-api")
};

module.exports = async function handler(request, response) {
  const endpoint = String(request.query?.endpoint || "");
  const selectedHandler = handlers[endpoint];
  if (!selectedHandler) return response.status(404).json({ error: "Endpoint not found" });
  return selectedHandler(request, response);
};
