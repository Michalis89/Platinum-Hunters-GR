# Feature: Support Ticket → GitHub Issue Bridge

## Status

Planned

## Summary

Δυνατότητα δημιουργίας GitHub Issue απευθείας από admin support ticket, μετά από review, ώστε τα πραγματικά προβλήματα/requests χρηστών να μπαίνουν στο επίσημο dev workflow.

Το feature λειτουργεί ως γέφυρα ανάμεσα στο in-app support system και το GitHub issue tracker.

---

## Motivation / Why

- Τα support tickets περιέχουν ήδη δομημένη και πολύτιμη πληροφορία.
- Όχι όλα τα tickets πρέπει να γίνονται dev tasks.
- Μετά από admin review, κάποια tickets αξίζουν άμεση μετατροπή σε GitHub issue.
- Αποφεύγεται διπλή καταχώρηση και context loss.
- Ο χρήστης λαμβάνει καθαρή ενημέρωση ότι το θέμα του “μπήκε στη δουλειά”.

---

## User Flow (Admin)

1. Admin ανοίγει ticket στο `/admin/support/:ticketId`
2. Κάνει review του περιεχομένου
3. Πατάει **“Δημιουργία GitHub Issue”**
4. Το σύστημα:
   - δημιουργεί issue στο GitHub
   - αποθηκεύει issue metadata στο ticket
   - (προαιρετικά) στέλνει αυτόματη απάντηση στον χρήστη
5. Το ticket εμφανίζεται ως **Synced with GitHub**

---

## UI Requirements

### Location

`/admin/support/:ticketId` → panel **Διαχείριση**

### Button

- Label: `Δημιουργία GitHub Issue`
- Disabled αν:
  - έχει ήδη δημιουργηθεί issue
  - λείπει τίτλος ή βασική περιγραφή
- Μετά τη δημιουργία:
  - εμφανίζεται link προς το issue
  - badge: `Synced to GitHub`

### Options

- Toggle: `Στείλε αυτόματη απάντηση στον χρήστη`
- Input: `Labels` (comma separated, π.χ. bug, ux, severity:medium)

---

## GitHub Issue Mapping

### Title

[Support] <Ticket Subject>

ή
[Bug] <Ticket Subject>

### Labels

- support
- bug / feature / author-rights / general
- severity:<low|medium|high>
- admin-defined labels

### Body (Markdown)

- Ticket metadata:
  - Ticket ID
  - Category
  - Severity
  - Created at
- User message:
  - Description
  - Steps to reproduce
  - Expected / Actual (αν υπάρχουν)
- Environment:
  - Device
  - OS
  - Browser
  - App version
- Attachments:
  - Links σε screenshots / files (signed URLs)

> Σημείωση: Τα links μπορεί να λήγουν για λόγους ιδιωτικότητας.

---

## Backend Requirements

### API / Server Action

- Endpoint (example):
  POST /api/admin/support/tickets/:id/create-github-issue

### Steps

1. Fetch ticket από DB
2. Validate admin permissions
3. Build GitHub issue payload
4. Create issue via GitHub API
5. Persist στο ticket:

- github_issue_number
- github_issue_url
- github_issue_created_at
- github_issue_state = open

6. Send optional auto-reply
7. Return issue data to UI

---

## Authentication

- MVP: Fine-grained GitHub PAT (repo-scoped)
- Env vars:
- GITHUB_TOKEN
- GITHUB_OWNER
- GITHUB_REPO
- Token χρησιμοποιείται μόνο server-side

---

## Privacy & Attachments

- Screenshots αποθηκεύονται σε Supabase Storage
- Στο GitHub issue μπαίνουν:
- signed URLs με expiration
- Δεν αποθηκεύονται προσωπικά δεδομένα πέρα από το απαραίτητο context

---

## Auto-reply (User)

### Default message

> Το αίτημά σου αξιολογήθηκε και καταχωρήθηκε ως τεχνικό task.
> Θα ενημερωθείς για την εξέλιξή του.

(Δεν απαιτείται public GitHub link)

---

## Edge Cases

- Αν έχει ήδη GitHub issue → disable button
- Αν αποτύχει το GitHub API → εμφανίζεται σαφές error
- Rate limits / auth errors handled gracefully

---

## Future Improvements

- Sync issue close → ticket status = “Λυμένο”
- Timeline events (issue created / closed)
- GitHub App αντί για PAT
- Multiple repo support

---

## Notes

Το feature στοχεύει να κρατήσει το support ανθρώπινο και το dev workflow καθαρό,
χωρίς να εκθέτει εσωτερικά εργαλεία στον χρήστη.
