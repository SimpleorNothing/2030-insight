// 2030.samsungda.net — 2030 미래 전망 게이트 Worker
//
// GitHub Pages(정적 보드)에는 비밀번호를 걸 수 없으므로, 서브도메인 앞단에 이 Worker를
// 두고 포탈과 같은 SSO 게이트를 적용한다. 통과한 요청만 GitHub 원본(raw)에서 파일을
// 읽어 돌려준다(레포의 index.html 단일 파일이 진실원).
//
// 배포:
//   cd gate && npx wrangler deploy
//   npx wrangler secret put SITE_PASSWORD   # 포탈과 "같은 값"
// DNS: 2030.samsungda.net 이 GitHub Pages(CNAME)를 가리키고 있으므로, Custom Domain을
//      이 Worker로 붙일 때 기존 DNS 레코드를 대체해야 한다(대시보드에서 교체 승인).

import { guard } from "./gate.js";

const RAW = "https://raw.githubusercontent.com/SimpleorNothing/2030-insight/main";

// 2030 보드는 전 경로를 게이트한다. 서버-측에서 이 보드를 읽던 아이디어 자판기(report-idea)는
// GitHub raw 원본을 읽도록 바꿨다(2030-insight 레포는 public).
const OPEN_PATHS = [];

const TYPES = {
  html: "text/html; charset=utf-8",
  js: "text/javascript; charset=utf-8",
  css: "text/css; charset=utf-8",
  json: "application/json; charset=utf-8",
  svg: "image/svg+xml",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  ico: "image/x-icon",
  txt: "text/plain; charset=utf-8",
  xml: "application/xml; charset=utf-8",
  woff2: "font/woff2",
};

function contentType(path) {
  const ext = (path.split(".").pop() || "").toLowerCase();
  return TYPES[ext] || "application/octet-stream";
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    const blocked = await guard(request, env, url, {
      title: "2030 미래 전망",
      openPaths: OPEN_PATHS,
    });
    if (blocked) return blocked;

    let path = url.pathname;
    if (path === "" || path === "/") path = "/index.html";
    if (path.endsWith("/")) path += "index.html";
    if (path.includes("..")) return new Response("Not found", { status: 404 });

    const upstream = await fetch(RAW + path, {
      cf: { cacheTtl: 60, cacheEverything: true },
      headers: { "user-agent": "samsungda-2030-gate" },
    });
    if (!upstream.ok) {
      return new Response("Not found", { status: upstream.status === 404 ? 404 : 502 });
    }

    const headers = new Headers();
    headers.set("content-type", contentType(path));
    headers.set("cache-control", path.endsWith(".json") ? "public, max-age=60" : "no-cache, must-revalidate");
    headers.set("x-content-type-options", "nosniff");
    return new Response(upstream.body, { status: 200, headers });
  },
};
