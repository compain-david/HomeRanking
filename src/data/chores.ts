// Generated from docs/CHORES.md — the spec is the source of truth.
// Regenerate rather than editing by hand.

export type Chore = {
  id: string
  name: string
  category: string
  effort: number
  aversion: number
  mentalLoad: number
  target: number
}

export type Category = { name: string; emoji: string; chores: Chore[] }

export const CATEGORIES: Category[] = [
  {
    name: "Kitchen & food",
    emoji: "\ud83c\udf7d",
    chores: [
      { id: 'c1', name: "Put dishes in the dishwasher", category: "Kitchen & food", effort: 1, aversion: 1, mentalLoad: 1, target: 7 },
      { id: 'c2', name: "Launch the dishwasher", category: "Kitchen & food", effort: 1, aversion: 1, mentalLoad: 3, target: 5 },
      { id: 'c3', name: "Empty the dishwasher", category: "Kitchen & food", effort: 1, aversion: 3, mentalLoad: 1, target: 5 },
      { id: 'c4', name: "Wipe counters & stovetop", category: "Kitchen & food", effort: 1, aversion: 1, mentalLoad: 1, target: 7 },
      { id: 'c5', name: "Cook dinner", category: "Kitchen & food", effort: 3, aversion: 1, mentalLoad: 3, target: 5 },
      { id: 'c6', name: "Meal planning & grocery list", category: "Kitchen & food", effort: 1, aversion: 1, mentalLoad: 5, target: 1 },
      { id: 'c7', name: "Grocery shopping", category: "Kitchen & food", effort: 3, aversion: 3, mentalLoad: 3, target: 1 },
      { id: 'c8', name: "Unpack & put away shopping", category: "Kitchen & food", effort: 1, aversion: 3, mentalLoad: 1, target: 1 },
      { id: 'c9', name: "Clean fridge & sort leftovers", category: "Kitchen & food", effort: 1, aversion: 3, mentalLoad: 3, target: 0.5 },
      { id: 'c10', name: "Vacuum the sofa & chairs", category: "Kitchen & food", effort: 1, aversion: 1, mentalLoad: 3, target: 0.5 },
    ],
  },
  {
    name: "Bathroom",
    emoji: "\ud83d\udebf",
    chores: [
      { id: 'c11', name: "Clean toilet", category: "Bathroom", effort: 1, aversion: 5, mentalLoad: 1, target: 1 },
      { id: 'c12', name: "Wipe sink & mirror", category: "Bathroom", effort: 1, aversion: 1, mentalLoad: 1, target: 1 },
      { id: 'c13', name: "Notice & restock loo roll / soap", category: "Bathroom", effort: 1, aversion: 1, mentalLoad: 5, target: 1 },
    ],
  },
  {
    name: "Laundry & clothes",
    emoji: "\ud83d\udc55",
    chores: [
      { id: 'c14', name: "Launch a laundry load", category: "Laundry & clothes", effort: 1, aversion: 1, mentalLoad: 3, target: 3 },
      { id: 'c15', name: "Unload & hang on the \u00e9tendoir", category: "Laundry & clothes", effort: 1, aversion: 3, mentalLoad: 3, target: 3 },
      { id: 'c16', name: "Fold & put away", category: "Laundry & clothes", effort: 3, aversion: 3, mentalLoad: 1, target: 3 },
      { id: 'c17', name: "Put out the bed sheets for the cleaner", category: "Laundry & clothes", effort: 1, aversion: 1, mentalLoad: 3, target: 0.5 },
    ],
  },
  {
    name: "Floors & surfaces",
    emoji: "\ud83e\uddf9",
    chores: [
      { id: 'c18', name: "Prepare the house for the robot", category: "Floors & surfaces", effort: 1, aversion: 3, mentalLoad: 3, target: 3 },
      { id: 'c19', name: "Launch the robot vacuum", category: "Floors & surfaces", effort: 1, aversion: 1, mentalLoad: 3, target: 3 },
      { id: 'c20', name: "Empty & clean the robot", category: "Floors & surfaces", effort: 1, aversion: 5, mentalLoad: 3, target: 1 },
      { id: 'c21', name: "Buy replacement parts for the robot", category: "Floors & surfaces", effort: 1, aversion: 1, mentalLoad: 5, target: 0.1 },
    ],
  },
  {
    name: "Bins & recycling",
    emoji: "\ud83d\uddd1",
    chores: [
      { id: 'c22', name: "Put the bins out", category: "Bins & recycling", effort: 1, aversion: 3, mentalLoad: 5, target: 1 },
      { id: 'c23', name: "Take the rubbish out to the bins", category: "Bins & recycling", effort: 1, aversion: 3, mentalLoad: 3, target: 2 },
      { id: 'c24', name: "Replace the bin bags", category: "Bins & recycling", effort: 1, aversion: 3, mentalLoad: 1, target: 0.5 },
      { id: 'c25', name: "Clean the bin", category: "Bins & recycling", effort: 1, aversion: 5, mentalLoad: 3, target: 0.25 },
    ],
  },
  {
    name: "Admin & mental load",
    emoji: "\ud83e\udde0",
    chores: [
      { id: 'c26', name: "Collect the post", category: "Admin & mental load", effort: 1, aversion: 1, mentalLoad: 3, target: 3 },
      { id: 'c27', name: "Pay bills & manage budget", category: "Admin & mental load", effort: 1, aversion: 3, mentalLoad: 5, target: 1 },
      { id: 'c28', name: "Work on investments", category: "Admin & mental load", effort: 3, aversion: 1, mentalLoad: 5, target: 1 },
      { id: 'c29', name: "Manage the cleaner \u2014 payment & schedule", category: "Admin & mental load", effort: 1, aversion: 3, mentalLoad: 5, target: 0.5 },
      { id: 'c30', name: "Birthdays, gifts & social calendar", category: "Admin & mental load", effort: 3, aversion: 1, mentalLoad: 5, target: 1 },
      { id: 'c31', name: "Track household supplies running low", category: "Admin & mental load", effort: 1, aversion: 1, mentalLoad: 5, target: 1 },
      { id: 'c32', name: "Insurance, renewals, paperwork", category: "Admin & mental load", effort: 1, aversion: 5, mentalLoad: 5, target: 0.25 },
      { id: 'c33', name: "Coordinate house people", category: "Admin & mental load", effort: 3, aversion: 5, mentalLoad: 5, target: 0.5 },
      { id: 'c34', name: "Wedding logistics & coordination", category: "Admin & mental load", effort: 3, aversion: 3, mentalLoad: 5, target: 3 },
    ],
  },
  {
    name: "Outdoor & occasional",
    emoji: "\ud83c\udf3f",
    chores: [
      { id: 'c35', name: "Water plants", category: "Outdoor & occasional", effort: 1, aversion: 1, mentalLoad: 3, target: 3 },
      { id: 'c36', name: "Mow lawn / garden tidy", category: "Outdoor & occasional", effort: 5, aversion: 3, mentalLoad: 3, target: 0.5 },
      { id: 'c37', name: "Car maintenance, service, admin", category: "Outdoor & occasional", effort: 3, aversion: 3, mentalLoad: 5, target: 0.1 },
      { id: 'c38', name: "Wash the car", category: "Outdoor & occasional", effort: 3, aversion: 3, mentalLoad: 1, target: 0.25 },
    ],
  },
]

export const points = (c: Chore) => c.effort + c.aversion + c.mentalLoad
export const ALL_CHORES: Chore[] = CATEGORIES.flatMap((c) => c.chores)
