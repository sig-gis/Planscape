import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { MaterialModule } from 'src/app/material/material.module';
import { PlanService } from 'src/app/services';
import { Region } from 'src/app/types';

import { SavedScenariosComponent } from './saved-scenarios.component';

describe('SavedScenariosComponent', () => {
  let component: SavedScenariosComponent;
  let fixture: ComponentFixture<SavedScenariosComponent>;
  let fakePlanService: PlanService;

  beforeEach(async () => {
    const fakeRoute = jasmine.createSpyObj(
      'ActivatedRoute',
      {},
      {
        snapshot: {
          paramMap: convertToParamMap({ id: '24' }),
        },
      }
    );

    fakePlanService = jasmine.createSpyObj<PlanService>(
      'PlanService',
      {
        getScenariosForPlan: of([
          {
            id: '1',
            createdTimestamp: 100,
          },
        ]),
        deleteScenarios: of(['1']),
      },
      {}
    );

    await TestBed.configureTestingModule({
      imports: [FormsModule, HttpClientTestingModule, MaterialModule, NoopAnimationsModule],
      declarations: [SavedScenariosComponent],
      providers: [
        { provide: ActivatedRoute, useValue: fakeRoute },
        { provide: PlanService, useValue: fakePlanService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SavedScenariosComponent);
    component = fixture.componentInstance;

    component.plan = {
      id: '1',
      name: 'Fake Plan',
      ownerId: '1',
      region: Region.SIERRA_NEVADA,
    };

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('createScenario should emit event', () => {
    spyOn(component.createScenarioEvent, 'emit');

    component.createScenario();

    expect(component.createScenarioEvent.emit).toHaveBeenCalled();
  });

  it('should call service for list of scenarios', () => {
    expect(fakePlanService.getScenariosForPlan).toHaveBeenCalledOnceWith('1');

    expect(component.scenarios.length).toEqual(1);
  });

  it('should delete selected scenarios', () => {
    component.scenarios[0].selected = true;

    component.deleteSelectedScenarios();

    expect(fakePlanService.deleteScenarios).toHaveBeenCalledOnceWith(['1']);
  });
});
