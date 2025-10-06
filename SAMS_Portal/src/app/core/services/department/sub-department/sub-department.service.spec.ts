import { TestBed } from '@angular/core/testing';

import { SubDepartmentService } from './sub-department.service';

describe('SubDepartmentService', () => {
  let service: SubDepartmentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SubDepartmentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
