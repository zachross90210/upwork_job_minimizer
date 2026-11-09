const LEGACY_KEY = "minimizedOpeningUids";
const META_KEY = "ujm_n";
const CHUNK_PREFIX = "ujm_c";
const MAX_ITEM_BYTES = 7000;

let minimized = {};
let scanTimer = 0;
let loadTimer = 0;

function isFeedPage() {
  return location.pathname.startsWith("/nx/find-work/my-feed");
}

function jobSections() {
  return document.querySelectorAll(
    "section.air3-card-section[data-ev-opening_uid]"
  );
}

function jobLink(section) {
  return section.querySelector("h3.job-tile-title a");
}

function jobTitle(section) {
  const link = jobLink(section);
  return link ? link.textContent.trim() : "Job";
}

function chunkBytes(uids) {
  return JSON.stringify(uids).length;
}

function buildChunks(uids) {
  const chunks = [];
  let current = [];
  for (const uid of uids) {
    const next = current.concat(uid);
    if (current.length && chunkBytes(next) > MAX_ITEM_BYTES) {
      chunks.push(current);
      current = [uid];
    } else {
      current = next;
    }
  }
  chunks.push(current);
  return chunks;
}

function isUjmKey(key) {
  return (
    key === META_KEY ||
    key === LEGACY_KEY ||
    (typeof key === "string" && key.startsWith(CHUNK_PREFIX))
  );
}

function parseStored(data) {
  const next = {};
  if (typeof data[META_KEY] === "number") {
    for (let i = 0; i < data[META_KEY]; i++) {
      const chunk = data[CHUNK_PREFIX + i];
      if (!Array.isArray(chunk)) continue;
      for (const uid of chunk) {
        if (uid) next[uid] = true;
      }
    }
    return next;
  }

  const legacy = data[LEGACY_KEY];
  if (legacy && typeof legacy === "object" && !Array.isArray(legacy)) {
    for (const uid of Object.keys(legacy)) {
      if (legacy[uid]) next[uid] = true;
    }
  }
  return next;
}

function persist() {
  const uids = Object.keys(minimized);
  const chunks = uids.length ? buildChunks(uids) : [];
  const payload = { [META_KEY]: chunks.length };
  chunks.forEach((chunk, i) => {
    payload[CHUNK_PREFIX + i] = chunk;
  });

  chrome.storage.sync.get(null, (all) => {
    if (chrome.runtime.lastError) {
      console.warn("ujm storage", chrome.runtime.lastError.message);
      return;
    }

    const remove = Object.keys(all || {}).filter((key) => {
      if (key === LEGACY_KEY) return true;
      if (!key.startsWith(CHUNK_PREFIX)) return false;
      const index = Number(key.slice(CHUNK_PREFIX.length));
      return !Number.isInteger(index) || index >= chunks.length;
    });

    const finish = () => {
      chrome.storage.sync.set(payload, () => {
        if (chrome.runtime.lastError) {
          console.warn("ujm storage", chrome.runtime.lastError.message);
        }
      });
    };

    if (remove.length) {
      chrome.storage.sync.remove(remove, finish);
    } else {
      finish();
    }
  });
}

function loadMinimized() {
  chrome.storage.sync.get(null, (data) => {
    if (chrome.runtime.lastError) {
      console.warn("ujm storage", chrome.runtime.lastError.message);
      minimized = {};
      scan();
      return;
    }

    minimized = parseStored(data || {});
    scan();

    if (data && data[LEGACY_KEY] != null && typeof data[META_KEY] !== "number") {
      persist();
    }
  });
}

function applySection(section) {
  const uid = section.getAttribute("data-ev-opening_uid");
  if (!uid) return;

  const hidden = minimized[uid] === true;
  section.classList.toggle("ujm-minimized", hidden);

  const button = section.querySelector(":scope > .ujm-bar .ujm-toggle");
  if (button) {
    const label = hidden ? "Show job" : "Hide job";
    button.textContent = hidden ? "Show" : "Hide";
    button.setAttribute("aria-pressed", hidden ? "true" : "false");
    button.setAttribute("aria-label", label);
  }

  const title = section.querySelector(":scope > .ujm-bar .ujm-title");
  const link = jobLink(section);
  if (title && link) {
    const text = jobTitle(section);
    if (title.textContent !== text) title.textContent = text;
    const href = link.getAttribute("href") || "";
    if (title.getAttribute("href") !== href) title.setAttribute("href", href);
  }
}

function ensureBar(section) {
  if (section.querySelector(":scope > .ujm-bar")) return;

  const bar = document.createElement("div");
  bar.className = "ujm-bar";

  const button = document.createElement("button");
  button.type = "button";
  button.className = "ujm-toggle";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    const uid = section.getAttribute("data-ev-opening_uid");
    if (!uid) return;
    if (minimized[uid]) delete minimized[uid];
    else minimized[uid] = true;
    applySection(section);
    persist();
  });

  const title = document.createElement("a");
  title.className = "ujm-title";

  bar.append(button, title);
  section.prepend(bar);
}

function scan() {
  if (!isFeedPage()) return;
  jobSections().forEach((section) => {
    ensureBar(section);
    applySection(section);
  });
}

function scheduleScan() {
  window.clearTimeout(scanTimer);
  scanTimer = window.setTimeout(scan, 50);
}

function hookHistory() {
  const push = history.pushState;
  const replace = history.replaceState;
  history.pushState = function () {
    const result = push.apply(this, arguments);
    scheduleScan();
    return result;
  };
  history.replaceState = function () {
    const result = replace.apply(this, arguments);
    scheduleScan();
    return result;
  };
  window.addEventListener("popstate", scheduleScan);
}

hookHistory();

const observer = new MutationObserver(scheduleScan);
observer.observe(document.documentElement, { childList: true, subtree: true });

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  if (!Object.keys(changes).some(isUjmKey)) return;
  window.clearTimeout(loadTimer);
  loadTimer = window.setTimeout(loadMinimized, 100);
});

loadMinimized();
