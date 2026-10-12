# seoyedoum

Astro + Svelte 5 + Tailwind CSS 4 + shadcn-svelte 프로젝트입니다.

## 개발

```sh
pnpm install
pnpm exec astro dev --background
pnpm exec astro dev status
pnpm exec astro dev logs
pnpm exec astro dev stop
```

```sh
pnpm check
pnpm build
```

## Cloudflare Pages 직접 업로드

```sh
pnpm artifact
```

검사와 빌드 후 루트에 `seoyedoum.zip`을 만듭니다. Cloudflare Pages 대시보드의 직접 업로드에 이 ZIP 파일을 올리면 됩니다. Wrangler CLI로 배포할 때는 ZIP 대신 `dist/` 폴더를 사용하세요.

## UI 컴포넌트

shadcn-svelte는 Vega 스타일과 neutral 색상을 사용합니다. 테마는
`src/styles/global.css`에서 관리하며 공통 레이아웃에서 불러옵니다.
`$lib` 별칭은 `src/lib`를 가리킵니다.

컴포넌트 추가:

```sh
pnpm exec shadcn-svelte add card
```

Svelte 컴포넌트에서 Button 사용:

```svelte
<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js';

  let count = $state(0);
</script>

<Button onclick={() => count += 1}>클릭 {count}회</Button>
```

위 컴포넌트를 `src/components/Counter.svelte`로 저장했다면 Astro 페이지에서
`client:load`를 지정해 상호작용을 활성화합니다.

```astro
---
import Counter from '../components/Counter.svelte';
import Layout from '../layouts/Layout.astro';
---

<Layout>
  <Counter client:load />
</Layout>
```
