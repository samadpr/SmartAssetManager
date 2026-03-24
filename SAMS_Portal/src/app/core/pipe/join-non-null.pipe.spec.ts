import { JoinNonNullPipe } from '../../join-non-null.pipe';

describe('JoinNonNullPipe', () => {
  it('create an instance', () => {
    const pipe = new JoinNonNullPipe();
    expect(pipe).toBeTruthy();
  });
});
