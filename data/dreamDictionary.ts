import type { DreamKeyword } from "../types/dream";

import animals from "./json/animals.json";
import nature from "./json/nature.json";
import body from "./json/body.json";
import people from "./json/people.json";
import places from "./json/places.json";
import money from "./json/money.json";
import actions from "./json/actions.json";

export const dreamDictionary = [
  ...animals,
  ...nature,
  ...body,
  ...people,
  ...places,
  ...money,
  ...actions,
] satisfies DreamKeyword[];