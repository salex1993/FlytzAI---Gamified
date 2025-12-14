
export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'General' | 'Strategies' | 'Technical' | 'Safety';
}

export const FAQ_DATA: FaqItem[] = [
  // --- GENERAL ---
  {
    id: 'what-is-flytz',
    category: 'General',
    question: 'What is Flytz and how is it different from Google Flights?',
    answer: 'Flytz is a "Flight Hacking Engine". Unlike standard search engines that just show you what airlines want you to see, Flytz builds complex strategies (like split-ticketing, positioning flights, and open-jaws) to find price loopholes. We use AI to analyze these routes for risk and value.'
  },
  {
    id: 'save-load',
    category: 'General',
    question: 'Where is my data saved?',
    answer: 'All strategies, profiles, and API keys are saved to your browser\'s LocalStorage. If you clear your browser cache or switch devices, this data will be lost. Flytz does not have a cloud database.'
  },
  {
    id: 'mobile-app',
    category: 'General',
    question: 'Is there a mobile app for Flytz?',
    answer: 'Flytz is a Progressive Web App (PWA). You can use it on your mobile browser and even "Add to Home Screen" for an app-like experience, but there is no native iOS or Android app store download currently.'
  },
  {
    id: 'currency',
    category: 'General',
    question: 'Can I change the currency?',
    answer: 'Currently, Flytz defaults to USD for consistency with major booking systems. However, when you click through to book on Google Flights or Skyscanner, they will automatically detect your local region and currency.'
  },

  // --- STRATEGIES ---
  {
    id: 'chaos-levels',
    category: 'Strategies',
    question: 'What do the "Adventure Levels" mean?',
    answer: 'Level 1 is for comfort (direct flights). Level 3 introduces "Self-Transfers" (switching airlines on your own). Level 5 unlocks "Skiplagging" (hidden city ticketing) and long overnight layovers for maximum savings. Higher levels = cheaper flights but more hassle.'
  },
  {
    id: 'skiplagging',
    category: 'Strategies',
    question: 'Is Skiplagging (Hidden City) illegal?',
    answer: 'It is generally not illegal, but it violates airline contracts of carriage. Risks include getting banned from an airline\'s frequent flyer program or having your return ticket cancelled. Flytz advises extreme caution: never check bags and never use your frequent flyer number on these trips.'
  },
  {
    id: 'positioning',
    category: 'Strategies',
    question: 'What is a "Positioning Flight"?',
    answer: 'A positioning flight is a cheap short-haul flight you take to get to a major hub where a cheaper long-haul deal exists. For example, flying from Austin to Los Angeles separately to catch a $400 deal from LAX to Tokyo.'
  },
  {
    id: 'error-fares',
    category: 'Strategies',
    question: 'What is an "Error Fare"?',
    answer: 'An error fare is when an airline accidentally publishes a ticket for a significantly lower price due to a glitch or human error (e.g., $200 to Europe). If you book one, DO NOT book hotels immediately. Airlines may cancel and refund the ticket within 24-48 hours.'
  },
  {
    id: 'open-jaw',
    category: 'Strategies',
    question: 'What is an "Open Jaw" ticket?',
    answer: 'An Open Jaw is flying into one city and out of another (e.g., NYC->London, then Paris->NYC). This saves time and money by avoiding backtracking. Flytz often recommends this for Europe and Asia trips.'
  },
  {
    id: 'best-time-to-book',
    category: 'Strategies',
    question: 'Is there a "Best Day" to book flights?',
    answer: 'The "Tuesday at midnight" rule is largely a myth. However, booking 1-3 months in advance for domestic and 2-6 months for international flights is the sweet spot. Flying mid-week (Tuesday/Wednesday) is almost always cheaper than flying on weekends.'
  },

  // --- SAFETY & LOGISTICS ---
  {
    id: 'split-ticket-risk',
    category: 'Safety',
    question: 'What happens if I miss a connection on a "Split Ticket"?',
    answer: 'If you book separate tickets (e.g., United then Ryanair), the first airline is not responsible if you miss the second flight. You must leave ample buffer time (4+ hours recommended) and you may need to pass immigration/customs to re-check bags between flights.'
  },
  {
    id: 'visas',
    category: 'Safety',
    question: 'Do I need a visa for layovers?',
    answer: 'If your itinerary requires a "Self-Transfer" (picking up bags and re-checking them), you often need to legally enter the country, which may require a full Visa or Transit Visa. Always check the entry requirements for every country you touch, even for just a few hours.'
  },
  {
    id: 'schengen-zone',
    category: 'Safety',
    question: 'How does the Schengen Zone affect transfers?',
    answer: 'In Europe\'s Schengen Zone, a flight from France to Germany is considered "domestic". If you arrive from outside Schengen (e.g., USA) and transfer to a Schengen flight, you clear immigration at your FIRST point of entry, not your final destination.'
  },
  {
    id: 'travel-insurance',
    category: 'Safety',
    question: 'Does travel insurance cover "Self-Transfers"?',
    answer: 'Most standard policies DO NOT cover missed connections if they are on separate tickets. You need specifically tailored insurance (like "Missed Connection" coverage) or premium travel credit cards that offer trip interruption protection.'
  },
  {
    id: 'baggage-interlining',
    category: 'Safety',
    question: 'What is "Baggage Interlining"?',
    answer: 'Interlining is when airlines transfer your bag to the next flight automatically. Low-cost carriers (Ryanair, Spirit) almost NEVER interline. If you switch to/from a budget airline, you MUST claim your bag and re-check it.'
  },

  // --- TECHNICAL ---
  {
    id: 'api-keys',
    category: 'Technical',
    question: 'Why do I need to input API keys?',
    answer: 'Flytz is a client-side application, meaning it runs entirely in your browser. To fetch live data from Amadeus or use Google\'s Gemini AI without a middleman server, you input your own free keys. These keys are stored locally on your device and never sent to us.'
  },
  {
    id: 'price-accuracy',
    category: 'Technical',
    question: 'Why are the prices sometimes slightly different when I click to book?',
    answer: 'Flight pricing is highly dynamic and changes by the minute based on "fare buckets". The price you see on Flytz is the last known cache from the Global Distribution System (GDS). Always verify the final price on the airline\'s website before paying.'
  },
  {
    id: 'mock-data',
    category: 'Technical',
    question: 'Why am I seeing "Mock Data"?',
    answer: 'If the system cannot detect valid Amadeus API keys in your settings, it falls back to a simulation mode so you can still experience the UI and strategy engine flows. Go to Settings (Gear Icon) to add your keys for live results.'
  }
];
