# 잠결 (Jamgyeol)

기억에 남은 꿈의 상징과 의미를 차분하게 풀어보는 꿈해몽·꿈풀이 웹사이트입니다.

## 주요 기능

- 꿈 이야기에서 상징, 동의어, 감정, 상황 찾기
- 꿈의 핵심 선택과 감정, 행동의 변화를 연결하는 서술형 해설
- 쉬운 일상어로 보통 3~4문단, 전체 450~750자를 목표로 설명 (아주 짧은 꿈은 2문단, 최대 5문단)
- 장면 확인(GPT-4.1 mini) → 원문 대조를 포함한 최종 해설(GPT-4.1) → 근거·반복 검사
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

`OPENAI_API_KEY`가 있어야 서술형 꿈풀이가 생성됩니다. 해석 API는 Redis, 무료 이용 횟수 제한, 결과 캐시를 사용하지 않습니다. 입력 검증을 통과하면 OpenAI API에 요청하며 생성 오류는 일반 해몽으로 숨기지 않고 안내합니다. 반복 제출은 매번 새 API 호출이므로 운영 전 OpenAI 프로젝트의 지출 한도와 알림을 설정하는 것이 좋습니다.

`ai-first`와 호환용 `hybrid`는 모두 새 서술형 파이프라인을 사용합니다. `dictionary-only`는 생성을 중단하고 이용 불가를 안내합니다. 꿈 사전 페이지는 별도로 유지됩니다. 결과는 핵심 해석, 연결된 문단, 한 문장 결론, 전체 흐름으로 표시하며 동일 장면을 여러 항목에 반복하지 않습니다. 근거 인용 대조와 반복 검사는 관찰 가능한 오류를 걸러내지만 의미의 정확성을 보장하지는 않습니다.

## 배포 환경 설정

- `SITE_URL`: 실제 공개 주소. canonical, sitemap, 공유 이미지 주소의 기준이 됩니다. Vercel에서는 값이 없을 때 운영 도메인을 자동 감지하지만, 맞춤 도메인을 연결했다면 명시적으로 설정하는 편이 안전합니다.
- `CONTACT_EMAIL`: 문의 페이지에 표시할 운영 이메일입니다.
- `NEXT_PUBLIC_GA_MEASUREMENT_ID`: 선택 사항인 방문 통계 측정 ID입니다. 비워두면 관련 스크립트를 불러오지 않습니다.
- `GOOGLE_SITE_VERIFICATION`: Search Console HTML 태그 인증에서 받은 `content` 값입니다.
- `DREAM_INTERPRETATION_MODE`: `ai-first`, `hybrid`, `dictionary-only` 중 하나입니다.
- `DREAM_PIPELINE`: 기본 `two-step`입니다. 롤백하려면 `baseline-3step`으로 설정하고 다시 배포합니다. 기준 파이프라인의 장면 분석·해설·편집 코드는 보존됩니다.
- `OPENAI_DREAM_ANALYSIS_MODEL`, `OPENAI_DREAM_MODEL`: 각각 two-step 장면 분석(`gpt-4.1-mini`)과 최종 해설(`gpt-4.1`) 모델입니다. 기존 `OPENAI_DREAM_MODEL`은 baseline의 모든 단계에도 적용됩니다. 미설정 시 괄호 안 기본값을 사용합니다.
- `DREAM_MAX_OUTPUT_TOKENS`, `DREAM_REQUEST_TIMEOUT_MS`: 해설 출력 한도와 전체 생성 제한 시간입니다. 기본값은 `5000`, `50000`이며 제한 시간은 최대 50초입니다. baseline으로 롤백하면 남은 시간이 15초 이상일 때 원문 대조 편집을 수행할 수 있습니다 (요청당 최대 세 번 생성). 서버 실행 한도는 60초, 브라우저 대기 한도는 65초입니다.
- 꿈 입력은 비어 있으면 거절하며 최대 1,500자입니다. OpenAI 호출마다 출력 토큰 상한을 적용하고 SDK 자동 재시도는 끕니다. two-step의 정상 해설은 장면 분석과 최종 해설 각 한 번씩, 최대 두 번 호출합니다. 확인 질문은 장면 분석 한 번으로 반환할 수 있습니다.

