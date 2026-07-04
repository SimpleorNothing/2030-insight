/**
 * 전주 MI 뉴스 → 1~6단계 반영 여부 점검 → weekly-check 섹션 업데이트
 * 자동 수정 없음. 점검 결과를 섹션에 채우고 PR 알람만 생성.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic();

// ===== CI(경쟁사 전략 추적) 실데이터 =====
// ci.samsungda.net 은 SSO(SITE_PASSWORD·세션 쿠키) 게이트라 직접 fetch가 막혀,
// 공개 저장소(competitor_intelligence) main 브랜치 raw JSON을 읽는다(main push 자동배포 → 배포본과 동일 최신).
const CI_STRATEGIES_URL = 'https://raw.githubusercontent.com/SimpleorNothing/competitor_intelligence/main/public/data/strategies.json';
const CI_EVIDENCE_URL   = 'https://raw.githubusercontent.com/SimpleorNothing/competitor_intelligence/main/public/data/evidence.json';
const CI_SIGNAL_RANK = { Insight: 3, Deep: 2, New: 1 };

// CI 전략 프레임 + 최근 실행 증거를 프롬프트 주입용 텍스트 블록으로 요약. 실패 시 '' 반환(MI 단독 진행).
async function loadCI(cap = 16) {
  let strategies, evidence;
  try {
    const [rs, re] = await Promise.all([fetch(CI_STRATEGIES_URL), fetch(CI_EVIDENCE_URL)]);
    if (!rs.ok || !re.ok) { console.error('CI fetch 응답 오류:', rs.status, re.status); return ''; }
    strategies = await rs.json();
    evidence   = await re.json();
  } catch (e) { console.error('CI fetch 실패:', e.message); return ''; }

  const companies = Array.isArray(strategies?.companies) ? strategies.companies : [];
  const items     = Array.isArray(evidence?.items) ? evidence.items : [];
  const active    = companies.filter(c => c && c.active);
  if (!active.length || !items.length) return '';

  const axisMap = {}, compMap = {};
  for (const c of companies) {
    compMap[c.id] = c.shortName || c.name || c.id;
    (Array.isArray(c.axes) ? c.axes : []).forEach(a => {
      axisMap[a.id] = { title: a.title || a.code || '', status: a.execStatus || '' };
    });
  }
  const axisLabel = (axisId) => {
    if (axisId && /-frame$/.test(axisId)) return '전략 프레임';
    const a = axisMap[axisId];
    return a ? (a.title + (a.status ? ` (${a.status})` : '')) : '';
  };
  const activeIds = new Set(active.map(c => c.id));

  // 주간 점검용: 최신순 우선 + 시그널·확신도 가중
  const sortFn = (a, b) => {
    const dt = new Date(b.date || 0) - new Date(a.date || 0); if (dt) return dt;
    const sg = (CI_SIGNAL_RANK[b.signalType] || 0) - (CI_SIGNAL_RANK[a.signalType] || 0); if (sg) return sg;
    return ((b.confidence === '사실') ? 1 : 0) - ((a.confidence === '사실') ? 1 : 0);
  };
  const pool = items.filter(it => activeIds.has(it.companyId)).sort(sortFn).slice(0, cap);
  if (!pool.length) return '';

  const frameLines = active.map(c => {
    const axes = (Array.isArray(c.axes) ? c.axes : [])
      .map(a => `${a.title}${a.execStatus ? ` (${a.execStatus})` : ''}`).join(' / ');
    const stmt = c.frame?.statement || '';
    const redef = c.frame?.redefinition ? `\n    재정의: ${String(c.frame.redefinition).slice(0, 120)}` : '';
    return `· ${c.shortName || c.name}${stmt ? ` — ${stmt}` : ''}${redef}` + (axes ? `\n    전략축(실행상태): ${axes}` : '');
  }).join('\n');

  const evLines = pool.map(it => {
    const comp = compMap[it.companyId] || it.companyId;
    const ax = axisLabel(it.axisId);
    const interp = it.interpretation ? ` — ${String(it.interpretation).slice(0, 90)}` : '';
    return `- [${it.date}] [${comp}${ax ? ` · ${ax}` : ''}] ${it.event}${interp}`;
  }).join('\n');

  return `[전략 프레임 요약]\n${frameLines}\n\n[최근 실행 증거]\n${evLines}`;
}

// 전주 범위 계산
const now = new Date();
const monday = new Date(now);
monday.setUTCDate(now.getUTCDate() - now.getUTCDay() - 6);
monday.setUTCHours(0, 0, 0, 0);
const sunday = new Date(monday);
sunday.setUTCDate(monday.getUTCDate() + 6);
sunday.setUTCHours(23, 59, 59, 999);

const weekLabel = `${monday.toISOString().slice(0,10)} ~ ${sunday.toISOString().slice(0,10)}`;
console.log(`분석 기간: ${weekLabel}`);

// 전주 뉴스 필터링
const raw = JSON.parse(fs.readFileSync('news_raw.json', 'utf-8'));
const lastWeekItems = raw.items.filter(item => {
  const d = new Date(item.publishedAt);
  return d >= monday && d <= sunday;
});

console.log(`전주 뉴스 ${lastWeekItems.length}건 발견`);

if (lastWeekItems.length === 0) {
  console.log('전주 뉴스 없음. 종료.');
  process.exit(0);
}

// 중요도순 정렬, 최대 30건 (토큰 절약)
const topItems = lastWeekItems
  .sort((a, b) => b.impact - a.impact)
  .slice(0, 30);

// 뉴스 요약 (summary는 생략, headline + point만)
const newsSummary = topItems.map(item =>
  `[${item.grade}/${item.lens}] impact:${item.impact} | ${item.headline} | 제품: ${(item.products||[]).join(',')} | 경쟁사: ${(item.competitors||[]).join(',')}`
).join('\n');

// CI(경쟁사 전략 추적) 실데이터 로드 — MI 뉴스에 더해 소스로 함께 활용
console.log('CI 데이터 로드 중...');
const ciBlock = await loadCI();
console.log(ciBlock ? 'CI 전략·증거 블록 주입' : 'CI 데이터 없음 — MI 뉴스만으로 분석 진행');

// 현재 index.html 읽기
const html = fs.readFileSync('index.html', 'utf-8');

// Claude 분석
console.log('Claude 분석 시작...');
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 8192,
  messages: [{
    role: 'user',
    content: `당신은 삼성다이나믹바이저리의 2030 미래 트렌드 보고서 편집자입니다.

아래 두 소스 — ① 전주(${weekLabel}) 가전·기술 업계 MI 뉴스와 ② 경쟁사 전략 추적(CI) 보드의 전략 프레임·최근 실행 증거 — 를 함께 검토하여,
현재 보고서의 1~6단계 중 어느 단계에 어떤 점을 반영하면 좋을지 점검 결과를 작성해주세요.
MI 뉴스뿐 아니라 CI 데이터에서 도출한 점검 포인트도 stageReviews에 포함하세요(특히 4단계 경쟁사 대응, 그리고 경쟁사 전략축 변화가 트렌드 성숙도·당사 전략에 주는 시사점).

## 판단 기준
- 1단계(분석 프레임): STEEP 매트릭스 셀에 새 신호 추가 필요?
- 2단계(트렌드 도출): 8대 메가트렌드 수치·근거 업데이트 필요? 카테고리 표 변경?
- 3단계(성숙도·영향): 트렌드 위치 이동 필요? 기회/위협 카드 업데이트?
- 4단계(경쟁사 대응): 경쟁사 신규 동향 추가 필요? (아래 CI 데이터의 전략축 실행상태 변화·신규 실행 증거를 우선 근거로 판단)
- 5단계(당사 현위치): 갭 진단 수치 변경 필요?
- 6단계(당사 전략): 로드맵·목표 수정 필요?
- 반영 불필요: 단순 일회성 이벤트, 저영향(impact < 3.0), 기존 내용과 중복

## 전주 MI 뉴스
${newsSummary}

## 경쟁사 전략 추적(CI) — 전략 프레임·최근 실행 증거
${ciBlock || '(이번 회차 CI 데이터 없음 — MI 뉴스만 근거)'}

## 응답 형식 (JSON만 반환)
{
  "hasReview": true 또는 false,
  "summary": "이번 주 전반적 특징 (2~3문장)",
  "stageReviews": [
    {
      "stage": "1" ~ "6" (해당 단계 번호),
      "stageLabel": "분석 프레임" 등 단계명,
      "headline": "점검 제목 (20자 이내)",
      "news": [
        {
          "headline": "뉴스 헤드라인",
          "point": "반영 검토 포인트 (1~2문장)"
        }
      ],
      "action": "담당자에게 전달할 반영 권고 (1문장)"
    }
  ],
  "prSummary": "PR 설명 (마크다운, 3~5줄)"
}`
  }]
});

let result;
try {
  const text = response.content[0].text.trim();
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  result = JSON.parse(jsonMatch[0]);
} catch (e) {
  console.error('JSON 파싱 실패:', e.message);
  process.exit(0);
}

console.log(`분석 완료 - 점검 항목: ${result.hasReview}, 단계 수: ${(result.stageReviews||[]).length}`);

if (!result.hasReview || !result.stageReviews || result.stageReviews.length === 0) {
  console.log('반영 검토 항목 없음. 종료.');
  process.exit(0);
}

// weekly-check 섹션 HTML 생성
const stageRowsHtml = result.stageReviews.map(sr => {
  const newsItems = (sr.news || []).map(n =>
    `<li><b>${n.headline}</b> — ${n.point}</li>`
  ).join('');
  return `
    <div class="wc-stage-row">
      <span class="wc-stage-badge">S${sr.stage}</span>
      <div class="wc-stage-content">
        <div class="wc-headline">${sr.stageLabel} · ${sr.headline}</div>
        <ul class="wc-news" style="padding-left:16px; margin-top:4px">${newsItems}</ul>
        <div class="wc-action">▶ ${sr.action}</div>
      </div>
    </div>`;
}).join('\n');

const summaryHtml = result.summary
  ? `<p style="font-size:15px; color:var(--warn); font-weight:600; padding:0 0 10px; border-bottom:1px solid rgba(245,158,11,.3); margin-bottom:6px">${result.summary}</p>`
  : '';

const newSection = `<!-- WEEKLY-CHECK-START -->
<section id="weekly-check" class="wrap" style="padding-top:32px">
  <div class="weekly-check">
    <div class="weekly-check-head">
      <span class="wc-badge">📰 주간 점검</span>
      <span class="wc-title">MI 트렌드 점검 — 1~6단계 반영 검토</span>
      <span class="wc-date">분석 기간: ${weekLabel}</span>
      <span class="wc-status pending">검토 대기</span>
    </div>
    <div class="weekly-check-body">
      ${summaryHtml}
      ${stageRowsHtml}
    </div>
  </div>
</section>
<!-- WEEKLY-CHECK-END -->`;

// 마커 사이 교체
const updatedHtml = html.replace(
  /<!-- WEEKLY-CHECK-START -->[\s\S]*?<!-- WEEKLY-CHECK-END -->/,
  newSection
);

if (updatedHtml === html) {
  console.error('마커를 찾지 못했습니다. index.html의 WEEKLY-CHECK-START/END 마커를 확인하세요.');
  process.exit(1);
}

fs.writeFileSync('index.html', updatedHtml, 'utf-8');
console.log('index.html 저장 완료');

// PR 본문 생성
const stageList = result.stageReviews.map(sr =>
  `- **${sr.stageLabel}(${sr.stage}단계)**: ${sr.headline} → ${sr.action}`
).join('\n');

const prBody = `## 주간 MI 트렌드 점검 결과

**분석 기간**: ${weekLabel}
**뉴스 검토**: ${lastWeekItems.length}건 중 상위 ${topItems.length}건 분석

### 이번 주 특징
${result.summary}

### 단계별 점검 결과
${stageList}

---
${result.prSummary}

> 이 PR은 자동 점검 알람입니다. index.html의 주간 점검 섹션만 업데이트됐습니다.
> 반영할 내용을 확인 후 Claude에게 알려주시면 해당 단계에 직접 반영합니다.
`;

fs.writeFileSync('pr_body.md', prBody, 'utf-8');
console.log('pr_body.md 생성 완료');
