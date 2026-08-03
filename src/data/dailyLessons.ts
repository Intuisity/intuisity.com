type DailyPositivityIdea = {
  title: string;
  practice: string;
  reflection: string;
};

const simpleIdeas: DailyPositivityIdea[] = [
  { title: "Next Call Guess", practice: "Guess who will call or text you next, then notice what actually happens.", reflection: "What did your first guess teach you about your inner knowing?" },
  { title: "First Friend", practice: "Call or message the first friend who comes to mind.", reflection: "What made that person stand out before you thought it through?" },
  { title: "Lunch Invitation", practice: "Invite someone to lunch, coffee, tea, or a short walk.", reflection: "How did it feel to act on a simple impulse toward connection?" },
  { title: "Three-Minute Writing", practice: "Sit with a pen for three minutes and write whatever comes to mind without editing it.", reflection: "What word, feeling, or image seemed most important afterward?" },
  { title: "Kind Message", practice: "Send a short kind message to someone without overthinking who to choose.", reflection: "What changed in your own energy after sending it?" },
  { title: "Notification Guess", practice: "Before checking your phone, guess the first notification you will see.", reflection: "Was your first impression close in person, topic, or feeling?" },
  { title: "Different Route", practice: "Take a slightly different route today and notice what catches your attention.", reflection: "What did the change in routine help you notice?" },
  { title: "Attention Question", practice: "Ask yourself, 'What should I pay attention to today?' and write the first answer.", reflection: "Where did that answer show up during the day?" },
  { title: "Color Watch", practice: "Guess what color you will notice most today, then watch for it.", reflection: "Did the color appear in a way that felt meaningful or surprising?" },
  { title: "Daily Word", practice: "Choose one word for the day and watch for where it appears.", reflection: "Where did the word show up in your thoughts, conversations, or surroundings?" },
  { title: "Calmest Choice", practice: "Pause before one small decision and choose what feels calmest.", reflection: "How did the calm choice affect the next part of your day?" },
  { title: "Morning Image", practice: "Write down the first image, word, or feeling that comes to mind this morning.", reflection: "Did that image, word, or feeling connect to anything later?" },
  { title: "Window Notice", practice: "Look out a window for one minute and notice what draws your attention first.", reflection: "What might that first attention point be telling you?" },
  { title: "Lighter Day", practice: "Ask, 'What would make today feel lighter?' and do one small thing from the answer.", reflection: "Did the small action shift your mood or awareness?" },
  { title: "Song Sense", practice: "Before pressing shuffle, guess the mood or theme of the next song.", reflection: "How close was your sense of the song's energy?" },
  { title: "Conversation Guess", practice: "Guess one topic someone may bring up in conversation today.", reflection: "Did the topic appear directly, or in a related way?" },
  { title: "Heart Check", practice: "Place your hand over your heart, breathe slowly, and ask what you need today.", reflection: "What answer came before you tried to explain it?" },
  { title: "Simple Thank You", practice: "Send a short thank-you message to someone who comes to mind.", reflection: "What did gratitude open in the moment?" },
  { title: "Object Pull", practice: "Pick up the object in your home that seems to call your attention first.", reflection: "Why do you think that object stood out today?" },
  { title: "Book Line", practice: "Open a book or article and notice the first line your eyes land on.", reflection: "Did that line connect with anything happening in your life?" },
  { title: "Quiet Minute", practice: "Take one quiet minute before answering a message and notice your first feeling.", reflection: "Did your first feeling help you respond differently?" },
  { title: "Name Pop-In", practice: "Notice the first name that randomly comes to mind today.", reflection: "Did that person, name, or memory connect to your day?" },
  { title: "Small Declutter", practice: "Choose one small thing to clear, move, or organize because it feels right.", reflection: "How did clearing that small area affect your mind?" },
  { title: "Nature Signal", practice: "Step outside or look outside and notice the first natural detail that stands out.", reflection: "What feeling did that detail create in you?" },
  { title: "Future Guess", practice: "Guess one small thing that will happen before the end of the day.", reflection: "How did your guess compare to what unfolded?" },
  { title: "Helpful Reach", practice: "Ask yourself who may appreciate a quick check-in today, then contact that person.", reflection: "What made that person come forward in your mind?" },
  { title: "One Good Question", practice: "Ask someone one sincere question and listen without planning your answer.", reflection: "What did deeper listening reveal?" },
  { title: "Mood Weather", practice: "Choose a weather word for your mood, then see if the day reflects it somehow.", reflection: "Did your inner weather match anything around you?" },
  { title: "Tiny Yes", practice: "Say yes to one small thing that feels light and healthy.", reflection: "What did that tiny yes create?" },
  { title: "Tiny No", practice: "Say no or pause one small thing that feels heavy or rushed.", reflection: "What did that tiny no protect?" },
  { title: "Intuitive Errand", practice: "When doing an errand, notice which aisle, item, or person draws your attention.", reflection: "Did anything useful come from following that attention?" },
  { title: "Message Draft", practice: "Write a message to someone before deciding whether to send it.", reflection: "What did writing it clarify?" },
  { title: "Body Signal", practice: "Before one choice, notice whether your body feels open, tight, calm, or rushed.", reflection: "What did your body know before your mind decided?" },
  { title: "Five Senses", practice: "Pause and name one thing you see, hear, feel, smell, and sense inside.", reflection: "Which sense gave you the strongest information?" },
  { title: "Small Invitation", practice: "Invite someone into a simple plan: coffee, lunch, a walk, or a quick call.", reflection: "What did the invitation teach you about connection?" },
  { title: "Dream Clue", practice: "If you remember a dream, write one symbol or feeling from it.", reflection: "Did the dream feeling echo anywhere in your day?" },
  { title: "Inbox Feeling", practice: "Before opening email, guess whether the first important message will feel easy, neutral, or demanding.", reflection: "How accurate was your read of the energy?" },
  { title: "Coin Choice", practice: "Hold two simple options in mind and notice which one feels brighter before deciding.", reflection: "Did the brighter option help your day flow?" },
  { title: "Synchronicity Watch", practice: "Pick a symbol, number, word, or color and watch for it today.", reflection: "Where did it appear, and how did it feel?" },
  { title: "One Compliment", practice: "Give one honest compliment when the opportunity naturally appears.", reflection: "How did the moment feel before and after you spoke?" },
  { title: "Gentle Repair", practice: "If a small misunderstanding comes to mind, take one gentle step to clear it.", reflection: "What shifted after you made the step?" },
  { title: "Fresh Air Pause", practice: "Step outside for two minutes and ask what your next best step is.", reflection: "What answer felt calmest?" },
  { title: "Photo Prompt", practice: "Take one photo of something that feels meaningful today.", reflection: "Why did that scene or object pull your attention?" },
  { title: "Random Kindness", practice: "Do one small kind thing anonymously or quietly.", reflection: "How did quiet kindness affect your mood?" },
  { title: "Inner Compass", practice: "Ask, 'What direction feels right today?' and write one simple sentence.", reflection: "Did your sentence point to action, rest, connection, or awareness?" },
  { title: "Calendar Sense", practice: "Look at your day and guess which moment will feel most important.", reflection: "Was that moment important in the way you expected?" },
  { title: "Warm Memory", practice: "Let one good memory come up naturally and write a sentence about it.", reflection: "What did that memory bring into the present?" },
  { title: "Five-Minute Reset", practice: "Spend five minutes doing the first small reset that comes to mind.", reflection: "What did your mind choose when given permission?" },
  { title: "Ask for a Sign", practice: "Ask for a small sign of encouragement, then stay open without forcing it.", reflection: "What did you notice after asking?" },
  { title: "Energy Check", practice: "Notice which task gives you energy and which task drains you today.", reflection: "What did your energy reveal about your priorities?" }
];

