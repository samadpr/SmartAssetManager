import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AiChatPageComponent } from './ai-chat-page.component';

describe('AiChatPageComponent', () => {
  let component: AiChatPageComponent;
  let fixture: ComponentFixture<AiChatPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AiChatPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AiChatPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
