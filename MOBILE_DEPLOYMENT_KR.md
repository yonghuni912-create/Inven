# 📱 모바일 환경에서 배포하기

## 문제 해결

### dotenv 의존성 추가 완료 ✅

`package.json`에 `"dotenv": "^16.4.5"`가 추가되었습니다. 이제 npm을 실행할 수 없는 환경에서도 Vercel이나 GitHub Actions를 통한 자동 배포가 정상적으로 작동합니다.

## 📱 핸드폰으로 배포하는 방법

핸드폰에서는 직접 `npm install`이나 `npm run build`를 실행할 수 없지만, **GitHub를 통한 자동 배포**를 활용하면 됩니다.

### 방법 1: GitHub 웹 인터페이스 + Vercel 자동 배포 (권장)

#### 1단계: Vercel 설정 (최초 1회만)

1. **Vercel 앱 설치** (모바일 브라우저에서)
   - https://vercel.com 접속
   - GitHub 계정으로 로그인
   - "Import Project" 선택
   - 이 저장소 선택: `yonghuni912-create/Inven`

2. **환경 변수 설정**
   - Settings → Environment Variables 메뉴
   - 다음 변수들을 추가:
     ```
     TURSO_DATABASE_URL=libsql://your-database.turso.io
     TURSO_AUTH_TOKEN=your-auth-token
     ENCRYPTION_KEY=your-32-char-random-key
     NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
     ```

3. **자동 배포 활성화**
   - Git Integration → Production Branch를 `main`으로 설정
   - 이제 GitHub의 main 브랜치에 코드를 푸시하면 **자동으로 빌드 및 배포**됩니다!

#### 2단계: 코드 수정 및 배포

**방법 A: GitHub 모바일 앱 사용**

1. GitHub 앱 설치 (iOS/Android)
2. 저장소 열기
3. 수정할 파일 선택
4. 연필 아이콘 클릭하여 편집
5. "Commit changes" 클릭
6. **자동으로 Vercel에서 빌드 시작** 🚀

**방법 B: GitHub 웹 사이트 (모바일 브라우저)**

1. github.com 접속
2. 저장소 페이지에서 파일 클릭
3. 연필 아이콘 (Edit) 클릭
4. 수정 후 하단의 "Commit changes" 버튼
5. **자동으로 Vercel에서 빌드 시작** 🚀

#### 3단계: 배포 상태 확인

1. **Vercel 앱/웹사이트에서**
   - Deployments 탭에서 진행 상황 확인
   - 빌드 로그 실시간 확인 가능
   - 성공하면 자동으로 프로덕션에 반영

2. **GitHub에서**
   - Actions 탭에서 워크플로우 상태 확인
   - Deployments 섹션에서 Vercel 배포 상태 확인

### 방법 2: GitHub Codespaces (무료 월 60시간)

핸드폰에서도 완전한 개발 환경을 사용할 수 있습니다!

1. **Codespace 생성**
   - GitHub 저장소 페이지 열기
   - 초록색 "Code" 버튼 클릭
   - "Codespaces" 탭 선택
   - "Create codespace on main" 클릭

2. **브라우저에서 VS Code 실행**
   - 브라우저에서 완전한 VS Code 환경 로드
   - 터미널에서 명령어 실행 가능:
     ```bash
     npm install
     npm run build
     npm run db:push
     ```

3. **변경사항 커밋 및 푸시**
   - 소스 제어 탭에서 변경사항 확인
   - 커밋 메시지 입력 후 커밋
   - "Sync Changes" 클릭
   - **자동으로 Vercel에서 배포 시작** 🚀

### 방법 3: Termux (Android 전용)

Android에서 완전한 Node.js 환경을 사용할 수 있습니다.

1. **Termux 앱 설치**
   - F-Droid에서 Termux 다운로드
   - Play Store 버전은 업데이트 중단됨

2. **개발 환경 설정**
   ```bash
   # 패키지 업데이트
   pkg update && pkg upgrade
   
   # Git, Node.js 설치
   pkg install git nodejs
   
   # 저장소 클론
   git clone https://github.com/yonghuni912-create/Inven.git
   cd Inven
   
   # 의존성 설치
   npm install
   
   # 환경 변수 설정
   cp .env.example .env
   nano .env  # 값 입력
   
   # 빌드 및 테스트
   npm run build
   ```

3. **변경사항 푸시**
   ```bash
   git add .
   git commit -m "Your message"
   git push
   ```

## 🔧 데이터베이스 설정 (핸드폰에서)

### Turso CLI 없이 데이터베이스 생성

Turso 웹 대시보드를 사용하세요:

1. **https://turso.tech 접속**
2. GitHub 계정으로 로그인
3. "Create Database" 클릭
4. 데이터베이스 이름 입력 (예: `inven-production`)
5. Region 선택 (가까운 지역)
6. "Create" 클릭

7. **연결 정보 복사**
   - Database URL과 Auth Token 표시됨
   - 이 값들을 Vercel 환경 변수에 입력

8. **스키마 적용**
   - GitHub Codespaces 사용하거나
   - Turso 웹 콘솔에서 직접 SQL 실행:
     - `db/schema.ts` 내용 기반으로 CREATE TABLE 문 실행

## ✅ 핸드폰 배포 체크리스트

### 최초 설정 (1회만)
- [ ] Vercel 계정 생성 및 저장소 연결
- [ ] Vercel 환경 변수 설정
- [ ] Turso 데이터베이스 생성 (웹 대시보드)
- [ ] Turso 연결 정보를 Vercel에 입력
- [ ] 첫 배포 테스트 (GitHub에서 README 수정 → 자동 배포 확인)

### 일상적인 배포
- [ ] GitHub 앱/웹에서 코드 수정
- [ ] Commit changes 클릭
- [ ] Vercel에서 자동 빌드 시작 (약 2-3분)
- [ ] 배포 완료 후 사이트 확인

## 💡 팁

### 1. 모바일 편집이 어려운 작업
- 대량의 코드 수정
- 여러 파일 동시 수정
- 복잡한 리팩토링

→ **GitHub Codespaces** 사용을 권장

### 2. 간단한 수정
- 설정 값 변경
- 텍스트 수정
- 환경 변수 업데이트

→ **GitHub 웹/앱**에서 직접 수정

### 3. 빌드 에러 확인
- Vercel 대시보드 → Deployments → 실패한 배포 클릭
- 로그에서 에러 메시지 확인
- GitHub에서 수정 후 다시 푸시

### 4. 긴급 롤백
- Vercel 대시보드 → Deployments
- 이전 성공한 배포 선택
- "Promote to Production" 클릭
- 즉시 이전 버전으로 복원!

## 🚨 주의사항

1. **환경 변수는 절대 코드에 직접 입력하지 마세요**
   - `.env` 파일은 절대 커밋하지 않음
   - Vercel 환경 변수만 사용

2. **main 브랜치에 직접 푸시 주의**
   - 가능하면 브랜치 생성 후 Pull Request
   - 테스트 후 머지

3. **데이터베이스 변경은 신중하게**
   - 스키마 변경 전 백업
   - Turso 웹 콘솔에서 직접 수정 가능

## 📞 도움이 필요하면

- GitHub Issues: 버그 리포트
- GitHub Discussions: 질문 및 토론
- Vercel Support Chat: 배포 문제
- Turso Discord: 데이터베이스 문제

---

이제 핸드폰만으로도 완전한 배포가 가능합니다! 🎉
