# Paybook

부부가 한 달 단위 공동 지출을 기록하는 개인용 웹앱입니다. 로그인 계정은 없고, 컨테이너 환경변수 `PAYBOOK_PIN`으로 설정한 공유 PIN으로 접근합니다.

## Requirements

- Node.js 22
- PostgreSQL 서버
- Docker 또는 Docker가 설치된 Proxmox VM/LXC

## Environment

필수 환경변수:

```env
DATABASE_URL=postgresql://paybook:change-me@postgres.example:5432/paybook
PAYBOOK_PIN=123456
PAYBOOK_SESSION_SECRET=replace-with-at-least-32-random-characters
```

`PAYBOOK_PIN`은 DB나 이미지에 저장하지 않습니다. `PAYBOOK_SESSION_SECRET`은 32자 이상으로 설정하세요.

## Local Development

```bash
npm install
npm run dev
```

처음 접속하면 PIN 입력 후 두 사람 이름을 설정합니다.

## Docker

```bash
docker build -t paybook:local .
docker run --rm -p 3000:3000 \
  -e DATABASE_URL='postgresql://paybook:change-me@postgres.example:5432/paybook' \
  -e PAYBOOK_PIN='123456' \
  -e PAYBOOK_SESSION_SECRET='replace-with-at-least-32-random-characters' \
  paybook:local
```

또는 `docker-compose.example.yml`을 복사해 환경변수를 수정한 뒤 실행합니다.

```bash
docker compose up -d --build
```

## Proxmox Deployment

Proxmox에서는 Docker가 설치된 VM 또는 LXC 안에서 컨테이너를 실행합니다. PostgreSQL은 외부 서버를 사용하고, 앱 컨테이너에는 DB를 포함하지 않습니다.

권장 구성:

- Paybook 컨테이너: 내부 포트 `3000`
- PostgreSQL: 별도 서버 또는 기존 DB 인스턴스
- HTTPS: Proxmox 앞단 리버스 프록시에서 종료
- 방화벽: 필요한 접근 경로만 허용

## Commands

```bash
npm test
npm run lint
npm run build
```
