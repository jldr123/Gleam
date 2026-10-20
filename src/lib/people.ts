const RELATIONS = new Map(
  Object.entries({
    mum: 'Mum', mom: 'Mom', mam: 'Mam', mother: 'Mum', dad: 'Dad', father: 'Dad', sister: 'my sister', brother: 'my brother',
    partner: 'my partner', wife: 'my wife', husband: 'my husband', boyfriend: 'my boyfriend', girlfriend: 'my girlfriend',
    son: 'my son', daughter: 'my daughter', nan: 'Nan', nana: 'Nana', gran: 'Gran', grandma: 'Grandma', grandpa: 'Grandpa',
    grandad: 'Grandad', granddad: 'Granddad', aunt: 'my aunt', auntie: 'my auntie', uncle: 'my uncle', cousin: 'my cousin',
    boss: 'my boss', manager: 'my manager', colleague: 'my colleague', coworker: 'my coworker', teacher: 'my teacher',
    neighbour: 'my neighbour', neighbor: 'my neighbor', mate: 'my mate', flatmate: 'my flatmate', roommate: 'my roommate',
    coach: 'my coach', friend: 'my friend', bestie: 'my bestie',
  }),
)

/** Capitalised words that start sentences or name places, brands and things, not people. */
const NOT_NAMES = new Set(
  `I I'm I've I'd A An The My Our This That Today Tonight Tomorrow Yesterday It It's We Just Having Getting Being
  Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August
  September October November December Christmas Easter Halloween God Coffee Tea Lunch Dinner Breakfast Brunch
  Work Home School Uni College Sun Rain Snow Morning Evening Night Weekend Park Street Road Lane Avenue Square
  Beach Lake River Bay Hill Mountain Forest Garden Gardens Church Cathedral Cafe Café Gym Office Station Airport
  City Town Village Hall Centre Center Mall Market Museum Library Hospital Clinic Uber Netflix Spotify YouTube
  Instagram TikTok WhatsApp Facebook Google Apple iPhone Amazon Zoom Slack Teams Tesco Sainsbury's Aldi Lidl Waitrose
  Costa Starbucks Pret Nando's McDonald's Ikea IKEA Disney London Paris Rome Berlin Madrid Dublin Edinburgh
  Manchester Liverpool Glasgow Bristol Leeds Brighton Oxford Cambridge Sydney Melbourne Brisbane Perth Adelaide
  Auckland Wellington Toronto Vancouver Chicago Boston Seattle England Scotland Wales Ireland Britain UK USA
  America Australia Canada France Spain Italy Germany Europe Asia Africa Hyde`.split(/\s+/),
)

/** Single words that make a whole entry but name a thing, not a person ("Pizza", "Sunshine"). */
const ONE_WORD_THINGS = new Set(
  `pizza chocolate cake wine beer sleep music family friends health exercise sunshine books nature food water
  rest peace love life running yoga football gaming walking swimming reading cooking baking gardening dogs cats
  pets kids children holidays holiday weekend sunday saturday payday silence quiet hugs laughter tv movies films
  podcasts art painting dancing singing church faith prayer meditation bath shower bed pillow blanket fire rain
  toast bread butter cheese pasta noodles rice soup salad curry sushi tacos burgers chips fries crisps biscuits
  cookies pancakes waffles porridge cereal eggs bacon fruit apples bananas strawberries berries oranges mango
  avocado icecream dessert pudding sweets candy popcorn snacks smoothie juice lemonade milk cocoa hotchocolate
  cocktails coffee tea brunch lunch dinner breakfast takeaway leftovers sunrise sunset stars moon snow sun
  flowers trees garden beach sea ocean waves mountains hills park walk walks run swim bike cycling hike hiking
  gym sport tennis golf netball cricket rugby basketball climbing skiing surfing knitting crafts puzzles games
  chess lego naps nap coffees teas candles fireplace sofa couch home house car train bus holidays travel sleepin
  quietness stillness warmth comfort heating air breeze fresh spring summer autumn winter fall weather
  work job pay bonus promotion overtime school uni homework exams results freedom health recovery progress
  baby puppy kitten dog cat horse birds birdsong`.split(/\s+/),
)

