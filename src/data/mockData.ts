import { Student } from '../types';
import { generateMockThumbnailUrl } from '../utils/pdfThumbnail';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    name: '김민준',
    cohort: '7기',
    createdAt: '2026-09-01',
    records: [
      {
        id: 'rec-1-1',
        studentId: 'std-1',
        date: '2026-10-18',
        title: '현대해상 자기소개서 첨삭',
        content: `[현대해상 IT 직무 자기소개서 피드백]
- 지원동기:
보험 도메인의 안정성과 디지털 혁신에 대한 관심도가 잘 드러났습니다. 다만 금융 IT 환경에서 가장 중요한 '트랜잭션 무결성'과 '보안 인식'을 경험과 연결지어 2~3줄 보강하면 완성도가 훨씬 높아집니다.

- 직무 역량:
Redis 캐싱 도입으로 응답 시간을 단축한 사례가 좋습니다. 단순 수치 나열보다는 캐시 무효화(Cache Invalidation) 고민 과정을 간략히 덧붙여주세요.

- 협업 갈등 해결:
Swagger 문서 자동화로 팀원들과 싱크를 맞춘 일화가 매우 적절합니다. 본인의 주도적 액션을 강조하세요.`,
        pdfs: [
          {
            id: 'pdf-1-1',
            fileName: '김민준_현대해상_자소서_첨삭.pdf',
            fileSize: '1.8 MB',
            uploadedAt: '2026-10-18',
            dataUrl: '',
            thumbnailUrl: generateMockThumbnailUrl('김민준_현대해상_자소서_첨삭.pdf', '지원동기 및 직무역량 문단 보강')
          }
        ]
      },
      {
        id: 'rec-1-2',
        studentId: 'std-1',
        date: '2026-09-25',
        title: '기술 이력서 초안 피드백',
        content: `프로젝트 경험을 단순 기술 나열식에서 STAR 기법으로 전면 재배치했습니다.
- 백엔드 성능 최적화 파트에서 DB 인덱스 튜닝 경험을 상단으로 이동.
- 모니터링 툴(Prometheus/Grafana) 활용 경험 1줄 보강 안내.`,
        pdfs: []
      }
    ]
  },
  {
    id: 'std-2',
    name: '이서연',
    cohort: '7기',
    createdAt: '2026-09-05',
    records: [
      {
        id: 'rec-2-1',
        studentId: 'std-2',
        date: '2026-10-15',
        title: '포트폴리오 피드백',
        content: `[UI/UX 포트폴리오 케이스 스터디 점검]
화면 결과물 위주에서 벗어나 문제 정의와 사용자 인터뷰(8명) 데이터를 전면에 배치하도록 전면 수정했습니다.
- A/B 테스트 가설 설정: '검색 필터 UI 개선을 통한 필터 사용률 25% 상승' 명시.
- 피그마 디자인 시스템 컴포넌트 재사용으로 작업 효율을 40% 단축한 사례를 강조하도록 가이드했습니다.`,
        pdfs: [
          {
            id: 'pdf-2-1',
            fileName: '이서연_포트폴리오_슬라이드_피드백.pdf',
            fileSize: '3.5 MB',
            uploadedAt: '2026-10-15',
            dataUrl: '',
            thumbnailUrl: generateMockThumbnailUrl('이서연_포트폴리오_슬라이드_피드백.pdf', '케이스 스터디 문제 정의 및 A/B 테스트')
          }
        ]
      },
      {
        id: 'rec-2-2',
        studentId: 'std-2',
        date: '2026-09-20',
        title: '이력서 자기소개서 초안 교정',
        content: `디자이너로서의 문제 해결 관점과 협업 커뮤니케이션 역량을 두괄식으로 정돈. 감성적인 서술보다는 프로덕트 지표(전환율, 체류시간)를 개선한 구체적 근거를 추가하도록 코칭함.`,
        pdfs: []
      }
    ]
  },
  {
    id: 'std-3',
    name: '박도현',
    cohort: '8기',
    createdAt: '2026-09-20',
    records: [
      {
        id: 'rec-3-1',
        studentId: 'std-3',
        date: '2026-10-12',
        title: '기술이력서 첨삭',
        content: `[프론트엔드 이력서 정밀 첨삭]
- 헤드라인 타이틀: "웹 경험의 렌더링 병목을 없애는 프론트엔드 개발자"로 정돈.
- Lighthouse 성능 지표 62점 -> 94점 개선 수치 헤드라인 배치.
- 가상 스크롤(Virtual Scroll) 직접 구현 경험을 핵심 강점으로 부각하도록 피드백했습니다.`,
        pdfs: [
          {
            id: 'pdf-3-1',
            fileName: '박도현_기술이력서_피드백_v2.pdf',
            fileSize: '1.2 MB',
            uploadedAt: '2026-10-12',
            dataUrl: '',
            thumbnailUrl: generateMockThumbnailUrl('박도현_기술이력서_피드백_v2.pdf', '가상 스크롤 성능 개선 지표 강조')
          }
        ]
      },
      {
        id: 'rec-3-2',
        studentId: 'std-3',
        date: '2026-09-28',
        title: '1차 기술면접 대비 코칭',
        content: `React 리렌더링 원리(Fiber 아키텍처, useMemo/useCallback 사용 기준)와 브라우저 렌더링 파이프라인(CRP) 질문에 대해 두괄식으로 답변하는 연습을 집중 진행함.`,
        pdfs: []
      }
    ]
  },
  {
    id: 'std-4',
    name: '최수아',
    cohort: '8기',
    createdAt: '2026-10-01',
    records: [
      {
        id: 'rec-4-1',
        studentId: 'std-4',
        date: '2026-10-10',
        title: '취업 방향 상담',
        content: `[하반기 지원 전략 및 일정 수립]
- 서비스 기획(PM) 포지션과 데이터 분석가 포지션 중 본인의 강점인 SQL 쿼리 작성 역량을 살릴 수 있는 데이터 기반 PM으로 타겟팅 확정.
- 10월 3주차까지 지원 포트폴리오(PRD 형태) 1종 완성 후 2차 첨삭 진행하기로 협의.`,
        pdfs: [
          {
            id: 'pdf-4-1',
            fileName: '최수아_신입PM_취업로드맵_계획서.pdf',
            fileSize: '0.9 MB',
            uploadedAt: '2026-10-10',
            dataUrl: '',
            thumbnailUrl: generateMockThumbnailUrl('최수아_신입PM_취업로드맵_계획서.pdf', '데이터 기반 PM 포트폴리오 로드맵')
          }
        ]
      }
    ]
  },
  {
    id: 'std-5',
    name: '한지은',
    cohort: '8기',
    createdAt: '2026-10-05',
    records: [
      {
        id: 'rec-5-1',
        studentId: 'std-5',
        date: '2026-10-16',
        title: '신입 개발자 첫 이력서 상담',
        content: `비전공 전환 후 첫 이력서 작성 가이드.
- 본인의 강점인 빠른 학습 속도와 꼼꼼한 코드 리뷰 경험을 부각하도록 조언.
- 팀 프로젝트 내에서 담당했던 기능 단위(인증/인가, JWT 로그인)를 명확히 작성할 것을 권장함.`,
        pdfs: []
      }
    ]
  }
];
