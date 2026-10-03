import type { TechniqueId } from '../engine/types';

export type LessonLevel = 'Beginner' | 'Intermediate' | 'Advanced';
export type PracticeKind = 'bank';

export type Page =
  /** Plain reading page: a concept or a tip. */
  | { kind: 'text'; title: string; body: string[]; tip?: boolean }
  /**
   * A real position from the training bank (index `example` of the lesson's technique) that can
   * be stepped through. `plain` shows the board with its notes and no step-through control.
   */
  | { kind: 'diagram'; example: number; caption: string; result?: string; plain?: boolean }
  /** Rules lesson: tap Row / Column / Box to light up a unit of the sample grid. */
  | { kind: 'units'; title: string; caption: string }
  /** Rules lesson: fill the one empty cell of the nearly solved sample grid. */
  | { kind: 'find'; title: string; caption: string };

export interface Lesson {
  id: string;
  title: string;
  /** One line shown in the training list. */
  summary: string;
  level: LessonLevel;
  technique?: TechniqueId;
  pages: Page[];
  practice?: PracticeKind;
}

/** A complete valid grid used by the rules lesson (the "find" page blanks one cell). */
export const RULES_SOLUTION =
  '489617352536824197217395846154263978863749215792581634321456789948172563675938421';
/** Cell blanked on the "find" page: r5c5. */
export const RULES_BLANK = 40;

const T = (title: string, ...body: string[]): Page => ({ kind: 'text', title, body });
const TIP = (...body: string[]): Page => ({
  kind: 'text',
  title: 'Spotting it in a game',
  body,
  tip: true,
});
const D = (example: number, caption: string, result: string): Page => ({
  kind: 'diagram',
  example,
  caption,
  result,
});

