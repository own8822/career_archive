-- ============================================================
-- 취업지원 아카이브 (Career Archive) Supabase DB 스키마 쿼리문
-- Supabase 대시보드 -> SQL Editor 에서 아래 전체를 복사-붙여넣고 [RUN]을 누르면 즉시 세팅됩니다.
-- ============================================================

-- 1. 학생 테이블 (students)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cohort TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. 상담·첨삭 기록 테이블 (records)
CREATE TABLE IF NOT EXISTS public.records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    pdfs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. 접속 코드 관리 테이블 (auth_settings)
CREATE TABLE IF NOT EXISTS public.auth_settings (
    id TEXT PRIMARY KEY DEFAULT 'global_auth',
    admin_code TEXT NOT NULL DEFAULT 'admin123123',
    viewer_codes JSONB NOT NULL DEFAULT '["viewer01","viewer02","viewer03","viewer04","viewer05","viewer06","viewer07","viewer08","viewer09","viewer10"]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 기본 관리자/열람자 코드 시드 삽입
INSERT INTO public.auth_settings (id, admin_code, viewer_codes)
VALUES (
    'global_auth',
    'admin123123',
    '["viewer01","viewer02","viewer03","viewer04","viewer05","viewer06","viewer07","viewer08","viewer09","viewer10"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. RLS (Row Level Security) 활성화 및 접근 정책 설정
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_settings ENABLE ROW LEVEL SECURITY;

-- 익명 사용자(anon) 전체 접근 허용 정책 (접속 코드로 프론트엔드에서 제어)
CREATE POLICY "Allow anon all on students" ON public.students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on records" ON public.records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow anon all on auth_settings" ON public.auth_settings FOR ALL USING (true) WITH CHECK (true);

-- 5. PDF 파일 저장을 위한 Storage 버킷 생성
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-archive-pdfs', 'career-archive-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage 파일 접근 정책 (모든 사용자 읽기/쓰기 허용)
CREATE POLICY "Allow public read on career-archive-pdfs" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'career-archive-pdfs');

CREATE POLICY "Allow public upload on career-archive-pdfs" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'career-archive-pdfs');

CREATE POLICY "Allow public update on career-archive-pdfs" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'career-archive-pdfs');

CREATE POLICY "Allow public delete on career-archive-pdfs" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'career-archive-pdfs');
