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
  { title: "Energy Check", practice: "Notice which task gives you energy and which task drains you today.", reflection: "What did your energy reveal about your priorities?" },
  { title: "Sound Map", practice: "Close your eyes for one minute and identify the nearest, farthest, and most surprising sounds.", reflection: "Which sound reached your awareness first?" },
  { title: "Texture Clue", practice: "Touch three everyday objects and notice which texture feels most comforting today.", reflection: "What quality did the chosen texture bring to mind?" },
  { title: "Doorway Pause", practice: "Pause at one doorway and notice the first thought you have before entering.", reflection: "Did that thought affect how you entered the space?" },
  { title: "Opposite Hand", practice: "Use your non-dominant hand for one simple task and notice what becomes more visible.", reflection: "What did slowing down help you notice?" },
  { title: "Shelf Choice", practice: "Choose one item from a shelf because it catches your attention, then consider why.", reflection: "What association surfaced when you held it?" },
  { title: "Tea Intention", practice: "Set one gentle intention while preparing a drink and revisit it after the last sip.", reflection: "How did the ritual affect your attention?" },
  { title: "Cloud Shape", practice: "Watch the sky briefly and name the first shape or story you recognize.", reflection: "What did your imagination choose without prompting?" },
  { title: "Scent Memory", practice: "Notice one scent today and let the first related memory arrive without searching.", reflection: "Why might that memory have surfaced now?" },
  { title: "Pocket Object", practice: "Carry a small meaningful object and notice when you remember it during the day.", reflection: "What was happening each time you remembered it?" },
  { title: "Three Breaths", practice: "Take three slow breaths before beginning one routine task.", reflection: "What changed when you began from a calmer place?" },
  { title: "Kindness Observation", practice: "Notice one act of kindness between other people without interrupting it.", reflection: "How did witnessing kindness affect you?" },
  { title: "Future Postcard", practice: "Write two sentences as if a content future version of you sent a postcard.", reflection: "What did your future perspective want you to remember?" },
  { title: "Intuitive Outfit", practice: "Choose one color or accessory by first impression rather than habit.", reflection: "How did that choice influence how you felt?" },
  { title: "Grocery Pull", practice: "At a store or in your kitchen, notice which wholesome food attracts your attention first.", reflection: "Was your body asking for a flavor, color, or kind of nourishment?" },
  { title: "Desk Object", practice: "Move one object on your desk or workspace to the place that feels most useful.", reflection: "Did the new placement change your focus?" },
  { title: "Silence Before Yes", practice: "Allow three quiet seconds before agreeing to one small request.", reflection: "What became clearer during the pause?" },
  { title: "Emotion Color", practice: "Give your present emotion a color without trying to change it.", reflection: "Did naming a color make the feeling easier to observe?" },
  { title: "Gratitude Photo", practice: "Photograph one ordinary thing you are genuinely grateful to have today.", reflection: "What made this ordinary thing worth noticing?" },
  { title: "Helpful Object", practice: "Choose one unused item you own and put it where it can be useful again.", reflection: "What possibility did you notice in the object?" },
  { title: "First Headline", practice: "Before opening a news or article page, guess the general topic of the first headline.", reflection: "How did your expectation compare with what appeared?" },
  { title: "Room Energy", practice: "Stand quietly in two rooms and notice how your posture or mood differs in each.", reflection: "Which details may have shaped the difference?" },
  { title: "Plant Notice", practice: "Spend one minute observing a plant, tree, or flower without naming or judging it.", reflection: "Which detail held your attention longest?" },
  { title: "Animal Encounter", practice: "Notice the first animal you encounter in person, through a window, or in an image.", reflection: "What quality did you associate with that animal?" },
  { title: "Number Guess", practice: "Before looking at a clock, receipt, or counter, guess one number you may see.", reflection: "Was your impression exact, close, or unrelated?" },
  { title: "Temperature Sense", practice: "Before stepping outside, estimate how the air will feel on your skin.", reflection: "Which physical cue informed your estimate?" },
  { title: "Screen-Free Ten", practice: "Spend ten minutes without a screen and follow the first constructive activity that appeals to you.", reflection: "What did your attention choose when it was not being directed?" },
  { title: "Forgotten Song", practice: "Let an old song come to mind and listen to it if it is available.", reflection: "What feeling or period of life did the song reopen?" },
  { title: "Recipe Instinct", practice: "Add or adjust one safe ingredient by taste and attention rather than strict habit.", reflection: "How did trusting your senses affect the result?" },
  { title: "Creative Mark", practice: "Make one unplanned line, shape, or color mark and build a tiny drawing around it.", reflection: "What did the first mark become?" },
  { title: "Question Jar", practice: "Write one question you do not need to answer immediately and place it somewhere visible.", reflection: "Did holding the question lightly create any new thought?" },
  { title: "Coin Observation", practice: "Examine a coin closely for thirty seconds and find one detail you had overlooked.", reflection: "What else might familiarity cause you to miss?" },
  { title: "Sunrise or Sunset", practice: "Notice the changing light near sunrise or sunset, even briefly through a window.", reflection: "What transition did the changing light suggest to you?" },
  { title: "Water Pause", practice: "Drink a glass of water slowly and notice the first physical sensation afterward.", reflection: "What did your body communicate when you paid attention?" },
  { title: "Supportive Phrase", practice: "Write the supportive sentence you would offer a friend facing your current challenge.", reflection: "How did the sentence feel when directed toward yourself?" },
  { title: "Priority Card", practice: "Write your three priorities, turn the paper over, and recall which one feels most important.", reflection: "Did importance match the order you originally wrote?" },
  { title: "Body Gratitude", practice: "Thank one part of your body for something practical it helped you do today.", reflection: "Did appreciation change how you experienced your body?" },
  { title: "Unfinished Task", practice: "Choose the smallest unfinished task that keeps returning to your attention and complete one step.", reflection: "Why might your attention have kept returning there?" },
  { title: "Generosity Choice", practice: "Offer a small resource, bit of time, or useful information where it is genuinely welcome.", reflection: "How did you recognize the right kind of help to offer?" },
  { title: "Listening Walk", practice: "Take a short walk while focusing on sound instead of what you see.", reflection: "What became noticeable when hearing led the experience?" },
  { title: "Light and Shadow", practice: "Find an interesting pattern of light and shadow and observe how it changes for one minute.", reflection: "What mood or image did the pattern create?" },
  { title: "Pattern Hunt", practice: "Look for one repeating shape or pattern in three unrelated places today.", reflection: "Did repetition change what the pattern meant to you?" },
  { title: "Surprise Yourself", practice: "Make one harmless choice that is different from your usual preference.", reflection: "What did stepping outside habit reveal?" },
  { title: "Memory Object", practice: "Choose an object connected to a good memory and tell its story in three sentences.", reflection: "Which part of the memory felt most alive?" },
  { title: "Small Courage", practice: "Take one low-stakes action you have been postponing because it feels slightly uncomfortable.", reflection: "What helped you move from hesitation to action?" },
  { title: "Rest Signal", practice: "Notice the first sign that your attention needs a short break and honor it safely.", reflection: "Did responding early make it easier to return?" },
  { title: "Energy Boundary", practice: "Protect ten minutes for one important activity by declining a nonessential distraction.", reflection: "What became possible when you protected the time?" },
  { title: "Curiosity List", practice: "Write three things you are sincerely curious about without trying to research them yet.", reflection: "Which curiosity carried the most energy?" },
  { title: "Meaningful Sound", practice: "Choose one sound that represents how you want today to feel and listen for something similar.", reflection: "Where did the sound or its feeling reappear?" },
  { title: "Tomorrow Note", practice: "Leave one kind, practical note for yourself to discover tomorrow.", reflection: "What support did you know your future self would appreciate?" },
  { title: "Joy Spot", practice: "Identify one place where you tend to feel lighter and spend a few intentional minutes there.", reflection: "Which qualities of the place supported that feeling?" }
];

