const BASE = () => site.replace(/\/$/, "") + "/api/greader.php";
const TOKEN_KEY = "auth_token";

// --- Auth ---

function getToken() {
 return getItem(TOKEN_KEY);
}

function fetchToken() {
 const url = BASE() + "/accounts/ClientLogin";
 const params = `Email=${encodeURIComponent(username)}&Passwd=${encodeURIComponent(api_password)}`;
 return sendRequest(url, "POST", params)
   .then((text) => {
     const match = text.match(/^Auth=(.+)$/m);
     if (!match) throw new Error("Authentication failed: no token in response.");
     const token = match[1].trim();
     setItem(TOKEN_KEY, token);
     return token;
   });
}

function authHeaders(token) {
 return { "Authorization": "GoogleLogin auth=" + token };
}

// --- Verify ---

function verify() {
 fetchToken()
   .then((token) => {
     return sendRequest(BASE() + "/reader/api/0/user-info", "GET", null, authHeaders(token));
   })
   .then((text) => {
     const userInfo = JSON.parse(text);
     const faviconUrl = site.replace(/\/$/, "") + "/favicon.ico";
     processVerification({
       displayName: userInfo.userEmail || username,
       icon: faviconUrl
     });
   })
   .catch((err) => {
     processError(err);
   });
}

// --- Load ---

function load() {
 const token = getToken();
 if (token) {
   loadUnread(token);
 } else {
   fetchToken().then(loadUnread).catch(processError);
 }
}

function loadUnread(token) {
 const headers = authHeaders(token);
 const count = Math.min(1000, Math.max(1, parseInt(batch_size, 10) || 50));
 const streamUrl = BASE() + "/reader/api/0/stream/contents/user/-/state/com.google/reading-list"
   + "?xt=user/-/state/com.google/read&n=" + count + "&output=json";
 const subsUrl = BASE() + "/reader/api/0/subscription/list?output=json";

 let iconMap = {};

 sendRequest(subsUrl, "GET", null, headers)
   .then((subsText) => {
     const subs = JSON.parse(subsText);
     for (const sub of (subs.subscriptions || [])) {
       if (sub.id && sub.iconUrl) {
         iconMap[sub.id] = sub.iconUrl;
       }
     }
     return sendRequest(streamUrl, "GET", null, headers);
   })
   .then((streamText) => {
     const stream = JSON.parse(streamText);
     const entries = stream.items || [];

     if (entries.length === 0) {
       processResults([]);
       return;
     }

     const results = entries.map((entry) => {
       const uri = canonicalUrl(entry) || entry.id;
       const date = new Date((entry.published || 0) * 1000);

       const item = Item.createWithUriDate(uri, date);
       item.title = entry.title || "(untitled)";
       item.body = entryBody(entry);

       const src = entry.origin;
       if (src) {
         const identity = Identity.createWithName(src.title || src.streamId);
         identity.uri = src.htmlUrl || null;
         const icon = iconMap[src.streamId];
         if (icon) {
           identity.avatar = icon;
         }
         item.author = identity;
       }

       const cats = entry.categories || [];
       const isStarred = cats.includes("user/-/state/com.google/starred");
       const isLabeled = cats.includes("user/-/label/" + (label || "Released"));

       item.actions = {};
       item.actions[isStarred ? "unstar" : "star"] = entry.id;
       item.actions[isLabeled ? "label_remove" : "label_add"] = entry.id;

       return item;
     });

     processResults(results);

     if (auto_mark_read === "on") {
       const ids = entries.map((e) => e.id);
       markRead(token, ids);
     }
   })
   .catch((err) => {
     if (getToken()) {
       setItem(TOKEN_KEY, null);
       fetchToken()
         .then((newToken) => loadUnread(newToken))
         .catch(processError);
     } else {
       processError(err);
     }
   });
}

function markRead(token, ids) {
 if (!ids || ids.length === 0) return;

 const headers = authHeaders(token);
 const body = ids.map((id) => "i=" + encodeURIComponent(id)).join("&")
   + "&a=user/-/state/com.google/read";

 sendRequest(
   BASE() + "/reader/api/0/edit-tag",
   "POST",
   body,
   headers
 ).catch((err) => {
   console.log("markRead failed: " + err.message);
 });
}

// --- Actions ---

function performAction(actionId, actionValue, item) {
 const token = getToken();
 if (!token) {
   actionComplete(null, new Error("Not authenticated. Please reload the feed."));
   return;
 }

 let tag;
 let body;

 if (actionId === "star" || actionId === "unstar") {
   const isStarring = (actionId === "star");
   tag = "user/-/state/com.google/starred";
   body = "i=" + encodeURIComponent(actionValue)
     + (isStarring ? "&a=" : "&r=") + encodeURIComponent(tag);

   sendRequest(BASE() + "/reader/api/0/edit-tag", "POST", body, authHeaders(token))
     .then(() => {
       const actions = item.actions || {};
       if (isStarring) {
         delete actions["star"];
         actions["unstar"] = actionValue;
       } else {
         delete actions["unstar"];
         actions["star"] = actionValue;
       }
       item.actions = actions;
       actionComplete(item, null);
     })
     .catch((err) => { actionComplete(null, err); });

 } else if (actionId === "label_add" || actionId === "label_remove") {
   const isAdding = (actionId === "label_add");
   tag = "user/-/label/" + (label || "Released");
   body = "i=" + encodeURIComponent(actionValue)
     + (isAdding ? "&a=" : "&r=") + encodeURIComponent(tag);

   sendRequest(BASE() + "/reader/api/0/edit-tag", "POST", body, authHeaders(token))
     .then(() => {
       const actions = item.actions || {};
       if (isAdding) {
         delete actions["label_add"];
         actions["label_remove"] = actionValue;
       } else {
         delete actions["label_remove"];
         actions["label_add"] = actionValue;
       }
       item.actions = actions;
       actionComplete(item, null);
     })
     .catch((err) => { actionComplete(null, err); });

 } else {
   actionComplete(null, new Error("Unknown action: " + actionId));
 }
}

// --- Helpers ---

function canonicalUrl(entry) {
 const alts = entry.alternate;
 if (alts && alts.length > 0) return alts[0].href;
 return null;
}

function entryBody(entry) {
 const content = (entry.summary && entry.summary.content)
   || (entry.content && entry.content.content)
   || "";
 return content || "<p>(No content)</p>";
}
