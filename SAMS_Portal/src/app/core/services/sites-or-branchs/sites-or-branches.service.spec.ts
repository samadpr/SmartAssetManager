import { TestBed } from '@angular/core/testing';

import { SitesOrBranchesService } from './sites-or-branches.service';

describe('SitesOrBranchesService', () => {
  let service: SitesOrBranchesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SitesOrBranchesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