export const dailyIntuitionLessons = simpleIdeas.map((idea) => ({
  ...idea,
  points: [
    "Choose one gentle idea for today.",
    "Let awareness, mindfulness, and inner knowing guide the moment.",
    "Keep it simple enough to actually try in real life."
  ]
}));

export function getDailyPositivityChoices(userKey: string, dateKey: string) {
  const remaining = [...dailyIntuitionLessons].sort((first, second) =>
    stableHash(`${userKey.toLowerCase()}-${first.title}`) - stableHash(`${userKey.toLowerCase()}-${second.title}`)
  );
  const pairs: Array<typeof dailyIntuitionLessons> = [];
  while (remaining.length >= 2) {
    const first = remaining.shift()!;
    const differentThemeIndex = remaining.findIndex((candidate) => getIdeaTheme(candidate.title) !== getIdeaTheme(first.title));
    const second = remaining.splice(differentThemeIndex >= 0 ? differentThemeIndex : 0, 1)[0];
    pairs.push([first, second]);
  }
  const dayNumber = daysSinceStart(dateKey);
  return pairs[dayNumber % pairs.length];
}

function getIdeaTheme(title: string) {
  const connection = new Set(["First Friend", "Lunch Invitation", "Kind Message", "Simple Thank You", "Helpful Reach", "One Good Question", "Small Invitation", "One Compliment", "Gentle Repair", "Message Draft"]);
  const prediction = new Set(["Next Call Guess", "Notification Guess", "Color Watch", "Song Sense", "Conversation Guess", "Future Guess", "Inbox Feeling", "Calendar Sense"]);
  const innerCheck = new Set(["Attention Question", "Calmest Choice", "Heart Check", "Body Signal", "Coin Choice", "Inner Compass", "Energy Check"]);
  const noticing = new Set(["Morning Image", "Window Notice", "Daily Word", "Object Pull", "Book Line", "Nature Signal", "Mood Weather", "Synchronicity Watch", "Photo Prompt", "Ask for a Sign", "Name Pop-In", "Dream Clue", "Five Senses"]);
  const action = new Set(["Different Route", "Lighter Day", "Tiny Yes", "Tiny No", "Intuitive Errand", "Small Declutter", "Random Kindness", "Five-Minute Reset", "Fresh Air Pause"]);
  if (connection.has(title)) return "connection";
  if (prediction.has(title)) return "prediction";
  if (innerCheck.has(title)) return "inner-check";
  if (noticing.has(title)) return "noticing";
  if (action.has(title)) return "action";
  return "reflection";
}

function stableHash(value: string) {
  return Math.abs([...value].reduce((hash, character) => ((hash << 5) - hash + character.charCodeAt(0)) | 0, 0));
}

function daysSinceStart(dateKey: string) {
  const [year, month, day] = dateKey.split("-").map(Number);
  return Math.max(0, Math.floor((Date.UTC(year, month - 1, day) - Date.UTC(2026, 0, 1)) / 86400000));
}
