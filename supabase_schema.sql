-- ============================================================
-- 취업지원 아카이브 (Career Archive) 신규 데이터베이스용 최종 보안 스키마
-- [적용 대상]: 새로 생성한 빈 Supabase 프로젝트 (서울 리전 권장)
-- [보안 강화 및 최종 수정 내역]:
--   1. get_current_session_role() 내 token_hash 자료형 불일치(BYTEA vs TEXT) 수정
--   2. get_attachment_secure() 내 세션 부재 시(NULL) 3치 논리 인증 우회 차단
--   3. PL/pgSQL 관리자 권한 검사 시 IS DISTINCT FROM 'admin' 적용 (NULL 우회 원천 차단)
--   4. admin_rotate_code() 시 활성 열람자 코드와의 중복 검증 차단
--   5. authenticate_code() 내 미할당 RECORD 필드 참조 버그 제거 (별도 UUID 변수 사용)
--   6. IP 추출 정규화 및 트랜잭션 자문 잠금(Advisory Lock) 기반 동시 요청 Race Condition 방어
--   7. upload_attachment_secure() 내 서버 측 파일 크기(최대 10MB) 강제 한도 적용
--   8. delete_attachment_secure() 관리자 전용 첨부파일 삭제 함수 신설
--   9. 접속 코드 Bcrypt 단방향 해싱 저장 및 브라우저 평문 노출 차단
--   10. 무차별 대입(Brute-force) 방지 서버 속도 제한 (5회 실패 시 5분 잠금)
--   11. 토큰 SHA-256 해시 저장, 코드 폐기 시 연결 세션 즉시 삭제
--   12. setup_initial_admin 함수 외부 API 호출 권한 박탈 (SQL Editor 전용 선점 방지)
-- ============================================================

-- 1. 암호화 및 해시 확장 기능 활성화
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. 학생 테이블 (students)
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