export const LESSONS: Lesson[] = [
  {
    id: 'rules',
    title: 'The grid',
    summary: 'Rows, columns, boxes and the one rule.',
    level: 'Beginner',
    pages: [
      T(
        'What is Sudoku?',
        'A Sudoku grid has 81 cells, arranged in 9 rows and 9 columns.',
        'Thick lines split it into nine boxes. Each box is 3 cells wide and 3 cells tall.',
        'Some cells start with a digit. These are the givens. Your job is to fill every empty cell with a digit from 1 to 9.',
      ),
      {
        kind: 'units',
        title: 'Rows, columns and boxes',
        caption: 'Tap a button to light up a row, a column or a box. Each one holds nine cells.',
      },
      T(
        'The one rule',
        'Every row, every column and every box must contain each digit from 1 to 9 exactly once.',
        'That is the whole rule. There is no arithmetic, and a good puzzle never needs a guess.',
        'Each technique in this course is a way to spot which digit cannot go in a cell. When only one digit is left, you place it.',
      ),
      {
        kind: 'find',
        title: 'Your first move',
        caption:
          'This grid is almost done. Every row, column and box is complete except one. Tap the empty cell, then choose the digit that fits.',
      },
    ],
  },
  {
    id: 'full-house',
    title: 'Full House',
    summary: 'The last empty cell of a row, column or box.',
    level: 'Beginner',
    technique: 'fullHouse',
    practice: 'bank',
    pages: [
      T(
        'One cell left',
        'A row, a column or a box holds nine cells and needs nine different digits.',
        'When eight of them are filled, only one digit is missing. It has nowhere else to go, so it goes in the last empty cell.',
      ),
      D(
        0,
        'The shaded unit has a single empty cell, and it is ringed. Eight digits are already in the unit, so only one is missing.',
        'The missing digit goes into the ringed cell. The unit is now complete.',
      ),
      TIP(
        'Look for units that are almost full. Count the empty cells in each one.',
        'Boxes are the easiest to check, because you can see all nine cells at a glance.',
      ),
    ],
  },
  {
    id: 'naked-single',
    title: 'Naked Single',
    summary: 'A cell where only one digit still fits.',
    level: 'Beginner',
    technique: 'nakedSingle',
    practice: 'bank',
    pages: [
      T(
        'Rule digits out',
        'Choose an empty cell. Any digit already in its row cannot go there. The same goes for its column and its box.',
        'Cross those digits off in your head. If eight digits are ruled out, the ninth is the answer.',
        'It is called naked because the answer sits right in the cell. You do not need to look at any other cell.',
      ),
      D(
        0,
        'Look at the ringed cell. Its row, column and box already contain every digit but one.',
        'Only one digit is left for the ringed cell, so it is written in.',
      ),
      TIP(
        'Start with cells that sit in crowded areas, where their row, column and box all meet many filled cells.',
        'If you keep notes, a cell with only one note left is a naked single.',
      ),
    ],
  },
  {
    id: 'hidden-single',
    title: 'Hidden Single',
    summary: 'A digit that has only one possible cell in a unit.',
    level: 'Beginner',
    technique: 'hiddenSingle',
    practice: 'bank',
    pages: [
      T(
        'Where can this digit go?',
        'Pick a box and a digit it still needs, for example 5. Every 5 already on the board blocks the rest of its row and column.',
        'Shade out the cells that are blocked or filled. If only one cell in the box is left, the 5 must go there.',
        'The cell may still have other candidates. The digit is hidden among them until you look at the whole unit.',
      ),
      D(
        0,
        'In the shaded unit, one digit has only a single cell left to live in. That cell is ringed.',
        'The digit is written into the ringed cell, the only place it can go in this unit.',
      ),
      D(
        1,
        'Another example. The same idea works for a row or a column, not only for a box.',
        'Again the digit is written into the only cell where it fits.',
      ),
      TIP(
        'Choose a digit that appears many times on the board, since it blocks lots of cells. Check each box that is still missing it.',
        'Then do the same with rows and columns. This sweep is often called cross-hatching.',
      ),
    ],
  },
  {
    id: 'notes',
    title: 'Notes',
    summary: 'Pencil marks, Auto Notes and why they matter.',
    level: 'Beginner',
    pages: [
      T(
        'Candidates',
        'A candidate is a digit that could still go in a cell. Notes are the small digits you write in a cell to remember its candidates.',
        'Tap the pencil button to turn notes mode on. Then tap a digit and a cell to add or remove a note.',
        'The Help menu has Auto Notes, which fills in every candidate for you.',
      ),
      {
        kind: 'diagram',
        example: 0,
        plain: true,
        caption:
          'Every empty cell shows the digits that can still go there. Cells with a single note are easy to solve.',
      },
      T(
        'Why bother?',
        'Every technique after this lesson compares the candidates of several cells. You cannot compare what you cannot see.',
        'Notes also save you from re-checking the same cell over and over.',
      ),
      T(
        'Keeping notes tidy',
        'When you place a digit, remove it from the notes of every cell in the same row, column and box. The game does this for you.',
        'When a technique tells you a candidate is impossible, strike it too. Every strike makes the next technique easier to spot.',
      ),
    ],
  },
  {
    id: 'pointing',
    title: 'Pointing',
    summary: 'A digit in a box is trapped on one line.',
    level: 'Intermediate',
    technique: 'pointing',
    practice: 'bank',
    pages: [
      T(
        'The digit points along a line',
        'Look at one digit inside one box. Suppose all of its remaining candidate cells sit in the same row.',
        'The box needs that digit somewhere, so it will land in that row. The row can only hold the digit once.',
        'So the digit cannot be a candidate anywhere else in that row, outside the box. The same works for columns.',
      ),
      D(
        0,
        'Inside the shaded box, every place for the highlighted digit lies on one line. Those cells are ringed.',
        'The digit must land on that line inside the box, so it cannot also go anywhere else along the line. The red candidates outside the box are struck.',
      ),
      TIP(
        'Look at a box and a digit with only two or three candidate cells left. Do they share a row or column?',
        'If they do, check the rest of that line for the same digit.',
      ),
    ],
  },
  {
    id: 'claiming',
    title: 'Claiming',
    summary: 'A digit in a line is trapped inside one box.',
    level: 'Intermediate',
    technique: 'claiming',
    practice: 'bank',
    pages: [
      T(
        'The line claims the box',
        'This is Pointing turned around. Look at one digit in one row. Suppose all of its candidate cells sit inside a single box.',
        'The row needs that digit, so it will land in that box. The box can only hold it once.',
        'So the digit cannot be a candidate in the other cells of that box. The same works for columns.',
      ),
      D(
        0,
        'In the shaded line, every place for the highlighted digit falls inside a single box. Those cells are ringed.',
        "The line's digit must come from that box, so the box's other cells cannot hold it. The red candidates in the box, off the line, are struck.",
      ),
      TIP(
        'Pointing starts from a box and looks along a line. Claiming starts from a line and looks into a box.',
        'If you cannot see one, try the other direction.',
      ),
    ],
  },
  {
    id: 'naked-pair',
    title: 'Naked Pair',
    summary: 'Two cells share the same two candidates.',
    level: 'Intermediate',
    technique: 'nakedPair',
    practice: 'bank',
    pages: [
      T(
        'Two cells, two digits',
        'Find two cells in one unit that each have exactly the same two candidates, say 3 and 7.',
        'One of the cells must be the 3 and the other must be the 7. We do not know which way round yet.',
        'Either way, the 3 and the 7 are used up in this unit. Strike both from every other cell of the unit.',
      ),
      D(
        0,
        'The two ringed cells hold the same pair of candidates and nothing else.',
        'Those two digits must fill those two cells, so no other cell in the unit can use them. The red candidates are struck.',
      ),
      TIP(
        'Scan a unit for cells with exactly two notes. Two of them with the same notes are a pair.',
        'Check the rest of the unit for those two digits.',
      ),
    ],
  },
  {
    id: 'hidden-pair',
    title: 'Hidden Pair',
    summary: 'Two digits that fit in only the same two cells.',
    level: 'Intermediate',
    technique: 'hiddenPair',
    practice: 'bank',
    pages: [
      T(
        'Two digits, two cells',
        'Look at a unit. Suppose two digits, say 2 and 6, each appear as a candidate in only two cells, and in the very same two cells.',
        'Those two digits need a home, and these are the only homes. So the two cells hold the 2 and the 6.',
        'Any other candidates in those two cells cannot be right, so strike them.',
      ),
      D(
        0,
        'Two digits appear as candidates in just two cells of this unit. Those cells are ringed.',
        'Those two cells must hold exactly those two digits, so every other candidate inside them is struck in red.',
      ),
      TIP(
        'Hidden pairs look messy because the two cells have extra notes. Ignore those and count where each digit can go.',
        'A hidden pair is a naked pair in disguise: after you strike the extras, the pair is naked.',
      ),
    ],
  },
  {
    id: 'naked-triple',
    title: 'Naked Triple',
    summary: 'Three cells that share only three digits.',
    level: 'Intermediate',
    technique: 'nakedTriple',
    practice: 'bank',
    pages: [
      T(
        'Three cells, three digits',
        'Find three cells in one unit whose candidates, added together, make up only three different digits.',
        'The cells do not each need all three digits. They could hold 1/2, 2/3 and 1/3, for example.',
        'Three cells and three digits means every digit is used. Strike those digits from the other cells of the unit.',
      ),
      D(
        0,
        'Three ringed cells use only three digits between them.',
        'The three digits must fill those three cells, so the rest of the unit cannot use them. The red candidates are struck.',
      ),
      TIP(
        'Look at cells with two or three notes. Check whether three of them draw only on the same three digits.',
        'It is the same idea as a pair, just one cell bigger.',
      ),
    ],
  },
  {
    id: 'hidden-triple',
    title: 'Hidden Triple',
    summary: 'Three digits that fit in only the same three cells.',
    level: 'Intermediate',
    technique: 'hiddenTriple',
    practice: 'bank',
    pages: [
      T(
        'Three digits, three cells',
        'Look at a unit. Suppose three digits can only go in the same three cells, and nowhere else in the unit.',
        'Each of the three digits needs a cell, and these three cells are all they have. So the cells hold exactly those digits.',
        'Strike every other candidate from those three cells.',
      ),
      D(
        0,
        'Three digits appear as candidates in just three cells of this unit. Those cells are ringed.',
        'Those three cells must hold exactly those three digits, so every other candidate inside them is struck in red.',
      ),
      TIP(
        'Pick out three digits that each have two or three possible cells in the unit, all in the same group of three cells.',
        'Hidden triples are hard to see directly. Notes make them much easier.',
      ),
    ],
  },
  {
    id: 'x-wing',
    title: 'X-Wing',
    summary: 'A rectangle of one digit that clears two lines.',
    level: 'Intermediate',
    technique: 'xWing',
    practice: 'bank',
    pages: [
      T(
        'A rectangle',
        'Pick one digit. Find two rows where that digit has exactly two candidate cells, and in both rows they sit in the same two columns.',
        'The four cells form a rectangle. Each row needs the digit once, so it takes one corner in each row.',
        'The two rows cannot both pick the same column. So together they use both columns, and those two columns get their digit from the rectangle.',
        'Strike the digit from every other cell in those two columns. The same works with rows and columns swapped.',
      ),
      D(
        0,
        'The highlighted digit has just two places in each of two rows, and they line up in the same two columns. The four ringed cells form a rectangle.',
        'The digit takes two opposite corners of the rectangle, so it is ruled out elsewhere in those columns. The red candidates are struck.',
      ),
      TIP(
        'Look for a digit that has just two candidate cells in several rows. Compare the columns they use.',
        'If two rows use identical columns, you have an X-Wing.',
      ),
    ],
  },
  {
    id: 'naked-quad',
    title: 'Naked Quad',
    summary: 'Four cells that share only four digits.',
    level: 'Advanced',
    technique: 'nakedQuad',
    practice: 'bank',
    pages: [
      T(
        'Four cells, four digits',
        'This is the same idea as a pair and a triple. Find four cells in one unit whose candidates together use only four digits.',
        'Four cells need four digits, and those are the only four available. So all four digits are used up inside those cells.',
        'Strike them from the rest of the unit.',
      ),
      D(
        0,
        'Four ringed cells draw on just four digits between them.',
        'The four digits must fill those four cells, so the rest of the unit cannot use them. The red candidates are struck.',
      ),
      TIP(
        'Quads are rare, because most of them contain a smaller pair or triple that you would find first.',
        'If a unit is crowded with small notes and nothing else works, check for four cells that share four digits.',
      ),
    ],
  },
  {
    id: 'hidden-quad',
    title: 'Hidden Quad',
    summary: 'Four digits that fit in only the same four cells.',
    level: 'Advanced',
    technique: 'hiddenQuad',
    practice: 'bank',
    pages: [
      T(
        'Four digits, four cells',
        'Suppose four digits can only go in the same four cells of a unit.',
        'Four digits need four cells, and there are no others to use. So those cells hold exactly those four digits.',
        'Strike every other candidate from the four cells.',
      ),
      D(
        0,
        'Four digits appear as candidates in just four cells of this unit. Those cells are ringed.',
        'Those four cells must hold exactly those four digits, so every other candidate inside them is struck in red.',
      ),
      TIP(
        'Hidden quads are very rare. Only hunt for one when a unit still has many empty cells and nothing simpler works.',
        'Notes are a must here. Without them, four digits and four cells are too much to hold in your head.',
      ),
    ],
  },
  {
    id: 'swordfish',
    title: 'Swordfish',
    summary: 'An X-Wing stretched over three rows and three columns.',
    level: 'Advanced',
    technique: 'swordfish',
    practice: 'bank',
    pages: [
      T(
        'Three rows, three columns',
        'Pick a digit. Find three rows where the digit is a candidate only in the same three columns.',
        'Each row needs the digit once, and the only places are in those three columns. So the three rows use up all three columns.',
        'Strike the digit from every other cell in those columns. Rows and columns can be swapped.',
      ),
      D(
        0,
        'In three rows, the highlighted digit can only go in the same three columns. The ringed cells are all its places in those rows.',
        'The digit will fill those three columns using those rows, so it is ruled out elsewhere in the columns. The red candidates are struck.',
      ),
      TIP(
        'Each row may show two or three candidate cells, not always all three columns. That is fine.',
        'Think of it as an X-Wing with a third row.',
      ),
    ],
  },
  {
    id: 'skyscraper',
    title: 'Skyscraper',
    summary: 'Two lines of one digit that lean on a shared column.',
    level: 'Advanced',
    technique: 'skyscraper',
    practice: 'bank',
    pages: [
      T(
        'Two towers',
        'Pick a digit. Find two rows where it has exactly two candidate cells, and one candidate in each row shares a column. These two form the base.',
        'The other two candidates, one in each row, are the roof.',
        'The base cells share a column, so at most one of them holds the digit. That means at least one of the roof cells must hold it.',
        'Any cell that sees both roof cells cannot hold the digit. Strike it there.',
      ),
      D(
        0,
        'The ringed cells are two towers of the same digit, joined at the base. Each tower has a roof cell at its top.',
        'One roof must hold the digit, so any cell that sees both roofs cannot. The red candidates are struck.',
      ),
      TIP(
        'Look for a digit with exactly two places in two different lines. If they share a column, the roof is the other pair.',
        'Check the cells that can see both roof cells.',
      ),
    ],
  },
  {
    id: 'two-string-kite',
    title: '2-String Kite',
    summary: 'A row and a column linked through one box.',
    level: 'Advanced',
    technique: 'twoStringKite',
    practice: 'bank',
    pages: [
      T(
        'Two strings and a box',
        'Pick a digit. Find a row where it has exactly two candidates, and a column where it also has exactly two.',
        'Suppose one cell from the row and one from the column lie in the same box. They are tied together, and at most one can hold the digit.',
        'The row needs the digit, and so does the column. If the tied cells cannot both have it, at least one of the two far ends must.',
        'Any cell that sees both far ends cannot hold the digit.',
      ),
      D(
        0,
        'The ringed cells form a kite. Two of them share a box, and the other two are the far ends of the kite.',
        'One far end must hold the digit, so any cell that sees both far ends cannot. The red candidates are struck.',
      ),
      TIP(
        'Draw an imaginary string along each line of two candidates. Look for strings that touch in a box.',
        'The cell where the two far ends cross is often the one to clear.',
      ),
    ],
  },
  {
    id: 'xy-wing',
    title: 'XY-Wing',
    summary: 'Three two-candidate cells that force a common digit.',
    level: 'Advanced',
    technique: 'xyWing',
    practice: 'bank',
    pages: [
      T(
        'A pivot and two pincers',
        'Find a cell with two candidates, X and Y. This is the pivot.',
        'Find two more two-candidate cells that both see the pivot. One holds X and Z, the other holds Y and Z. These are the pincers.',
        'If the pivot is X, the first pincer cannot be X, so it is Z. If the pivot is Y, the second pincer is Z. Either way, one pincer is Z.',
        'Any cell that sees both pincers cannot be Z. Strike it.',
      ),
      D(
        0,
        'The ringed cells are a pivot with two candidates and two pincers that each share one of those candidates.',
        'Whichever way the pivot goes, one pincer holds the shared digit, so a cell that sees both pincers cannot. The red candidate is struck.',
      ),
      TIP(
        'Start from cells with exactly two notes. Look for a pivot that has two such neighbours with a common digit.',
        'Then check the cells that see both pincers.',
      ),
    ],
  },
];

export function lessonById(id: string): Lesson | undefined {
  return LESSONS.find((l) => l.id === id);
}

/** The lesson that teaches `technique` (used by the game's hint banner). */
export function lessonForTechnique(technique: TechniqueId): Lesson | undefined {
  return LESSONS.find((l) => l.technique === technique);
}

export const LEVELS: LessonLevel[] = ['Beginner', 'Intermediate', 'Advanced'];
