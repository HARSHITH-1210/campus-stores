# Campus Stores

Campus Stores is a Product Engineer work sample set at a fictional campus media equipment desk. Work through a club’s screening, from equipment pickup to a partial return and the next morning’s handover. Open **Candidate brief** in the app for the assignment.

## My submission: would I keep this product?

**Yes, I'd keep it, with one change: after a partial return the desk must record, as data, who has each missing unit, so the next shift can close the right loan without reconstructing the story.** The changes are in `app.js`, `styles.css` and one icon in `index.html`. There is still no build step and no dependencies.

### The original problem

The flow that works well is pickup at 3:45 pm. Kabir collects the Film Society kit. When I tried to issue a second adapter (AD-15), the desk refused with *"The approved quantity of this equipment type is already on loan."* The projector in repair (PR-06) never appears in the list, and equipment of a type the request didn't approve is rejected. Kabir leaves with exactly what Isha's form approved.

**Keep:** one loan per physical unit, and those three checks.

The flow that breaks is the partial return. At 7:30 pm Kabir returns the projector and speaker, and Leela keeps the adapter. The original app could only close two slips and accept a free-text note. At 9:00 am the incoming operator saw:

```
L-404 · AD-12     RQ-214 · Kabir Sen · Due Fri 8 pm      [Record return]
L-401 · MI-09     RQ-209 · Tara Shah · Due Sat 10 am     [Record return]
```

Nothing says AD-12 is overdue, that Leela has it rather than Kabir, or what the unit is. A second, identical adapter (AD-15) sits in the same bin C4. The operator has to rebuild the story from the desk book, and a wrong-slip return is one click away.

### The design decision

**Track custody per physical unit as structured data, and close loans only by unit ID.** A note can be skipped, misread or buried. A field on the loan can be shown on every screen, filtered on and checked. Matching by unit ID, never by type or model, means returning "an adapter" can't close the wrong adapter's loan.

### What changed

| Area | Change |
| --- | --- |
| Loan record | Every issued unit has its own loan, with a separate **original borrower** (`who`) and **current custodian** (`custodian`). It also records issue time, expected return, actual return, who returned it and return notes. |
| Status | *Outstanding*, *Due soon* (within an hour), *Overdue* or *Returned*. It is worked out from the desk clock every time it is shown, so it can't go stale. |
| Return workflow | **Record return** on a request lists every unit still out. Each must be marked *Returned now* or *Still out*. *Still out* needs a custodian and an expected time. There is an optional handover note, and a summary shows after saving: "AD-12 · USB-C → HDMI adapter: Still with Leela Das, expected Sat 9 am". |
| **Outstanding** tab (new) | The morning view: unit, equipment, who has it, request, issue time, expected back, status and the latest note. Overdue items are listed first. Search covers unit ID, type, custodian, borrower and request, and you can filter by status. A count badge in the nav shows how many units are out. |
| Check-in | Starts from the ID on the item's label. The operator must tick "The label on the item reads AD-12" before **Close L-404**. Picking AD-15 instead shows *No open loan* and points to the AD-12 loan held by Leela, and nothing is closed. |
| Request progress | A progress bar plus *Total units · Returned · Outstanding*. The request stays *Open · Partially returned* until every issued unit is back, then shows *All returned*. The request list shows "2/3 returned". |
| Issue workflow | **Issue entire request** issues every approved item in one form, still one loan per unit. Both issue paths reject a return time after the request deadline or already in the past. |
| Data integrity | Closing a loan is done in one place and refuses a loan that is already closed, so stale forms and double clicks change nothing. Saves from earlier versions are migrated: a free-text holder becomes `custodian`, and missing fields get defaults. Malformed records are dropped one by one, duplicate open loans for the same unit are removed, and unreadable storage falls back to a fresh shift. Returned loans stay in the register as history. |

### How custodian tracking works

```js
{ num: 404, req: "RQ-214", asset: "AD-12", type: "USB-C → HDMI adapter",
  who: "Kabir Sen",          // original borrower, never changes
  custodian: "Leela Das",    // who has it now
  issuedAt: "Fri 3:45 pm", due: "Fri 8 pm", expect: "Sat 9 am",
  back: false, returnedAt: "", returnedBy: "",
  notes: [{ at: "Fri 7:30 pm", text: "Leela has AD-12. AD-15 stays in C4." }] }
```

A partial return sets `custodian` and `expect` on the loan that is still open. Check-in finds the loan by `asset` alone (`AD-12`), and closing sets `back`, `returnedAt` and `returnedBy`. No other loan is touched.

### Reproduce the three-stage scenario

1. Click **Restart sample shift**.
2. **Friday 3:45 pm:** open **Requests → Courtyard screening → Issue entire request**. The defaults are PR-04, SP-02 and AD-12. Choose *Kabir Sen* as **Collected by** and click **Issue units**. Loans L-402, L-403 and L-404 are created.
3. Click **Move to return time**. You can reload the page here; nothing is lost.
4. **Friday 7:30 pm:** click **Record return**. Mark the projector and speaker *Returned now*. Mark the adapter *Still out*, with custodian *Leela Das* and expected back *Sat 9 am*. Add a note and click **Save return**. The summary reads 2/3 returned, and the request shows *Open · Partially returned*.
5. Click **Move to next morning**, and reload if you like.
6. **Saturday 9:00 am:** open **Outstanding**. AD-12 is first: *Leela Das, borrowed by Kabir Sen*, RQ-214, *Overdue*, expected Sat 9 am, with the note underneath. Try **Check in a unit → AD-15**: it shows *No open loan* and points to AD-12. Choose **AD-12** (or its **Check in** button), tick the label box and click **Close L-404**. The status bar reads *RQ-214: 3/3 units returned*. AD-15 has no loan history, and Tara's microphone is still out.

### What I'd watch at a real counter

When an item arrives the morning after a partial return, does the operator close the right loan **without opening the desk book or asking a colleague**? I'd time from "item put down on the counter" to "loan closed", and count wrong-unit closures found in the weekly stock check. If the change helps, the time should match an ordinary return, and wrong-unit closures should be zero.

## Run the app

Open `index.html` in a modern browser. The app includes its scripts, styles, and icons and can run offline.

To serve it over local HTTP, run this from the repository folder and visit `http://localhost:8000`.

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Each browser stores its own sample shift locally when browser storage is available. **Restart sample shift** restores the fictional starting records.

## Source

- `index.html` contains the desk layout, candidate brief, and bundled icons.
- `app.js` contains the sample records and interactions.
- `styles.css` defines the desktop and mobile layouts.

Icon license notices are in [third-party/lucide-LICENSE.txt](third-party/lucide-LICENSE.txt).


## Submit your work

1. [Fork Campus Stores](https://github.com/virinchi-healthcare/campus-stores/fork) into your GitHub account. Complete the candidate brief and push your changes to your public fork. In your README, point reviewers to your work and explain the decision you made.
2. In your fork, open **Commits**, select the final commit you want reviewed, and copy the page URL. It should look like `https://github.com/YOUR-USERNAME/campus-stores/commit/COMMIT-SHA`.
3. [Submit your work through the Google Form](https://docs.google.com/forms/d/e/1FAIpQLScvzoh1R4WS-SkiwAVBQbMvniieJYSoOEfLMyVo5CyjOvYUgQ/viewform). Your **roll number**, **email ID**, and **final commit link from your public fork** are required. Enter your roll number and email ID in the form only.
