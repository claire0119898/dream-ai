import type { DreamEmotion } from "../types/dream";

// 7가지 대표 감정: 꿈 내용에서 감지되면 종합 해몽 문구에 반영됩니다.
export const emotions: DreamEmotion[] = [
  {
    key: "fear",
    label: "무서움",
    words: ["무서웠", "두려웠", "공포", "겁이 났", "겁났"],
  },
  {
    key: "anxiety",
    label: "불안",
    words: ["불안했", "걱정됐", "초조했", "긴장했"],
  },
  {
    key: "joy",
    label: "기쁨",
    words: ["기뻤", "행복했", "즐거웠", "신났"],
  },
  {
    key: "calm",
    label: "편안함",
    words: ["편안했", "평온했", "안심했", "따뜻했"],
  },
  {
    key: "sadness",
    label: "슬픔",
    words: ["슬펐", "울었", "외로웠", "허전했"],
  },
  {
    key: "anger",
    label: "분노",
    words: ["화가 났", "분노했", "짜증났", "억울했"],
  },
  {
    key: "surprise",
    label: "놀람",
    words: ["놀랐", "당황했", "깜짝"],
  },
];
