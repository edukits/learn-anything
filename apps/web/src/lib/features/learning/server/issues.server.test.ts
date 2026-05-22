import { describe, expect, test } from 'vitest';
import { encodeIssueTarget, parseIssueReportForm, parseIssueTarget } from './issues.server';

describe('issue report parsing', () => {
	test('accepts supported issue types and trims details', () => {
		const form = new FormData();
		form.set('issueType', 'clarity');
		form.set('message', '  This explanation needs an example.  ');

		expect(parseIssueReportForm(form)).toEqual({
			issueType: 'clarity',
			message: 'This explanation needs an example.'
		});
	});

	test('rejects unsupported issue types', () => {
		const form = new FormData();
		form.set('issueType', 'private_data');
		form.set('message', 'This should not be accepted.');

		expect(() => parseIssueReportForm(form)).toThrow('supported issue type');
	});

	test('round-trips server-validated content targets', () => {
		const target = {
			contentType: 'quiz_question' as const,
			contentId: 'question_1',
			contentVersion: 2
		};

		expect(parseIssueTarget(encodeIssueTarget(target))).toEqual(target);
		expect(parseIssueTarget('quiz_question|question_1|bad')).toBeNull();
	});
});