/** A capital straight after one of these is a place or thing ("in Hyde Park", "to Brighton"). */
const PLACE_WORDS = new Set(['in', 'at', 'to', 'from', 'on', 'into', 'near', 'around', 'through', 'via', 'inside', 'outside', 'visit', 'visiting', 'watched', 'watching'])

/** Words after a sentence-initial name that suggest it really is a person ("Sam made dinner"). */
const PERSON_VERBS =
  /^(made|called|helped|gave|took|sent|said|cooked|brought|came|showed|listened|texted|messaged|rang|hugged|bought|picked|drove|covered|checked|asked|told|offered|invited|visited|reminded|is|was|and|for|who|being|checking|making|helping)$/i

export interface Person {
  /** How the person is addressed in a draft, e.g. "Sam" or "Mum". */
  name: string
  /** True when the name is a relation rather than a proper name ("my sister"). */
  relation: boolean
  /** The word as it appears in the text, used to rephrase it. */
  match: string
}

const isCapitalised = (w: string) => /^\p{Lu}\p{Ll}+$/u.test(w)

/** A lone capitalised word that isn't a known place, brand or day, e.g. "Sam" on its own. */
export function looksLikeName(word: string): boolean {
  const w = word.trim().replace(/[.!]+$/, '')
  return isCapitalised(w) && !NOT_NAMES.has(w) && !ONE_WORD_THINGS.has(w.toLowerCase()) && !RELATIONS.has(w.toLowerCase())
}

