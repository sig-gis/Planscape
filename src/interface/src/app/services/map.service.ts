import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, map, Observable, take } from 'rxjs';

import { BackendConstants } from '../backend-constants';
import {
  BoundaryConfig,
  ColormapConfig,
  ConditionsConfig,
  Region,
} from '../types';

/** A map of Region to static assets for that region. */
const regionToGeojsonMap: Record<Region, Record<string, string>> = {
  [Region.SIERRA_NEVADA]: {
    boundary: 'assets/geojson/sierra_nevada_region.geojson',
    counties: 'assets/geojson/sierra_cascade_inyo/counties.geojson',
    huc10: 'assets/geojson/sierra_cascade_inyo/huc10.geojson',
    huc12: 'assets/geojson/sierra_cascade_inyo/huc12.geojson',
    USFS: 'assets/geojson/sierra_cascade_inyo/USFS.geojson',
    RecentFires: 'assets/geojson/sierra_cascade_inyo/recent_fires.geojson',
    PrescribedBurns: 'assets/geojson/sierra_cascade_inyo/prescribed_burns.geojson'
  },
  [Region.CENTRAL_COAST]: {},
  [Region.NORTHERN_CALIFORNIA]: {},
  [Region.SOUTHERN_CALIFORNIA]: {},
};

@Injectable({
  providedIn: 'root',
})
export class MapService {
  readonly boundaryConfig$ = new BehaviorSubject<BoundaryConfig[] | null>(null);
  readonly conditionsConfig$ = new BehaviorSubject<ConditionsConfig | null>(
    null
  );
  readonly conditionNameToDisplayNameMap$ = new BehaviorSubject<Map<string, string>>(new Map<string, string>());

  constructor(private http: HttpClient) {
    this.http
      .get<BoundaryConfig[]>(BackendConstants.END_POINT + '/boundary/boundary')
      .pipe(take(1))
      .subscribe((config: BoundaryConfig[]) => {
        this.boundaryConfig$.next(config);
      });
    this.http
      .get<ConditionsConfig>(
        BackendConstants.END_POINT +
          '/conditions/config/?region_name=sierra_cascade_inyo'
      )
      .pipe(take(1))
      .subscribe((config: ConditionsConfig) => {
        this.conditionsConfig$.next(config);
        this.populateConditionNameMap(config);
      });
  }

  /**
   * Gets the GeoJSON for the given region, or an empty observable
   * if the path is empty.
   * */
  getRegionBoundary(region: Region): Observable<GeoJSON.GeoJSON> {
    const path = regionToGeojsonMap[region];
    if (!path || !path['boundary']) return EMPTY;
    return this.http.get<GeoJSON.GeoJSON>(path['boundary']);
  }

  /**
   * (For reference, currently unused)
   * Gets boundaries for four regions: Sierra Nevada, Southern California,
   * Central Coast, Northern California.
   * */
  getRegionBoundaries(): Observable<GeoJSON.GeoJSON> {
    return this.http.get<GeoJSON.GeoJSON>(
      BackendConstants.END_POINT +
        '/boundary/boundary_details/?boundary_name=task_force_regions'
    );
  }

  /* Note: these are the names used by the configurations and backend */
  regionToString(region: Region): string {
    switch (region) {
      case Region.SIERRA_NEVADA:
        return 'sierra_cascade_inyo';
      case Region.CENTRAL_COAST:
        return 'central_coast';
      case Region.NORTHERN_CALIFORNIA:
        return 'north_coast_inland';
      case Region.SOUTHERN_CALIFORNIA:
        return 'southern_california';
    }
  }

  /** Get shapes for a boundary from assets, if possible.  Fall back to the
   *  REST server, clipping the shapes to the region if the region is non-null. */
  getBoundaryShapes(
    boundaryName: string,
    region: Region | null
  ): Observable<GeoJSON.GeoJSON> {
    if (region != null) {
      // Try to get the shapes from the assets.
      const regionAssets = regionToGeojsonMap[region];
      if (regionAssets && regionAssets[boundaryName]) {
        return this.http.get<GeoJSON.GeoJSON>(regionAssets[boundaryName]);
      }
    }
    // Get the shapes from the REST server.
    return this.http.get<GeoJSON.GeoJSON>(
      BackendConstants.END_POINT +
        `/boundary/boundary_details/?boundary_name=${boundaryName}` +
        (region == null ? '' : `&region_name=${this.regionToString(region)}`));
  }

  // Queries the CalMAPPER ArcGIS Web Feature Service for known land management projects without filtering.
  getExistingProjects(): Observable<GeoJSON.GeoJSON> {
    return this.http.get<string>(BackendConstants.END_POINT + '/projects/calmapper').pipe(
      map((response: string) => {
        return JSON.parse(response);
      })
    );
  }

  /** Get colormap values from the REST server. */
  getColormap(colormap: string): Observable<ColormapConfig> {
    return this.http.get<ColormapConfig>(
      BackendConstants.END_POINT.concat(
        `/conditions/colormap/?colormap=${colormap}`
      )
    );
  }

  private populateConditionNameMap(config: ConditionsConfig) {
    let nameMap = this.conditionNameToDisplayNameMap$.value;
    config.pillars?.forEach(pillar => {
      if (!!pillar.pillar_name && !!pillar.display_name) {
        nameMap.set(pillar.pillar_name, pillar.display_name);
      }
      pillar.elements?.forEach(element => {
        if (!!element.element_name && !!element.display_name) {
          nameMap.set(element.element_name, element.display_name);
        }
        element.metrics?.forEach(metric => {
          if (!!metric.metric_name && !!metric.display_name) {
            nameMap.set(metric.metric_name, metric.display_name);
          }
        });
      });
    });
    this.conditionNameToDisplayNameMap$.next(nameMap);
  }
}
