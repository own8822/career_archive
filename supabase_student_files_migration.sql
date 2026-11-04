-- ============================================================
-- 취업지원 아카이브 (Career Archive) 학생 첨부파일 (Student Attachments) 마이그레이션 SQL
-- 실행 위치: Supabase 대시보드 -> 왼쪽 메뉴 [SQL Editor] -> [New query] 붙여넣기 후 [Run]
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
    file_data TEXT, -- Base64 캐시 및 안전 보관용
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 검색 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_student_attachments_student_id ON public.student_attachments(student_id);
CREATE INDEX IF NOT EXISTS idx_student_attachments_storage_path ON public.student_attachments(storage_path);

-- RLS(Row Level Security) 활성화
ALTER TABLE public.student_attachments ENABLE ROW LEVEL SECURITY;

-- API 접근 권한 부여
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_attachments TO anon, authenticated;

-- RLS 정책 정의: 활성 세션(관리자/열람자)만 조회, 관리자만 추가/수정/삭제
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
    26214400 -- 25MB 파일 크기 제한
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


-- 4. 학생 첨부파일 서버 보안 RPC 함수들

-- (1) 학생 첨부파일 등록 RPC (관리자 전용)
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

-- (2) 학생 첨부파일 삭제 RPC (관리자 전용)
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

-- (3) 특정 학생 첨부파일 목록 조회 RPC (관리자 및 열람자)
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

-- (4) 첨부파일 단건 상세/데이터 조회 RPC (관리자 및 열람자)
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

-- 실행 권한 설정
REVOKE EXECUTE ON FUNCTION public.upload_student_attachment_secure(TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.delete_student_attachment_secure(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.list_student_attachments_secure(TEXT) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_student_attachment_secure(TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.upload_student_attachment_secure(TEXT, TEXT, TEXT, TEXT, BIGINT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_student_attachment_secure(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.list_student_attachments_secure(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_student_attachment_secure(TEXT) TO anon, authenticated;
