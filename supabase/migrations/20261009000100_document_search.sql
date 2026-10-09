-- Full-text search over what is inside uploaded documents, not just their names.
--
-- content_text: null = not read yet (the indexer picks it up), '' = read, no text
-- (a scan, or an encrypted PDF). The 300k cap keeps search_tsv far below
-- Postgres's 1 MB tsvector limit.

alter table public.submission_documents add column if not exists content_text text;
alter table public.common_documents     add column if not exists content_text text;
alter table public.repository_files     add column if not exists content_text text;
alter table public.templates            add column if not exists content_text text;

alter table public.submission_documents add column if not exists search_tsv tsvector
  generated always as (to_tsvector('english'::regconfig, coalesce(title, '') || ' ' || left(coalesce(content_text, ''), 300000))) stored;
alter table public.common_documents add column if not exists search_tsv tsvector
  generated always as (to_tsvector('english'::regconfig, coalesce(title, '') || ' ' || left(coalesce(content_text, ''), 300000))) stored;
alter table public.repository_files add column if not exists search_tsv tsvector
  generated always as (to_tsvector('english'::regconfig, coalesce(title, '') || ' ' || left(coalesce(content_text, ''), 300000))) stored;
alter table public.templates add column if not exists search_tsv tsvector
  generated always as (to_tsvector('english'::regconfig, coalesce(title, '') || ' ' || left(coalesce(content_text, ''), 300000))) stored;

create index if not exists submission_documents_search_idx on public.submission_documents using gin (search_tsv);
create index if not exists common_documents_search_idx     on public.common_documents     using gin (search_tsv);
create index if not exists repository_files_search_idx     on public.repository_files     using gin (search_tsv);
create index if not exists templates_search_idx            on public.templates            using gin (search_tsv);

-- Writes only content_text. QAC-only because the indexer runs as QAC (the
-- uploader's own session, or the mailer job account); reps cannot update
-- submission rows once a cycle closes, so their uploads are read inline instead.
create or replace function public.set_document_text(p_kind text, p_id uuid, p_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_qac() then
    raise exception 'Only QAC can index documents.' using errcode = 'insufficient_privilege';
  end if;
  case p_kind
    when 'submission' then update public.submission_documents set content_text = p_text where id = p_id;
    when 'common'     then update public.common_documents     set content_text = p_text where id = p_id;
    when 'repository' then update public.repository_files     set content_text = p_text where id = p_id;
    when 'template'   then update public.templates            set content_text = p_text where id = p_id;
    else raise exception 'Unknown document kind %', p_kind;
  end case;
end;
$$;

revoke all on function public.set_document_text(text, uuid, text) from public;
grant execute on function public.set_document_text(text, uuid, text) to authenticated;

-- Security invoker: every branch is filtered by the caller's own RLS, so a rep
-- never matches a Common Document before their NDA is verified, or another
-- programme's files. Templates are readable by everyone, unpublished included,
-- hence the explicit is_published check.
--
-- Each word is matched as a prefix ("accred" finds "accreditation").
create or replace function public.search_documents(p_query text, p_limit int default 8)
returns table (kind text, id uuid, title text, snippet text, ref_id uuid, program text, level text, rank real)
language plpgsql
stable
security invoker
set search_path = public
as $$
declare
  q tsquery;
begin
  select to_tsquery('english', string_agg(quote_literal(w) || ':*', ' & '))
    into q
    from regexp_split_to_table(lower(coalesce(p_query, '')), '[^[:alnum:]]+') as w
   where w <> '';
  if q is null or numnode(q) = 0 then
    return;
  end if;

  return query
  with hits as (
    (select 'submission'::text as kind, d.id, d.title, d.content_text, d.submission_id as ref_id,
            p.name as program, l.name as level, ts_rank(d.search_tsv, q) as rank
       from public.submission_documents d
       left join public.submissions s on s.id = d.submission_id
       left join public.programs p on p.id = s.program_id
       left join public.accreditation_levels l on l.id = s.level_id
      where d.is_current and d.search_tsv @@ q
      order by rank desc limit p_limit)
    union all
    (select 'common', c.id, c.title, c.content_text, null::uuid, null::text, null::text, ts_rank(c.search_tsv, q)
       from public.common_documents c
      where c.deleted_at is null and c.search_tsv @@ q
      order by 8 desc limit p_limit)
    union all
    (select 'repository', r.id, r.title, r.content_text, r.program_id, p.name, null::text, ts_rank(r.search_tsv, q)
       from public.repository_files r
       left join public.programs p on p.id = r.program_id
      where not r.is_archived and r.search_tsv @@ q
      order by 8 desc limit p_limit)
    union all
    (select 'template', t.id, t.title, t.content_text, null::uuid, null::text, null::text, ts_rank(t.search_tsv, q)
       from public.templates t
      where (t.is_published or public.is_qac()) and t.search_tsv @@ q
      order by 8 desc limit p_limit)
  )
  select h.kind, h.id, h.title,
         case when coalesce(h.content_text, '') = '' then null
              else ts_headline('english', left(h.content_text, 60000), q,
                               'MaxFragments=1, MaxWords=18, MinWords=8, StartSel=«, StopSel=»')
         end,
         h.ref_id, h.program, h.level, h.rank
    from hits h
   order by h.rank desc;
end;
$$;

grant execute on function public.search_documents(text, int) to authenticated;
