import { TestBed } from '@angular/core/testing';

import { PopupWidgetService } from './popup-widget.service';

describe('PopupWidgetService', () => {
  let service: PopupWidgetService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PopupWidgetService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
