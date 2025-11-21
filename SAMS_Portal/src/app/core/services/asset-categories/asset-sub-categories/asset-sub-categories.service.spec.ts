import { TestBed } from '@angular/core/testing';

import { AssetSubCategoriesService } from './asset-sub-categories.service';

describe('AssetSubCategoriesService', () => {
  let service: AssetSubCategoriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetSubCategoriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