const practiceVersions = [
  { label: "Open Practice", practicePrefix: "", reflectionPrefix: "" },
  { label: "Morning Version", practicePrefix: "Before noon, ", reflectionPrefix: "What did trying this earlier in the day add? " },
  { label: "Three-Breath Version", practicePrefix: "Take three slow breaths first, then ", reflectionPrefix: "After beginning with three breaths, " },
  { label: "Outdoor Version", practicePrefix: "If practical, try this outdoors or beside an open window: ", reflectionPrefix: "How did the setting affect the experience? " },
  { label: "Written Version", practicePrefix: "Keep one short written note while you try this: ", reflectionPrefix: "What did writing one detail help you recognize? " },
  { label: "Routine Version", practicePrefix: "Connect this practice to an ordinary routine today: ", reflectionPrefix: "How did attaching it to a routine change your follow-through? " },
  { label: "Five-Minute Version", practicePrefix: "Give this five focused minutes without multitasking: ", reflectionPrefix: "What became clearer with five minutes of focus? " },
  { label: "Sensory Version", practicePrefix: "Pay special attention to physical sensations while you try this: ", reflectionPrefix: "Which sensory detail gave you the most information? " },
  { label: "Evening Version", practicePrefix: "Try this later in the day and compare it with your morning expectations: ", reflectionPrefix: "What changed between morning and evening? " },
  { label: "Journal Version", practicePrefix: "Afterward, record one honest sentence about this practice: ", reflectionPrefix: "What did your one-sentence record reveal? " }
];

