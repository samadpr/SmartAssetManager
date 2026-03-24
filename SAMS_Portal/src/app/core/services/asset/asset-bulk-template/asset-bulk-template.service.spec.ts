import { TestBed } from '@angular/core/testing';

import { AssetBulkTemplateService } from './asset-bulk-template.service';

describe('AssetBulkTemplateService', () => {
  let service: AssetBulkTemplateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetBulkTemplateService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
