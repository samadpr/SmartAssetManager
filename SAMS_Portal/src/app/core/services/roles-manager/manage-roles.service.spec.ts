import { TestBed } from '@angular/core/testing';

import { ManageRolesService } from './manage-roles.service';

describe('ManageRolesService', () => {
  let service: ManageRolesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManageRolesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
