import type { DreamKeyword } from "../types/dream";
import actions from "./json/actions.json";
import animals from "./json/animals.json";
import body from "./json/body.json";
import money from "./json/money.json";
import nature from "./json/nature.json";
import objects from "./json/objects.json";
import people from "./json/people.json";
import places from "./json/places.json";

export const coreDreamKeywords = [
  ...animals,
  ...nature,
  ...body,
  ...people,
  ...places,
  ...money,
  ...actions,
  ...objects,
] satisfies DreamKeyword[];

export const popularKeywordNames = [
  "뱀",
  "물",
  "이빨",
  "돈",
  "불",
  "아기",
  "죽다",
  "날다",
  "바다",
  "집",
  "고양이",
  "개",
  "떨어지다",
  "결혼하다",
  "가족",
];

export const popularKeywords = popularKeywordNames
  .map((name) => coreDreamKeywords.find((item) => item.keyword === name))
  .filter((item): item is NonNullable<typeof item> => Boolean(item));
