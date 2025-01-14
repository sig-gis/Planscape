import { Component, EventEmitter, Input, Output } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BehaviorSubject, concatMap, Observable, take } from 'rxjs';
import { PlanService } from 'src/app/services';
import { Plan } from 'src/app/types';

@Component({
  selector: 'app-plan-overview',
  templateUrl: './plan-overview.component.html',
  styleUrls: ['./plan-overview.component.scss'],
})
export class PlanOverviewComponent {
  @Input() plan$ = new BehaviorSubject<Plan | null>(null);

  constructor(
    private planService: PlanService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  openConfig(configId?: number): void {
    if (!configId) {
      this.newConfig().subscribe((newConfigId) => {
        this.router.navigate(['config', newConfigId], {
          relativeTo: this.route,
        });
      });
    } else {
      this.router.navigate(['config', configId], { relativeTo: this.route });
    }
  }

  private newConfig(): Observable<number> {
    return this.planService.planState$.pipe(
      concatMap((planState) =>
        this.planService.createProjectInPlan(planState.currentPlanId!)
      ),
      take(1)
    );
  }
}