export const dailyIntuitionLessons = practiceVersions.flatMap((version, versionIndex) =>
  simpleIdeas.map((idea) => ({
    ...idea,
    baseTitle: idea.title,
    title: `${idea.title} · ${version.label}`,
    versionIndex,
    points: [
      "Choose one gentle idea for today.",
      "Let awareness, mindfulness, and inner knowing guide the moment.",
      "Keep it simple enough to actually try in real life."
    ],
    practice: `${version.practicePrefix}${idea.practice.charAt(0).toLowerCase()}${idea.practice.slice(1)}`,
    reflection: `${version.reflectionPrefix}${idea.reflection.charAt(0).toLowerCase()}${idea.reflection.slice(1)}`
  }))
);

export function getDailyPositivityChoices(userKey: string, dateKey: string) {
  const baseLessons = dailyIntuitionLessons.filter((lesson) => lesson.versionIndex === 0);
  const remaining = [...baseLessons].sort((first, second) =>
    stableHash(`${userKey.toLowerCase()}-${first.baseTitle}`) - stableHash(`${userKey.toLowerCase()}-${second.baseTitle}`)
  );
  const pairs: Array<typeof dailyIntuitionLessons> = [];
  while (remaining.length >= 2) {
    const first = remaining.shift()!;
    const differentThemeIndex = remaining.findIndex((candidate) => getIdeaTheme(candidate.title) !== getIdeaTheme(first.title));
    const second = remaining.splice(differentThemeIndex >= 0 ? differentThemeIndex : 0, 1)[0];
    pairs.push([first, second]);
  }
  const dayNumber = daysSinceStart(dateKey);
  const pairIndex = dayNumber % pairs.length;
  const versionIndex = Math.floor(dayNumber / pairs.length) % practiceVersions.length;
  return pairs[pairIndex].map((baseLesson) =>
    dailyIntuitionLessons.find((lesson) => lesson.baseTitle === baseLesson.baseTitle && lesson.versionIndex === versionIndex)!
  );
}

function getIdeaTheme(title: string) {
  title = title.split(" · ")[0];
  const connection = new Set(["First Friend", "Lunch Invitation", "Kind Message", "Simple Thank You", "Helpful Reach", "One Good Question", "Small Invitation", "One Compliment", "Gentle Repair", "Message Draft", "Kindness Observation", "Supportive Phrase", "Generosity Choice", "Tomorrow Note"]);
  const prediction = new Set(["Next Call Guess", "Notification Guess", "Color Watch", "Song Sense", "Conversation Guess", "Future Guess", "Inbox Feeling", "Calendar Sense", "First Headline", "Number Guess", "Temperature Sense"]);
  const innerCheck = new Set(["Attention Question", "Calmest Choice", "Heart Check", "Body Signal", "Coin Choice", "Inner Compass", "Energy Check", "Doorway Pause", "Tea Intention", "Silence Before Yes", "Emotion Color", "Room Energy", "Priority Card", "Body Gratitude", "Small Courage", "Rest Signal", "Energy Boundary"]);
  const noticing = new Set(["Morning Image", "Window Notice", "Daily Word", "Object Pull", "Book Line", "Nature Signal", "Mood Weather", "Synchronicity Watch", "Photo Prompt", "Ask for a Sign", "Name Pop-In", "Dream Clue", "Five Senses", "Sound Map", "Texture Clue", "Shelf Choice", "Cloud Shape", "Scent Memory", "Plant Notice", "Animal Encounter", "Coin Observation", "Sunrise or Sunset", "Water Pause", "Listening Walk", "Light and Shadow", "Pattern Hunt", "Meaningful Sound"]);
  const action = new Set(["Different Route", "Lighter Day", "Tiny Yes", "Tiny No", "Intuitive Errand", "Small Declutter", "Random Kindness", "Five-Minute Reset", "Fresh Air Pause", "Opposite Hand", "Intuitive Outfit", "Grocery Pull", "Desk Object", "Helpful Object", "Screen-Free Ten", "Recipe Instinct", "Unfinished Task", "Surprise Yourself", "Joy Spot"]);
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
