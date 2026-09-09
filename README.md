# My Expense Tracker

굿즈/소장품 구매와 판매를 관리하는 개인용 지출 추적 웹앱입니다. 무엇을 얼마에 샀고, 얼마에
팔았고, 언제 발송되는지를 한 곳에서 관리하려고 만들었습니다. 모바일에서도 앱처럼 설치해
쓸 수 있도록 PWA로 만들었습니다.

## 주요 기능

- **구매/판매 관리**: 장르·캐릭터·시리즈·물품 종류별로 구매 품목을 등록하고, 부분 판매를
  포함한 판매 이력과 손익을 관리합니다.
- **발송 관리**: 발송 예정일 기준 D-Day 표시, 발송일이 지나면 "배송중" 상태로 자동 전환되고
  실제 수령을 확인하면 "배송 완료"로 바뀝니다. 발송일이 "몇 월"까지만 정해진 경우도 입력할
  수 있습니다.
- **발송 그룹**: 같은 날 구매하고 제작자/공구 개최자가 같은 품목을 자동으로 묶어서, 발송일이
  밀리면 그룹 전체를 한 번에 수정할 수 있습니다.
- **카탈로그 관리**: 장르/캐릭터/물품 종류 등 선택지를 직접 추가·삭제·이름 변경할 수 있고,
  드래그 앤 드롭으로 노출 순서를 바꿀 수 있습니다.
- **행사 체크리스트**: 오프라인 행사(마켓 등) 참여 시 부스별로 구매/수령할 목록을 미리
  적어두고 당일 확인할 수 있습니다.
- **통계 대시보드**: 월별 구매/판매 추이, 카테고리별 합계를 확인할 수 있습니다.
- **사진 업로드**: 품목 사진을 업로드할 때 브라우저에서 바로 회전·자유 비율로 잘라서 올릴 수
  있습니다.
- **PWA**: 홈 화면에 설치해 앱처럼 사용할 수 있습니다.
- **백업**: 전체 데이터를 JSON으로 내려받을 수 있습니다.

## 기술 스택

- [Next.js 16](https://nextjs.org) (App Router, Server Actions)
- [Prisma 7](https://www.prisma.io) + [Supabase](https://supabase.com) (PostgreSQL)
- [NextAuth.js (Auth.js)](https://authjs.dev) — Google OAuth 로그인
- [Tailwind CSS](https://tailwindcss.com)
- [@dnd-kit](https://dndkit.com), [react-image-crop](https://github.com/sekoyo/react-image-crop)
- 배포: [Vercel](https://vercel.com)

## 로그인 방식

Google OAuth로 로그인하지만, 로그인 자체는 **환경변수 `ALLOWED_EMAIL`에 등록된 이메일
한 개만** 허용하는 화이트리스트 방식입니다(1인용 개인 가계부 앱이기 때문입니다). 직접
배포해서 써보려면 아래 설정에서 본인 이메일로 지정해야 본인 계정으로 로그인할 수 있습니다.

## 시작하기

### 1. 저장소 클론 및 설치

```bash
git clone https://github.com/pilan2/my-expense-tracker.git
cd my-expense-tracker
npm install
```

### 2. Supabase 프로젝트 준비

1. [Supabase](https://supabase.com)에서 새 프로젝트를 만듭니다(무료 티어로 충분합니다).
2. **Database**: 프로젝트의 **Connect** 메뉴 > **ORM** 탭에서 Prisma용 연결 문자열
   (`DATABASE_URL`, `DIRECT_URL`)을 확인합니다.
3. **Storage**: 품목 사진을 저장할 `item-images`라는 이름의 **public** 버킷을 만듭니다.
   **Project Settings > API**에서 Project URL(`SUPABASE_URL`)과 `service_role` 키
   (`SUPABASE_SERVICE_ROLE_KEY`)를 확인합니다.

### 3. Google OAuth 클라이언트 준비

1. [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트를 만들고 OAuth
   동의 화면을 설정합니다.
2. **사용자 인증 정보 > OAuth 클라이언트 ID**를 만들고(웹 애플리케이션), 승인된 리디렉션
   URI에 `http://localhost:3000/api/auth/callback/google`(배포 시에는 실제 도메인으로도
   추가)을 등록합니다.
3. 발급된 클라이언트 ID/보안 비밀번호를 `GOOGLE_CLIENT_ID`/`GOOGLE_CLIENT_SECRET`에 씁니다.

### 4. 환경변수 설정

`.env.example`을 `.env.local`로 복사하고 값을 채웁니다.

```bash
cp .env.example .env.local
```

- `NEXTAUTH_SECRET`은 `openssl rand -base64 32`로 생성합니다.
- `ALLOWED_EMAIL`에는 로그인을 허용할 본인 Google 계정 이메일을 씁니다.

### 5. DB 스키마 반영 및 실행

```bash
npx prisma migrate deploy
npm run dev
```

`http://localhost:3000`에서 확인할 수 있습니다.

### 배포

Vercel에 저장소를 연결하고, 위 환경변수를 그대로 Vercel 프로젝트 환경변수에 등록하면
GitHub `main` 브랜치 push 시 자동으로 배포됩니다.

## 라이선스

[MIT](./LICENSE)
