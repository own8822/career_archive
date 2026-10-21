import { Student, User, AccessLog } from '../types';

export const INITIAL_USERS: User[] = [
  {
    id: 'u-admin-1',
    name: '김선임 컨설턴트',
    role: 'admin',
    email: 'consultant1@career.edu',
    department: '취업지원처 컨설팅팀',
  },
  {
    id: 'u-viewer-1',
    name: '이운영 매니저',
    role: 'viewer',
    email: 'manager1@career.edu',
    department: '학사운영팀',
  },
  {
    id: 'u-admin-2',
    name: '박수석 멘토',
    role: 'admin',
    email: 'mentor1@career.edu',
    department: '취업지원처 기술멘토링팀',
  }
];

export const INITIAL_ACCESS_LOGS: AccessLog[] = [
  {
    id: 'log-1',
    userId: 'u-admin-1',
    userName: '김선임 컨설턴트',
    role: 'admin',
    action: 'login',
    timestamp: '2026-10-21 09:12:44',
    ipAddress: '192.168.1.105',
    targetInfo: '시스템 로그인 완료'
  },
  {
    id: 'log-2',
    userId: 'u-admin-1',
    userName: '김선임 컨설턴트',
    role: 'admin',
    action: 'create_record',
    timestamp: '2026-10-21 10:30:15',
    ipAddress: '192.168.1.105',
    targetInfo: '김민준 학생 3회차 상담 기록 추가'
  },
  {
    id: 'log-3',
    userId: 'u-viewer-1',
    userName: '이운영 매니저',
    role: 'viewer',
    action: 'login',
    timestamp: '2026-10-21 11:05:02',
    ipAddress: '192.168.1.112',
    targetInfo: '시스템 로그인 완료'
  },
  {
    id: 'log-4',
    userId: 'u-viewer-1',
    userName: '이운영 매니저',
    role: 'viewer',
    action: 'view_student',
    timestamp: '2026-10-21 11:06:20',
    ipAddress: '192.168.1.112',
    targetInfo: '이서연 학생 프로필 및 첨삭 이력 열람'
  },
  {
    id: 'log-5',
    userId: 'u-admin-2',
    userName: '박수석 멘토',
    role: 'admin',
    action: 'view_pdf',
    timestamp: '2026-10-21 13:45:10',
    ipAddress: '192.168.1.98',
    targetInfo: '박도현 학생 [2026_프론트엔드_이력서_첨삭본.pdf] 열람'
  }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'std-1',
    name: '김민준',
    cohort: '7기',
    major: '컴퓨터공학과',
    targetRole: '백엔드 개발자',
    targetCompanies: ['토스', '네이버', '카카오페이'],
    status: '면접전형',
    notes: '대용량 트래픽 프로젝트 경험 풍부, 인성 면접 답변 구체화 필요',
    avatarColor: 'bg-blue-600',
    createdAt: '2026-08-10',
    updatedAt: '2026-10-18',
    records: [
      {
        id: 'rec-1-1',
        studentId: 'std-1',
        date: '2026-08-18',
        counselorName: '김선임 컨설턴트',
        type: 'resume',
        title: '1차 자기소개서 및 기술이력서 피드백',
        summary: '프로젝트 경험의 성과 수치화 및 STAR 기법 기반 문장 재배치 지도',
        content: `[상담 상세 피드백]
1. 문제점 파악:
기존 이력서에서는 'Spring Boot와 Redis를 활용하여 캐싱을 구현함'과 같이 단순 기술 스택 나열에 머물러 있었습니다. 면접관 입장에서 실질적으로 시스템 성능이 얼마나 개선되었는지 판단하기 어렵습니다.

2. 수정 가이드라인 제시:
- STAR 기법을 엄격히 적용할 것.
- Redis 캐싱 도입 전/후 응답속도 비교 지표(예: TPS 150 -> 650 향상, 평균 레이턴시 380ms -> 45ms 단축)를 명시하도록 코칭.
- 분산 트랜잭션 처리 중 발생했던 사가 패턴(Saga Pattern) 적용 이유와 한계점을 회고 내용으로 2문장 이내 보강.

3. 문항별 피드백 요약:
- 지원동기: 지원 기업의 금융 결제 아키텍처에 대한 이해도 강조 좋음.
- 실패 경험: DB 데드락 이슈 트러블슈팅 사례를 더 간결하고 결론 중심으로 두괄식 전개할 것.`,
        tags: ['자소서', 'STAR기법', 'Redis성능지표', '두괄식'],
        actionItem: '수치화된 성능 개선 지표 3곳 보강 후 2차 첨삭 요청',
        pdfReview: {
          id: 'pdf-1-1',
          title: '김민준_백엔드_자기소개서_1차첨삭.pdf',
          originalFileName: '김민준_이력서_초안_v1.2.pdf',
          fileSize: '1.8 MB',
          pageCount: 3,
          uploadedAt: '2026-08-18 16:30',
          summary: '1~3페이지 전반에 걸친 붉은펜 첨삭 및 구조 개선 메모 포함',
          annotations: [
            {
              id: 'ann-1',
              page: 1,
              type: 'improve',
              quote: '다양한 기술을 습득하여 웹 백엔드 시스템 구축에 기여했습니다.',
              comment: '문장이 너무 모호합니다. 어떤 비즈니스 문제를 해결했는지 핵심 키워드를 넣으세요.',
              author: '김선임 컨설턴트'
            },
            {
              id: 'ann-2',
              page: 2,
              type: 'praise',
              quote: 'Redis 캐싱 아키텍처 다이어그램 및 부하 테스트 그래프',
              comment: '시각적 도표 배치가 매우 훌륭합니다. 이 부분을 1페이지 상단으로 올려도 좋습니다.',
              author: '김선임 컨설턴트'
            },
            {
              id: 'ann-3',
              page: 3,
              type: 'grammar',
              quote: '성장할 수 있는 계기가 되었던 것 같습니다.',
              comment: '자신감 있는 어조로 수정: "계기가 되었습니다."',
              author: '김선임 컨설턴트'
            }
          ]
        }
      },
      {
        id: 'rec-1-2',
        studentId: 'std-1',
        date: '2026-09-12',
        counselorName: '박수석 멘토',
        type: 'interview',
        title: '토스 1차 기술 직무 모의면접 피드백',
        summary: '동시성 제어 및 인덱스 튜닝 질문에 대한 답변 구조화 코칭',
        content: `[모의면접 질의응답 분석]
Q1. 재고 차감 시스템에서 낙관적 락(Optimistic Lock)과 비관적 락(Pessimistic Lock)의 선택 기준은?
- 피드백: 개념 설명은 완벽하나 충돌 빈도가 높을 때 롤백 비용이 증가한다는 점을 실제 프로젝트 상황과 연결짓지 못함. "제가 진행한 선착순 쿠폰 발급 프로젝트에서는..." 형식으로 경험을 즉시 인용할 것을 권장.

Q2. MySQL B+Tree 인덱스의 동작 원리와 복합 인덱스 컬럼 순서 설정 기준?
- 피드백: 카디널리티(Cardinality)가 높은 컬럼을 우선 배치해야 하는 이유를 잘 설명함. 다만 커버링 인덱스(Covering Index) 활용 사례를 덧붙이면 플러스 요인이 될 것임.

[총평]
자신감 있는 목소리와 명확한 딕션이 장점. 모르는 질문이 나왔을 때 무리하게 추측하기보다 "해당 부분은 깊이 파악하지 못했으나, ~한 관점에서 접근할 수 있을 것 같습니다"로 유연하게 방어하는 연습 필요.`,
        tags: ['모의면접', '동시성제어', 'MySQL인덱스', '답변구조화'],
        actionItem: '트랜잭션 격리수준(Isolation Level) 정리 노트 작성 및 모의면접 녹음 파일 복습'
      },
      {
        id: 'rec-1-3',
        studentId: 'std-1',
        date: '2026-10-15',
        counselorName: '김선임 컨설턴트',
        type: 'interview',
        title: '네이버 최종 임원면접 대비 코칭',
        summary: '직무 가치관 및 협업 갈등 해결 에피소드 정교화',
        content: `[임원 면접 집중 지도]
- 본인만의 개발 철학 정립: "비즈니스의 안정성과 동료 개발자의 생산성을 동시에 높이는 코드"를 메인 테마로 선정.
- 갈등 관리 질문: 프론트엔드 팀과의 API 스펙 합의 지연 이슈에서 Swagger 문서 자동화와 정기 싱크 미팅을 통해 주도적으로 해결했던 에피소드로 일원화.
- 마지막 역질문 준비: "네이버 페이 정산 플랫폼이 글로벌 확장 시 겪고 계신 가장 큰 아키텍처적 도전과제는 무엇인가요?" 추천.`,
        tags: ['임원면접', '컬처핏', '협업갈등해결', '역질문'],
        actionItem: '1분 자기소개 영상 촬영 후 공유'
      }
    ]
  },
  {
    id: 'std-2',
    name: '이서연',
    cohort: '7기',
    major: '시각디자인학전공',
    targetRole: 'UI/UX 디자이너',
    targetCompanies: ['당근', '무신사', '토스'],
    status: '서류전형',
    notes: '비주얼 감각 탁월하나 문제 정의와 유저 리서치 데이터 연결이 다소 부족',
    avatarColor: 'bg-emerald-600',
    createdAt: '2026-08-15',
    updatedAt: '2026-10-14',
    records: [
      {
        id: 'rec-2-1',
        studentId: 'std-2',
        date: '2026-08-25',
        counselorName: '김선임 컨설턴트',
        type: 'portfolio',
        title: '포트폴리오 케이스 스터디 구조 개편',
        summary: '문제 정의 - 가설 수립 - 사용자 조사 - 솔루션 - 성과 지표의 5단계 흐름 정립',
        content: `[포트폴리오 구조 개편안]
1. 현 상태 진단:
화면 결과물(GUI) 위주로 구성되어 있어, 어떤 문제의식에서 해당 인터페이스가 도출되었는지 근거가 약함. 당근/토스 등 데이터 드리븐 프로덕트 디자인을 지향하는 기업에서는 감점 요인이 될 수 있음.

2. 개선안:
- 프로젝트 1: '반려동물 산책 커뮤니티' -> 유저 인터뷰 8명 진행 결과(Pain point 3가지 도출 과정)를 인포그래픽으로 전면에 배치.
- A/B 테스트 가설 설정: '검색 필터 위치 변경을 통해 필터 사용률 25% 상승 목표' 명시.
- 디자인 시스템: 컬러 팔레트와 폰트만 나열하지 말고, 컴포넌트 재사용으로 작업 효율을 40% 단축한 사례 강조.`,
        tags: ['포트폴리오', 'UIUX', '케이스스터디', '디자인시스템'],
        actionItem: 'Notion/Figma 포트폴리오 첫 번째 메인 프로젝트 슬라이드 전면 리뉴얼',
        pdfReview: {
          id: 'pdf-2-1',
          title: '이서연_UIUX_포트폴리오_슬라이드_첨삭.pdf',
          originalFileName: 'Lee_Seoyeon_Portfolio_2026_Draft.pdf',
          fileSize: '4.2 MB',
          pageCount: 12,
          uploadedAt: '2026-08-25 14:10',
          summary: '케이스 스터디 플로우 및 레이아웃 그리드 첨삭 메모 8건',
          annotations: [
            {
              id: 'ann-2-1',
              page: 2,
              type: 'improve',
              quote: '예쁜 디자인을 위해 미니멀한 라인 아이콘을 채택했습니다.',
              comment: '디자인의 심미성뿐만 아니라 고령층 사용자의 인지 용이성 관점의 근거를 보강하세요.',
              author: '김선임 컨설턴트'
            },
            {
              id: 'ann-2-2',
              page: 5,
              type: 'praise',
              quote: 'Figma Auto-layout 컴포넌트 라이브러리 구조도',
              comment: '실무 디자이너들이 매우 선호하는 체계적인 컴포넌트 설계입니다. 적극 어필하세요!',
              author: '김선임 컨설턴트'
            }
          ]
        }
      },
      {
        id: 'rec-2-2',
        studentId: 'std-2',
        date: '2026-10-10',
        counselorName: '김선임 컨설턴트',
        type: 'resume',
        title: '당근 프로덕트 디자이너 채용 지원서 첨삭',
        summary: '사용자 중심 사고와 프로덕트 비즈니스 임팩트 어필 집중',
        content: `[당근 자소서 항목별 피드백]
- 1번 문항 (지원동기): 동네 기반 하이퍼로컬 서비스에 대한 개인적 경험을 녹여 진정성 있음.
- 2번 문항 (가장 몰입했던 디자인 경험): 와이어프레임 수정 단계에서 사용자 피드백을 반영해 3차례 피벗했던 과정 묘사가 훌륭함.
- 주의사항: 전문 용어(Figma, ProtoPie 등) 위주보다는 실제 서비스 지표에 미친 영향을 강조할 것.`,
        tags: ['당근지원', '자기소개서', '프로덕트디자인'],
        actionItem: '당근 채용 사이트 지원서 최종 제출'
      }
    ]
  },
  {
    id: 'std-3',
    name: '박도현',
    cohort: '8기',
    major: '전자공학과 (비전공 전환)',
    targetRole: '프론트엔드 개발자',
    targetCompanies: ['카카오', '쿠팡', '우아한형제들'],
    status: '준비중',
    notes: '웹 접근성 및 성능 최적화에 높은 관심, 첫 구직 활동이라 프로세스 가이드 필요',
    avatarColor: 'bg-indigo-600',
    createdAt: '2026-09-01',
    updatedAt: '2026-10-19',
    records: [
      {
        id: 'rec-3-1',
        studentId: 'std-3',
        date: '2026-09-05',
        counselorName: '김선임 컨설턴트',
        type: 'career',
        title: '신입 프론트엔드 취업 로드맵 수립 상담',
        summary: '목표 기업별 채용 프로세스 분석 및 하반기 공채/수시 타임라인 확정',
        content: `[취업 로드맵 컨설팅]
1. 채용 시장 현황:
프론트엔드 주니어 시장의 진입장벽이 높아짐에 따라, 단순 CRUD 구현 프로젝트는 차별점이 없음.
따라서 본인의 강점인 '웹 렌더링 최적화(Lighthouse 점수 개선, Virtualization)'와 'TypeScript 타입 안정성'을 코어 무기로 삼기로 결정.

2. 9~11월 액션 플랜:
- 9월 1~2주: 메인 프로젝트 번들 사이즈 최적화 (Code Splitting, Tree Shaking) 및 성능 리포트 작성
- 9월 3~4주: 1차 이력서 완성 및 멘토 피드백
- 10월: 수시채용 지원 시작 (매주 3곳 이상), 코딩테스트 병행
- 11월: 직무 면접 집중 대비`,
        tags: ['취업로드맵', '프론트엔드', '성능최적화', '타임라인'],
        actionItem: 'Lighthouse 성능 측정 전후 비교 문서 작성'
      },
      {
        id: 'rec-3-2',
        studentId: 'std-3',
        date: '2026-10-12',
        counselorName: '박수석 멘토',
        type: 'resume',
        title: '2026 하반기 기술 이력서 정밀 첨삭',
        summary: 'React 렌더링 원리 이해 및 커스텀 훅 추상화 경험 강조',
        content: `[이력서 세부 첨삭]
- 제목 타이틀: "화면을 그리는 것을 넘어 웹 경험의 병목을 없애는 프론트엔드 개발자 박도현입니다" -> 전달력 우수함.
- 프로젝트 설명 보완점:
  1) 가상 스크롤(Virtual Scroll) 라이브러리를 직접 구현한 동기와 DOM 노드 수를 1,000개에서 20개로 유지시켜 메모리 누수를 해결한 과정 상세 기술 요청.
  2) React Query(TanStack Query)를 활용한 캐싱 정책(staleTime, cacheTime) 설정 이유 보강.
- GitHub 링크 관리: README에 데모 gif, 아키텍처 다이어그램, 트러블슈팅 로그 필수 배치 확인 완료.`,
        tags: ['기술이력서', 'React최적화', 'VirtualScroll', '포트폴리오링크'],
        actionItem: '이력서 내 GitHub 프로젝트 README 최신화 완료 후 링크 검증',
        pdfReview: {
          id: 'pdf-3-1',
          title: '박도현_프론트엔드_기술이력서_피드백_v2.pdf',
          originalFileName: 'DoHyun_Park_FE_Resume_v2.pdf',
          fileSize: '2.1 MB',
          pageCount: 2,
          uploadedAt: '2026-10-12 17:00',
          summary: '주요 경력기술서 및 프로젝트 기술 스택 설명 주석 5건',
          annotations: [
            {
              id: 'ann-3-1',
              page: 1,
              type: 'praise',
              quote: 'Lighthouse Performance Score 62점 -> 94점 개선 (FCP 2.4s -> 0.8s)',
              comment: '수치 명시가 매우 훌륭합니다. 채용담당자 시선을 사로잡는 강력한 헤드라인입니다.',
              author: '박수석 멘토'
            },
            {
              id: 'ann-3-2',
              page: 2,
              type: 'improve',
              quote: 'TypeScript, Next.js, Redux, Zustand, Recoil, TailwindCSS...',
              comment: '기술 스택을 무조건 많이 나열하면 깊이가 얕아 보입니다. 핵심 주력 스택 4~5개에 집중하세요.',
              author: '박수석 멘토'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'std-4',
    name: '최수아',
    cohort: '8기',
    major: '경영학부',
    targetRole: '서비스 기획 (PM/PO)',
    targetCompanies: ['우아한형제들', '야놀자', '토스'],
    status: '서류전형',
    notes: '비즈니스 모델 분석력 및 커뮤니케이션 능력 우수, 데이터 분석 툴(SQL, GA4) 자격증 보유',
    avatarColor: 'bg-purple-600',
    createdAt: '2026-09-10',
    updatedAt: '2026-10-17',
    records: [
      {
        id: 'rec-4-1',
        studentId: 'std-4',
        date: '2026-09-20',
        counselorName: '김선임 컨설턴트',
        type: 'resume',
        title: '신입 PM 역량기술서 및 포트폴리오 첨삭',
        summary: '문제 해결 프레임워크와 기능 명세서(PRD) 작성 역량 어필',
        content: `[PM 포트폴리오 집중 코칭]
기획 포트폴리오는 아이디어의 참신함보다 '시장 기회 포착 -> 유저 인터뷰 -> 지표 정의(KPI/OKR) -> 프로덕트 요구사항 정의서(PRD) -> 개발팀/디자인팀 협업 조율 -> 출시 후 지표 분석'의 일련의 프로덕트 라이프사이클을 실제로 경험해 보았는지가 핵심 평가 기준입니다.

- 개선 포인트:
1. 배달의민족 클론 프로젝트에서 발생한 결제 이탈률을 줄이기 위한 '원클릭 간편결제 UX 제안서'를 PRD 형태로 재가공할 것.
2. SQL 쿼리를 활용해 코호트 리텐션(Cohort Retention)을 직접 집계했던 대시보드 캡처를 첨부하여 데이터 리터러시 강조.`,
        tags: ['PM기획', 'PRD', '데이터리터러시', 'SQL', '가설검증'],
        actionItem: 'PRD 문서 템플릿 정리 및 포트폴리오 링크 첨부',
        pdfReview: {
          id: 'pdf-4-1',
          title: '최수아_서비스기획_포트폴리오_PRD_첨삭.pdf',
          originalFileName: 'Sua_Choi_PM_Portfolio_2026.pdf',
          fileSize: '5.6 MB',
          pageCount: 15,
          uploadedAt: '2026-09-20 15:20',
          summary: '기획서 논리 전개 및 핵심 지표 설정 피드백 7건',
          annotations: [
            {
              id: 'ann-4-1',
              page: 3,
              type: 'improve',
              quote: '유저들이 불편해해서 버튼을 상단으로 이동시켰습니다.',
              comment: '불편함의 실체를 데이터로 증명해야 합니다. 히트맵(Heatmap) 클릭률 데이터나 이탈률 수치를 넣으세요.',
              author: '김선임 컨설턴트'
            },
            {
              id: 'ann-4-2',
              page: 8,
              type: 'praise',
              quote: 'SQL 코호트 분석 및 DAU/MAU 예측 모델링',
              comment: '주니어 PM 지원자 중 이 수준의 지표 분석을 담은 포트폴리오는 매우 드뭅니다. 최고 강점입니다.',
              author: '김선임 컨설턴트'
            }
          ]
        }
      }
    ]
  },
  {
    id: 'std-5',
    name: '정우진',
    cohort: '7기',
    major: '소프트웨어학과',
    targetRole: '데이터 엔지니어',
    targetCompanies: ['SK텔레콤', '뱅크샐러드', '쿠팡'],
    status: '최종합격',
    notes: '대용량 파이프라인(Kafka, Spark, Airflow) 구축 경험 보유. SKT 최종 합격 후 처우 협의 중',
    avatarColor: 'bg-teal-600',
    createdAt: '2026-07-20',
    updatedAt: '2026-10-20',
    records: [
      {
        id: 'rec-5-1',
        studentId: 'std-5',
        date: '2026-08-05',
        counselorName: '박수석 멘토',
        type: 'resume',
        title: '데이터 파이프라인 아키텍처 이력서 첨삭',
        summary: 'Kafka-Spark-S3-Snowflake 데이터 흐름도 및 ETL 장애 대응 경험 부각',
        content: `[데이터 엔지니어링 첨삭]
- 파이프라인의 처리량(Throughput) 명시: 일일 5,000만 건 이벤트 데이터 배치 및 스트리밍 처리 환경 명시.
- 멱등성(Idempotency)과 Exactly-Once 처리를 위해 적용한 Kafka 트랜잭션 프로듀서 설정과 Spark Checkpointing 전략을 상세 기술하도록 안내.
- 데이터 품질(Data Quality) 검증을 위한 Great Expectations 도입 사례 추가 권장.`,
        tags: ['데이터엔지니어', 'Kafka', 'Spark', 'Airflow', 'ETL'],
        actionItem: '아키텍처 다이어그램 고화질화 및 이력서 반영 완료'
      },
      {
        id: 'rec-5-2',
        studentId: 'std-5',
        date: '2026-09-28',
        counselorName: '박수석 멘토',
        type: 'interview',
        title: 'SK텔레콤 2차 직무 면접 최종 코칭',
        summary: '대용량 데이터 분산 처리 최적화 및 클라우드 인프라 비용 절감 질문 대비',
        content: `[최종 면접 피드백]
- 면접관들이 가장 감명받을 포인트: 데이터 처리량 증가 시 EMR 인스턴스 자동 스케일링(Auto-scaling)과 Spot Instance 활용으로 월 클라우드 비용 35% 절감한 경험.
- 팀플레이어로서의 태도 강조: 데이터 분석가들과의 협업 시 셀프서비스 쿼리 환경을 제공하기 위해 Trino(Presto) 환경을 구축한 점을 적극적으로 언급할 것.`,
        tags: ['최종면접', '인프라비용절감', 'SpotInstance', '합격대비'],
        actionItem: '면접 복기록 작성'
      },
      {
        id: 'rec-5-3',
        studentId: 'std-5',
        date: '2026-10-20',
        counselorName: '김선임 컨설턴트',
        type: 'career',
        title: 'SKT 최종 합격 및 오퍼 레터 협의 상담',
        summary: '입사일 조정 및 수습 평가 안내, 취업 성공 스토리 아카이브 등록 동의',
        content: `[최종 합격 및 후속 상담]
- SK텔레콤 데이터 플랫폼 직무 최종 합격 확인! (연봉 및 입사일자 11월 초 협의 완료)
- 후배들을 위한 취업 성공기 및 이력서/포트폴리오 샘플 아카이브 등록에 흔쾌히 동의함.
- 비결 요약: "단순 튜토리얼 수준을 벗어나 실제 실패와 장애 상황(OOM, 파이프라인 지연)을 재현하고 극복한 기록이 면접관들의 신뢰를 얻었음."`,
        tags: ['최종합격', '취업성공기', '오퍼협의'],
        actionItem: '후배 멘토링 특강 일정 조율'
      }
    ]
  },
  {
    id: 'std-6',
    name: '한지은',
    cohort: '8기',
    major: '정보통신공학과',
    targetRole: '풀스택 개발자',
    targetCompanies: ['라인', '당근', '샌드버드'],
    status: '준비중',
    notes: 'NestJS + Next.js 기반 사내 협업툴 제작 프로젝트 진행 중',
    avatarColor: 'bg-rose-600',
    createdAt: '2026-09-15',
    updatedAt: '2026-10-16',
    records: [
      {
        id: 'rec-6-1',
        studentId: 'std-6',
        date: '2026-10-02',
        counselorName: '김선임 컨설턴트',
        type: 'resume',
        title: '풀스택 포지션 이력서 초안 방향성 점검',
        summary: '프론트와 백엔드 양쪽 역량 균형 및 풀스택으로서의 강점 명확화',
        content: `[풀스택 이력서 점검]
풀스택 개발자는 "둘 다 조금씩 할 줄 안다"가 아닌 "비즈니스 요구사항을 프론트와 백엔드 전체 관점에서 통합적으로 파악하고 빠르게 제품을 배포할 수 있다"는 오너십(Ownership)을 보여주어야 합니다.

- 가이드라인:
1. 클라이언트(Next.js App Router)와 서버(NestJS) 간의 통신에서 tRPC나 Swagger 기반의 Type-safe API 연동 경험을 부각할 것.
2. Docker와 GitHub Actions를 활용한 CI/CD 무중단 배포(Blue/Green) 파이프라인 구축 과정을 이력서에 독립 섹션으로 분리.`,
        tags: ['풀스택', 'NestJS', 'Nextjs', 'CICD', '이력서초안'],
        actionItem: 'Type-safe API 통신 구현 상세 코드 스니펫 이력서에 추가',
        pdfReview: {
          id: 'pdf-6-1',
          title: '한지은_풀스택_개발자_이력서_1차_피드백.pdf',
          originalFileName: 'JiEun_Han_Fullstack_2026.pdf',
          fileSize: '1.5 MB',
          pageCount: 3,
          uploadedAt: '2026-10-02 16:45',
          summary: '아키텍처 및 CI/CD 설명 보완용 붉은펜 첨삭 4건',
          annotations: [
            {
              id: 'ann-6-1',
              page: 1,
              type: 'improve',
              quote: '풀스택으로 다양한 프로젝트를 혼자서 완수했습니다.',
              comment: '협업 경험이 없어 보일 수 있습니다. 오픈소스 기여나 코드 리뷰 경험을 함께 언급하세요.',
              author: '김선임 컨설턴트'
            },
            {
              id: 'ann-6-2',
              page: 2,
              type: 'praise',
              quote: 'Docker 컨테이너화 및 AWS ECS Fargate 무중단 배포 구성도',
              comment: '신입 레벨에서 인프라 배포까지 직접 파이프라인을 뚫은 점이 돋보입니다.',
              author: '김선임 컨설턴트'
            }
          ]
        }
      }
    ]
  }
];
