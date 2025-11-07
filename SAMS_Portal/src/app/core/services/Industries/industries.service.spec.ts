import { TestBed } from '@angular/core/testing';

import { IndustriesService } from './industries.service';

describe('IndustriesService', () => {
  let service: IndustriesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(IndustriesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