배포 후 `/robots.txt`, `/sitemap.xml`, 존재하지 않는 주소의 404 응답을 확인하고, Search Console에 사이트맵을 제출합니다. 방문 통계를 활성화했다면 실시간 보고서에서 페이지 이동이 기록되는지 확인하고 개인정보처리방침의 안내와 실제 설정이 일치하는지 점검합니다.

## 검증

```bash
npm run lint
npm run typecheck
npm run build
npm test
```

`test:api`는 로컬 모의 제공자를 사용하며 실제 키나 외부 전송이 필요하지 않습니다. 실제 출력의 수동 품질 검토는 예시 전송에 동의한 경우에만 `node --env-file=.env.local --experimental-strip-types scripts/smoke-narrative-live.mjs --review`로 실행합니다 (`--spa`로 온천 예시 선택). 이 명령은 비용이 발생하며 `--review`에서 예시 원문과 결과를 콘솔에 출력합니다.

## 꿈 해석 파이프라인 비용·품질 비교 (개발 전용)

운영 `/api/interpret`의 기본 경로는 `two-step`이며 비교 실험의 two-step과 동일한 공통 생성 함수를 사용합니다. `DREAM_PIPELINE=baseline-3step`으로 기존 `generateNarrative` 경로를 선택할 수 있습니다. 비교 실험의 `mixed-model-3step`(mini → 4.1 → mini)과 `single-step`(4.1 한 번)도 보존됩니다. 합성 꿈 10개는 `scripts/dream-comparison-cases.mjs`에만 있으며 실제 사용자 입력이나 운영 로그는 사용하지 않습니다.

실제 API 비용이 발생하는 비교는 자동 테스트·빌드에서 실행되지 않습니다. 별도 승인 후에만 다음 명령을 실행하세요. 먼저 한 케이스만 시험할 수도 있습니다.

```bash
npm run compare:dream-pipeline:live -- --case case-01
npm run compare:dream-pipeline:live
```

