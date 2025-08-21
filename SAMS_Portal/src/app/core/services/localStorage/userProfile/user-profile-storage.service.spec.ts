import { TestBed } from '@angular/core/testing';

import { UserProfileStorageService } from './user-profile-storage.service';

describe('UserProfileStorageService', () => {
  let service: UserProfileStorageService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserProfileStorageService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
