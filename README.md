# 한국 여행지 월드컵 100

최신 `2025~2026 한국관광 100선`을 후보 풀로 삼은 1:1 토너먼트 게임입니다. 게임을 시작하면 100곳 중 64곳을 무작위로 선발해 결승까지 진행합니다.

## 실행

```powershell
cd outputs\korea-travel-worldcup
node server.js 4175
```

브라우저에서 `http://localhost:4175/`를 엽니다. 단일 이미지 검수 화면은 `http://localhost:4175/image-review.html?batch=travel-100`입니다.

## 구성

- `data/places.json`: 지역, 여행 테마, 대표 추천 계절, 대략적 위도·경도, 소개를 포함한 후보 100곳
- `data/game-stats.json`: 완료 게임 수와 후보별 우승 횟수
- `images/places`: 생성한 장소별 실사풍 AI 이미지
- `images/places/image-generation-manifest.json`: 이미지 파일, 검수 상태, 생성 도구 기록
- `images/hidden/dokdo.png`: 독도 히든 아이템용 AI 생성 이미지
- `app.js`: 후보 무작위 선발, 토너먼트, 우승 통계와 후보 검색
- `server.js`: 정적 파일과 통계 API

## 후보 선정 기준

후보 100곳은 문화체육관광부와 한국관광공사가 발표한 `2025~2026 한국관광 100선`을 그대로 사용했습니다. 이 목록은 SNS 검색량 등을 포함한 빅데이터 분석과 관광 분야 전문가의 서면·현장 평가를 거쳐 선정됩니다.

- [문화체육관광부 2025~2026 한국관광 100선 발표](https://www.mcst.go.kr/kor/s_notice/press/pressView.jsp?pCurrentPage=1&pMenuCD=0302000000&pSearchType=01&pSearchWord=&pSeq=21611&pTypeDept=)
- [대한민국 구석구석 한국관광 100선](https://korean.visitkorea.or.kr/other/otherService.do?otdid=622bcd99-84fa-11e8-8165-020027310001)

## 이미지 정책

후보별 이미지는 OpenAI의 ChatGPT 이미지 생성 도구(ChatGPT Images)로 새로 생성합니다. 외부 여행 사진, 관광지 공식 사진, 기업 로고와 특정 사업체의 간판을 사용하지 않습니다. 생성 결과는 하나의 검수 페이지에서 확인한 뒤 승인된 이미지만 후보 데이터에 연결합니다. 현재 100개 후보 이미지가 모두 검수 승인되어 게임과 관광지도에 적용되어 있습니다.

## 히든 여행지: 독도

독도는 100개 후보나 관광지도 점에는 포함하지 않습니다. `울릉도`가 게임 우승자가 되면 결과 화면에 `숨겨진 비경: 독도` 버튼이 항상 나타나며, 다른 우승 결과에서는 게임별로 10% 확률로 발견됩니다. 독도 이미지는 OpenAI의 ChatGPT Images로 생성한 AI 이미지입니다.

## 관광지도 100

`관광지도` 메뉴는 후보별 위도·경도를 바탕으로 대한민국 지도 위에 위치를 표시합니다. 점의 색은 시·도별로 구분되며, 점을 가리키거나 선택하면 사진 미리보기, 장소명, 여행 테마, 추천 계절을 확인할 수 있습니다. 제주도와 울릉도·독도는 별도 지도 영역으로 표시됩니다.

시·도별 면색과 지역명을 지도에 표시하며, `서울특별시`와 `부산광역시` 라벨을 누르면 각 도시 후보를 넓게 볼 수 있는 확대 지도가 열립니다. 울릉도와 독도는 지도에 지명만 표시하고, 독도는 관광지 후보 핀으로 등록하지 않습니다.

지도 바탕은 통계청 SGIS 공개 데이터를 바탕으로 만든 [`statgarten/maps`](https://github.com/statgarten/maps)의 단순 행정경계 SVG를 사용했습니다. (MIT License)
