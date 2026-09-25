# 잠결 (Jamgyeol)

기억에 남은 꿈의 상징과 의미를 차분하게 풀어보는 꿈해몽·꿈풀이 웹사이트입니다.

## 주요 기능

- 꿈 이야기에서 상징, 동의어, 감정, 상황 찾기
- 꿈의 핵심 선택과 감정, 행동의 변화를 연결하는 서술형 해설
- 쉬운 일상어로 보통 3~4문단, 전체 450~750자를 목표로 설명 (아주 짧은 꿈은 2문단, 최대 5문단)
- 장면 확인 → 해설 작성 → 근거·반복 검사 → 원문 대조 편집 (시간 여유가 있을 때 한 번)
- 동물, 인물, 장소, 행동별 꿈 사전
- 생성 실패 시 원문을 유지하고 재시도 안내 (일반 문구로 대체하지 않음)
- 모바일과 데스크톱 반응형 화면

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인할 수 있습니다.

환경변수는 `.env.example`을 참고해 `.env.local`에 설정합니다. 비밀 키는 서버에서만 사용하며 브라우저 코드에 포함하지 않습니다.

`OPENAI_API_KEY`가 있어야 서술형 꿈풀이가 생성됩니다. `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`, `RATE_LIMIT_HASH_SALT`를 설정하면 서버리스 인스턴스 간 사용량 제한과 캐시를 공유합니다. Redis 미설정 시 인스턴스별 메모리 제한만 적용되므로 운영 전역 비용 보호에는 Redis 연결을 권장합니다. 저장소 장애나 한도 초과는 일반 해몽으로 숨기지 않고 오류로 안내합니다. 모든 사용량 날짜 구분은 UTC 기준입니다.

`ai-first`와 호환용 `hybrid`는 모두 새 서술형 파이프라인을 사용합니다. `dictionary-only`는 생성을 중단하고 이용 불가를 안내합니다. 꿈 사전 페이지는 별도로 유지됩니다. 결과는 핵심 해석, 연결된 문단, 한 문장 결론, 전체 흐름으로 표시하며 동일 장면을 여러 항목에 반복하지 않습니다. 근거 인용 대조와 반복 검사는 관찰 가능한 오류를 걸러내지만 의미의 정확성을 보장하지는 않습니다.

## 배포 환경 설정

- `SITE_URL`: 실제 공개 주소. canonical, sitemap, 공유 이미지 주소의 기준이 됩니다. Vercel에서는 값이 없을 때 운영 도메인을 자동 감지하지만, 맞춤 도메인을 연결했다면 명시적으로 설정하는 편이 안전합니다.
- `CONTACT_EMAIL`: 문의 페이지에 표시할 운영 이메일입니다.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: 선택 사항인 방문 통계 측정 ID입니다. 비워두면 관련 스크립트를 불러오지 않습니다.
- `GOOGLE_SITE_VERIFICATION`: Search Console HTML 태그 인증에서 받은 `content` 값입니다.
- `DREAM_INTERPRETATION_MODE`: `ai-first`, `hybrid`, `dictionary-only` 중 하나입니다.
- `DREAM_MAX_OUTPUT_TOKENS`, `DREAM_REQUEST_TIMEOUT_MS`: 해설 출력 한도와 전체 생성 제한 시간입니다. 기본값은 `5000`, `50000`이며 제한 시간은 최대 50초입니다. 남은 시간이 15초 이상이면 형식 통과 여부와 무관하게 원문 대조 편집을 한 번 수행합니다 (요청당 최대 세 번 생성). 여유가 부족하면 검사를 통과한 초안만 반환하며, 검사 실패는 오류로 안내합니다. 서버 실행 한도는 60초, 브라우저 대기 한도는 65초입니다.
- 결과 캐시는 `jamgyeol:interpretation:v16:{dreamHash}`이며 `interpretation-v16`/`narrative-v16` 버전을 함께 확인합니다. 구형 결과는 재사용하지 않으며 꿈 원문은 캐시 키에 포함되지 않습니다.
- 진행 중 잠금은 120초이고 성공·실패·재질문 후 해제됩니다. 실패해도 사용량 카운터는 유지하여 무제한 재요청 비용을 방지합니다.
- `DREAM_RATE_LIMIT_PER_MINUTE`, `DREAM_RATE_LIMIT_PER_HOUR`, `DREAM_RATE_LIMIT_PER_DAY`, `DREAM_GLOBAL_DAILY_LIMIT`: 사용자 및 사이트 전체 호출 한도입니다.
- `DREAM_CACHE_TTL_SECONDS`: 동일 꿈 풀이 결과의 해시 기반 단기 캐시 시간입니다.

배포 후 `/robots.txt`, `/sitemap.xml`, 존재하지 않는 주소의 404 응답을 확인하고, Search Console에 사이트맵을 제출합니다. 방문 통계를 활성화했다면 실시간 보고서에서 페이지 이동이 기록되는지 확인하고 개인정보처리방침의 안내와 실제 설정이 일치하는지 점검합니다.

## 검증

```bash
npm run lint
npm run test:narrative
npm run test:long-dreams
npm run build
npm run test:api
```

`test:api`는 로컬 모의 제공자를 사용하며 실제 키나 외부 전송이 필요하지 않습니다. 실제 출력의 수동 품질 검토는 예시 전송에 동의한 경우에만 `node --env-file=.env.local --experimental-strip-types scripts/smoke-narrative-live.mjs --review`로 실행합니다 (`--spa`로 온천 예시 선택). 이 명령은 비용이 발생하며 `--review`에서 예시 원문과 결과를 콘솔에 출력합니다.

## Vercel에서 오류 확인

배포 후 풀이가 실패하면 Functions 로그의 `dream_reading_failed`를 확인합니다. 응답의 `X-Request-Id`로 요청을 연결할 수 있습니다. 로그는 단계·오류 코드·검사 항목·외부 HTTP 상태만 기록하고 꿈 원문, 결과 초안, 키는 기록하지 않습니다.

- `missing_key` / `disabled_generation`: 배포 환경의 키와 운영 모드 확인
- `provider_error`: 상태 401은 키, 429는 제공자 한도/잔액, 그 외는 제공자 장애 확인
- `timeout` / `output_incomplete`: 응답 지연 또는 출력 한도 확인
- `understanding_rejected` / `reading_rejected`: 장면 또는 해설 검사 실패
- `user_limited` / `global_limited` / `store_unavailable`: 사용량 제한 또는 Redis 연결 확인

이전 화면의 일반 문구만으로는 어떤 외부 오류가 발생했는지 알 수 없습니다. 배포 설정을 바꾼 뒤에는 새 배포에 환경변수가 적용됐는지 확인해야 합니다.
