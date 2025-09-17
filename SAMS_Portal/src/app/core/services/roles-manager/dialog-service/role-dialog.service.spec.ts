import { TestBed } from '@angular/core/testing';

import { RoleDialogService } from './role-dialog.service';

describe('RoleDialogService', () => {
  let service: RoleDialogService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(RoleDialogService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
