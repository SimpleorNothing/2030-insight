# 2030 미래 트렌드 (DA·SENSING 2030)

DA 가전시장의 2030년 변화를, **프레임에서 전략까지 하나의 논리 사슬**로 읽는 단일 페이지 보드.
거시 신호를 어떤 렌즈로 볼지 정하고(①) → 트렌드를 도출하며(②) → 성숙도·영향도를 가늠하고(③) →
경쟁사 대응을 점검한 뒤(④) → 당사 현 위치·격차를 진단하고(⑤) → 당사 차별화·선도 전략으로 닫는(⑥)
6단계 흐름에, 그 위로 최신 신호를 공급하는 **정보 업데이트(⓪)** 단계를 얹은 구조다.

**배포 URL:** `https://2030.samsungda.net`
**호스팅:** GitHub Pages (`CNAME` = `2030.samsungda.net`)
**구성:** 단일 정적 `index.html` (빌드 과정 없음, `.nojekyll`로 Jekyll 비활성화)
**상태:** 작업중 (좌상단 노란 배지 표기)

> 🧭 **기획 도구 모음**(`samsungda.net`) 생태계의 일부입니다 — 허브 레포: [`samsungda-portal`](https://github.com/SimpleorNothing/samsungda-portal)

| 도구 | 진입 | 레포 |
|------|------|------|
| 클로드로 워드보고서 작성하기 | `agentguide.samsungda.net` | `agentguide` |
| 보고서 자판기 | `report.samsungda.net` | `report-site` |
| Market Insight | `mi.samsungda.net` | `market-insight` |
| 2030 미래 트렌드 | `2030.samsungda.net` | `2030-insight` ◀ **현재 레포** |
| Quick Share | `quickshare.samsungda.net` | `QuickShare` |
| My Space | `space.samsungda.net` | `samsungda-space` |

---

## 디렉토리 구조

```
2030-insight/                  (= 레포 루트, 2030.samsungda.net 으로 단독 배포)
├── index.html                 보드 본문 (단일 파일 · 인라인 CSS/JS)
├── CNAME                       커스텀 도메인 (2030.samsungda.net)
├── .nojekyll                   GitHub Pages Jekyll 처리 비활성화
└── README.md
```

---

## 화면 구성 — 정보 업데이트(⓪) + 6단계 분석 사슬

상단 흐름 레일과 히어로 플로우맵이 전체 사슬을 한 줄로 보여주고, 각 단계가 순서대로 이어진다.
**STEP 00은 분석에 신호를 공급하는 인풋 단계**(점선·별도 위계)이고, **STEP 01~06은 하나의 논리 사슬**이다.

| 단계 | 역할 | 핵심 구성 |
|------|------|-----------|
| **S0 정보 업데이트** | 신호 공급 (연료) | 소스 선택(MI·2030·agentguide·추가) → Insight 뽑기 → 1~6단계 반영 |
| **S1 분석 프레임** | 어떤 렌즈로 | STEEP × 거점(미국·유럽·한국) 표 · STEEP × 가전 4축(기술·소비자·규제·공급망) 매트릭스 |
| **S2 트렌드 도출** | 무엇이 뜨나 | 선정기준·탈락사유 → 8대 메가트렌드 카드(T1~T8) · 제품 카테고리 레벨 히트맵 |
| **S3 성숙도·영향** | 언제 × 얼마나 | 영향도 × 성숙도 2×2 매트릭스 · Hype Cycle 진행 참조 |
| **S4 경쟁사 대응** | 경쟁사는 이미 | 트렌드 × 경쟁사+당사 히트맵(●선도/○대응/–공백) · HVAC 전문기업 비교군 |
| **S5 당사 현 위치** | 우리는 어디 | 메가트렌드 레벨 갭 + 제품 카테고리 레벨 갭(선도/격차/공백) |
| **S6 당사 전략** | 그래서 So What | 트렌드 클러스터 · 역량×우선순위 매트릭스 · 단기·중기·장기 로드맵 |

### 데이터 상태 표기 (3종)

본문 수치는 **정적 리서치 데이터**다(실시간 갱신 아님, HTML에 고정). 신뢰 수준을 세 가지로 구분 표기한다:

- **확정** — 검증 출처 기준 수치 (예: 액체냉각 시장 $55억→$190억, 스마트가전 CAGR 20.6%)
- **미검증** — `.unver` 클래스, <span style="color:#A07C3A">**빨간 이탤릭**</span>으로 표기 (예: 한국 1인가구 ~35%, 초저출산 0.7대 등 내부 데이터로 확정 필요)
- **미입력** — `□□` 플레이스홀더·"보강" 라벨 (예: S6 로드맵의 목표 수치 = 내부 데이터 매핑 대기)

> ⚠️ 정량 수치·자동 수집 파이프라인은 **보강 단계 과제**다. 현재는 분석 골격과 리서치 데이터가
> 정적으로 완성돼 있고, 동적 요소는 아래 S0 Insight 생성 1곳뿐이다.

---

## 동적 요소 — S0 Insight 생성 (온디맨드)

이 보드에서 실제로 동작하는 동적 기능은 **S0의 "Insight 뽑기"** 하나다.
자동·주기적 피드가 아니라, **사용자가 버튼을 눌렀을 때만** Claude를 호출하는 온디맨드 방식이다.

**흐름:** 소스 선택 → `Insight 뽑기` → Claude가 신호 도출·S1~S6 분류 → 반영할 항목 선택 → 1~6단계 분석 테이블에 반영(+신규반영 배지)

- **모델:** `claude-haiku-4-5-20251001`
- **프록시:** `https://da-insight-anthropic-proxy.cw120-park.workers.dev`
  - Anthropic 키는 워커 secret에 보관 — 브라우저로 노출되지 않음 (`market-insight`와 동일 인프라)
- **소스 4종(MI·2030·agentguide·추가)** 은 *실데이터 fetch가 아니라* 선택 시 해당 **라벨 텍스트가 Claude 프롬프트 맥락으로 전달**되는 방식이다. (추가 소스만 URL·파일·텍스트 직접 입력)
- **폴백:** 프록시 미연결 시 하드코딩 샘플(`DEMO`, 9건)로 흐름을 시연하며 "백엔드 미연결 — 샘플 Insight" 배너를 표시
- **반영 결과:** 선택한 신호는 해당 STEP의 트렌드별(T1~T8) 분석 테이블로 들어가고, 기존 8대 트렌드 카드(S2)·경쟁사 히트맵(S4) 행에 신규반영 배지(`+N ▲/▼`)로 연동된다. `×`로 반영 취소 가능

> 과거 버전의 `market-insight/main/data/news.json` 자동 fetch 연동은 **현재 코드에 없다.**
> 마켓 인사이트는 위 S0 소스 라벨 중 하나로만 참조된다.

---

## 배포 (GitHub Pages)

이 레포는 `samsungda.net/2030` 하위경로가 아니라 **단독 서브도메인 `2030.samsungda.net`**으로 배포된다.
`samsungda.net/2030` 직접 접속은 `report-site` 백엔드에서 이 서브도메인으로 **301 영구 리다이렉트**되므로,
진입점은 `2030.samsungda.net` 하나로 통일돼 있다.

### 셋업 (1회만)

레포 `Settings → Pages`:

- **Source:** `Deploy from a branch` → `main` / `/ (root)`
- **Custom domain:** `2030.samsungda.net` 입력 → Save (레포의 `CNAME` 파일과 동일)
  - "DNS check successful" 확인 후 **Enforce HTTPS** 체크
- DNS(도메인 등록기관): `2030`을 `simpleornothing.github.io`로 향하는 `CNAME` 레코드

### 갱신

```bash
git clone https://github.com/SimpleorNothing/2030-insight.git
cd 2030-insight
# index.html 수정 후
git add index.html
git commit -m "..."
git push          # push 즉시 Pages 자동 재배포
```

> `index.html`은 인라인 CSS/JS를 포함한 단일 파일이다. 빌드 단계가 없으므로
> 로컬에서 `python3 -m http.server 8080` 후 브라우저로 바로 확인할 수 있다.

---

## 디자인

표준 DA 디자인 시스템(`#1257d6` 브랜드 블루)과 달리, 이 보드는 센싱 리포트 성격에 맞춰
**Pantone 팔레트 기반 독자 비주얼 아이덴티티**를 의도적으로 사용한다. 타이포그래피는 Pretendard.

| 토큰 | 값 | 용도 |
|------|------|------|
| `--paper` | `#F0EFEB` (Cloud Dancer) | 페이지 배경 |
| `--surface` | `#FBFAF7` | 카드·표 배경 |
| `--ink` | `#2E2A26` | 본문 텍스트 |
| `--accent` | `#496176` (Blue Fusion) | 강조·액티브·헤더 |
| `--signal` | `#A07C3A` | 미검증·주의 신호 (빨간 이탤릭) |
| `--ok` | `#5E9468` | 선도·반영 완료 |

- 반응형 `--wrap` 1180px, 모바일 860px 브레이크포인트에서 레일 라벨·그리드 단일화
- `prefers-reduced-motion` 대응 (스크롤·트랜지션 비활성화)
- 미검증 잠정 수치는 `.unver`(빨간 이탤릭)로 일관 표기해 확정값과 구분

---

## 라이선스

사내 도구 (내부 사용 限).
