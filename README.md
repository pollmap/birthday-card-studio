# 생일 카드 스튜디오

이름·문구·테마·포켓몬을 선택하고 미리본 뒤, 카드별 고유 URL과 링크 썸네일을 자동 생성하여 GitHub Pages에 게시하는 로컬 편집기입니다. 기존 [선업님 카드](https://pollmap.github.io/seonup-birthday-card-2026/)와 [소정님 카드](https://pollmap.github.io/sojeong-birthday-card-2026/)는 별도 저장소에 그대로 있습니다.

## 사용 방법

1. `start-studio.cmd`를 실행하고 열린 창을 유지합니다.
2. 브라우저에서 `http://127.0.0.1:4173/`을 엽니다.
3. 이름, 카드 호칭, 축하 문구, 서명, 테마와 포켓몬을 고릅니다. 모바일 화면 미리보기를 확인합니다.
4. **카드 게시하기**를 누릅니다. 카드와 1200×630 링크 썸네일이 생성되고 GitHub Pages에 반영됩니다.
5. 나중에 수정하려면 **기존 카드 수정**에서 카드를 고른 뒤 같은 주소로 다시 게시합니다.

새 카드 주소 형식은 `https://pollmap.github.io/birthday-card-studio/cards/주소-이름/`입니다. 주소 이름은 영문 소문자·숫자·하이픈만 사용할 수 있습니다. 게시한 카드의 이름과 문구, 이미지가 담긴 저장소는 공개 상태입니다.

## 필요한 프로그램

- Node.js, Git, GitHub CLI(`gh`)
- Python 3와 Pillow(`python -m pip install pillow`)
- `gh auth login`으로 `pollmap` 계정에 로그인된 상태

이 편집기는 `127.0.0.1`에서만 열리고 GitHub 인증 토큰을 웹페이지에 저장하지 않습니다. 게시는 이 PC의 Git/GitHub CLI 인증을 이용합니다. 공개 사이트에는 정적 카드만 올라갑니다.

## 구성

- `studio/`: 로컬 편집 화면, 입력 검증, HTML·썸네일 생성, 게시 서버
- `docs/assets/`: 카드 공통 코드와 이미지
- `cards/*.json`: 각 카드의 편집 가능한 원본 내용
- `docs/cards/<slug>/`: 실제 공개 카드와 썸네일

포켓몬 이미지는 비공식 개인 축하 카드용입니다. 피츄·쥬피썬더는 [PokeAPI sprites](https://github.com/PokeAPI/sprites)의 공식 일러스트 자산이며, 피카츄 이미지는 [기존 KDA Pikachu 사이트](https://kda-pikachu.pages.dev/)에서 가져왔습니다. 관련 권리는 각 권리자에게 있습니다. 카드 배경과 케이크는 별도로 생성했습니다.
