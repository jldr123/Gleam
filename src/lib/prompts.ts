export interface Prompt {
  id: string
  text: string
}

/** Gentle, open questions. None of them assume the day was good. */
export const PROMPTS: Prompt[] = [
  { id: 'easier', text: 'Who made today a little easier?' },
  { id: 'learned', text: 'What did you learn today, big or small?' },
  { id: 'smile', text: 'What made you smile, even briefly?' },
  { id: 'proud', text: 'What is one thing you handled well today?' },
  { id: 'noticed', text: 'What did you notice today that you usually overlook?' },
  { id: 'kindness', text: 'What kindness did you give or receive?' },
  { id: 'body', text: 'What did your body do for you today?' },
  { id: 'hard', text: 'What was hard today, and what got you through it?' },
  { id: 'again', text: 'Which moment from today would you happily live again?' },
  { id: 'thank', text: 'Who would you thank today if you could?' },
  { id: 'calm', text: 'When did you feel most at ease today?' },
  { id: 'taste', text: 'What did you eat, drink or smell that you enjoyed?' },
  { id: 'place', text: 'Where were you when you felt good today?' },
  { id: 'tomorrow', text: 'What are you quietly looking forward to?' },
  { id: 'letgo', text: 'What can you let go of before you sleep?' },
  { id: 'surprise', text: 'What surprised you today?' },
  { id: 'conversation', text: 'Which conversation stayed with you today?' },
  { id: 'growth', text: 'Where did you grow a little today?' },
  { id: 'simple', text: 'What simple thing do you have that you would miss?' },
  { id: 'sound', text: 'What sound, song or voice did you enjoy today?' },
  { id: 'help', text: 'Who did you help today, and how did it feel?' },
  { id: 'enough', text: 'What about today was enough, just as it was?' },
  { id: 'outside', text: 'What did you see outside today?' },
  { id: 'younger', text: 'What would your younger self be glad you have now?' },
  { id: 'rest', text: 'How did you rest or recharge today?' },
  { id: 'friend', text: 'Which person are you glad is in your life right now?' },
  { id: 'gift', text: 'What did today give you that you did not expect?' },
  { id: 'remember', text: 'What from today do you want to remember in a year?' },
]

function hash(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

/** The same prompt all evening, a different one most nights. `skip` moves to the next one. */
export function promptFor(date: string, skip = 0): Prompt {
  return PROMPTS[(hash(date) + skip) % PROMPTS.length]
}

/** Short reasons to reflect, shown once per evening. */
export const WHY_LINES = [
  'Noticing what went well trains your attention to find it more often.',
  'Writing down a few good things in the evening is linked to better sleep.',
  'Gratitude tends to strengthen the relationships it is about.',
  'A few honest minutes now can make a hard day feel lighter.',
  'Small, specific moments count more than big general ones.',
  'You do not have to feel grateful for everything. Just notice what is there.',
]

export function whyLineFor(date: string): string {
  return WHY_LINES[hash(`why-${date}`) % WHY_LINES.length]
}
