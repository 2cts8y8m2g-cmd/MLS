# Accuracy log

This file records what was checked, how, and what is still open. Lesson-level detail (claims, references, flags) lives in each lesson JSON and appears in the app under **Evidence & accuracy**.

**No human expert has reviewed any content.** Nothing here is endorsed by ASCP, the ASCP BOC, or the PRC.

## Sources actually consulted (2026-10-07)

| Source | How accessed | Used for |
|---|---|---|
| R.A. 5527 (Philippine Medical Technology Act of 1969), lawphil.net | Full text read | MTLE subjects and relative weights (Sec. 17); passing rule as enacted (Sec. 19) |
| PRB-MT Resolution No. 13, s. 2023 (prc.gov.ph PDF) | Resolution text read (3 pages) | Enhanced TOS adopted from the Aug 2023 MTLE onward; supersedes Res. 12 s. 2009 |
| Parastatidou et al., *Children (Basel)* 2025;12(6):666, doi:10.3390/children12060666 | Full text (Europe PMC, CC BY) | IgM anti-A/anti-B in groups A and B; IgG in group O mothers crosses the placenta |
| Shen et al., *Blood Transfus* 2025;23(5):393-408, doi:10.2450/bloodtransfus.941 | Full text (Europe PMC) | Naturally occurring anti-A/anti-B; intravascular hemolysis |
| Shastry et al., *Asian J Transfus Sci* 2013;7(2):153-155, doi:10.4103/0973-6247.115583 | Full text (Europe PMC) | Bombay mistyped as O; 4+ reaction with O cells; anti-H thermal range; neonatal reverse grouping omitted by SOP |
| Elzein, *Cureus* 2024;16(3):e56812, doi:10.7759/cureus.56812 | Full text (Europe PMC, CC BY) | Leukemia-associated ABO discrepancies |

## Sources that could NOT be accessed

| Source | Result | Consequence |
|---|---|---|
| **User's MLS reviewer (attachment)** | Not present in the repository, the remote, or the build environment | No reviewer mapping; provisional curriculum; no chapter checklist |
| ASCP BOC MLS Content Guideline PDF | HTTP 403/404 from the build environment | ASCP areas and weights shown as **unverified**. Secondary summaries disagree on Microbiology (17–20% vs 17–22%) |
| ASCPi (international) MLS guideline | Not checked | ASCPi treated as the same as MLS(ASCP); **unverified** |
| Annex A of PRB-MT Res. 13 s. 2023 (the enhanced TOS itself) | prc.gov.ph returned HTTP 403 | MTLE topic lists are not TOS-verified; the expanded scope of the sixth subject (cytology, laws, management, ethics) is **unverified** |
| NCBI Bookshelf (StatPearls etc.) | CAPTCHA wall | Not used |
| AABB Technical Manual; Harmening, *Modern Blood Banking & Transfusion Practices* | Not available | Listed as `consulted: false`; the claims that depend on them are `pending` |

## Open issues: ABO Forward and Reverse Typing

Claims **pending** verification (8): the age when infants start making ABO antibodies (often quoted as 3–6 months) and the age below which reverse typing isn't required (often quoted as 4 months); weak antibodies in elderly or immunodeficient patients; IgM having 10 binding sites; tube grading descriptions; hemolysis counting as a positive reaction; anti-H lectin (*Ulex*) reactions; rouleaux causing false-positive reverse reactions; A2 subgroups and anti-A1.

Open flags (4):
- **Method-dependent:** grading descriptions apply to tube testing only (gel/column and solid phase differ).
- **Guideline-dependent:** the infant age cutoff. The lesson avoids stating a specific cutoff.
- **Guideline-dependent:** the specimen type depends on lab procedure.
- **Missing context:** the "Groups I–IV" classification of ABO discrepancies is deliberately not taught until it is verified against the reviewer and a textbook.

## Points where the reviewer must not be repeated uncritically (to do once received)

When the reviewer arrives, compare each chapter against current references, and log here:
- outdated nomenclature or methods (for example, older reference ranges or superseded guidelines)
- contradictions between the reviewer and current standards
- reference ranges given without method or population context
- interpretations that depend on a guideline (for example, CLSI/AABB/WHO editions)
