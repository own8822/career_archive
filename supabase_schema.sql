-- ============================================================
-- 취업지원 아카이브 (Career Archive) 보안 강화 Supabase SQL 스키마
-- 관리자/열람자/미인증 사용자 권한 통제 & 서버측 코드 검증 & 비공개 버킷
-- ============================================================

-- 0. pgcrypto 확장 활성화 (난수 생성 및 암호화)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. 학생 테이블 (students)
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    cohort TEXT NOT NULL,
    order_no TEXT,
    birth_year TEXT,
    phone TEXT,
    email TEXT,
    university TEXT,
    major1 TEXT,
    major2 TEXT,
    memo TEXT,
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
    viewer_codes JSONB NOT NULL DEFAULT '["ubion0112","ubion0212","ubion0312","ubion0412","ubion0512","ubion0612","ubion0712","ubion0812","ubion0912","ubion1012"]'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

INSERT INTO public.auth_settings (id, admin_code, viewer_codes)
VALUES (
    'global_auth',
    'admin123123',
    '["ubion0112","ubion0212","ubion0312","ubion0412","ubion0512","ubion0612","ubion0712","ubion0812","ubion0912","ubion1012"]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 4. 서버 세션 토큰 관리 테이블 (user_sessions)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    token TEXT PRIMARY KEY,
    role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_records_student_id ON public.records(student_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON public.user_sessions(token, expires_at);

-- 5. RLS (Row Level Security) 활성화
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리
DROP POLICY IF EXISTS "Allow anon all on students" ON public.students;
DROP POLICY IF EXISTS "Allow anon all on records" ON public.records;
DROP POLICY IF EXISTS "Allow anon all on auth_settings" ON public.auth_settings;
DROP POLICY IF EXISTS "Allow select for active sessions on students" ON public.students;
DROP POLICY IF EXISTS "Allow admin insert on students" ON public.students;
DROP POLICY IF EXISTS "Allow admin update on students" ON public.students;
DROP POLICY IF EXISTS "Allow admin delete on students" ON public.students;
DROP POLICY IF EXISTS "Allow select for active sessions on records" ON public.records;
DROP POLICY IF EXISTS "Allow admin insert on records" ON public.records;
DROP POLICY IF EXISTS "Allow admin update on records" ON public.records;
DROP POLICY IF EXISTS "Allow admin delete on records" ON public.records;

-- Helper 함수: HTTP 요청 헤더 'x-session-token'을 통한 유효 세션 역할 조회
CREATE OR REPLACE FUNCTION public.get_current_session_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role
  FROM public.user_sessions
  WHERE token = COALESCE(
    NULLIF(current_setting('request.headers', true), '')::jsonb->>'x-session-token',
    ''
  )
  AND expires_at > now()
  LIMIT 1;
$$;

-- RLS: students
-- (1) 조회: 승인된 세션(관리자 or 열람자)만 허용, 미인증(NULL)은 100% 차단
CREATE POLICY "Allow select for active sessions on students"
ON public.students FOR SELECT
USING (public.get_current_session_role() IN ('admin', 'viewer'));

-- (2) 추가/수정/삭제: 오직 관리자(admin) 세션만 허용 (열람자 및 미인증 차단)
CREATE POLICY "Allow admin insert on students"
ON public.students FOR INSERT
WITH CHECK (public.get_current_session_role() = 'admin');

CREATE POLICY "Allow admin update on students"
ON public.students FOR UPDATE
USING (public.get_current_session_role() = 'admin')
WITH CHECK (public.get_current_session_role() = 'admin');

CREATE POLICY "Allow admin delete on students"
ON public.students FOR DELETE
USING (public.get_current_session_role() = 'admin');

-- RLS: records
-- (1) 조회: 승인된 세션(관리자 or 열람자)만 허용
CREATE POLICY "Allow select for active sessions on records"
ON public.records FOR SELECT
USING (public.get_current_session_role() IN ('admin', 'viewer'));

-- (2) 추가/수정/삭제: 오직 관리자(admin) 세션만 허용
CREATE POLICY "Allow admin insert on records"
ON public.records FOR INSERT
WITH CHECK (public.get_current_session_role() = 'admin');

CREATE POLICY "Allow admin update on records"
ON public.records FOR UPDATE
USING (public.get_current_session_role() = 'admin')
WITH CHECK (public.get_current_session_role() = 'admin');

CREATE POLICY "Allow admin delete on records"
ON public.records FOR DELETE
USING (public.get_current_session_role() = 'admin');

-- RLS: auth_settings
-- REST API를 통한 직접 조회/수정 원천 차단 (비밀번호 목록이 브라우저로 절대 유출되지 않음)
REVOKE ALL ON public.auth_settings FROM anon, authenticated;
REVOKE ALL ON public.user_sessions FROM anon, authenticated;

-- 6. 보안 검증 RPC 함수 (서버 측 암호 확인 및 세션 발급)

-- [함수 1] 접속 코드 서버 검증 및 세션 토큰 발급 (비밀번호 원문 반환 안 함)
CREATE OR REPLACE FUNCTION public.authenticate_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_code TEXT;
    v_viewer_codes JSONB;
    v_role TEXT := NULL;
    v_token TEXT;
    v_clean_code TEXT;
BEGIN
    v_clean_code := TRIM(p_code);
    IF v_clean_code IS NULL OR v_clean_code = '' THEN
        RETURN jsonb_build_object('success', false, 'message', '접속 코드를 입력해주세요.');
    END IF;

    SELECT admin_code, viewer_codes INTO v_admin_code, v_viewer_codes
    FROM public.auth_settings
    WHERE id = 'global_auth'
    LIMIT 1;

    IF v_clean_code = v_admin_code THEN
        v_role := 'admin';
    ELSIF v_viewer_codes ? v_clean_code THEN
        v_role := 'viewer';
    ELSE
        RETURN jsonb_build_object('success', false, 'message', '접속 코드가 올바르지 않습니다.');
    END IF;

    -- 7일 유효한 암호학적 랜덤 64자리 세션 토큰 생성
    v_token := encode(gen_random_bytes(32), 'hex');
    INSERT INTO public.user_sessions (token, role, expires_at)
    VALUES (v_token, v_role, now() + interval '7 days');

    RETURN jsonb_build_object(
        'success', true,
        'role', v_role,
        'session_token', v_token
    );
END;
$$;

-- [함수 2] 관리자 전용: 접속 코드 조회 (오직 관리자 세션 토큰이 있을 때만 열람 가능)
CREATE OR REPLACE FUNCTION public.get_auth_codes_secure()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_admin_code TEXT;
    v_viewer_codes JSONB;
BEGIN
    IF public.get_current_session_role() != 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자 권한이 필요합니다.';
    END IF;

    SELECT admin_code, viewer_codes INTO v_admin_code, v_viewer_codes
    FROM public.auth_settings
    WHERE id = 'global_auth';

    RETURN jsonb_build_object(
        'adminCode', v_admin_code,
        'viewerCodes', v_viewer_codes
    );
END;
$$;

-- [함수 3] 관리자 전용: 접속 코드 변경
CREATE OR REPLACE FUNCTION public.update_auth_codes_secure(p_admin_code TEXT, p_viewer_codes JSONB)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF public.get_current_session_role() != 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자 권한이 필요합니다.';
    END IF;

    UPDATE public.auth_settings
    SET admin_code = TRIM(p_admin_code),
        viewer_codes = p_viewer_codes,
        updated_at = now()
    WHERE id = 'global_auth';

    RETURN jsonb_build_object('success', true);
END;
$$;

-- [함수 4] 로그아웃 시 세션 즉시 만료
CREATE OR REPLACE FUNCTION public.invalidate_session(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    DELETE FROM public.user_sessions WHERE token = p_token;
END;
$$;

-- 7. 비공개 PDF Storage 버킷 및 권한 제어
-- 버킷을 비공개(public = false)로 설정하여 외부 직접 URL 링크 접근 차단
INSERT INTO storage.buckets (id, name, public)
VALUES ('career-archive-pdfs', 'career-archive-pdfs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read on career-archive-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public upload on career-archive-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public update on career-archive-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow public delete on career-archive-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow active session read on career-archive-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin upload on career-archive-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin update on career-archive-pdfs" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete on career-archive-pdfs" ON storage.objects;

-- (1) 첨부파일 다운로드/조회: 인증된 활성 세션(관리자 or 열람자)만 허용
CREATE POLICY "Allow active session read on career-archive-pdfs"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'career-archive-pdfs' AND
    public.get_current_session_role() IN ('admin', 'viewer')
);

-- (2) 첨부파일 업로드/수정/삭제: 오직 관리자(admin)만 허용
CREATE POLICY "Allow admin upload on career-archive-pdfs"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'career-archive-pdfs' AND
    public.get_current_session_role() = 'admin'
);

CREATE POLICY "Allow admin update on career-archive-pdfs"
ON storage.objects FOR UPDATE
USING (
    bucket_id = 'career-archive-pdfs' AND
    public.get_current_session_role() = 'admin'
);

CREATE POLICY "Allow admin delete on career-archive-pdfs"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'career-archive-pdfs' AND
    public.get_current_session_role() = 'admin'
);

-- 8. 필요한 RPC 함수 권한만 부여 (최소 권한 원칙)
GRANT EXECUTE ON FUNCTION public.authenticate_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_auth_codes_secure() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_auth_codes_secure(TEXT, JSONB) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.invalidate_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_session_role() TO anon, authenticated;
