import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormGroup } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { Router } from '@angular/router';
import { BehaviorSubject, of } from 'rxjs';
import { PlanService, PlanState } from 'src/app/services';
import { Region } from 'src/app/types';

import { PlanModule } from '../plan.module';
import { CreateScenariosComponent } from './create-scenarios.component';

describe('CreateScenariosComponent', () => {
  let component: CreateScenariosComponent;
  let fixture: ComponentFixture<CreateScenariosComponent>;
  let fakePlanService: PlanService;
  let fakeGeoJson: GeoJSON.GeoJSON;

  beforeEach(async () => {
    fakeGeoJson = {
      type: 'FeatureCollection',
      features: [],
    };
    fakePlanService = jasmine.createSpyObj<PlanService>(
      'PlanService',
      {
        getConditionScoresForPlanningArea: of(),
        getProject: of({
          id: 1,
          maxBudget: 100,
        }),
        updateProject: of(1),
        bulkCreateProjectAreas: of(null),
        createProjectArea: of(1),
        createScenario: of('1'),
        updateStateWithShapes: undefined,
      },
      {
        planState$: new BehaviorSubject<PlanState>({
          all: {
            '1': {
              id: '1',
              ownerId: 'fakeowner',
              name: 'testplan',
              region: Region.SIERRA_NEVADA,
            },
          },
          currentPlanId: '1',
          currentConfigId: 1,
          currentScenarioId: null,
          mapConditionFilepath: null,
          mapShapes: null,
          panelExpanded: true,
        }),
      }
    );

    await TestBed.configureTestingModule({
      imports: [BrowserAnimationsModule, HttpClientTestingModule, PlanModule],
      declarations: [CreateScenariosComponent],
      providers: [{ provide: PlanService, useValue: fakePlanService }],
    }).compileComponents();

    fixture = TestBed.createComponent(CreateScenariosComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('stepper should begin on the first step', () => {
    expect(component.stepper?.selectedIndex).toEqual(0);
  });

  it('should load existing config into form', () => {
    expect(fakePlanService.getProject).toHaveBeenCalledOnceWith(1);

    component.formGroups[1].valueChanges.subscribe((_) => {
      expect(
        component.formGroups[1].get('budgetForm.maxCost')?.value
      ).toEqual(100);
    });
  });

  it('should update project when stepper advances', () => {
    component.formGroups[0].get('priorities')?.setValue(['test']);
    component.stepper?.next();

    expect(fakePlanService.updateProject).toHaveBeenCalledOnceWith({
      id: 1,
      planId: 1,
      est_cost: NaN,
      max_budget: NaN,
      max_treatment_area_ratio: NaN,
      max_road_distance: NaN,
      max_slope: NaN,
      priorities: ['test'],
      weights: [1],
    });
  });

  it('should not update project if form is invalid', () => {
    expect(fakePlanService.updateProject).toHaveBeenCalledTimes(0);

    component.formGroups[0].markAsDirty();
    component.formGroups[0].get('priorities')?.setValue(['test']);
    component.stepper?.next();

    expect(fakePlanService.updateProject).toHaveBeenCalledTimes(1);
  });

  it('update plan state when "identify project areas" form inputs change', () => {
    const generateAreas = component.formGroups[2].get('generateAreas');
    const uploadedArea = component.formGroups[2].get('uploadedArea');

    // Set "generate areas automatically" to true
    generateAreas?.setValue(true);

    expect(fakePlanService.updateStateWithShapes).toHaveBeenCalledWith(null);

    // Add an uploaded area and set "generate areas automatically" to false
    generateAreas?.setValue(false);
    uploadedArea?.setValue('testvalue');

    expect(fakePlanService.updateStateWithShapes).toHaveBeenCalledWith(
      'testvalue'
    );
  });

  it('adds a priority weight form control for each priority', () => {
    component.formGroups[0]
      .get('priorities')
      ?.setValue(['priority1', 'priority2']);
    const priorityWeightsForm = component.formGroups[3].get(
      'priorityWeightsForm'
    ) as FormGroup;

    expect(priorityWeightsForm.value).toEqual({
      priority1: 1,
      priority2: 1,
    });
  });

  it('creates scenario when event is emitted', () => {
    component.scenarioConfigId = 1;
    component.formGroups[0].get('priorities')?.setValue(['test']);
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, 'navigate');

    component.createScenarioAndProjectAreas();

    expect(fakePlanService.createScenario).toHaveBeenCalledOnceWith({
      id: 1,
      planId: 1,
      est_cost: NaN,
      max_budget: NaN,
      max_treatment_area_ratio: NaN,
      max_road_distance: NaN,
      max_slope: NaN,
      priorities: ['test'],
      weights: [1],
    });
    expect(router.navigate).toHaveBeenCalledOnceWith([
      'scenario-confirmation',
      '1',
    ]);
  });

  it('creates uploaded project areas when event is emitted', () => {
    component.scenarioConfigId = 1;
    component.formGroups[0].get('priorities')?.setValue(['test']);
    component.formGroups[2].get('uploadedArea')?.setValue(fakeGeoJson);
    const router = fixture.debugElement.injector.get(Router);
    spyOn(router, 'navigate');

    component.createScenarioAndProjectAreas();

    expect(fakePlanService.bulkCreateProjectAreas).toHaveBeenCalledOnceWith(
      component.scenarioConfigId,
      []
    );
  });

  describe('convertSingleGeoJsonToGeoJsonArray', () => {
    it('converts a geojson with multiple multipolygons into geojsons', () => {
      const testMultiGeoJson: GeoJSON.GeoJSON = {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: {
              type: 'MultiPolygon',
              coordinates: [
                [
                  [
                    [-120.48760442258875, 38.86069261999541],
                    [-120.25134738486939, 38.63563031791014],
                    [-120.68265831280989, 38.65924332885403],
                    [-120.48760442258875, 38.86069261999541],
                  ],
                ],
                [
                  [
                    [-120.08926185006236, 38.70429439806091],
                    [-119.83102710804575, 38.575493119820806],
                    [-120.02882494064228, 38.56474992770867],
                    [-120.12497630750148, 38.59268150226389],
                    [-120.08926185006236, 38.70429439806091],
                  ],
                ],
                [
                  [
                    [-120.32277500514876, 38.59483057427002],
                    [-120.19090826710838, 38.65494898256424],
                    [-120.1947892445163, 38.584354895060606],
                    [-120.25934844928075, 38.55964521088927],
                    [-120.32277500514876, 38.59483057427002],
                  ],
                ],
              ],
            },
            properties: {},
          },
          {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [
                [
                  [-120.399442, 38.957252],
                  [-120.646674, 38.631876],
                  [-120.020352, 38.651183],
                  [-120.07804, 38.818293],
                  [-120.306043, 38.79689],
                  [-120.399442, 38.957252],
                ],
              ],
            },
          },
        ],
      };

      const result =
        component.convertSingleGeoJsonToGeoJsonArray(testMultiGeoJson);

      expect(result).toEqual([
        {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: {
                type: 'MultiPolygon',
                coordinates: [
                  [
                    [
                      [-120.48760442258875, 38.86069261999541],
                      [-120.25134738486939, 38.63563031791014],
                      [-120.68265831280989, 38.65924332885403],
                      [-120.48760442258875, 38.86069261999541],
                    ],
                  ],
                  [
                    [
                      [-120.08926185006236, 38.70429439806091],
                      [-119.83102710804575, 38.575493119820806],
                      [-120.02882494064228, 38.56474992770867],
                      [-120.12497630750148, 38.59268150226389],
                      [-120.08926185006236, 38.70429439806091],
                    ],
                  ],
                  [
                    [
                      [-120.32277500514876, 38.59483057427002],
                      [-120.19090826710838, 38.65494898256424],
                      [-120.1947892445163, 38.584354895060606],
                      [-120.25934844928075, 38.55964521088927],
                      [-120.32277500514876, 38.59483057427002],
                    ],
                  ],
                ],
              },
              properties: {},
            },
          ],
        },
        {
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Polygon',
                coordinates: [
                  [
                    [-120.399442, 38.957252],
                    [-120.646674, 38.631876],
                    [-120.020352, 38.651183],
                    [-120.07804, 38.818293],
                    [-120.306043, 38.79689],
                    [-120.399442, 38.957252],
                  ],
                ],
              },
            },
          ],
        },
      ]);
    });
  });
});