결과는 Git에서 제외된 `artifacts/dream-pipeline-comparison/`에 저장됩니다. 각 케이스의 네 해설, `blind.md`, 전체 `answer-key.md`, 호출별 `metrics.json`, 평균 호출·토큰·USD 비용·절감률을 보여주는 `report.md`가 생성됩니다. 블라인드 A/B/C/D 배치는 케이스 ID에 따른 고정 순환이므로 재실행해도 순서가 같습니다. 사람이 블라인드 해설의 정확성·근거·자연스러움·확인 질문 적절성을 평가한 뒤 정답표를 확인하세요. 응답의 usage가 없거나 호출이 실패하면 해당 비용은 0으로 처리하지 않고 측정 불가로 표시합니다. 요금은 `scripts/config/model-pricing.mjs` 한 곳에서 관리하며 live 실행 전 [공식 GPT-4.1](https://developers.openai.com/api/docs/models/gpt-4.1) 및 [GPT-4.1 mini](https://developers.openai.com/api/docs/models/gpt-4.1-mini) 단가를 재확인해야 합니다.

### 2차 비교: two-step 대 single-step

2차 실행은 `scripts/dream-comparison-round2-cases.mjs`의 합성 꿈 20개만 사용하며 baseline/mixed를 실행하지 않습니다. 정상 흐름의 최대 예상 호출은 20 × (2 + 1) = 60회입니다. 다음 명령은 모두 실제 비용이 발생하므로 별도 승인 후에만 실행합니다.

```bash
npm run compare:dream-pipeline:round2:live -- --case round2-01
npm run compare:dream-pipeline:round2:live
```

결과는 기존 1차 자료와 분리된 `artifacts/dream-pipeline-comparison-round2/`에 저장합니다. `report.md`에 성공률·평균 호출·입출력 토큰·비용·지연 시간을 기록하고, 케이스별 `blind.md`는 Result A/B로만 표시합니다. 정답은 별도 `answer-key.md`에 있으며, 빈 `evaluation.md`에 원문 충실도·해석 깊이·설득력·단정 방지·문장 자연스러움·다시 사용하고 싶은 정도를 사람이 1~5점으로 직접 기입합니다. 실패한 합성 케이스의 원본 생성 JSON과 검증 `issues`는 해당 케이스의 `*-diagnostics.json`에만 남기고 콘솔에는 출력하지 않습니다. 실제 사용자 꿈에는 이 저장 방식을 사용하지 않습니다.

1차 실험의 `case-02` single-step 및 `case-05` 전체 실패는 당시 `metrics.json`에 오류 코드만 남아 있어 어느 검증 항목이 원인인지 소급해 확정할 수 없습니다. OpenAI 호출과 usage 기록 뒤에 탈락했으며 입력 검증이나 별도의 자해 키워드 차단에서 막힌 것은 아닙니다. `reading_rejected`는 `validateNarrative` 실패이고, `single_rejected`는 응답 객체 확인 또는 `validateNarrative` 실패입니다. `case-05`는 네 버전에 공통으로 발생했으므로 특정 버전의 상대 품질 실패로 취급하지 않습니다. 꿈속 죽음·돌아가신 가족은 정상적인 꿈풀이 입력이며, 현실의 자해 의도와 혼동해서는 안 됩니다. 현재 코드에는 현실 자해 의도를 위한 별도 처리 경로가 없으므로 이를 보호 기능이 구현된 것으로 간주하지 않습니다. 2차의 실패 진단 자료를 확인하기 전까지 validator 기준이나 운영 안전 정책을 변경하지 않습니다.

## Vercel에서 오류 확인

배포 후 풀이가 실패하면 Functions 로그의 `dream_reading_failed`를 확인합니다. 응답의 `X-Request-Id`로 요청을 연결할 수 있습니다. `dream_openai_call_start`, `dream_openai_call_complete`, `dream_interpret_complete`에는 파이프라인·단계·모델·호출 횟수·입출력/총 토큰·소요 시간이 기록됩니다. 꿈 원문, 결과 초안, 키는 기록하지 않습니다.

- `missing_key` / `disabled_generation`: 배포 환경의 키와 운영 모드 확인
- `provider_error`: 상태 401은 키, 429는 제공자 한도/잔액, 그 외는 제공자 장애 확인
- `timeout` / `output_incomplete`: 응답 지연 또는 출력 한도 확인
- `understanding_rejected` / `reading_rejected`: 장면 또는 해설 검사 실패

이전 화면의 일반 문구만으로는 어떤 외부 오류가 발생했는지 알 수 없습니다. 배포 설정을 바꾼 뒤에는 새 배포에 환경변수가 적용됐는지 확인해야 합니다.

## 프로덕션 스모크 테스트

1. Vercel Production의 `OPENAI_API_KEY`, `DREAM_INTERPRETATION_MODE` 설정을 확인하고 새 배포가 `Ready`인지 확인합니다. `DREAM_PIPELINE`은 미설정 또는 `two-step`이어야 합니다. 모델 환경변수는 미설정 시 각각 `gpt-4.1-mini`, `gpt-4.1`을 사용합니다. 사용하지 않는 Redis·사용량 제한 환경변수는 삭제할 수 있습니다. 환경변수를 변경했다면 다시 배포합니다.
2. 공개 사이트에서 20자 이상 1,500자 이하의 시험용 꿈 한 건을 입력해 해석이 표시되는지 확인합니다. 실제 개인 꿈을 테스트 자료로 남기지 마세요.
3. 같은 시험 문장을 다시 제출해 횟수 제한·Redis 오류 없이 다시 해석되는지 확인합니다. 이 요청은 OpenAI 호출 비용이 다시 발생합니다.
4. 빈 입력과 1,500자 초과 입력은 오류로 거절되는지 확인합니다. 이 경우 OpenAI 호출이 없어야 합니다.
5. 정상 해설 한 건의 Vercel Runtime Logs에서 같은 `requestId`의 `dream_openai_call_start`가 `understanding`/`gpt-4.1-mini`, `final-reading`/`gpt-4.1` 순서로 두 번 기록되고 `dream_interpret_complete.openaiCalls`가 2인지 확인합니다. 각 `dream_openai_call_complete`의 `inputTokens`, `outputTokens`, `totalTokens`, `elapsedMs`도 확인합니다. 확인 질문이면 1회가 정상입니다.
6. 오류가 나면 `dream_reading_failed`의 `stage`, `code`, 외부 상태를 확인합니다. 사용량 저장소 단계의 오류가 나타나면 구 배포에 접속 중인지 확인합니다.
