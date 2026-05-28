alter table public.quiz_question_versions
	add column if not exists choice_order_strategy text not null default 'shuffle',
	add column if not exists fixed_choice_ids text[] not null default '{}';

alter table public.quiz_question_versions
	drop constraint if exists quiz_question_versions_choice_order_strategy_check;

alter table public.quiz_question_versions
	add constraint quiz_question_versions_choice_order_strategy_check
	check (choice_order_strategy in ('shuffle', 'fixed'));
