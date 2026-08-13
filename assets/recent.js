/* LiczMat website — which calculators this browser actually used, and when.
 *
 * Master plan, session 14: the dashboard shows "ostatnio używane narzędzia". Nothing on
 * the site knew that. The workspace (assets/workspace.js) records what was *saved* into a
 * project; opening a calculator and reading the answer saves nothing, and that is the
 * normal case — chapter II says a calculator must work without an account and without
 * being told to keep anything.
 *
 * So this is a separate, deliberately small store:
 *
 *   liczmat-recent-calcs   [{ id, at }, …]  newest first, at most LM_RECENT_MAX
 *
 * It is **device-local and never synced**. It is not a Firestore document and must not
 * become one: docs/FIRESTORE_SYNC.md defines the three collections the phone and the site
 * share, and a list of which tools somebody clicked is not one of them. It is also not a
 * calculation — no inputs, no results, no prices are kept here, only a calculator id and
 * a timestamp, so nothing private leaves the visitor's own browser and nothing here can
 * contradict a saved estimate.
 *
 * Listed on /cookies/ next to the other liczmat-* keys.
 */

var LM_RECENT_KEY = "liczmat-recent-calcs";

/** How many tools the list keeps. The dashboard shows four; the rest are the tail. */
var LM_RECENT_MAX = 8;

/**
 * The list, newest first. A corrupt, absent or hand-edited store reads as an empty one —
 * the dashboard has an empty state anyway, and a broken key must not break the page.
 */
function lmRecentRead() {
  var raw;
  try { raw = localStorage.getItem(LM_RECENT_KEY); } catch (e) { return []; }
  if (!raw) return [];
  var rows;
  try { rows = JSON.parse(raw); } catch (e) { return []; }
  if (!Array.isArray(rows)) return [];
  return rows
    .filter(function (r) { return r && typeof r.id === "string" && r.id && isFinite(r.at); })
    .map(function (r) { return { id: r.id, at: Number(r.at) }; })
    .sort(function (a, b) { return b.at - a.at; })
    .slice(0, LM_RECENT_MAX);
}

/**
 * Record that a calculator was used, and move it to the front.
 *
 * One entry per calculator: the list answers "which tools do you reach for", so the same
 * calculator used twice is one row with the later time, not two rows pushing everything
 * else out.
 *
 * @param {string} calcId an id from CALCS (assets/calculators.js)
 * @param {number} [now] millis, for the test
 * @returns {object[]} the new list
 */
function lmRecentPush(calcId, now) {
  var id = String(calcId || "");
  if (!id) return lmRecentRead();
  var when = now === undefined ? Date.now() : now;
  var rows = lmRecentRead().filter(function (r) { return r.id !== id; });
  rows.unshift({ id: id, at: when });
  rows = rows.slice(0, LM_RECENT_MAX);
  try {
    localStorage.setItem(LM_RECENT_KEY, JSON.stringify(rows));
  } catch (e) {
    // Private mode or a full quota: the calculator still works, nothing is remembered.
    return rows;
  }
  if (typeof document !== "undefined" && typeof CustomEvent === "function") {
    document.dispatchEvent(new CustomEvent("lm-recent", { detail: { list: rows } }));
  }
  return rows;
}

/** Forget the list. The dashboard offers this; it is the visitor's own history. */
function lmRecentClear() {
  try { localStorage.removeItem(LM_RECENT_KEY); } catch (e) {}
  if (typeof document !== "undefined" && typeof CustomEvent === "function") {
    document.dispatchEvent(new CustomEvent("lm-recent", { detail: { list: [] } }));
  }
}

/* A calculator page dispatches `calcresult` on every render, including the silent one on
   load that turns the server-rendered answer into a live result object. `byHand` is the
   difference between the page catching up with itself and somebody pressing "Policz" —
   only the second one is the visitor using the tool. */
if (typeof document !== "undefined") {
  document.addEventListener("calcresult", function (e) {
    if (!e.detail || !e.detail.byHand) return;
    var card = e.detail.card;
    if (card && card.dataset && card.dataset.calc) lmRecentPush(card.dataset.calc);
  });
}
