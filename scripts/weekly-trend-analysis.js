/**
 * 전주 MI 뉴스 → 1~6단계 반영 여부 점검 → weekly-check 섹션 업데이트
 * 자동 수정 없음. 점검 결과를 섹션에 채우고 PR 알람만 생성.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic();

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

// 중요도순 정렬, 최대 60건
const topItems = lastWeekItems
  .sort((a, b) => b.impact - a.impact)
  .slice(0, 60);

const newsSummary = topItems.map(item =>
  `[${item.grade}/${item.lens}] impact:${item.impact} | ${item.headline}\n${item.summary}\n제품: ${(item.products||[]).join(', ')} | 경쟁사: ${(item.competitors||[]).join(', ')}\n`
).join('\n---\n');

// 현재 index.html 읽기
const html = fs.readFileSync('index.html', 'utf-8');

// Claude 분석
console.log('Claude 분석 시작...');
const response = await client.messages.create({
  model: 'claude-sonnet-4-6',
  max_tokens: 6000,
  messages: [{
    role: 'user',
    content: `당신은 삼성다이나믹바이저리의 2030 미래 트렌드 보고서 편집자입니다.

아래 전주(${weekLabel}) 가전·기술 업계 MI 뉴스를 검토하여,
현재 보고서의 1~6단계 중 어느 단계에 어떤 점을 반영하면 좋을지 점검 결과를 작성해주세요.

## 판단 기준
- 1단계(분석 프레임): STEEP 매트릭스 셀에 새 신호 추가 필요?
- 2단계(트렌드 도출): 8대 메가트렌드 수치·근거 업데이트 필요? 카테고리 표 변경?
- 3단계(성숙도·영향): 트렌드 위치 이동 필요? 기회/위협 카드 업데이트?
- 4단계(경쟁사 대응): 경쟁사 신규 동향 추가 필요?
- 5단계(당사 현위치): 갭 진단 수치 변경 필요?
- 6단계(당사 전략): 로드맵·목표 수정 필요?
- 반영 불필요: 단순 일회성 이벤트, 저영향(impact < 3.0), 기존 내용과 중복

## 전주 MI 뉴스
${newsSummary}

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
  ? `<p style="font-size:13px; color:var(--warn); font-weight:600; padding:0 0 10px; border-bottom:1px solid rgba(245,158,11,.3); margin-bottom:6px">${result.summary}</p>`
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
