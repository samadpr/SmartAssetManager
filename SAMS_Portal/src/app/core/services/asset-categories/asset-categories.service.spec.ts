import { TestBed } from '@angular/core/testing';

import { AssetCategoriesService } from './asset-categories.service';

describe('AssetCategoriesService', () => {
  let service: AssetCategoriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetCategoriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