/** Everyone an entry seems to name, in order and without repeats. Errs towards missing a name over guessing wrong. */
export function findPeople(text: string): Person[] {
  // A whole entry that is just a name ("Jess") names a person.
  if (looksLikeName(text)) {
    const w = text.trim().replace(/[.!]+$/, '')
    return [{ name: w, relation: false, match: w }]
  }
  const found: Person[] = []
  const add = (p: Person) => {
    if (!found.some((f) => f.name === p.name)) found.push(p)
  }
  for (const sentence of text.split(/[.!?;\n]+/)) {
    const words = sentence.match(/[\p{L}'’-]+/gu) ?? []
    for (let i = 0; i < words.length; i++) {
      const raw = words[i]
      const w = raw.replace(/['’]s$/, '')
      const rel = RELATIONS.get(w.toLowerCase())
      if (rel) {
        add({ name: rel, relation: rel.startsWith('my '), match: w })
        continue
      }
      if (!isCapitalised(w) || NOT_NAMES.has(w) || NOT_NAMES.has(raw)) continue
      const prev = words[i - 1] ?? ''
      const next = words[i + 1] ?? ''
      // Two capitals together are a place or brand ("Hyde Park", "Pizza Express").
      if (isCapitalised(next) || (i > 0 && isCapitalised(prev))) continue
      if (PLACE_WORDS.has(prev.toLowerCase())) continue
      // Mid-sentence capitals are names; a capital at the start needs a person-like word after it.
      if (i > 0 || PERSON_VERBS.test(next)) add({ name: w, relation: false, match: w })
    }
  }
  return found
}

/** The first person an entry seems to name, if any. */
export function findPerson(text: string): Person | null {
  return findPeople(text)[0] ?? null
}

/** The words a thank-you can be built from: a gratitude and its reason, or a prompt answer. */
export interface ThanksSource {
  text: string
  because?: string
}

const GERUND = /^\w+ing\b/i

/** Turns third-person words about them into second person ("she called" → "you called"). */
export function toYou(s: string): string {
  let out = s
    .replace(/\b(she|he|they)['’](s|re)\b/gi, 'you’re')
    .replace(/\b(she|he|they)\b/gi, 'you')
    .replace(/\b(his|their)\b/gi, 'your')
    .replace(/\bher\b(?=\s+[a-z])/gi, 'your')
    .replace(/\b(her|him|them)\b/gi, 'you')
  // Fix the verb that follows a new "you": "you was" → "you were", "you always knows" → "you always know".
  out = out.replace(/\byou(\s+(?:always|really|just|never|still|also|even|so))?\s+(\w+)/gi, (m, adv: string | undefined, verb: string) => {
    const v = agree(verb)
    return v === verb ? m : `you${adv ?? ''} ${v}`
  })
  return out
}

const IRREGULAR: Record<string, string> = { is: 'are', was: 'were', has: 'have', does: 'do', goes: 'go', says: 'say' }

function agree(verb: string): string {
  const lower = verb.toLowerCase()
  if (IRREGULAR[lower]) return IRREGULAR[lower]
  if (/^[a-z]{3,}ies$/.test(lower)) return verb.slice(0, -3) + 'y'
  if (/^[a-z]{2,}(ch|sh|x|ss)es$/.test(lower)) return verb.slice(0, -2)
  if (/^[a-z]{3,}[^s]s$/.test(lower) && !/(ous|ss|us|is)$/.test(lower)) return verb.slice(0, -1)
  return verb
}

/** Lower-cases the first word to sit mid-sentence, leaving "I" and acronyms alone. */
const lowerFirst = (s: string) => (/^(I\b|[A-Z]{2,})/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1))
const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1)
const clean = (s: string) => s.trim().replace(/[\s,.!]+$/, '')
const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

type Main = { kind: 'you'; text: string } | { kind: 'for'; text: string }

/** Trailing context that reads oddly in a thank-you ("lunch from work" → "lunch"). */
const TRAILING_CONTEXT =
  /[,\s]+(?:(?:from|at|after|before|in)\s+(?:work|the office|school|uni|college|the gym|church|home)|today|tonight|this (?:morning|afternoon|evening)|earlier|again|yesterday)$/i

function dropContext(s: string): string {
  let out = s.trim()
  while (TRAILING_CONTEXT.test(out)) out = out.replace(TRAILING_CONTEXT, '').trim()
  return out
}

/** Meals read best without an article: "Thank you for lunch." */
const MEALS = /^(breakfast|brunch|lunch|dinner|supper|tea)$/i
/** Past-tense verbs that don't end in -ed, so "Sam made dinner" can become "You made dinner". */
const PAST =
  /^(made|took|gave|sent|brought|came|drove|bought|rang|picked|got|let|kept|left|lent|found|held|met|paid|put|read|ran|sat|set|showed|sang|stood|taught|thought|understood|was|were|is|did|fed|fixed)$/i
/** Saying something is thanked as "for saying…": "my boss said well done" → "Thank you for saying well done." */
const SAYING: Record<string, string> = { said: 'saying', told: 'telling', wrote: 'writing' }
/** A chat they had together: "Talked to Dad" → "Thank you for the chat." */
const CHAT = /^(?:talked|chatted|spoke|caught up|had a chat|had a talk)\s+(?:to|with)\s+(?:my\s+|our\s+)?/i
const CALL = /^(?:called|rang|phoned|facetimed|had a call with)\s+(?:my\s+|our\s+)?/i
const ADVERBS = /^((?:(?:always|really|just|finally|also|even|so|actually|kindly)\s+)*)(\S+)(.*)$/i
const PRONOUN = /\b(i|we|me|us|he|she|they|it)\b/i

/**
 * Rephrases an entry that names the person into words spoken to them, or
 * returns null when unsure so the draft falls back to a simpler line.
 */
function rephrase(person: Person, text: string): Main | null {
  const t = clean(text)
  const name = escape(person.match)
  const tail = new RegExp(`^${name}(['’]s)?\\b(.*)$`, 'i')

  for (const [pattern, thing] of [[CHAT, 'the chat'], [CALL, 'the call']] as const) {
    const m = t.match(pattern)
    if (m && tail.test(t.slice(m[0].length)) && !dropContext(t.slice(m[0].length).match(tail)![2])) return { kind: 'for', text: thing }
  }

  const start = t.match(new RegExp(`^(?:my\\s+|our\\s+)?${name}(['’]s)?[,\\s]+(.+)$`, 'i'))
  if (start) {
    const rest = dropContext(start[2].replace(/^who\s+/i, ''))
    if (start[1]) return /\s/.test(rest) && PRONOUN.test(rest) ? null : { kind: 'for', text: `your ${rest}` }
    const verb = rest.match(ADVERBS)
    if (!verb) return null
    const [, adverbs, word, after] = verb
    if (GERUND.test(word)) return { kind: 'for', text: toYou(rest) }
    if (SAYING[word.toLowerCase()]) return { kind: 'for', text: toYou(`${adverbs}${SAYING[word.toLowerCase()]}${after}`) }
    const past = /^[a-z]{2,}ed$/i.test(word) || PAST.test(word)
    const present = agree(word) !== word
    if (!past && !present) return null
    return { kind: 'you', text: `You ${toYou(`you ${rest}`).slice(4)}` }
  }

  const around = t.match(new RegExp(`^(.+?)[,\\s]+(?:with|from|by)\\s+(?:my\\s+|our\\s+)?${name}(['’]s)?\\b(.*)$`, 'i'))
  if (around) {
    const before = lowerFirst(around[1].trim())
    const after = dropContext(around[3])
    if (GERUND.test(before)) return { kind: 'for', text: [before, 'with me', after].filter(Boolean).join(' ') }
    // Anything after the name ("and the team", "about work") is left out rather than risk an odd sentence.
    const thing = dropContext(before)
    if (PRONOUN.test(thing) || thing.split(/\s+/).length > 4 || /^\w+ed\b/i.test(thing)) return null
    if (MEALS.test(thing)) return { kind: 'for', text: thing }
    if (/^(a|an)\s+/i.test(thing)) return { kind: 'for', text: thing.replace(/^(a|an)\s+/i, 'the ') }
    const article = /^(the|my|our|your|that|this|some)\b/i.test(thing) ? '' : 'the '
    return { kind: 'for', text: article + thing }
  }
  return null
}

/** The reason line as its own sentence, or as "it meant…" when it describes what their help made possible. */
function reasonFor(because: string): { meant: boolean; text: string } | null {
  const b = clean(toYou(because.replace(/^because\s+/i, '')))
  if (!b) return null
  const meant = /^(i|we)\s+(could|can|got to|was able|were able|didn['’]?t have to|did not have to|managed|finally)\b/i.test(b)
  return { meant, text: b }
}

/**
 * A short, editable thank-you built from the user's own words, e.g.
 * "Hi Sam, I was thinking back on today. You covered my shift, and it meant I
 * could make it to Mum's. Thank you, it really helped." Falls back to
 * "Thank you for today" whenever the rephrase is unsure.
 */
export function thankYouDraft(person: Person, source?: ThanksSource): string {
  const hi = person.relation ? 'Hi' : `Hi ${person.name}`
  const main = source ? rephrase(person, source.text) : null
  const reason = source?.because ? reasonFor(source.because) : null

  if (main?.kind === 'you') {
    const why = reason ? (reason.meant ? `, and it meant ${reason.text}.` : `. ${upperFirst(reason.text)}.`) : '.'
    return `${hi}, I was thinking back on today. ${main.text}${why} Thank you, it really helped.`
  }
  if (main?.kind === 'for') {
    const why = reason ? ` ${reason.meant ? `It meant ${reason.text}` : upperFirst(reason.text)}.` : ''
    return `${hi}, I was thinking back on today. Thank you for ${main.text}.${why} It meant a lot.`
  }
  // Unsure how to rephrase: keep it simple, with their reason if they gave one.
  const why = reason ? `${reason.meant ? `It meant ${reason.text}` : upperFirst(reason.text)}.` : 'It meant more than you know.'
  return `${hi}, I was thinking back on today. Thank you for today. ${why}`
}
