import { TestBed } from '@angular/core/testing';

import { FilesUploadService } from './files-upload.service';

describe('FilesUploadService', () => {
  let service: FilesUploadService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FilesUploadService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
