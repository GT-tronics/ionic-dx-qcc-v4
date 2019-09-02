import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OtadPage } from './otad.page';

describe('OtadPage', () => {
  let component: OtadPage;
  let fixture: ComponentFixture<OtadPage>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OtadPage ],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OtadPage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
