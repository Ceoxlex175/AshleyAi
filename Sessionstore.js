// routes/sessionStore.js
// Very simple in-memory session store.
// For production use, swap this out for Redis, a database, etc.

const sessions = new Map();

function createSession(sessionId) {
  const session = {
    sessionId,
    createdAt: new Date().toISOString(),
    history: [],
  };
  sessions.set(sessionId, session);
  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId) || null;
}

function getOrCreateSession(sessionId) {
  return sessions.get(sessionId) || createSession(sessionId);
}

function appendToSession(sessionId, message) {
  const session = getOrCreateSession(sessionId);
  session.history.push(message);
  return session;
}

function deleteSession(sessionId) {
  return sessions.delete(sessionId);
}

module.exports = {
  createSession,
  getSession,
  getOrCreateSession,
  appendToSession,
  deleteSession,
};
