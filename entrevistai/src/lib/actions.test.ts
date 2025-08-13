import { startInterviewAction } from './actions';

test('startInterviewAction retorna erro para input inválido', async () => {
  const result = await startInterviewAction({ jobRole: '', professionalArea: '' });
  expect(result.success).toBe(false);
});
