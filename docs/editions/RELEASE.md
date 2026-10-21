# 캐릭터 생일 카드 4종

## 주소

- 병진아: https://pollmap.github.io/birthday-card-studio/byungjin/
- 승균이 햄: https://pollmap.github.io/birthday-card-studio/seunggyun/
- 찬영쌤: https://pollmap.github.io/birthday-card-studio/chanyoung/
- 은성 누님: https://pollmap.github.io/birthday-card-studio/eunseong/

## 구성

화학 실험실(치이카와·하치와레), 황금 파티(치이카와·하치와레·우사기), 딸기 케이크 파티(치이카와·우사기), 우사기 단독 파티. 서명 없음. 모든 그림은 이미지 생성 도구로 제작한 비공식 팬 일러스트이며 공식 원본 이미지가 아님.

각 페이지의 index.html에 문구, og.html에 공유 이미지 레이아웃이 있다. editions/premium.css와 premium.js가 공통 레이아웃과 효과를 담당한다. 이미지 파일은 chem-cute.webp, gold-cute.webp, duo-v2.webp, usagi-v2.webp. 배포에 쓰는 썸네일은 각 폴더의 og-v2.png(1200×630)다.

이미지 제작은 내장 imagegen 생성 모드로 진행했다. 공통 프롬프트 방향: 세로 2:3, 치이카와 캐릭터의 갈색 선과 평면 파스텔 색, 상단 문구 여백, 중앙 생일 케이크, 텍스트 없는 일러스트. 실험실은 보안경·실험복·유리 플라스크, 황금 파티는 왕관·비트코인·선물용 작은 빌딩, 다른 두 장은 딸기 케이크·선물·폭죽으로 구성했다. 원본은 Codex generated_images에 보존하고 웹용 WebP만 이 폴더에 복사했다.

## 동작

버튼으로 장면 전환과 축포를 시작한다. 완료 후 2.6초 간격으로 작은 축포가 이어진다. 버튼을 제외한 화면을 누르면 해당 위치에서 추가 폭죽이 퍼진다. 배경 탭에서는 효과와 소리를 멈춘다. 동작 줄이기 설정에서는 반복 애니메이션과 폭죽을 끈다. 소리는 기본 꺼짐이며 켜기 버튼을 눌러야 재생된다.

## 검증 범위

JavaScript 문법 검사, 4종 메타데이터와 이미지 크기 검사. Chromium 모바일 화면 390×844, 375×667, 320×568 및 가로 844×390에서 레이아웃을 확인했다. 320×568에서는 세로 스크롤이 가능하며 가로 넘침이 없다. 실제 iPhone Safari 기기 검증은 수행하지 않았다. 메신저의 기존 미리보기 캐시 갱신은 메신저 서비스에 따라 달라질 수 있다.

기존 선업·소정 카드와 스튜디오 기존 기능은 수정하지 않는다.
