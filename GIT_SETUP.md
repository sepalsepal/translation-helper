# Git Automation Setup Guide

## ✅ Git이 설정되었습니다!

### 첫 배포 (1회만 인증 필요)

1. **GitHub Personal Access Token 생성**
   - 브라우저에서 열기: https://github.com/settings/tokens
   - "Generate new token (classic)" 클릭
   - Note: `Translation Helper Deploy`
   - Expiration: `No expiration` (또는 원하는 기간)
   - 권한: ✅ `repo` 체크
   - 하단 "Generate token" 클릭
   - **토큰 복사** (한 번만 보입니다!)

2. **첫 배포 실행**
   ```bash
   cd /Users/al01742017/Desktop/Trans
   ./deploy.sh "Initial setup"
   ```

3. **인증 정보 입력** (1회만)
   - Username: `sepalsepal`
   - Password: `[복사한 토큰 붙여넣기]`

### 이후 배포 (자동!)

```bash
./deploy.sh "메시지"
```

또는 메시지 없이:
```bash
./deploy.sh
```

자동으로 시간 기반 커밋 메시지가 생성됩니다.

---

## 🚀 배포 프로세스

```
./deploy.sh 실행
    ↓
Git add + commit
    ↓
GitHub push
    ↓
Vercel 자동 감지 (1~2분)
    ↓
배포 완료!
```
