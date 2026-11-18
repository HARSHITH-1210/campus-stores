(() => {
  // Same key as the original app, so saved shifts are migrated, not lost.
  const storageKey = "campus-stores.shift.v1";
  const legacyKeys = ["campus-stores.shift.v2"];
  const root = document.getElementById("campus-stores");
  const q = (selector) => root.querySelector(selector);
  const requests = [
    {
      id: "RQ-214",
      club: "Film Society",
      event: "Courtyard screening",
      owner: "Isha Rao",
      due: "Fri 8 pm",
      items: ["HDMI projector", "Portable speaker", "USB-C → HDMI adapter"],
      note: "Playback is from a USB-C-only laptop. The host will collect at 4 pm.",
    },
    {
      id: "RQ-209",
      club: "Debate Union",
      event: "Finals rehearsal",
      owner: "Tara Shah",
      due: "Sat 10 am",
      items: ["Wireless microphone"],
      note: "Rehearsal runs into the evening.",
    },
    {
      id: "RQ-217",
      club: "Photo Circle",
      event: "Street portrait walk",
      owner: "Dev Menon",
      due: "Sat noon",
      items: ["Digital camera"],
      note: "Collection on Saturday morning.",
    },
  ];
  const assets = [
    { id: "PR-04", type: "HDMI projector", model: "BenQ MH550", bin: "A2" },
    {
      id: "PR-06",
      type: "HDMI projector",
      model: "Epson EB-X49",
      bin: "Workshop",
      repair: true,
    },
    { id: "SP-02", type: "Portable speaker", model: "JBL Eon One", bin: "B1" },
    { id: "SP-05", type: "Portable speaker", model: "Bose S1", bin: "B2" },
    {
      id: "AD-12",
      type: "USB-C → HDMI adapter",
      model: "Belkin AVC002",
      bin: "C4",
    },
    {
      id: "AD-15",
      type: "USB-C → HDMI adapter",
      model: "Anker A8312",
      bin: "C4",
    },
    { id: "MI-09", type: "Wireless microphone", model: "Shure BLX", bin: "B3" },
    { id: "CA-03", type: "Digital camera", model: "Sony A6400", bin: "D2" },
  ];
  const people = [
    "Isha Rao",
    "Kabir Sen",
    "Leela Das",
    "Tara Shah",
    "Dev Menon",
  ];
  // `h` is hours since Friday midnight, so desk times compare as numbers.
  const shifts = [
    {
      time: "Friday · 3:45 pm",
      at: "Fri 3:45 pm",
      h: 15.75,
      title: "Pickup at the counter",
      text: "Kabir is here for the Film Society screening. The film starts at four. Can he leave with everything he needs?",
      next: "Move to return time",
    },
    {
      time: "Friday · 7:30 pm",
      at: "Fri 7:30 pm",
      h: 19.5,
      title: "The kit comes back in pieces",
      text: "Kabir has brought back the projector and speaker. “Leela still has the adapter. She’ll drop it off tomorrow at nine.” Take the return and hand over to the morning shift.",
      next: "Move to next morning",
    },
    {
      time: "Saturday · 9:00 am",
      at: "Sat 9:00 am",
      h: 33,
      title: "Morning shift",
      text: "You’ve just taken over. Leela walks in with an adapter. Work out what was outstanding from the screening and close the loan for the right item.",
    },
  ];
  const times = { "Fri 8 pm": 20, "Sat 9 am": 33, "Sat 10 am": 34, "Sat noon": 36 };
  const timeList = Object.keys(times);
  const isTime = (x) => typeof x === "string" && Object.hasOwn(times, x);
  const pages = [
    ["Requests", "clipboard-list"],
    ["Outstanding", "clock"],
    ["Inventory", "package"],
    ["Loan register", "book-open"],
    ["Desk book", "messages-square"],
  ];
  const shows = ["Not returned", "Overdue", "Due soon", "Outstanding", "Returned", "All loans"];
  const filters = ["All items", "On shelf", "On loan", "In repair"];
  // One record per physical unit. `who` is the original borrower and never
  // changes; `custodian` is whoever has the unit now.
  const seedLoans = () => [
    {
      num: 401,
      req: "RQ-209",
      asset: "MI-09",
      type: "Wireless microphone",
      who: "Tara Shah",
      custodian: "Tara Shah",
      issuedAt: "Fri 3:30 pm",
      due: "Sat 10 am",
      expect: "",
      back: false,
      returnedAt: "",
      returnedBy: "",
      notes: [],
    },
  ];
  const original = () => ({
    version: 3,
    tab: "Requests",
    phase: 0,
    selected: "",
    mode: "",
    checkin: "",
    search: "",
    show: "Not returned",
    filter: "All items",
    loans: seedLoans(),
    notes: [],
    summary: null,
    editing: false,
    onlyOpen: true,
    notice: "Sample shift · All records are fictional.",
  });
  let s = original();
  const getAsset = (id) => assets.find((x) => x.id === id);
  const getReq = (id) => requests.find((x) => x.id === id);
  const out = (id) => s.loans.find((l) => l.asset === id && !l.back);
  const now = () => shifts[s.phase].h;
  const esc = (x) =>
    String(x).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const opts = (list) =>
    list
      .map(([v, t]) => '<option value="' + esc(v) + '">' + esc(t) + "</option>")
      .join("");
  const btn = (label, act, val = "", style = "") =>
    '<button type="button" data-action="' +
    act +
    '" data-val="' +
    esc(val) +
    '" class="' +
    style +
    '">' +
    esc(label) +
    "</button>";
  const head = (title, sub, control = "") =>
    '<div class="sectionhead"><div><h2>' +
    title +
    "</h2><small>" +
    sub +
    "</small></div>" +
    control +
    "</div>";
  const row = (label, sub, right) =>
    '<div class="row"><div><strong>' +
    esc(label) +
    "</strong><small>" +
    esc(sub) +
    "</small></div><div>" +
    right +
    "</div></div>";
  const badge = (t, kind = "") =>
    '<span class="tag' + (kind ? " " + kind : "") + '">' + esc(t) + "</span>";
  const unitName = (id) => id + " · " + getAsset(id).type;
  const slip = (l) => "L-" + l.num;

  // Status is worked out from the desk clock every time, never stored, so it
  // cannot drift out of date between shifts.
  function loanStatus(l) {
    if (l.back) return "Returned";
    const left = times[l.due] - now();
    if (left < 0) return "Overdue";
    if (left <= 1) return "Due soon";
    return "Outstanding";
  }
  const statusTag = (l) => {
    const st = loanStatus(l);
    return badge(st, "st-" + st.toLowerCase().replace(" ", ""));
  };
  const holderText = (l) =>
    l.back
      ? "Returned " + (l.returnedAt || "") + (l.returnedBy ? " by " + l.returnedBy : "")
      : "With " +
        l.custodian +
        (l.custodian !== l.who ? " (borrowed by " + l.who + ")" : "");
  const dueText = (l) =>
    "Due " + l.due + (l.expect && !l.back ? " · expected " + l.expect : "");

  // Request progress counts approved units, using each type's latest loan.
  function progress(r) {
    const loans = s.loans.filter((l) => l.req === r.id);
    const lines = r.items.map((type) => ({
      type,
      loan: loans.filter((l) => l.type === type).pop(),
    }));
    const returned = lines.filter((x) => x.loan && x.loan.back).length;
    const outCount = lines.filter((x) => x.loan && !x.loan.back).length;
    const state = outCount
      ? returned
        ? "Partially returned"
        : "On loan"
      : returned === r.items.length
        ? "All returned"
        : returned
          ? "Partly issued"
          : "Not issued";
    return { lines, returned, out: outCount, total: r.items.length, state };
  }

  function requestPage() {
    let html = head(
      "Approved requests",
      "Student Activities Office · 3 approved forms",
    );
    if (!s.selected) {
      // The whole row opens the form, like a native list.
      for (const r of requests) {
        const p = progress(r);
        const issued = p.state !== "Not issued";
        html +=
          '<button type="button" class="reqrow" data-action="request" data-val="' +
          esc(r.id) +
          '"><span class="reqmain"><strong>' +
          esc(r.event) +
          "</strong><small>" +
          esc(r.id + " · " + r.club + " · Return by " + r.due) +
          '</small></span><span class="reqside">' +
          (issued
            ? '<span class="mini" aria-hidden="true"><span style="transform:scaleX(' +
              p.returned / p.total +
              ')"></span></span>'
            : "") +
          badge(
            issued ? p.returned + "/" + p.total + " returned" : "Not issued",
            p.state === "All returned" ? "good" : p.out ? "st-outstanding" : "",
          ) +
          '</span><svg aria-hidden="true" class="store-icon chev"><use href="#icon-chevron-right"></use></svg></button>';
      }
      return html;
    }
    const r = getReq(s.selected);
    const p = progress(r);
    html += btn("Back to list", "close");
    if (s.summary && s.summary.req === r.id)
      html +=
        '<div class="record summary" role="status" data-swipe data-enter="summary-' +
        esc(s.summary.title) +
        '"><b>' +
        esc(s.summary.title) +
        "</b><ul>" +
        s.summary.lines.map((x) => "<li>" + esc(x) + "</li>").join("") +
        "</ul>" +
        btn("Dismiss", "summaryclose") +
        "</div>";
    html +=
      '<div class="record"><small>' +
      esc(r.id) +
      " · Approved</small><h3>" +
      esc(r.event) +
      "</h3><p>" +
      esc(r.club) +
      " · Filed by " +
      esc(r.owner) +
      "</p><p><b>Return by</b> " +
      esc(r.due) +
      "</p><p><b>Approved equipment</b></p><ul>" +
      r.items.map((x) => "<li>" + esc(x) + "</li>").join("") +
      "</ul><p>" +
      esc(r.note) +
      "</p></div>";
    const pct = Math.round((p.returned / p.total) * 100);
    const canIssue = p.lines.some((x) => !x.loan);
    html +=
      '<div class="sectionhead kithead"><div><h3>' +
      esc(r.club + " · " + r.event + " kit") +
      "</h3><small>Total units " +
      p.total +
      " · Returned " +
      p.returned +
      " · Outstanding " +
      p.out +
      "</small></div>" +
      badge(
        p.out ? "Open · " + p.state : p.state,
        p.state === "All returned" ? "good" : p.out ? "st-outstanding" : "",
      ) +
      "</div>" +
      '<div class="progress" role="progressbar" aria-label="Units returned" aria-valuemin="0" aria-valuemax="' +
      p.total +
      '" aria-valuenow="' +
      p.returned +
      '"><span data-progress="' +
      esc(r.id) +
      '" data-pct="' +
      pct +
      '" style="transform:scaleX(' +
      pct / 100 +
      ')"></span></div>';
    for (const { type, loan } of p.lines)
      html += row(
        type,
        loan
          ? slip(loan) + " · " + loan.asset + " · " + holderText(loan) + " · " + dueText(loan)
          : "Not issued yet",
        loan ? statusTag(loan) : badge("Not issued"),
      );
    if (!s.mode) {
      const actions =
        (canIssue ? btn("Issue entire request", "issuekit", r.id, "primary") : "") +
        (p.out ? btn("Record return", "kitreturn", r.id, canIssue ? "" : "primary") : "");
      if (actions) html += '<div class="buttons">' + actions + "</div>";
    }
    if (s.mode === "issue") html += issueKitForm(r, p);
    if (s.mode === "return") html += returnForm(r);
    return html;
  }

  // Issue every approved item in one go. Each unit still gets its own loan.
  function issueKitForm(r, p) {
    let html =
      '<form data-issuekit="' +
      esc(r.id) +
      '" class="record" data-enter="issuekit-' +
      esc(r.id) +
      '"><p><b>Issue entire request</b> · one loan per unit</p><div class="form">';
    p.lines.forEach(({ type, loan }, i) => {
      if (loan) return;
      const avail = assets.filter((a) => a.type === type && !a.repair && !out(a.id));
      html +=
        '<label><span>' +
        esc(type) +
        '</span><select name="unit-' +
        i +
        '">' +
        opts(avail.map((a) => [a.id, a.id + " · " + a.model + " · " + a.bin])) +
        '<option value="">Don’t issue</option></select></label>';
    });
    const dues = timeList.filter((t) => times[t] <= times[r.due] && times[t] > now());
    html +=
      '<label><span>Collected by</span><select name="who" required><option value="">Select…</option>' +
      opts(people.map((x) => [x, x])) +
      '</select></label><label><span>Return by</span><select name="due" required>' +
      opts(dues.map((t) => [t, t])) +
      "</select></label></div>" +
      '<div class="buttons"><button type="submit" class="primary">Issue units</button>' +
      btn("Cancel", "modecancel") +
      "</div></form>";
    return html;
  }

  // Every open unit needs an answer: back now, or still out with a named
  // custodian and an expected time.
  function returnForm(r) {
    const open = s.loans.filter((l) => l.req === r.id && !l.back);
    const later = timeList.filter((t) => times[t] > now());
    let html =
      '<form data-kitreturn="' +
      esc(r.id) +
      '" class="record" data-enter="return-' +
      esc(r.id) +
      '"><p><b>Record return</b> · mark every unit. Anything still out stays on its loan with a named custodian.</p>';
    for (const l of open) {
      const n = l.num;
      html +=
        '<fieldset class="kititem"><legend>' +
        esc(unitName(l.asset)) +
        " <small>" +
        slip(l) +
        " · with " +
        esc(l.custodian) +
        "</small></legend>" +
        '<label class="choice"><input type="radio" name="st-' +
        n +
        '" value="back" required /> Returned now</label>' +
        '<label class="choice"><input type="radio" name="st-' +
        n +
        '" value="out" /> Still out</label>' +
        '<div class="form stillout"><label><span>Current custodian</span><select name="cust-' +
        n +
        '">' +
        opts([l.custodian, ...people.filter((x) => x !== l.custodian)].map((x) => [x, x])) +
        '</select></label><label><span>Expected back</span><select name="expect-' +
        n +
        '"><option value="">Select…</option>' +
        opts(later.map((t) => [t, t])) +
        "</select></label></div></fieldset>";
    }
    return (
      html +
      '<div class="form"><label class="full"><span>Handover note (optional)</span><textarea name="note" rows="2" maxlength="400"></textarea></label></div>' +
      '<div class="buttons"><button type="submit" class="primary">Save return</button>' +
      btn("Cancel", "modecancel") +
      "</div></form>"
    );
  }

  // Check-in starts from the label on the unit in hand. Loans are matched by
  // unit ID only, never by type or model.
  function checkinPanel() {
    let html =
      '<div class="record checkin"><label><span><b>Check in a unit</b> · pick the ID printed on the item’s label</span><select data-checkin><option value="">Select unit label…</option>' +
      opts(assets.map((a) => [a.id, unitName(a.id) + " · bin " + a.bin])) +
      "</select></label>";
    if (s.checkin) {
      const a = getAsset(s.checkin);
      const l = out(a.id);
      if (!l) {
        const same = s.loans.filter((x) => !x.back && x.type === a.type);
        html +=
          '<p data-enter="noloan-' +
          esc(a.id) +
          '">' +
          badge("No open loan", "st-overdue") +
          " " +
          esc(a.id) +
          " is not on loan" +
          (a.repair ? " (it is in repair)." : " and belongs on shelf " + esc(a.bin) + ".") +
          " Nothing will be closed.</p>" +
          (same.length
            ? "<p>Open loans for this equipment type: " +
              same
                .map((x) => "<b>" + esc(x.asset) + "</b> with " + esc(x.custodian) + " (" + slip(x) + ")")
                .join(", ") +
              ". Check the label on the item again.</p>"
            : "");
      } else {
        const r = getReq(l.req);
        html +=
          '<form data-checkinform="' +
          l.num +
          '" data-enter="checkin-' +
          l.num +
          '"><p>' +
          statusTag(l) +
          " <b>" +
          slip(l) +
          " · " +
          esc(unitName(l.asset)) +
          "</b></p><p>" +
          esc(r.id + " · " + r.club + " · " + r.event) +
          "</p><p>" +
          esc(holderText(l) + " · Issued " + (l.issuedAt || "—") + " · " + dueText(l)) +
          '</p><label class="choice"><input type="checkbox" name="label" required /> The label on the item reads <b>' +
          esc(l.asset) +
          '</b></label><div class="form"><label class="full"><span>Return note (optional)</span><input name="note" maxlength="200" /></label></div><div class="buttons"><button type="submit" class="primary">Close ' +
          slip(l) +
          " · return " +
          esc(l.asset) +
          "</button>" +
          btn("Cancel", "checkcancel") +
          "</div></form>";
      }
    }
    return html + "</div>";
  }

  function outstanding() {
    let html = head(
      "Outstanding items",
      "What is missing, who has it, which unit, and when it is due back",
    );
    html += checkinPanel();
    html +=
      '<div class="buttons filters"><label>Search <input type="search" data-search placeholder="Unit, type, person or request" value="' +
      esc(s.search) +
      '" /></label><label>Status <select data-show>' +
      opts(shows.map((x) => [x, x])) +
      "</select></label></div>";
    const term = s.search.trim().toLowerCase();
    const order = { Overdue: 0, "Due soon": 1, Outstanding: 2, Returned: 3 };
    const list = s.loans
      .filter((l) => {
        const st = loanStatus(l);
        if (s.show === "Not returned" && l.back) return false;
        if (!["Not returned", "All loans"].includes(s.show) && st !== s.show) return false;
        if (!term) return true;
        return [l.asset, l.type, l.custodian, l.who, l.req, getReq(l.req).club, st]
          .join(" ")
          .toLowerCase()
          .includes(term);
      })
      .sort(
        (a, b) =>
          order[loanStatus(a)] - order[loanStatus(b)] || times[a.due] - times[b.due] || a.num - b.num,
      );
    if (!list.length)
      return (
        html +
        '<p class="empty">' +
        (term || s.show !== "Not returned"
          ? "No loans match these filters."
          : "Nothing is out. Every issued unit is back on its shelf.") +
        "</p>"
      );
    html +=
      '<table class="loans"><thead><tr><th>Unit</th><th>Equipment</th><th>Who has it</th><th>Request</th><th>Issued</th><th>Expected back</th><th>Status</th><th><span class="sr">Action</span></th></tr></thead><tbody>';
    for (const l of list) {
      const a = getAsset(l.asset);
      const r = getReq(l.req);
      const last = l.notes[l.notes.length - 1];
      const rowClass = [
        l.asset === s.checkin ? "picked" : "",
        loanStatus(l) === "Overdue" ? "is-overdue" : "",
      ]
        .filter(Boolean)
        .join(" ");
      html +=
        "<tr" +
        (rowClass ? ' class="' + rowClass + '"' : "") +
        '><td data-label="Unit"><b>' +
        esc(l.asset) +
        "</b><small>" +
        slip(l) +
        " · bin " +
        esc(a.bin) +
        '</small></td><td data-label="Equipment">' +
        esc(l.type) +
        "<small>" +
        esc(a.model) +
        '</small></td><td data-label="Who has it"><b>' +
        esc(l.back ? "Back at desk" : l.custodian) +
        "</b><small>" +
        (l.custodian !== l.who || l.back ? "Borrowed by " + esc(l.who) : "Borrower") +
        '</small></td><td data-label="Request">' +
        esc(l.req) +
        "<small>" +
        esc(r.club) +
        '</small></td><td data-label="Issued">' +
        esc(l.issuedAt || "—") +
        '</td><td data-label="Expected back">' +
        esc(l.back ? "Returned " + l.returnedAt : l.expect || l.due) +
        (l.expect && !l.back ? "<small>Request due " + esc(l.due) + "</small>" : "") +
        '</td><td data-label="Status">' +
        statusTag(l) +
        '</td><td class="act">' +
        (l.back ? "" : btn("Check in", "checkin", l.asset)) +
        "</td></tr>" +
        (last
          ? '<tr class="noterow"><td colspan="8"><small>Note · ' +
            esc(last.at) +
            "</small> " +
            esc(last.text) +
            "</td></tr>"
          : "");
    }
    return html + "</tbody></table>";
  }

  function inventory() {
    let html = head(
      "Inventory",
      "Physical units · home shelf and current availability",
    );
    html +=
      '<div class="buttons"><label>Show <select data-filter>' +
      opts(filters.map((f) => [f, f])) +
      "</select></label></div>";
    for (const a of assets) {
      const l = out(a.id);
      const status = a.repair ? "In repair" : l ? "On loan" : "On shelf";
      if (s.filter !== "All items" && s.filter !== status) continue;
      html += row(
        a.id + " · " + a.type,
        a.model + " · " + a.bin + (l ? " · With " + l.custodian + " (" + slip(l) + ")" : ""),
        badge(status, status === "On shelf" ? "good" : ""),
      );
    }
    return html;
  }

  function register() {
    let html = head(
      "Loan register",
      "One slip per physical unit",
      s.editing
        ? btn("Cancel", "cancel")
        : btn("New issue slip", "new", "", "primary"),
    );
    if (s.editing) {
      const available = assets.filter((a) => !a.repair && !out(a.id));
      const select = (label, key, options) =>
        "<label><span>" +
        label +
        '</span><select name="' +
        key +
        '" required><option value="">Select…</option>' +
        opts(options) +
        "</select></label>";
      return (
        html +
        '<form data-issue data-enter="issue-slip"><div class="form">' +
        select(
          "Approved request",
          "req",
          requests.map((r) => [r.id, r.id + " · " + r.club + " · return by " + r.due]),
        ) +
        select(
          "Unit leaving the desk",
          "asset",
          available.map((a) => [a.id, a.id + " · " + a.type]),
        ) +
        select(
          "Collected by",
          "who",
          people.map((p) => [p, p]),
        ) +
        select(
          "Return by",
          "due",
          timeList.map((d) => [d, d]),
        ) +
        '</div><button type="submit" class="primary">Save issue slip</button></form>'
      );
    }
    html +=
      '<div class="buttons">' +
      ["Outstanding", "All slips"]
        .map(
          (v, i) =>
            '<button type="button" data-action="scope" data-val="' +
            i +
            '" aria-pressed="' +
            (s.onlyOpen === (i === 0)) +
            '">' +
            v +
            "</button>",
        )
        .join("") +
      "</div>";
    const shown = s.loans
      .filter((l) => !s.onlyOpen || !l.back)
      .slice()
      .reverse();
    if (!shown.length) html += '<p class="empty">No outstanding slips.</p>';
    for (const l of shown)
      html += row(
        slip(l) + " · " + unitName(l.asset),
        l.req + " · " + getReq(l.req).club + " · " + holderText(l) + " · " + dueText(l),
        statusTag(l) + (l.back ? "" : " " + btn("Check in", "checkin", l.asset)),
      );
    return html;
  }

  function deskbook() {
    let html = head(
      "Desk book",
      "Messages from clubs and notes for the next shift",
    );
    const entries = [
      [
        "Friday · 3:20 pm",
        "Isha Rao · Film Society",
        "Kabir Sen is picking up our whole screening kit. Please issue it in his name. I’m setting up in the courtyard.",
      ],
      [
        "Friday · 3:30 pm",
        "Tara Shah · Debate Union",
        "Our microphone stays with me overnight. I’ll return it by 10 am Saturday.",
      ],
    ];
    if (s.phase >= 1)
      entries.push([
        "Friday · 7:30 pm",
        "Kabir Sen · Film Society",
        "I brought the projector and speaker. Leela Das has our adapter. She’ll be at the counter at 9 am tomorrow.",
      ]);
    for (const n of s.notes)
      entries.push([shifts[n.phase].time, n.author || "Counter handover", n.text]);
    for (const [t, author, body] of entries.slice().reverse())
      html +=
        '<article class="record"><small>' +
        esc(t) +
        "</small><h3>" +
        esc(author) +
        "</h3><p>" +
        esc(body) +
        "</p></article>";
    return (
      html +
      '<form data-note><div class="form"><label class="full"><span>Note for the next shift</span><textarea name="note" rows="2" maxlength="400" required></textarea></label></div><button type="submit">Add handover note</button></form>'
    );
  }

  const screens = {
    Requests: requestPage,
    Outstanding: outstanding,
    Inventory: inventory,
    "Loan register": register,
    "Desk book": deskbook,
  };
  function paint() {
    const phase = shifts[s.phase];
    q("[data-clock]").textContent = phase.time;
    q("[data-shift-title]").textContent = phase.title;
    q("[data-shift]").textContent = phase.text;
    // Where am I in the story, what is done, what is next.
    q("[data-timeline]").innerHTML = shifts
      .map(
        (p, i) =>
          '<li class="' +
          (i < s.phase ? "done" : i === s.phase ? "now" : "next") +
          '"' +
          (i === s.phase ? ' aria-current="step"' : "") +
          '><span class="dot">' +
          (i < s.phase
            ? '<svg aria-hidden="true" class="store-icon"><use href="#icon-check"></use></svg>'
            : i + 1) +
          "</span><span>" +
          esc(p.at) +
          "</span></li>",
      )
      .join("");
    const advance = q('[data-action="advance"]');
    advance.hidden = !phase.next;
    advance.textContent = phase.next || "";
    const openCount = s.loans.filter((l) => !l.back).length;
    q("[data-nav]").innerHTML = pages
      .map(
        ([n, icon]) =>
          '<button type="button" data-action="tab" data-val="' +
          n +
          '" aria-pressed="' +
          (s.tab === n) +
          '"><svg aria-hidden="true" class="store-icon"><use href="#icon-' +
          icon +
          '"></use></svg>' +
          n +
          (n === "Outstanding" && openCount ? ' <span class="count">' + openCount + "</span>" : "") +
          "</button>",
      )
      .join("");
    q("[data-page]").innerHTML = screens[s.tab]();
    if (q("[data-filter]")) q("[data-filter]").value = s.filter;
    if (q("[data-checkin]")) q("[data-checkin]").value = s.checkin;
    if (q("[data-show]")) q("[data-show]").value = s.show;
    setStatus(s.notice);
    playMotion();
  }

  // ---- Motion -------------------------------------------------------------
  // The page is rebuilt on every click, so CSS entrance animations would
  // replay on unrelated clicks. Motion plays only when a state really changes:
  // a panel that was not on screen last paint, or a progress value that moved.
  // Tab switches and filtering stay instant: they happen dozens of times a shift.
  const easeOut = "cubic-bezier(0.23, 1, 0.32, 1)";
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ready = false;
  let onScreen = new Set();
  const lastPct = {};
  function playMotion() {
    const seen = new Set();
    for (const el of root.querySelectorAll("[data-enter]")) {
      const key = el.dataset.enter;
      seen.add(key);
      if (ready && !onScreen.has(key))
        el.animate(
          reduced()
            ? [{ opacity: 0 }, { opacity: 1 }]
            : [
                { opacity: 0, transform: "translateY(6px)" },
                { opacity: 1, transform: "none" },
              ],
          { duration: 220, easing: easeOut },
        );
    }
    onScreen = seen;
    for (const bar of root.querySelectorAll("[data-progress]")) {
      const id = bar.dataset.progress;
      const pct = Number(bar.dataset.pct);
      if (ready && lastPct[id] !== undefined && lastPct[id] !== pct && !reduced())
        bar.animate(
          [{ transform: "scaleX(" + lastPct[id] / 100 + ")" }, { transform: "scaleX(" + pct / 100 + ")" }],
          { duration: 300, easing: easeOut },
        );
      lastPct[id] = pct;
    }
  }
  // Status text is the confirmation for every action: a new message rises in
  // so it is noticed; warnings get their own tone.
  let lastStatus = "";
  function setStatus(text, tone = "") {
    const span = q("[data-status]");
    const bar = span.parentElement;
    bar.classList.toggle("is-warn", tone === "warn");
    if (text === lastStatus && span.textContent === text) return;
    span.textContent = text;
    lastStatus = text;
    if (ready)
      span.animate(
        reduced()
          ? [{ opacity: 0.2 }, { opacity: 1 }]
          : [
              { opacity: 0, transform: "translateY(4px)" },
              { opacity: 1, transform: "none" },
            ],
        { duration: 200, easing: easeOut },
      );
  }

  // ---- Gesture: swipe the return summary away ------------------------------
  // Track phase follows the pointer 1:1 (with rubber-band resistance against
  // a tiny drag); release dismisses on distance OR flick velocity, otherwise
  // snaps back. The Dismiss button stays as the visible path.
  let drag = null;
  root.addEventListener("pointerdown", (e) => {
    const card = e.target.closest("[data-swipe]");
    if (!card || e.target.closest("button, a, input, select, textarea") || e.button > 0) return;
    drag = { card, id: e.pointerId, x0: e.clientX, y0: e.clientY, dx: 0, axis: "", hist: [] };
  });
  root.addEventListener("pointermove", (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x0;
    const dy = e.clientY - drag.y0;
    if (!drag.axis) {
      if (Math.hypot(dx, dy) < 10) return; // hysteresis before committing
      drag.axis = Math.abs(dx) > Math.abs(dy) ? "x" : "y";
      if (drag.axis === "y") {
        drag = null; // a vertical move is a scroll, not a dismiss
        return;
      }
      drag.card.classList.add("is-dragging");
      try {
        drag.card.setPointerCapture(e.pointerId); // keep tracking outside the card
      } catch {
        // Tracking still works through the delegated listeners on root.
      }
      drag.card.classList.remove("is-settling");
    }
    drag.dx = dx;
    drag.hist.push([e.timeStamp, dx]);
    if (drag.hist.length > 6) drag.hist.shift();
    const w = drag.card.offsetWidth;
    drag.card.style.transform = "translateX(" + dx + "px)";
    drag.card.style.opacity = String(1 - Math.min(Math.abs(dx) / w, 1) * 0.7);
  });
  const endDrag = (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const { card, dx, hist } = drag;
    drag = null;
    if (!card.classList.contains("is-dragging")) return;
    card.classList.remove("is-dragging");
    const first = hist[0];
    const last = hist[hist.length - 1];
    const v = first && last && last[0] > first[0] ? ((last[1] - first[1]) / (last[0] - first[0])) * 1000 : 0;
    const w = card.offsetWidth;
    const flung = Math.abs(v) > 500 && Math.sign(v) === Math.sign(dx);
    card.classList.add("is-settling");
    if (e.type !== "pointercancel" && (Math.abs(dx) > w * 0.4 || flung)) {
      const dir = Math.sign(dx || v) || 1;
      card.style.transform = "translateX(" + dir * w * 1.05 + "px)";
      card.style.opacity = "0";
      setTimeout(() => {
        s.summary = null;
        commit();
      }, reduced() ? 0 : 200);
    } else {
      card.style.transform = "";
      card.style.opacity = "";
    }
  };
  root.addEventListener("pointerup", endDrag);
  root.addEventListener("pointercancel", endDrag);
  function save() {
    try {
      localStorage.setItem(storageKey, JSON.stringify(s));
    } catch {
      q("[data-status]").textContent +=
        " Browser storage is unavailable. Progress lasts for this visit.";
    }
  }
  function commit(msg) {
    if (msg) s.notice = msg;
    paint();
    save();
  }
  const warn = (msg) => setStatus(msg, "warn");
  const nextNum = () => Math.max(400, ...s.loans.map((l) => l.num)) + 1;
  const newLoan = (r, unit, who, due) => ({
    num: nextNum(),
    req: r.id,
    asset: unit.id,
    type: unit.type,
    who,
    custodian: who,
    issuedAt: shifts[s.phase].at,
    due,
    expect: "",
    back: false,
    returnedAt: "",
    returnedBy: "",
    notes: [],
  });
  // The original issue rules, plus a return time inside the request deadline.
  function issueProblem(r, unit, due) {
    if (!r || !unit) return "Choose an approved request and a unit.";
    if (unit.repair) return unit.id + " is in repair and cannot leave the desk.";
    if (out(unit.id)) return unit.id + " is already on loan.";
    if (!r.items.includes(unit.type))
      return "This equipment type is outside the approved request. Choose an approved unit.";
    if (s.loans.some((l) => l.req === r.id && !l.back && l.type === unit.type))
      return "The approved quantity of this equipment type is already on loan.";
    if (!isTime(due)) return "Choose a return time.";
    if (times[due] > times[r.due])
      return "Return by " + due + " is after this request’s deadline (" + r.due + ").";
    if (times[due] <= now()) return "That return time has already passed.";
    return "";
  }
  // Closing a loan is the only place a unit comes back; it refuses anything
  // already closed, so a unit cannot be returned twice.
  function closeLoan(l, note) {
    if (!l || l.back) return false;
    l.back = true;
    l.returnedAt = shifts[s.phase].at;
    l.returnedBy = l.custodian;
    l.expect = "";
    if (note) l.notes.push({ at: shifts[s.phase].at, text: note });
    return true;
  }

  root.addEventListener("click", (e) => {
    const b = e.target.closest("[data-action]");
    if (!b) return;
    const v = b.dataset.val;
    switch (b.dataset.action) {
      case "restart":
        s = original();
        break;
      case "advance":
        if (s.phase < 2) s.phase++;
        s.notice = "Shift time updated.";
        break;
      case "tab":
        s.tab = v;
        s.editing = false;
        s.mode = "";
        s.summary = null;
        if (v !== "Outstanding") s.checkin = "";
        break;
      case "close":
        s.selected = "";
        s.mode = "";
        s.summary = null;
        break;
      case "request":
        s.selected = v;
        s.mode = "";
        s.summary = null;
        break;
      case "issuekit":
        s.mode = "issue";
        s.summary = null;
        break;
      case "kitreturn":
        s.mode = "return";
        s.summary = null;
        break;
      case "modecancel":
        s.mode = "";
        break;
      case "summaryclose":
        s.summary = null;
        break;
      case "checkin":
        s.tab = "Outstanding";
        s.checkin = v;
        break;
      case "checkcancel":
        s.checkin = "";
        break;
      case "new":
        s.editing = true;
        break;
      case "cancel":
        s.editing = false;
        break;
      case "scope":
        s.onlyOpen = v === "0";
        break;
      default:
        return;
    }
    commit();
  });
  root.addEventListener("change", (e) => {
    const key = ["filter", "show", "checkin"].find((k) => e.target.matches("[data-" + k + "]"));
    if (!key) return;
    s[key] = e.target.value;
    commit();
    q("[data-" + key + "]")?.focus();
  });
  root.addEventListener("input", (e) => {
    if (!e.target.matches("[data-search]")) return;
    s.search = e.target.value.slice(0, 60);
    commit();
    const box = q("[data-search]");
    box.focus();
    box.setSelectionRange(box.value.length, box.value.length);
  });
  root.addEventListener("submit", (e) => {
    e.preventDefault();
    const f = e.target;
    const form = new FormData(f);
    if (f.matches("[data-note]")) {
      const text = String(form.get("note")).trim();
      if (!text) return;
      s.notes.push({ phase: s.phase, text });
      commit("Handover note saved.");
      return;
    }
    if (f.matches("[data-checkinform]")) {
      const l = s.loans.find((x) => x.num === Number(f.dataset.checkinform));
      if (!l || l.back || l.asset !== s.checkin) {
        s.checkin = "";
        commit("That loan is already closed. Nothing was changed.");
        return;
      }
      if (!form.get("label")) return warn("Confirm the label on the item first.");
      const note = String(form.get("note") || "").trim();
      const by = l.custodian;
      closeLoan(l, note);
      s.checkin = "";
      const r = getReq(l.req);
      const p = progress(r);
      commit(
        l.asset +
          " returned by " +
          by +
          " to bin " +
          getAsset(l.asset).bin +
          ". " +
          slip(l) +
          " closed. " +
          r.id +
          ": " +
          p.returned +
          "/" +
          p.total +
          " units returned.",
      );
      return;
    }
    if (f.matches("[data-kitreturn]")) {
      const r = getReq(f.dataset.kitreturn);
      const open = r ? s.loans.filter((l) => l.req === r.id && !l.back) : [];
      if (!open.length) {
        s.mode = "";
        commit("Nothing on this request is out. Nothing was changed.");
        return;
      }
      const plan = [];
      for (const l of open) {
        const st = form.get("st-" + l.num);
        const cust = form.get("cust-" + l.num);
        const expect = form.get("expect-" + l.num);
        if (st !== "back" && st !== "out")
          return warn("Mark " + l.asset + " as returned or still out.");
        if (st === "out" && (!people.includes(cust) || !isTime(expect) || times[expect] <= now())) {
          f.querySelector('[name="expect-' + l.num + '"]').focus();
          return warn("Say who has " + unitName(l.asset) + " now and when it is expected back.");
        }
        plan.push({ l, st, cust, expect });
      }
      const note = String(form.get("note") || "").trim();
      const lines = [];
      for (const { l, st, cust, expect } of plan) {
        if (st === "back") {
          const by = l.custodian;
          closeLoan(l, note);
          lines.push(unitName(l.asset) + ": Returned by " + by);
        } else {
          l.custodian = cust;
          l.expect = expect;
          if (note) l.notes.push({ at: shifts[s.phase].at, text: note });
          lines.push(unitName(l.asset) + ": Still with " + cust + ", expected " + expect);
        }
      }
      const still = plan.filter((x) => x.st === "out");
      if (still.length || note)
        s.notes.push({
          phase: s.phase,
          author: "Desk · " + r.id + " return",
          text:
            r.club +
            ". " +
            lines.join(". ") +
            "." +
            (note ? " Note: " + note : "") +
            (still.length ? " Close by the unit ID on the label (Outstanding tab)." : ""),
        });
      const p = progress(r);
      s.mode = "";
      s.summary = {
        req: r.id,
        title:
          "Return saved · " + shifts[s.phase].at + " · " + p.returned + "/" + p.total + " units returned",
        lines,
      };
      commit(
        plan.length - still.length +
          " returned, " +
          still.length +
          " still out." +
          (still.length ? " Logged in the desk book." : ""),
      );
      return;
    }
    if (f.matches("[data-issuekit]")) {
      const r = getReq(f.dataset.issuekit);
      if (!r) return;
      const who = form.get("who");
      const due = form.get("due");
      if (!people.includes(who)) return warn("Choose who is collecting.");
      const picks = r.items
        .map((type, i) => [type, getAsset(form.get("unit-" + i))])
        .filter(([, unit]) => unit);
      if (!picks.length) return warn("Choose at least one unit to issue.");
      for (const [type, unit] of picks) {
        const problem = unit.type !== type ? "Wrong unit type for " + type + "." : issueProblem(r, unit, due);
        if (problem) return warn(problem);
      }
      const nums = [];
      for (const [, unit] of picks) {
        const l = newLoan(r, unit, who, due);
        s.loans.push(l);
        nums.push(slip(l) + " " + unit.id);
      }
      s.mode = "";
      commit("Issued to " + who + ", due " + due + ": " + nums.join(", ") + ".");
      return;
    }
    if (!f.matches("[data-issue]")) return;
    const [req, asset, who, due] = ["req", "asset", "who", "due"].map((k) => form.get(k));
    const unit = getAsset(asset),
      r = getReq(req);
    if (!people.includes(who)) return warn("Choose who is collecting.");
    const problem = issueProblem(r, unit, due);
    if (problem) return warn(problem);
    const l = newLoan(r, unit, who, due);
    s.loans.push(l);
    s.editing = false;
    commit("Issued " + asset + " to " + who + " on slip " + slip(l) + ".");
  });

  // Accepts saves from every earlier version. Bad records are dropped one by
  // one instead of throwing the whole shift away.
  function migrate(d) {
    if (!d || typeof d !== "object" || ![1, 2, 3].includes(d.version)) return null;
    const base = original();
    const seen = new Set();
    const openUnits = new Set();
    const loans = [];
    for (const l of Array.isArray(d.loans) ? d.loans : []) {
      if (
        !l ||
        !Number.isInteger(l.num) ||
        seen.has(l.num) ||
        !getReq(l.req) ||
        !getAsset(l.asset) ||
        !people.includes(l.who) ||
        !isTime(l.due)
      )
        continue;
      const back = l.back === true;
      if (!back && openUnits.has(l.asset)) continue;
      seen.add(l.num);
      if (!back) openUnits.add(l.asset);
      const str = (x) => (typeof x === "string" ? x.slice(0, 40) : "");
      loans.push({
        num: l.num,
        req: l.req,
        asset: l.asset,
        type: getAsset(l.asset).type,
        who: l.who,
        custodian: [l.custodian, l.holder].find((p) => people.includes(p)) || l.who,
        issuedAt: str(l.issuedAt) || (l.num === 401 ? "Fri 3:30 pm" : ""),
        due: l.due,
        expect: !back && isTime(l.expect) ? l.expect : "",
        back,
        returnedAt: back ? str(l.returnedAt) : "",
        returnedBy: back && people.includes(l.returnedBy) ? l.returnedBy : "",
        notes: (Array.isArray(l.notes) ? l.notes : [])
          .filter((n) => n && typeof n.text === "string" && typeof n.at === "string")
          .map((n) => ({ at: n.at.slice(0, 40), text: n.text.slice(0, 400) })),
      });
    }
    const phase = Number.isInteger(d.phase) && shifts[d.phase] ? d.phase : 0;
    const selected = getReq(d.selected) ? d.selected : "";
    const sum = d.summary;
    return {
      ...base,
      tab: Object.hasOwn(screens, d.tab) ? d.tab : base.tab,
      phase,
      selected,
      mode: selected && ["issue", "return"].includes(d.mode) ? d.mode : "",
      checkin: getAsset(d.checkin) ? d.checkin : "",
      search: typeof d.search === "string" ? d.search.slice(0, 60) : "",
      show: shows.includes(d.show) ? d.show : base.show,
      filter: filters.includes(d.filter) ? d.filter : base.filter,
      loans: loans.length ? loans : base.loans,
      notes: (Array.isArray(d.notes) ? d.notes : [])
        .filter((n) => n && Number.isInteger(n.phase) && shifts[n.phase] && typeof n.text === "string")
        .map((n) => ({
          phase: n.phase,
          text: n.text.slice(0, 800),
          ...(typeof n.author === "string" ? { author: n.author.slice(0, 80) } : {}),
        })),
      summary:
        sum &&
        getReq(sum.req) &&
        typeof sum.title === "string" &&
        Array.isArray(sum.lines) &&
        sum.lines.every((x) => typeof x === "string")
          ? { req: sum.req, title: sum.title, lines: sum.lines.slice() }
          : null,
      editing: d.editing === true,
      onlyOpen: d.onlyOpen !== false,
      notice: typeof d.notice === "string" ? d.notice.slice(0, 200) : base.notice,
    };
  }
  paint();
  try {
    for (const key of [storageKey, ...legacyKeys]) {
      let d = null;
      try {
        d = JSON.parse(localStorage.getItem(key));
      } catch {
        continue;
      }
      const restored = migrate(d);
      if (!restored) continue;
      s = restored;
      paint();
      if (key !== storageKey) save();
      break;
    }
  } catch {
    // Keep the fresh shift when storage is unavailable.
  }
  // Nothing animates on first load; motion is reserved for changes.
  ready = true;
})();
