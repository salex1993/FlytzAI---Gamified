# Authorship & Technical Steering Log
**Project:** Flytz (AI-Powered Multimodal Flight Discovery)
**Lead Architect:** Stephen Alexander
**Status:** Proprietary / Commercial

## 1. Proprietary Business Logic
The core "Flytz Intelligence" is driven by specific human-conceived heuristics refined through iterative technical steering:

### The Flytz Ratio Logic
I established a mandatory discovery threshold (The Flytz Ratio) that filters all results. A route is only considered "Mission Ready" if it meets the following criteria:
*   **Transit Friction:** Total self-transfer or positioning transit time must be < 1 hour.
*   **Arbitrage Efficiency:** Total positioning cost must be < 40% of the calculated total savings versus a standard direct GDS fare.

### Complexity Score Formula
I designed the Complexity Score ($S$) to quantify travel friction for gamification and risk assessment:
$$S = (L \times 15) + (M \times 25) + (H \times 50) + (D \times 10)$$
Where:
*   $L$: Number of Low-Cost Carrier (LCC) legs.
*   $M$: Number of multi-airport self-transfers.
*   $H$: Number of High-risk (Hidden City) legs.
*   $D$: Number of distinct ticket documents required.

## 2. Iterative Design Shifts & Rescissions
*   **Style Rescission:** I explicitly rescinded the initial "Cyberpunk" aesthetic requirements in favor of a professional "Mission Control" theme. I directed the removal of neon-excessive styling and "hacker-speak" in favor of normal, professional terminology suitable for an enterprise-ready cockpit.
*   **Gamification Architecture:** I authored the requirement for a tiered Level/XP system ($500 \times 1.5^n$ progression) and established the specific conditions for "Achievement" unlocks (e.g., 'Deal Sniper' logic requiring 40% savings).

## 3. Strategic Sourcing & AI Refinement
*   **GDS Selection:** I manually vetted and selected the Amadeus API over competitors based on its superior support for multi-modal "Virtual Interlining."
*   **Gemini 3 Integration:** I directed the switch to Gemini 3 series models (Flash and Pro) for real-time strategy refinement, explicitly requiring the use of `responseSchema` for structured parsing and `thinkingBudget` management.
*   **Private Sector Integration:** I authored the requirement to bridge commercial air itineraries with private ground and charter transit data, creating a unified discovery interface.
