create table public.topic_modules (
	id text primary key,
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	slug text not null,
	created_at timestamptz not null default now(),
	unique (topic_area_id, slug)
);

create table public.topic_module_versions (
	topic_module_id text not null references public.topic_modules(id) on delete restrict,
	version int not null check (version > 0),
	topic_area_id text not null references public.topic_areas(id) on delete restrict,
	title text not null,
	description text not null,
	content_responsibility text not null,
	ordering int not null check (ordering > 0),
	content_run_id text not null references public.content_runs(id) on delete restrict,
	source_refs jsonb not null default '[]'::jsonb,
	schema_version int not null,
	created_at timestamptz not null default now(),
	primary key (topic_module_id, version)
);

alter table public.learning_path_items
	add column module_id text,
	add column module_version int;

alter table public.learning_path_items
	add constraint learning_path_items_module_pair_check
	check ((module_id is null and module_version is null) or (module_id is not null and module_version is not null));

alter table public.learning_path_items
	add constraint learning_path_items_module_fk
	foreign key (module_id, module_version)
	references public.topic_module_versions(topic_module_id, version)
	on delete restrict;

alter table public.content_release_items
	drop constraint if exists content_release_items_content_type_check;

alter table public.content_release_items
	add constraint content_release_items_content_type_check
	check (
		content_type in (
			'subject_area',
			'topic_area',
			'topic_module',
			'skill',
			'lesson',
			'quiz',
			'quiz_question',
			'learning_path',
			'media_asset'
		)
	);

alter table public.topic_modules enable row level security;
alter table public.topic_module_versions enable row level security;

create policy "Topic modules are readable by signed-in learners" on public.topic_modules
	for select to authenticated using (true);

create policy "Topic module versions are readable by signed-in learners" on public.topic_module_versions
	for select to authenticated using (true);
