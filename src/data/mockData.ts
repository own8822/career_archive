import { Student, User, AccessLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin',
    name: '관리자',
    role: 'admin',
    email: 'admin@career.archive',
  },
  {
    id: 'u-viewer',
    name: '팀원',
    role: 'viewer',
    email: 'viewer@career.archive',
  }
];

export const INITIAL_ACCESS_LOGS: AccessLog[] = [
  {
    id: 'log-1',
    userId: 'u-admin',
    userName: '관리자',
    role: 'admin',
    action: 'login',
    timestamp: '2026-10-21 09:00:00',
    ipAddress: '192.168.1.100',
    targetInfo: '관리자 시스템 로그인'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    name: '김민준',
    cohort: '7기',
    createdAt: '2026-09-01',
    records: [
      {
        id: 'rec-1-2',
        studentId: 'std-1',
        date: '2026-10-18',
        title: '현대해상 자기소개서 첨삭',
        content: `[현대해상 IT 직무 자기소개서 피드백]
- 1번 지원동기:
보험 도메인의 안정성과 디지털 혁신에 대한 관심도가 잘 드러났습니다. 다만 금융 IT 환경에서 가장 중요한 '트랜잭션 무결성'과 '보안 인식'을 경험과 연결지어 2~3줄 보강하면 완성도가 훨씬 높아집니다.

- 2번 직무 역량:
Redis 캐싱 도입으로 응답 시간을 단축한 사례가 좋습니다. 단순한 수치 나열보다는 도입 과정에서 겪은 캐시 무효화(Cache Invalidation) 고민을 간략히 덧붙여주세요.

- 3번 협업 및 갈등 해결:
일정 지연 상황에서 Swagger 문서 자동화로 팀원들과 싱크를 맞춘 일화가 매우 적절합니다. 본인의 주도적 액션을 강조하세요.`,
        pdf: {
          id: 'pdf-1-2',
          title: '김민준_현대해상_자소서_첨삭본.pdf',
          fileName: '김민준_현대해상_자소서_첨삭본.pdf',
          fileSize: '1.8 MB',
          uploadedAt: '2026-10-18',
          previewText: '1. 지원동기 및 포부 (첨삭 메모: 금융 도메인 이해도 강조 완료)\n2. 직무 전문성 (첨삭 메모: 캐시 무효화 트러블슈팅 문단 추가 권장)\n3. 협업 갈등 극복 사례 (Good!)'
        }
      },
      {
        id: 'rec-1-1',
        studentId: 'std-1',
        date: '2026-09-15',
        title: '기본 기술이력서 피드백',
        content: `프로젝트 성과를 단순 나열하지 않고 STAR 기법으로 수정하도록 지도함.
- 주요 사용 기술의 선택 이유를 명확히 작성할 것.
- GitHub 리포지토리 README 최신화 및 데모 링크 연결 확인.`
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
        pdf: {
          id: 'pdf-2-1',
          title: '이서연_포트폴리오_슬라이드_피드백.pdf',
          fileName: '이서연_포트폴리오_슬라이드_피드백.pdf',
          fileSize: '3.5 MB',
          uploadedAt: '2026-10-15',
          previewText: 'Page 1: 케이스 스터디 목차 구조 개선\nPage 3: 사용자 인터뷰 페르소나 그래프 위치 수정\nPage 7: 디자인 시스템 컴포넌트 명세 추가'
        }
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
- 타이틀: "웹 경험의 렌더링 병목을 없애는 프론트엔드 개발자"로 정돈.
- Lighthouse 성능 지표 62점 -> 94점 개선 수치 헤드라인 배치.
- 가상 스크롤(Virtual Scroll) 직접 구현 경험을 핵심 강점으로 부각하도록 피드백했습니다.`,
        pdf: {
          id: 'pdf-3-1',
          title: '박도현_기술이력서_피드백_v2.pdf',
          fileName: '박도현_기술이력서_피드백_v2.pdf',
          fileSize: '1.2 MB',
          uploadedAt: '2026-10-12',
          previewText: 'Page 1: 헤드라인 카피 및 핵심 역량 요약\nPage 2: 프로젝트 성능 개선 지표 붉은펜 교정'
        }
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
- 10월 3주차까지 지원 포트폴리오(PRD 형태) 1종 완성 후 2차 첨삭 진행하기로 협의.`
      }
    ]
  }
];
