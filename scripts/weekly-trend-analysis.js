/**
 * 전주 MI 뉴스를 읽어 2030 트렌드 관련성을 Claude로 분석,
 * 반영이 필요하면 index.html을 직접 수정하고 PR 본문을 pr_body.md에 저장.
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';

const client = new Anthropic();

// 전주 범위 계산
const now = new Date();
const monday = new Date(now);
monday.setUTCDate(now.getUTCDate() - now.getUTCDay() - 6); // 지난주 월요일
monday.setUTCHours(0, 0, 0, 0);
const sunday = new Date(monday);
sunday.setUTCDate(monday.getUTCDate() + 6);
sunday.setUTCHours(23, 59, 59, 999);

console.log(`분석 기간: ${monday.toISOString().slice(0,10)} ~ ${sunday.toISOString().slice(0,10)}`);

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

// 중요도순 정렬, 최대 60건 (토큰 절약)
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
  max_tokens: 8000,
  messages: [{
    role: 'user',
    content: `당신은 삼성다이나믹어드바이저리의 2030 미래 트렌드 보고서 편집자입니다.

아래는 전주(${monday.toISOString().slice(0,10)} ~ ${sunday.toISOString().slice(0,10)}) 가전·기술 업계 MI 뉴스입니다.
이 뉴스들을 검토하여, 현재 2030 보고서(index.html)에 반영하거나 수정이 필요한 내용이 있는지 판단하세요.

## 판단 기준
- 2030 메가트렌드(AI가전, 에너지전환, 헬스케어, 구독경제 등) 예측을 강화·수정할 근거가 되는가?
- 경쟁사 동향이 당사 갭 진단 섹션에 반영되어야 하는가?
- 참고자료 섹션에 추가할 중요 기사가 있는가?
- 반영 불필요한 경우: 단순 일회성 이벤트, 저영향(impact < 3.0) 뉴스, 기존 내용과 중복

## 전주 MI 뉴스
${newsSummary}

## 현재 index.html (전체)
${html}

## 응답 형식 (JSON)
반드시 아래 JSON 형식으로만 응답하세요:
{
  "hasUpdates": true 또는 false,
  "reasoning": "반영 여부 판단 근거 (2-3문장)",
  "updates": [
    {
      "section": "섹션명 (예: 5단계 갭진단, 참고자료)",
      "type": "추가 또는 수정",
      "description": "무엇을 왜 바꾸는지 설명",
      "oldText": "교체할 기존 HTML 텍스트 (exact match 필요, 없으면 빈 문자열)",
      "newText": "새로 삽입할 HTML 텍스트"
    }
  ],
  "prSummary": "PR 설명 (마크다운, 3-5줄)"
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

console.log(`분석 결과 - 업데이트 필요: ${result.hasUpdates}`);
console.log(`근거: ${result.reasoning}`);

if (!result.hasUpdates || !result.updates || result.updates.length === 0) {
  console.log('반영할 내용 없음. 종료.');
  process.exit(0);
}

// index.html 수정 적용
let updatedHtml = html;
let appliedCount = 0;

for (const update of result.updates) {
  if (update.oldText && updatedHtml.includes(update.oldText)) {
    updatedHtml = updatedHtml.replace(update.oldText, update.newText);
    appliedCount++;
    console.log(`적용: [${update.section}] ${update.description}`);
  } else if (!update.oldText && update.newText) {
    // oldText 없으면 </main> 바로 앞에 삽입
    updatedHtml = updatedHtml.replace('</main>', update.newText + '\n</main>');
    appliedCount++;
    console.log(`삽입: [${update.section}] ${update.description}`);
  } else {
    console.warn(`스킵 (oldText 불일치): [${update.section}]`);
  }
}

if (appliedCount === 0) {
  console.log('실제 적용된 변경 없음. 종료.');
  process.exit(0);
}

fs.writeFileSync('index.html', updatedHtml, 'utf-8');
console.log(`index.html 저장 완료 (${appliedCount}건 적용)`);

// PR 본문 생성
const prBody = `## 주간 MI 트렌드 자동 반영

**분석 기간**: ${monday.toISOString().slice(0,10)} ~ ${sunday.toISOString().slice(0,10)}  
**뉴스 검토**: ${lastWeekItems.length}건 중 상위 ${topItems.length}건 분석  
**적용 변경**: ${appliedCount}건

### 판단 근거
${result.reasoning}

### 변경 내용
${result.updates.filter(u => u.oldText ? html.includes(u.oldText) : true).map(u =>
  `- **[${u.section}]** (${u.type}): ${u.description}`
).join('\n')}

${result.prSummary}

---
*이 PR은 market-insight MI 뉴스 기반 자동 분석으로 생성됐습니다. 내용을 검토 후 머지하세요.*
`;

fs.writeFileSync('pr_body.md', prBody, 'utf-8');
console.log('pr_body.md 생성 완료');