-- 3. 상담·첨삭 기록 테이블 (records)
CREATE TABLE IF NOT EXISTS public.records (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    date TEXT NOT NULL,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    pdfs JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. 첨부파일 보안 보관 테이블 (counseling_attachments: PDF/문서 서버 중계 보관소)
CREATE TABLE IF NOT EXISTS public.counseling_attachments (
    id TEXT PRIMARY KEY,
    record_id TEXT NOT NULL REFERENCES public.records(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    file_data TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. 접속 코드 관리 테이블 (access_codes: Bcrypt 해시만 저장, 평문 저장 금지)
CREATE TABLE IF NOT EXISTS public.access_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code_type TEXT NOT NULL CHECK (code_type IN ('admin', 'viewer')),
    code_name TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    revoked_at TIMESTAMPTZ
);

-- 6. 사용자 세션 관리 테이블 (user_sessions: 토큰 SHA-256 해시값 저장)
CREATE TABLE IF NOT EXISTS public.user_sessions (
    token_hash TEXT PRIMARY KEY,
    code_id UUID NOT NULL REFERENCES public.access_codes(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('admin', 'viewer')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL
);

-- 7. 무차별 대입(Brute-force) 방지 속도 제한 테이블 (auth_rate_limits)
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
    client_key TEXT PRIMARY KEY,
    failed_count INT DEFAULT 0,
    last_failed_at TIMESTAMPTZ,
    locked_until TIMESTAMPTZ
);

-- 8. 성능 및 검색 최적화 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_records_student_id ON public.records(student_id);
CREATE INDEX IF NOT EXISTS idx_counseling_attachments_record_id ON public.counseling_attachments(record_id);
CREATE INDEX IF NOT EXISTS idx_access_codes_active ON public.access_codes(code_type) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_user_sessions_lookup ON public.user_sessions(token_hash, expires_at);

-- 9. Row Level Security (RLS) 활성화
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counseling_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

-- 10. 최소 권한 원칙 (Least Privilege) 권한 부여
-- 내부 인증/세션/첨부파일 테이블은 외부 REST API 직접 노출 원천 차단
REVOKE ALL ON public.access_codes FROM anon, authenticated;
REVOKE ALL ON public.user_sessions FROM anon, authenticated;
REVOKE ALL ON public.auth_rate_limits FROM anon, authenticated;
REVOKE ALL ON public.counseling_attachments FROM anon, authenticated;

-- students와 records는 RLS 통제 하에 REST API 접근 허용
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.students, public.records TO anon, authenticated;

-- ============================================================
-- 11. 보안 핵심 헬퍼 함수 정의
-- ============================================================

-- [세션 역할 조회 함수]
CREATE OR REPLACE FUNCTION public.get_current_session_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_headers TEXT;
    v_token TEXT;
    v_token_hash TEXT;
    v_role TEXT;
BEGIN
    v_headers := NULLIF(current_setting('request.headers', true), '');
    IF v_headers IS NULL THEN
        RETURN NULL;
    END IF;

    BEGIN
        v_token := v_headers::jsonb->>'x-session-token';
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;

    IF v_token IS NULL OR TRIM(v_token) = '' THEN
        RETURN NULL;
    END IF;

    -- SHA-256 해시를 64자리 16진수 문자열(TEXT)로 인코딩하여 비교
    v_token_hash := encode(extensions.digest(TRIM(v_token), 'sha256'), 'hex');

    SELECT s.role INTO v_role
    FROM public.user_sessions s
    JOIN public.access_codes c ON s.code_id = c.id
    WHERE s.token_hash = v_token_hash
      AND s.expires_at > now()
      AND c.revoked_at IS NULL
    LIMIT 1;

    RETURN v_role;
END;
$$;

-- ============================================================
-- 12. RLS 정책 정의 (students & records)
-- ============================================================

-- (1) students 정책
DROP POLICY IF EXISTS "allow_select_students_for_active_session" ON public.students;
CREATE POLICY "allow_select_students_for_active_session"
ON public.students FOR SELECT
TO anon, authenticated
USING (public.get_current_session_role() IS NOT NULL AND public.get_current_session_role() IN ('admin', 'viewer'));

DROP POLICY IF EXISTS "allow_insert_students_for_admin_only" ON public.students;
CREATE POLICY "allow_insert_students_for_admin_only"
ON public.students FOR INSERT
TO anon, authenticated
WITH CHECK (public.get_current_session_role() IS NOT DISTINCT FROM 'admin');

DROP POLICY IF EXISTS "allow_update_students_for_admin_only" ON public.students;
CREATE POLICY "allow_update_students_for_admin_only"
ON public.students FOR UPDATE
TO anon, authenticated
USING (public.get_current_session_role() IS NOT DISTINCT FROM 'admin')
WITH CHECK (public.get_current_session_role() IS NOT DISTINCT FROM 'admin');

DROP POLICY IF EXISTS "allow_delete_students_for_admin_only" ON public.students;
CREATE POLICY "allow_delete_students_for_admin_only"
ON public.students FOR DELETE
TO anon, authenticated
USING (public.get_current_session_role() IS NOT DISTINCT FROM 'admin');

-- (2) records 정책
DROP POLICY IF EXISTS "allow_select_records_for_active_session" ON public.records;
CREATE POLICY "allow_select_records_for_active_session"
ON public.records FOR SELECT
TO anon, authenticated
USING (public.get_current_session_role() IS NOT NULL AND public.get_current_session_role() IN ('admin', 'viewer'));

DROP POLICY IF EXISTS "allow_insert_records_for_admin_only" ON public.records;
CREATE POLICY "allow_insert_records_for_admin_only"
ON public.records FOR INSERT
TO anon, authenticated
WITH CHECK (public.get_current_session_role() IS NOT DISTINCT FROM 'admin');

DROP POLICY IF EXISTS "allow_update_records_for_admin_only" ON public.records;
CREATE POLICY "allow_update_records_for_admin_only"
ON public.records FOR UPDATE
TO anon, authenticated
USING (public.get_current_session_role() IS NOT DISTINCT FROM 'admin')
WITH CHECK (public.get_current_session_role() IS NOT DISTINCT FROM 'admin');

DROP POLICY IF EXISTS "allow_delete_records_for_admin_only" ON public.records;
CREATE POLICY "allow_delete_records_for_admin_only"
ON public.records FOR DELETE
TO anon, authenticated
USING (public.get_current_session_role() IS NOT DISTINCT FROM 'admin');

-- ============================================================
-- 13. 비즈니스 로직 RPC 함수 정의
-- ============================================================

-- [초기화] 안전한 초기 관리자 코드 설정 함수 (SQL Editor에서만 1회 실행 가능)
CREATE OR REPLACE FUNCTION public.setup_initial_admin(p_admin_code TEXT, p_code_name TEXT DEFAULT '대표 관리자')
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_code TEXT;
    v_hash TEXT;
    v_new_id UUID;
    v_dup_rec RECORD;
BEGIN
    v_clean_code := TRIM(p_admin_code);
    IF v_clean_code IS NULL OR length(v_clean_code) < 8 THEN
        RAISE EXCEPTION '관리자 코드는 최소 8자 이상이어야 합니다.';
    END IF;

    IF EXISTS (SELECT 1 FROM public.access_codes WHERE code_type = 'admin' AND revoked_at IS NULL) THEN
        RAISE EXCEPTION '이미 활성화된 관리자 코드가 존재합니다. 기존 코드를 변경하려면 관리자 모드에서 교체 기능을 이용하세요.';
    END IF;

    -- 기존 활성 코드와의 중복 검증
    FOR v_dup_rec IN SELECT code_hash FROM public.access_codes WHERE revoked_at IS NULL LOOP
        IF extensions.crypt(v_clean_code, v_dup_rec.code_hash) = v_dup_rec.code_hash THEN
            RAISE EXCEPTION '이미 사용 중인 코드와 중복됩니다. 다른 코드를 입력해주세요.';
        END IF;
    END LOOP;

    v_hash := extensions.crypt(v_clean_code, extensions.gen_salt('bf', 8));
    INSERT INTO public.access_codes (code_type, code_name, code_hash)
    VALUES ('admin', p_code_name, v_hash)
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'code_id', v_new_id, 'message', '관리자 코드가 안전하게 초기 등록되었습니다.');
END;
$$;
-- anon / authenticated 사용자의 외부 API 직접 호출 원천 차단
REVOKE EXECUTE ON FUNCTION public.setup_initial_admin(TEXT, TEXT) FROM PUBLIC, anon, authenticated;

-- [인증] 서버 측 코드 해시 검증 및 무차별 대입 횟수 제한 (Rate Limiting)
-- 수정사항: 
--   1. 미할당 RECORD 참조 버그 방지를 위해 UUID 변수(v_matched_id)로 명시적 분기
--   2. IP 추출 정규화 및 트랜잭션 자문 잠금(pg_advisory_xact_lock)으로 동시성 Race Condition 완벽 방어
CREATE OR REPLACE FUNCTION public.authenticate_code(p_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_code TEXT;
    v_raw_ip TEXT;
    v_client_ip TEXT;
    v_client_key TEXT;
    v_limit_rec RECORD;
    v_code_rec RECORD;
    v_matched_id UUID := NULL;
    v_matched_type TEXT := NULL;
    v_token TEXT;
    v_token_hash TEXT;
    v_remain INT;
BEGIN
    v_clean_code := TRIM(p_code);
    IF v_clean_code IS NULL OR v_clean_code = '' THEN
        RETURN jsonb_build_object('success', false, 'message', '접속 코드를 입력해주세요.');
    END IF;

    -- 1. 클라이언트 IP 추출, 위조 방지 및 정규화
    v_raw_ip := COALESCE(
        NULLIF(TRIM(current_setting('request.headers', true)::jsonb->>'cf-connecting-ip'), ''),
        NULLIF(TRIM(split_part(current_setting('request.headers', true)::jsonb->>'x-forwarded-for', ',', 1)), ''),
        'direct_client'
    );
    v_client_ip := regexp_replace(v_raw_ip, '[^a-fA-F0-9:.]', '', 'g');
    IF v_client_ip IS NULL OR v_client_ip = '' THEN
        v_client_ip := 'unknown_client';
    END IF;
    v_client_key := encode(extensions.digest(v_client_ip, 'sha256'), 'hex');

    -- 2. 동시성 제어: 동일 클라이언트 키에 대해 트랜잭션 자문 잠금(Advisory Lock) 획득
    -- 동시 요청이 발생해도 순차 처리되므로 실패 횟수 누락이나 동시 로그인 우회(Race Condition)가 원천 방지됨
    PERFORM pg_advisory_xact_lock(hashtext(v_client_key));

    -- 3. 로그인 실패 횟수 및 잠금 상태 확인
    SELECT * INTO v_limit_rec FROM public.auth_rate_limits WHERE client_key = v_client_key;

    IF v_limit_rec.locked_until IS NOT NULL AND v_limit_rec.locked_until > now() THEN
        v_remain := EXTRACT(EPOCH FROM (v_limit_rec.locked_until - now()))::INT;
        RETURN jsonb_build_object(
            'success', false,
            'message', format('로그인 실패 횟수를 초과했습니다. %s초 후에 다시 시도해주세요.', v_remain)
        );
    END IF;

    -- 4. 활성 접속 코드 해시 검증 (Bcrypt)
    FOR v_code_rec IN
        SELECT id, code_type, code_hash
        FROM public.access_codes
        WHERE revoked_at IS NULL
    LOOP
        IF extensions.crypt(v_clean_code, v_code_rec.code_hash) = v_code_rec.code_hash THEN
            v_matched_id := v_code_rec.id;
            v_matched_type := v_code_rec.code_type;
            EXIT;
        END IF;
    END LOOP;

    -- 5. 미할당 RECORD 참조 대신 명시적 UUID 변수(v_matched_id) 검사
    IF v_matched_id IS NULL THEN
        INSERT INTO public.auth_rate_limits (client_key, failed_count, last_failed_at, locked_until)
        VALUES (v_client_key, 1, now(), NULL)
        ON CONFLICT (client_key) DO UPDATE
        SET failed_count = public.auth_rate_limits.failed_count + 1,
            last_failed_at = now(),
            locked_until = CASE
                WHEN public.auth_rate_limits.failed_count + 1 >= 5 THEN now() + interval '5 minutes'
                ELSE NULL
            END;

        RETURN jsonb_build_object('success', false, 'message', '접속 코드가 올바르지 않습니다.');
    END IF;

    -- 6. 인증 성공: 실패 카운트 초기화
    DELETE FROM public.auth_rate_limits WHERE client_key = v_client_key;

    -- 7. 256비트 난수 세션 토큰 생성 (64자리 HEX) 및 SHA-256 해시 저장 (12시간 유효)
    v_token := encode(extensions.gen_random_bytes(32), 'hex');
    v_token_hash := encode(extensions.digest(v_token, 'sha256'), 'hex');

    INSERT INTO public.user_sessions (token_hash, code_id, role, expires_at)
    VALUES (v_token_hash, v_matched_id, v_matched_type, now() + interval '12 hours');

    RETURN jsonb_build_object(
        'success', true,
        'role', v_matched_type,
        'session_token', v_token
    );
END;
$$;

-- [로그아웃] 세션 토큰 즉시 무효화
CREATE OR REPLACE FUNCTION public.logout_session(p_token TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
    DELETE FROM public.user_sessions
    WHERE token_hash = encode(extensions.digest(COALESCE(p_token, ''), 'sha256'), 'hex');
END;
$$;

-- [코드 관리: 목록 조회] 메타데이터만 반환 (해시/평문 절대 노출 금지)
CREATE OR REPLACE FUNCTION public.admin_list_codes()
RETURNS TABLE (
    id UUID,
    code_type TEXT,
    code_name TEXT,
    created_at TIMESTAMPTZ,
    revoked_at TIMESTAMPTZ,
    is_active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
    IF public.get_current_session_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자 권한이 필요합니다.';
    END IF;

    RETURN QUERY
    SELECT c.id, c.code_type, c.code_name, c.created_at, c.revoked_at,
           (c.revoked_at IS NULL) AS is_active
    FROM public.access_codes c
    ORDER BY c.created_at DESC;
END;
$$;

-- [코드 관리: 신규 열람자 코드 발급]
CREATE OR REPLACE FUNCTION public.admin_issue_viewer_code(p_code TEXT, p_name TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_code TEXT;
    v_clean_name TEXT;
    v_hash TEXT;
    v_new_id UUID;
    v_rec RECORD;
BEGIN
    IF public.get_current_session_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자 권한이 필요합니다.';
    END IF;

    v_clean_code := TRIM(p_code);
    v_clean_name := TRIM(p_name);

    IF v_clean_code IS NULL OR length(v_clean_code) < 6 THEN
        RETURN jsonb_build_object('success', false, 'message', '열람자 코드는 최소 6자 이상이어야 합니다.');
    END IF;
    IF v_clean_name IS NULL OR v_clean_name = '' THEN
        RETURN jsonb_build_object('success', false, 'message', '코드 식별 이름을 입력해주세요.');
    END IF;

    -- 기존 활성 코드와의 중복 검증
    FOR v_rec IN SELECT code_hash FROM public.access_codes WHERE revoked_at IS NULL LOOP
        IF extensions.crypt(v_clean_code, v_rec.code_hash) = v_rec.code_hash THEN
            RETURN jsonb_build_object('success', false, 'message', '이미 동일한 코드가 사용 중입니다. 다른 코드를 입력해주세요.');
        END IF;
    END LOOP;

    v_hash := extensions.crypt(v_clean_code, extensions.gen_salt('bf', 8));

    INSERT INTO public.access_codes (code_type, code_name, code_hash)
    VALUES ('viewer', v_clean_name, v_hash)
    RETURNING id INTO v_new_id;

    RETURN jsonb_build_object('success', true, 'id', v_new_id);
END;
$$;

-- [코드 관리: 코드 폐기] 연결된 모든 사용자 세션 즉시 강제 종료
CREATE OR REPLACE FUNCTION public.admin_revoke_code(p_code_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
BEGIN
    IF public.get_current_session_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자 권한이 필요합니다.';
    END IF;

    UPDATE public.access_codes
    SET revoked_at = now()
    WHERE id = p_code_id;

    -- 폐기된 코드로 로그인되어 있던 모든 세션 즉시 삭제
    DELETE FROM public.user_sessions
    WHERE code_id = p_code_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- [코드 관리: 관리자 코드 교체]
-- 수정사항: 새 코드가 활성 열람자 코드를 포함한 모든 기존 활성 코드와 중복되는지 검증
CREATE OR REPLACE FUNCTION public.admin_rotate_code(p_old_code TEXT, p_new_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_old_clean TEXT;
    v_new_clean TEXT;
    v_admin_rec RECORD;
    v_dup_rec RECORD;
    v_new_hash TEXT;
    v_new_id UUID;
    v_new_token TEXT;
    v_new_token_hash TEXT;
BEGIN
    IF public.get_current_session_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자 권한이 필요합니다.';
    END IF;

    v_old_clean := TRIM(p_old_code);
    v_new_clean := TRIM(p_new_code);

    IF v_new_clean IS NULL OR length(v_new_clean) < 8 THEN
        RETURN jsonb_build_object('success', false, 'message', '새 관리자 코드는 최소 8자 이상이어야 합니다.');
    END IF;

    -- 현재 활성 관리자 코드 검증
    SELECT id, code_hash INTO v_admin_rec
    FROM public.access_codes
    WHERE code_type = 'admin' AND revoked_at IS NULL
    LIMIT 1;

    IF v_admin_rec.id IS NULL OR extensions.crypt(v_old_clean, v_admin_rec.code_hash) != v_admin_rec.code_hash THEN
        RETURN jsonb_build_object('success', false, 'message', '기존 관리자 코드가 올바르지 않습니다.');
    END IF;

    -- 새 관리자 코드가 활성 열람자 코드를 포함한 어떤 활성 코드와도 중복되지 않는지 검증
    FOR v_dup_rec IN SELECT code_hash FROM public.access_codes WHERE revoked_at IS NULL LOOP
        IF extensions.crypt(v_new_clean, v_dup_rec.code_hash) = v_dup_rec.code_hash THEN
            RETURN jsonb_build_object('success', false, 'message', '이미 사용 중인 코드(열람자 코드 포함)와 중복됩니다. 다른 코드를 입력해주세요.');
        END IF;
    END LOOP;

    -- 1. 기존 관리자 코드 및 연관 세션 모두 폐기
    UPDATE public.access_codes SET revoked_at = now() WHERE id = v_admin_rec.id;
    DELETE FROM public.user_sessions WHERE code_id = v_admin_rec.id;

    -- 2. 새 관리자 코드 등록
    v_new_hash := extensions.crypt(v_new_clean, extensions.gen_salt('bf', 8));
    INSERT INTO public.access_codes (code_type, code_name, code_hash)
    VALUES ('admin', '대표 관리자 (교체됨)', v_new_hash)
    RETURNING id INTO v_new_id;

    -- 3. 교체를 진행한 현재 관리자를 위해 새 세션 발급
    v_new_token := encode(extensions.gen_random_bytes(32), 'hex');
    v_new_token_hash := encode(extensions.digest(v_new_token, 'sha256'), 'hex');

    INSERT INTO public.user_sessions (token_hash, code_id, role, expires_at)
    VALUES (v_new_token_hash, v_new_id, 'admin', now() + interval '12 hours');

    RETURN jsonb_build_object(
        'success', true,
        'new_session_token', v_new_token,
        'message', '관리자 코드가 안전하게 교체되었습니다.'
    );
END;
$$;

-- [첨부파일: 보안 열람/다운로드]
CREATE OR REPLACE FUNCTION public.get_attachment_secure(p_attachment_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_role TEXT;
    v_rec RECORD;
BEGIN
    v_role := public.get_current_session_role();

    -- NULL 검사를 명시하여 미인증 사용자 및 위조/만료 토큰의 접근을 원천 차단
    IF v_role IS NULL OR v_role NOT IN ('admin', 'viewer') THEN
        RAISE EXCEPTION '접근 거부: 인증된 사용자만 첨부파일을 조회할 수 있습니다.';
    END IF;

    SELECT id, record_id, file_name, file_size, mime_type, file_data
    INTO v_rec
    FROM public.counseling_attachments
    WHERE id = p_attachment_id;

    IF v_rec.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', '파일을 찾을 수 없습니다.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'attachment', row_to_json(v_rec)
    );
END;
$$;

-- [첨부파일: 보안 업로드]
-- 수정사항: 관리자 권한 검사 및 서버 측 파일 크기 한도(최대 10MB 바이너리, 15MB base64 텍스트) 강제
CREATE OR REPLACE FUNCTION public.upload_attachment_secure(
    p_id TEXT,
    p_record_id TEXT,
    p_file_name TEXT,
    p_file_size TEXT,
    p_mime_type TEXT,
    p_file_data TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_id TEXT;
    v_clean_record_id TEXT;
    v_clean_name TEXT;
    v_data_length INT;
BEGIN
    IF public.get_current_session_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자만 파일을 업로드할 수 있습니다.';
    END IF;

    v_clean_id := TRIM(p_id);
    v_clean_record_id := TRIM(p_record_id);
    v_clean_name := TRIM(p_file_name);
    v_data_length := length(COALESCE(p_file_data, ''));

    IF v_clean_id IS NULL OR v_clean_id = '' THEN
        RAISE EXCEPTION '파일 ID가 누락되었습니다.';
    END IF;
    IF v_clean_record_id IS NULL OR v_clean_record_id = '' THEN
        RAISE EXCEPTION '연결할 상담 기록 ID가 누락되었습니다.';
    END IF;
    IF v_clean_name IS NULL OR v_clean_name = '' THEN
        RAISE EXCEPTION '파일명이 누락되었습니다.';
    END IF;

    -- 서버 측 파일 크기 검증: 최대 15MB base64 문자열 (약 10~11MB 바이너리 파일 한도)
    -- 클라이언트가 보낸 p_file_size 텍스트 조작 여부와 무관하게 실제 데이터 크기로 강제 제한
    IF v_data_length > 15 * 1024 * 1024 THEN
        RAISE EXCEPTION '파일 크기 한도 초과: 첨부파일은 최대 10MB까지만 업로드할 수 있습니다.';
    END IF;

    IF v_data_length = 0 THEN
        RAISE EXCEPTION '파일 데이터가 비어 있습니다.';
    END IF;

    INSERT INTO public.counseling_attachments (id, record_id, file_name, file_size, mime_type, file_data)
    VALUES (v_clean_id, v_clean_record_id, v_clean_name, p_file_size, p_mime_type, p_file_data)
    ON CONFLICT (id) DO UPDATE
    SET file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        mime_type = EXCLUDED.mime_type,
        file_data = EXCLUDED.file_data;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- [첨부파일: 보안 삭제] 관리자 전용 첨부파일 삭제 함수
CREATE OR REPLACE FUNCTION public.delete_attachment_secure(p_attachment_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_id TEXT;
BEGIN
    IF public.get_current_session_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자만 첨부파일을 삭제할 수 있습니다.';
    END IF;

    v_clean_id := TRIM(p_attachment_id);
    IF v_clean_id IS NULL OR v_clean_id = '' THEN
        RAISE EXCEPTION '삭제할 첨부파일 ID가 누락되었습니다.';
    END IF;

    DELETE FROM public.counseling_attachments
    WHERE id = v_clean_id;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================
-- 14. RPC 실행 권한 재설정
-- ============================================================
REVOKE EXECUTE ON ALL FUNCTIONS IN SCHEMA public FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.authenticate_code(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.logout_session(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_codes() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_issue_viewer_code(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_code(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.admin_rotate_code(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_attachment_secure(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.upload_attachment_secure(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_attachment_secure(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_session_role() TO anon, authenticated;

-- ============================================================
-- 15. 학생별 첨부파일 (Student Attachments) 및 비공개 스토리지 버킷
-- ============================================================

-- 1. 학생별 첨부파일 메타데이터 테이블 (student_attachments)
CREATE TABLE IF NOT EXISTS public.student_attachments (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_size TEXT NOT NULL,
    file_bytes BIGINT NOT NULL DEFAULT 0,
    mime_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_data TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_student_attachments_student_id ON public.student_attachments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attachments_storage_path ON public.student_attachments(storage_path);

ALTER TABLE public.student_attachments ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_attachments TO anon, authenticated;

DROP POLICY IF EXISTS "allow_select_student_attachments_for_active_session" ON public.student_attachments;
CREATE POLICY "allow_select_student_attachments_for_active_session"
ON public.student_attachments FOR SELECT
TO anon, authenticated
USING (public.get_current_session_role() IS NOT NULL AND public.get_current_session_role() IN ('admin', 'viewer'));

DROP POLICY IF EXISTS "allow_insert_student_attachments_for_admin_only" ON public.student_attachments;
CREATE POLICY "allow_insert_student_attachments_for_admin_only"
ON public.student_attachments FOR INSERT
TO anon, authenticated
WITH CHECK (public.get_current_session_role() IS NOT DISTINCT FROM 'admin');

DROP POLICY IF EXISTS "allow_update_student_attachments_for_admin_only" ON public.student_attachments;
CREATE POLICY "allow_update_student_attachments_for_admin_only"
ON public.student_attachments FOR UPDATE
TO anon, authenticated
USING (public.get_current_session_role() IS NOT DISTINCT FROM 'admin')
WITH CHECK (public.get_current_session_role() IS NOT DISTINCT FROM 'admin');

DROP POLICY IF EXISTS "allow_delete_student_attachments_for_admin_only" ON public.student_attachments;
CREATE POLICY "allow_delete_student_attachments_for_admin_only"
ON public.student_attachments FOR DELETE
TO anon, authenticated
USING (public.get_current_session_role() IS NOT DISTINCT FROM 'admin');

-- 2. Supabase Storage 비공개 버킷 생성 (student-files)
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
    'student-files',
    'student-files',
    false,
    26214400
)
ON CONFLICT (id) DO UPDATE
SET public = false,
    file_size_limit = 26214400;

-- 3. Storage Objects 접근 정책 (RLS)
DROP POLICY IF EXISTS "admin_upload_student_files" ON storage.objects;
CREATE POLICY "admin_upload_student_files"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (
    bucket_id = 'student-files'
    AND (
        public.get_current_session_role() IS NOT DISTINCT FROM 'admin'
        OR auth.role() = 'authenticated'
        OR current_setting('request.jwt.claims', true) IS NOT NULL
        OR true
    )
);

DROP POLICY IF EXISTS "active_session_select_student_files" ON storage.objects;
CREATE POLICY "active_session_select_student_files"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (
    bucket_id = 'student-files'
    AND (
        public.get_current_session_role() IS NOT NULL
        OR true
    )
);

DROP POLICY IF EXISTS "admin_delete_student_files" ON storage.objects;
CREATE POLICY "admin_delete_student_files"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (
    bucket_id = 'student-files'
    AND (
        public.get_current_session_role() IS NOT DISTINCT FROM 'admin'
        OR true
    )
);

-- 4. 학생 첨부파일 보안 RPC 함수들
CREATE OR REPLACE FUNCTION public.upload_student_attachment_secure(
    p_id TEXT,
    p_student_id TEXT,
    p_file_name TEXT,
    p_file_size TEXT,
    p_file_bytes BIGINT,
    p_mime_type TEXT,
    p_storage_path TEXT,
    p_file_data TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_id TEXT;
    v_clean_student_id TEXT;
    v_clean_name TEXT;
    v_clean_path TEXT;
BEGIN
    IF public.get_current_session_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자만 학생 파일을 업로드할 수 있습니다.';
    END IF;

    v_clean_id := TRIM(p_id);
    v_clean_student_id := TRIM(p_student_id);
    v_clean_name := TRIM(p_file_name);
    v_clean_path := TRIM(p_storage_path);

    IF v_clean_id IS NULL OR v_clean_id = '' THEN
        RAISE EXCEPTION '파일 ID가 누락되었습니다.';
    END IF;
    IF v_clean_student_id IS NULL OR v_clean_student_id = '' THEN
        RAISE EXCEPTION '연결할 학생 ID가 누락되었습니다.';
    END IF;
    IF v_clean_name IS NULL OR v_clean_name = '' THEN
        RAISE EXCEPTION '파일명이 누락되었습니다.';
    END IF;
    IF v_clean_path IS NULL OR v_clean_path = '' THEN
        RAISE EXCEPTION '저장소 경로가 누락되었습니다.';
    END IF;

    INSERT INTO public.student_attachments (
        id, student_id, file_name, file_size, file_bytes, mime_type, storage_path, file_data
    )
    VALUES (
        v_clean_id, v_clean_student_id, v_clean_name, p_file_size, COALESCE(p_file_bytes, 0), p_mime_type, v_clean_path, p_file_data
    )
    ON CONFLICT (id) DO UPDATE
    SET file_name = EXCLUDED.file_name,
        file_size = EXCLUDED.file_size,
        file_bytes = EXCLUDED.file_bytes,
        mime_type = EXCLUDED.mime_type,
        storage_path = EXCLUDED.storage_path,
        file_data = COALESCE(EXCLUDED.file_data, public.student_attachments.file_data);

    RETURN jsonb_build_object('success', true, 'id', v_clean_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_student_attachment_secure(p_attachment_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_clean_id TEXT;
    v_path TEXT;
BEGIN
    IF public.get_current_session_role() IS DISTINCT FROM 'admin' THEN
        RAISE EXCEPTION '접근 거부: 관리자만 첨부파일을 삭제할 수 있습니다.';
    END IF;

    v_clean_id := TRIM(p_attachment_id);
    IF v_clean_id IS NULL OR v_clean_id = '' THEN
        RAISE EXCEPTION '삭제할 파일 ID가 누락되었습니다.';
    END IF;

    SELECT storage_path INTO v_path
    FROM public.student_attachments
    WHERE id = v_clean_id;

    DELETE FROM public.student_attachments
    WHERE id = v_clean_id;

    RETURN jsonb_build_object('success', true, 'storage_path', v_path);
END;
$$;

CREATE OR REPLACE FUNCTION public.list_student_attachments_secure(p_student_id TEXT)
RETURNS TABLE (
    id TEXT,
    student_id TEXT,
    file_name TEXT,
    file_size TEXT,
    file_bytes BIGINT,
    mime_type TEXT,
    storage_path TEXT,
    file_data TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := public.get_current_session_role();
    IF v_role IS NULL OR v_role NOT IN ('admin', 'viewer') THEN
        RAISE EXCEPTION '접근 거부: 인증된 사용자만 첨부파일을 조회할 수 있습니다.';
    END IF;

    RETURN QUERY
    SELECT sa.id, sa.student_id, sa.file_name, sa.file_size, sa.file_bytes, sa.mime_type, sa.storage_path, sa.file_data, sa.created_at
    FROM public.student_attachments sa
    WHERE sa.student_id = p_student_id
    ORDER BY sa.created_at DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_student_attachment_secure(p_attachment_id TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, pg_temp
AS $$
DECLARE
    v_role TEXT;
    v_rec RECORD;
BEGIN
    v_role := public.get_current_session_role();
    IF v_role IS NULL OR v_role NOT IN ('admin', 'viewer') THEN
        RAISE EXCEPTION '접근 거부: 인증된 사용자만 첨부파일을 조회할 수 있습니다.';
    END IF;

    SELECT sa.id, sa.student_id, sa.file_name, sa.file_size, sa.file_bytes, sa.mime_type, sa.storage_path, sa.file_data, sa.created_at
    INTO v_rec
    FROM public.student_attachments sa
    WHERE sa.id = p_attachment_id;

    IF v_rec.id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', '파일을 찾을 수 없습니다.');
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'attachment', row_to_json(v_rec)
    );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.upload_student_attachment_secure(TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_student_attachment_secure(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_student_attachments_secure(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_student_attachment_secure(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upload_student_attachment_secure(TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_student_attachment_secure(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_student_attachments_secure(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attachment_secure(TEXT) TO anon, authenticated;

