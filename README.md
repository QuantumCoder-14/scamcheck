# ScamCheck

**Paste a suspicious message. See which scam patterns it matches — before you click, call back
or pay anything.**

**[Live: quantumcoder-14.github.io/scamcheck](https://quantumcoder-14.github.io/scamcheck/)**

Built for the messages people in India actually receive: fake CBI and "digital arrest" calls,
KYC-expiry phishing, customs-fee parcel fraud, pay-per-task job scams, electricity
disconnection threats, and "enter your UPI PIN to receive money".

## Why this exists

A "digital arrest" scam is a script. The caller claims to be CBI or Customs, says a case is
registered, forbids you from telling anyone, and stays on a video call until you transfer
money. It works because the pressure is real-time and the victim has no way to check anything
mid-call.

This tool does the checking. Paste the message and it shows the specific signals — not a vague
red warning, but "this matched: impersonation of authority, demands secrecy, payment to a
government account" with a one-line reason for each.

## What it checks

**21 rule groups across nine categories**, each with a severity and a weight:

| Category | Examples of what it catches |
| --- | --- |
| Impersonation | CBI / NIA / ED claims, arrest warrants, "do not tell anyone", "stay on the call" |
| Banking | KYC expiry, account-freeze threats, OTP and PIN requests, unsolicited refunds |
| Delivery | parcels held for customs duty, illegal-items stories, address confirmation |
| Job fraud | pay-per-task offers, joining or registration fees |
| Prize | lotteries you never entered, "claim your prize" |
| Loan fraud | instant loans with no documents or CIBIL check |
| Utility | disconnection threats with a deadline tonight |
| Payment | "enter UPI PIN to receive", gift cards, crypto, "government account", AnyDesk and TeamViewer |
| Pressure | artificial urgency, "click here", legal threats, bulk-template phrasing |

**Plus link analysis** on every URL in the message: shortened links that hide their
destination, raw IP addresses, plain `http`, punycode lookalikes, cheap TLDs, and domains
imitating a bank or government name while not being on `gov.in`.

## How the score works

Weights are summed, with two adjustments:

- **Any high-severity signal adds 15 on its own.** A single "digital arrest" message must not
  land in the same band as a mildly pushy advert. That fix came out of a failing test — a
  customs-fee message with a `bit.ly` link originally scored 29, which is "be careful" for an
  obvious scam.
- **Links add up to 18**, scaled by how many flags they carry.

Bands: 0-14 no obvious signals · 15-39 be careful · 40-69 likely a scam · 70+ almost certainly.

## What it cannot do, stated plainly

- **It reads patterns, not intent.** A low score is not a clean bill of health, and a high
  score is not proof. A scam written in careful English with no links can score low.
- **It cannot see the sender.** A spoofed sender ID, a lookalike number or a genuine bank's
  real message forwarded by a scammer all look the same as text.
- **It cannot call the bank.** It never verifies whether a claim is true, only whether the
  wording matches known fraud patterns.
- **It is India-oriented.** The rules encode Indian institutions, UPI mechanics and local scam
  scripts. Other regions will need their own rule set.

## Local only

No server, no logging, no storage. The message is analysed in the page and disappears when you
close the tab. Save the page and it works with no connection — useful, since the moment you
need it you may be on a call with someone who wants you offline.

## Tests

```bash
node tests/test.js     # 34 assertions across 21 rules
```

The suite asserts that each sample scam scores where it should (digital arrest, KYC, parcel,
task), that a normal message scores under 15, that individual rules fire on their own wording,
that there are **no false positives** on a legitimate OTP message ("Your OTP for login is
4821, do not share it"), that lookalike detection does *not* flag `onlinesbi.sbi` or
`cybercrime.gov.in`, and that scoring is deterministic and never exceeds 100.

## If you have already been scammed

Call **1930** (India's cyber-fraud helpline) and file at
**[cybercrime.gov.in](https://cybercrime.gov.in)**. Report within 24 hours — early reporting is
what makes a UPI transaction reversible.

## Licence

MIT with Commons Clause. Copyright (c) 2026 Siddhant Neekhra. See [LICENSE.md](LICENSE.md).
