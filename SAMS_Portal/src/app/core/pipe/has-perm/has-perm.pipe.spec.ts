import { HasPermPipe } from './has-perm.pipe';

describe('HasPermPipe', () => {
  it('create an instance', () => {
    const pipe = new HasPermPipe();
    expect(pipe).toBeTruthy();
  });
});
