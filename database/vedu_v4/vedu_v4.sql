--
-- PostgreSQL database dump
--

\restrict QyP4rjd0FwvpdnUy7wLklSTq1bQuyOgZAeS4wIMAJWiDagpabi99nYVMvZExGDY

-- Dumped from database version 18.6
-- Dumped by pg_dump version 18.6

-- Started on 2026-09-28 17:32:28

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 6 (class 2615 OID 17177)
-- Name: auth; Type: SCHEMA; Schema: -; Owner: postgres
--

CREATE SCHEMA auth;


ALTER SCHEMA auth OWNER TO postgres;

--
-- TOC entry 270 (class 1255 OID 17682)
-- Name: fn_create_user(character varying, character varying, character varying, character varying); Type: FUNCTION; Schema: auth; Owner: postgres
--

CREATE FUNCTION auth.fn_create_user(p_full_name character varying, p_email character varying, p_password_hash character varying, p_role character varying DEFAULT 'STUDENT'::character varying) RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_user_id INTEGER;
BEGIN
    INSERT INTO auth.users(full_name, email, password_hash, role)
    VALUES (p_full_name, LOWER(TRIM(p_email)), p_password_hash, p_role)
    RETURNING user_id INTO v_user_id;
    RETURN v_user_id;
END;
$$;


ALTER FUNCTION auth.fn_create_user(p_full_name character varying, p_email character varying, p_password_hash character varying, p_role character varying) OWNER TO postgres;

--
-- TOC entry 264 (class 1255 OID 17668)
-- Name: fn_validate_parent_student(); Type: FUNCTION; Schema: auth; Owner: postgres
--

CREATE FUNCTION auth.fn_validate_parent_student() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    parent_role VARCHAR(20);
    student_role VARCHAR(20);
BEGIN
    SELECT role INTO parent_role FROM auth.users WHERE user_id = NEW.parent_id;
    SELECT role INTO student_role FROM auth.users WHERE user_id = NEW.student_id;

    IF parent_role <> 'PARENT' THEN
        RAISE EXCEPTION 'parent_id % must belong to a PARENT user', NEW.parent_id;
    END IF;

    IF student_role <> 'STUDENT' THEN
        RAISE EXCEPTION 'student_id % must belong to a STUDENT user', NEW.student_id;
    END IF;

    RETURN NEW;
END;
$$;


ALTER FUNCTION auth.fn_validate_parent_student() OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 227 (class 1259 OID 17185)
-- Name: users; Type: TABLE; Schema: auth; Owner: postgres
--

CREATE TABLE auth.users (
    user_id integer NOT NULL,
    full_name character varying(100) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    role character varying(20) DEFAULT 'STUDENT'::character varying NOT NULL,
    avatar text,
    token character varying(500),
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT users_role_check CHECK (((role)::text = ANY ((ARRAY['STUDENT'::character varying, 'TEACHER'::character varying, 'ADMIN'::character varying])::text[])))
);


ALTER TABLE auth.users OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17184)
-- Name: users_user_id_seq; Type: SEQUENCE; Schema: auth; Owner: postgres
--

ALTER TABLE auth.users ALTER COLUMN user_id ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME auth.users_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 5014 (class 0 OID 17185)
-- Dependencies: 227
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: postgres
--

COPY auth.users (user_id, full_name, email, password_hash, role, avatar, token, is_active, created_at, updated_at) FROM stdin;
1	Nguyen Van A	student1@vedu.vn	HASHED_PASSWORD_1	STUDENT	\N	\N	t	2026-09-28 17:20:09.719352	2026-09-28 17:20:09.719352
2	Tran Thi B	student2@vedu.vn	HASHED_PASSWORD_2	STUDENT	\N	\N	t	2026-09-28 17:20:09.719352	2026-09-28 17:20:09.719352
3	Le Van C	teacher1@vedu.vn	HASHED_PASSWORD_3	TEACHER	\N	\N	t	2026-09-28 17:20:09.719352	2026-09-28 17:20:09.719352
5	Admin Vedu	admin@vedu.vn	HASHED_PASSWORD_5	ADMIN	\N	\N	t	2026-09-28 17:20:09.719352	2026-09-28 17:20:09.719352
\.


--
-- TOC entry 5020 (class 0 OID 0)
-- Dependencies: 226
-- Name: users_user_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: postgres
--

SELECT pg_catalog.setval('auth.users_user_id_seq', 5, true);


--
-- TOC entry 4857 (class 2606 OID 17206)
-- Name: users users_email_key; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- TOC entry 4859 (class 2606 OID 17204)
-- Name: users users_pkey; Type: CONSTRAINT; Schema: auth; Owner: postgres
--

ALTER TABLE ONLY auth.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (user_id);


--
-- TOC entry 4854 (class 1259 OID 17631)
-- Name: idx_users_role; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX idx_users_role ON auth.users USING btree (role);


--
-- TOC entry 4855 (class 1259 OID 17632)
-- Name: idx_users_token; Type: INDEX; Schema: auth; Owner: postgres
--

CREATE INDEX idx_users_token ON auth.users USING btree (token) WHERE (token IS NOT NULL);


--
-- TOC entry 4860 (class 2620 OID 17680)
-- Name: users trg_audit_users; Type: TRIGGER; Schema: auth; Owner: postgres
--

CREATE TRIGGER trg_audit_users AFTER INSERT OR DELETE OR UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION system_config.fn_audit_row('user_id');


--
-- TOC entry 4861 (class 2620 OID 17658)
-- Name: users trg_users_updated_at; Type: TRIGGER; Schema: auth; Owner: postgres
--

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON auth.users FOR EACH ROW EXECUTE FUNCTION system_config.fn_set_updated_at();


-- Completed on 2026-09-28 17:32:28

--
-- PostgreSQL database dump complete
--

\unrestrict QyP4rjd0FwvpdnUy7wLklSTq1bQuyOgZAeS4wIMAJWiDagpabi99nYVMvZExGDY

