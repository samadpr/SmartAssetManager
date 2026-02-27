import { TestBed } from '@angular/core/testing';

import { AssetIssueService } from './asset-issue.service';

describe('AssetIssueService', () => {
  let service: AssetIssueService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetIssueService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
