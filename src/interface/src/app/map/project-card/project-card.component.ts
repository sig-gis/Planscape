import {
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { Feature, Geometry } from 'geojson';

interface Project {
  PROJECT_NAME?: string;
  PROJECT_STATUS?: string;
  PROJECT_START_DATE?: number;
  PROJECT_END_DATE?: number;
  LAST_UPDATED?: number;
  PROJECT_TYPE?: string;
  REGION?: string;
  UNIT?: string;
  treatments: Treatment[];
}

interface Treatment {
  PROJECT_NAME?: string;
  TREATMENT_NAME?: string;
  TREATMENT_OBJECTIVE?: string;
  ACTIVITY_STATUS?: string;
}

@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
  styleUrls: ['./project-card.component.scss'],
})
export class ProjectCardComponent implements AfterViewInit, OnInit {
  @Input() features!: Feature<Geometry, any>[];
  @Output() initializedEvent = new EventEmitter<void>();

  projects!: Project[];

  ngOnInit() {
    this.projects = this.getProjects();
  }

  ngAfterViewInit(): void {
    this.initializedEvent.emit();
  }

  isProject(feature: Feature<Geometry, any>): boolean {
    return !!feature.properties.PROJECT_NAME;
  }

  private getProjects(): Project[] {
    const projectNames: Set<Project> = new Set<Project>();
    const projects: Map<string, Project> = new Map<string, Project>();

    this.features
      .filter((feature) => this.isProject(feature))
      .forEach((feature) => {
        const projectName = feature.properties.PROJECT_NAME;
        if (projectNames.has(projectName)) {
          projects
            .get(projectName)
            ?.treatments.push(feature.properties as Treatment);
        } else {
          projectNames.add(projectName);
          const project = feature.properties as Project;
          project.treatments = [feature.properties as Treatment];
          projects.set(projectName, project);
        }
      });

    return Array.from(projects.values());
  }
}
