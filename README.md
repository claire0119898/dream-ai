# 잠결 (Jamgyeol)

기억에 남은 꿈의 상징과 의미를 차분하게 풀어보는 꿈해몽·꿈풀이 웹사이트입니다.

## 주요 기능

- 꿈 이야기에서 상징, 동의어, 감정, 상황 찾기
- 사전 정보를 조합한 꿈풀이
- 복잡한 꿈의 문맥을 보완한 종합 풀이
- 동물, 인물, 장소, 행동별 꿈 사전
- 외부 서비스 장애 시에도 기본 꿈풀이 제공
- 모바일과 데스크톱 반응형 화면

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인할 수 있습니다.

환경변수는 `.env.example`을 참고해 `.env.local`에 설정합니다. 비밀 키는 서버에서만 사용하며 브라우저 코드에 포함하지 않습니다.

운영 환경에서는 `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_HASH_SALT`를 설정해야 외부 문맥 보완 기능이 활성화됩니다. 저장소가 준비되지 않았거나 일일 한도에 도달하면 비용이 발생하지 않도록 외부 호출을 중단하고 기본 꿈풀이를 제공합니다. 로컬 개발 환경에서는 별도 Redis 없이 메모리 기반 제한이 적용됩니다. 모든 사용량 날짜 구분은 UTC 기준입니다.

꿈풀이 방식은 `DREAM_INTERPRETATION_MODE`로 제어합니다. 기본값인 `ai-first`는 검증된 정상 입력마다 문맥 보완을 한 번 시도하고, `hybrid`는 사전 정보가 부족할 때만 시도하며, `dictionary-only`는 꿈 사전 결과만 사용합니다. 관련 사전 항목은 최대 8개만 전달하고 결과가 형식·길이·안전성·장면 근거 검사를 통과하지 못하면 재시도 없이 기본 꿈풀이를 반환합니다.

## 배포 환경 설정

- `SITE_URL`: 실제 공개 주소. canonical, sitemap, 공유 이미지 주소의 기준이 됩니다. Vercel에서는 값이 없을 때 운영 도메인을 자동 감지하지만, 맞춤 도메인을 연결했다면 명시적으로 설정하는 편이 안전합니다.
- `CONTACT_EMAIL`: 문의 페이지에 표시할 운영 이메일입니다.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: 선택 사항인 방문 통계 측정 ID입니다. 비워두면 관련 스크립트를 불러오지 않습니다.
- `GOOGLE_SITE_VERIFICATION`: Search Console HTML 태그 인증에서 받은 `content` 값입니다.
- `DREAM_INTERPRETATION_MODE`: `ai-first`, `hybrid`, `dictionary-only` 중 하나입니다.
- `DREAM_MAX_OUTPUT_TOKENS`, `DREAM_REQUEST_TIMEOUT_MS`, `DREAM_CONTEXT_ENTRY_LIMIT`: 결과 길이, 제한 시간, 참고 사전 수를 제어합니다. 현재 기본값은 각각 `2400`, `30000`, `8`입니다.
- `DREAM_RATE_LIMIT_PER_MINUTE`, `DREAM_RATE_LIMIT_PER_HOUR`, `DREAM_RATE_LIMIT_PER_DAY`, `DREAM_GLOBAL_DAILY_LIMIT`: 사용자 및 사이트 전체 호출 한도입니다.
- `DREAM_CACHE_TTL_SECONDS`: 동일 꿈 풀이 결과의 해시 기반 단기 캐시 시간입니다.

배포 후 `/robots.txt`, `/sitemap.xml`, 존재하지 않는 주소의 404 응답을 확인하고, Search Console에 사이트맵을 제출합니다. 방문 통계를 활성화했다면 실시간 보고서에서 페이지 이동이 기록되는지 확인하고 개인정보처리방침의 안내와 실제 설정이 일치하는지 점검합니다.

## 검증

```bash
npm run lint
npm run build
```
