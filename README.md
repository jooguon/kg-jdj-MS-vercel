# 발더비 경매장

15초 동안 제시어를 그리면 고른 화풍의 명화로 복원하고, AI 감정사와 가상 큰손들이 경매로 값을 매기는 마이크로 서비스.
낙찰된 작품은 전시관에 걸려 순위로 볼 수 있어요. 기획은 [PLAN.md](PLAN.md)에 있어요.

## 흐름

로비(작가명) → 화실(15초 드로잉 + 화풍 선택) → 감정실 → 실시간 경매(바람잡이) → 낙찰 증서 → 전시관

## 로컬 실행

```bash
npm install
cp .env.example .env.local   # OPENAI_API_KEY 입력
npm run dev
```

- API 키가 없으면 개발 모드에서는 샘플 데이터로 동작해요.
- 전시관은 로컬에서 `.data/gallery` 폴더에 저장돼요. `node scripts/seed-gallery.ts`로 샘플 작품을 채울 수 있고, `.data` 폴더를 지우면 초기화돼요.

## 구조

- `src/components/Game.tsx` — 로비와 단계 전환
- `Studio` / `Appraisal` / `Auction` / `Certificate` — 화실, 감정실, 경매, 증서 화면
- `src/app/gallery` + `GalleryView` — 전시관 (낙찰가 TOP 4 + 나머지 랜덤 배치)
- `src/app/api/judge` — 낙서 감정, 응찰자 대사, 낙찰가 계산, 서명된 경매 티켓 발급
- `src/app/api/transform` — 이미지 편집 API로 명화 복원
- `src/app/api/shill` — 바람잡이 (성공 2배 / 실패 0원, 티켓당 결과 고정)
- `src/app/api/exhibit` — 서명 검증 후 전시관에 저장 (작가명은 모더레이션 검사)
- `src/lib/trends.ts` — 오늘의 트렌드(매일 바뀌는 보너스 조건)
- `src/lib/store.ts` — 전시관 저장소 (Upstash Redis, 로컬은 파일)
- `public/samples/` — 화풍 예시 그림 (`node scripts/make-samples.ts`로 생성)

## Vercel 배포

1. GitHub 저장소를 Vercel에 Import
2. Settings → Environment Variables에 `OPENAI_API_KEY`, `SIGNING_SECRET` 추가
3. Storage → Upstash for Redis(무료 플랜) 생성 후 이 프로젝트에 Connect → `KV_REST_API_URL`, `KV_REST_API_TOKEN`이 자동으로 들어가요
4. Redeploy
