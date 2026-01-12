import { TestBed } from '@angular/core/testing';

import { ManageAssetsService } from './manage-assets.service';

describe('ManageAssetsService', () => {
  let service: ManageAssetsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManageAssetsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
