# Resource Hub & AI Integration Design Document

## 1. Overview
The Resource Hub has been upgraded to serve as a comprehensive platform for funding, valuation, and curriculum progression. It now integrates two AI-powered assistants: **MentorGPT** (Career & Curriculum) and **MoneyGPT** (Finance & Funding).

## 2. Architecture

### 2.1 Component Structure
The solution is built using React components within the existing `apps/desktop` architecture.

*   **`ResourceHub.tsx`**: The main container component.
    *   **Layout**: Grid-based layout for resource cards (Curriculum, Funding, Crowdfunding, etc.).
    *   **State Management**: Manages `activeAgent` state ('mentor' | 'money' | null) to toggle the AI side panel.
    *   **Integration**: Imports and renders `AIChatInterface`.
*   **`agents/AIChatInterface.tsx`**: A reusable, polymorphic chat component.
    *   **Props**: `agentName`, `agentType`, `description`, `suggestions`.
    *   **Functionality**: Handles chat history, user input, and simulates AI responses (extensible to real LLM backend).
    *   **UI**: Glassmorphism design with responsive message bubbles, typing indicators, and suggestion chips.

### 2.2 Integration Points
*   **Navigation**: Accessed via the "Resource Hub" tab in the `DynamicWorkspace`.
*   **AI Access**: "AI Advisors" section at the top of the Resource Hub provides clear entry points for MentorGPT and MoneyGPT.
*   **Overlay System**: AI chat opens in a non-intrusive side panel (slide-over), allowing users to reference resources while chatting.

## 3. Functionalities

### 3.1 MentorGPT
*   **Focus**: Career development, skill enhancement, academic progression.
*   **Features**:
    *   Personalized guidance on curriculum topics.
    *   Learning path suggestions.
    *   Integration with "Weekly Curriculum" resources.

### 3.2 MoneyGPT
*   **Focus**: Funding, investment strategies, financial valuation.
*   **Features**:
    *   Guidance on SBA loans, grants, and VC funding.
    *   Valuation methodology explanations (e.g., Berkus Method).
    *   Financial modeling assistance.

### 3.3 Resource Hub Core
*   **Curated Materials**:
    *   **Weekly Curriculum**: Structured learning modules.
    *   **Funding Sources**: Direct links to SBA, NSF, SBIR.
    *   **Valuation Tools**: Calculators and term sheet templates.
    *   **Market Research**: Articles and guides.

## 4. UI/UX Design
*   **Theme**: Consistent "Electric Purple" and dark mode aesthetic.
*   **Interactivity**: Hover effects, smooth transitions for side panel, and animated typing indicators.
*   **Accessibility**: Clear typography, high contrast icons, and intuitive navigation.

## 5. Security & Performance
*   **Data Privacy**: Chat interface includes disclaimers about AI usage. Architecture supports secure API calls to backend services.
*   **Performance**: React components are optimized for rendering. The chat history is managed locally in component state for responsiveness.

## 6. Future Scalability
*   **Backend Integration**: The `AIChatInterface` is fully integrated with a live Ollama server (configured in `config.ts`). It dynamically fetches available models and supports pulling new ones (e.g., `llama3`) directly from the UI.
*   **New Agents**: Adding a "LegalGPT" or "MarketingGPT" requires only adding a new card in `ResourceHub` and passing appropriate props to `AIChatInterface`.

---

# User Guide

## Accessing the Resource Hub
1.  Launch the Tyaga Desktop Application.
2.  Click on the **Resource Hub** tab (Book icon).

## Using MentorGPT
1.  In the "AI Advisors" section, click on the **MentorGPT** card (Blue Bot icon).
2.  The chat panel will slide open from the right.
3.  Type your question (e.g., "What should I learn next?") or click a suggestion chip.
4.  MentorGPT will respond with advice tailored to your career and curriculum.

## Using MoneyGPT
1.  In the "AI Advisors" section, click on the **MoneyGPT** card (Green Dollar icon).
2.  The chat panel will slide open from the right.
3.  Ask about funding (e.g., "How do I value my startup?") or financial planning.
4.  MoneyGPT will provide insights and strategies.

## Browsing Resources
*   Scroll down to view curated resource cards.
*   Click on any link (e.g., "SBA Loans") to open the external resource in your browser.
