# 2030 미래 트렌드 (DA·SENSING 2030)

DA 가전시장의 2030년 변화를 통합 센싱하는 단일 페이지 보드.
소비자·기술·경쟁사 3축 신호를 `Signal → Trend → Megatrend` 위계로 추적하고,
실시간 마켓 인사이트 피드를 자동 반영한다.

**배포 URL:** `https://2030.samsungda.net`
**호스팅:** GitHub Pages (`CNAME` = `2030.samsungda.net`)
**구성:** 단일 정적 `index.html` (빌드 과정 없음, `.nojekyll`로 Jekyll 비활성화)

> 🧭 **기획 도구 모음**(`samsungda.net`) 생태계의 일부입니다 — 허브 레포: [`samsungda-portal`](https://github.com/SimpleorNothing/samsungda-portal)

| 도구 | 진입 | 레포 |
|------|------|------|
| 클로드로 워드보고서 작성하기 | `agentguide.samsungda.net` | `agent-guide` |
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

## 화면 구성

- **히어로 / 카운터** — 약 신호·트렌드·메가·폐기 단계별 집계, 최근 7일·30일 변동
- **실시간 마켓 인사이트** — `market-insight` 파이프라인 결과를 자동 연동(아래 참조)
- **3축 신호 카드** — 소비자·기술 / 표준·규제 / 경쟁사(11개사 · 7제품군)
- **So what for DA** — 단기(6M) · 중기(1~2Y) · 장기(3Y+ ~2030) 시점별 실행 시사점
- **출처 아카이브** — 본문 인용 순 1차 출처(공시·거래소·박람회·Tier 1 매체)

> ⚠️ 카운터·빈도·신뢰도 등 **정량 수치는 시연용 잠정값**(빨간 이탤릭)이며 검증이 필요하다.
> 입력 가이드(소비자·기술/경쟁사 v3)는 운영 프레임워크 정의서로, 실측 신호 데이터는 별도 수집 대상이다.

---

## 실시간 데이터 연동

보드의 마켓 인사이트 피드는 `market-insight` 레포가 산출한 분류 결과를 **클라이언트에서 직접 fetch**한다.
별도 백엔드 없이 정적 페이지가 외부 JSON을 읽어오는 구조다.

- **소스:** `https://raw.githubusercontent.com/SimpleorNothing/market-insight/main/data/news.json`
- **갱신:** `market-insight`의 GitHub Actions cron(1시간 주기)이 갱신하면 보드는 새로고침 시 자동 반영
- **CORS:** `raw.githubusercontent.com`은 `access-control-allow-origin *`이라 교차 출처 fetch 허용
- 렌즈(경쟁사·소비자·기술·정책·거시) × 등급(긴급·주요·주시·참고) × 영향도(1~5)로 분류된 항목을 표시

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

표준 디자인 시스템(`#1257d6` 브랜드 블루, Pretendard)과 달리, 이 보드는 센싱 리포트 성격에 맞춘
**독자 비주얼 아이덴티티**를 쓴다 — gold(`#B0791F`)·teal(`#1F9E94`) 액센트, IBM Plex Sans KR / Gowun Batang /
IBM Plex Mono 타이포그래피. 시연용 잠정 수치는 빨간 이탤릭(`.demo`)으로 일관 표기해 실측값과 구분한다.

---

## 라이선스

사내 도구 (내부 사용 限).
