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

/** Capitalised words that start sentences or name things, not people. */
const NOT_NAMES = new Set(
  `I I'm I've I'd A An The My Our This That Today Tonight Tomorrow Yesterday It It's We Just Having Getting Being
  Monday Tuesday Wednesday Thursday Friday Saturday Sunday January February March April May June July August
  September October November December Christmas Easter God Netflix Spotify Instagram Google Apple iPhone Uber
  Coffee Tea Lunch Dinner Breakfast Work Home School Uni Sun Rain Morning Evening Night Weekend`.split(/\s+/),
)

/** Words after a sentence-initial name that suggest it really is a person ("Sam made dinner"). */
const PERSON_VERBS =
  /^(made|called|helped|gave|took|sent|said|cooked|brought|came|showed|listened|texted|messaged|rang|hugged|bought|picked|drove|covered|checked|asked|told|offered|invited|visited|reminded|is|was|and|for)$/i

export interface Person {
  /** How the person is addressed in a draft, e.g. "Sam" or "Mum". */
  name: string
  /** True when the name is a relation rather than a proper name ("my sister"). */
  relation: boolean
}

/** The first person an entry seems to name, if any. Errs towards missing a name over inventing one. */
export function findPerson(text: string): Person | null {
  const words = text.match(/[\p{L}'’-]+/gu) ?? []
  for (let i = 0; i < words.length; i++) {
    const w = words[i].replace(/['’]s$/, '')
    const rel = RELATIONS.get(w.toLowerCase())
    if (rel) return { name: rel, relation: rel.startsWith('my ') }
    const capitalised = /^\p{Lu}\p{Ll}+$/u.test(w)
    if (!capitalised || NOT_NAMES.has(w)) continue
    // Mid-sentence capitals are names; a capital at the start needs a verb after it.
    if (i > 0 || PERSON_VERBS.test(words[i + 1] ?? '')) return { name: w, relation: false }
  }
  return null
}

/** A short, editable thank-you the user can send themselves. */
export function thankYouDraft(person: Person): string {
  const hi = person.relation ? 'Hi' : `Hi ${person.name}`
  return `${hi}, I was thinking back on today and wanted to say thank you. It meant more than you know.`
}
