import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../services';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {

  error: any;

  form: FormGroup;

  readonly text1: string = `
    Planscape is a collaborative effort by the California Natural Resources Agency (CNRA) and the
    USDA Forest Service, with support from Google.org.
  `;

  readonly text2: string = `
    designed to bring the best available state & federal data and science together. Planscape
    guides regional planners in prioritizing landscape treatments to mitigate fire risk, maximize
    ecological benefits, and help California’s landscapes adapt to climate change.
  `;

  readonly bulletPoints: string[] = [
    `Open source and free to use, for state and federal planners, as well as the public`,
    `Supports regional planning for fire resilience and ecological benefits across broader
    landscapes`,
    `Designed to utilize the latest Regional Resource Kits as the primary data source`,
    `Built to utilize the best state and federal science and models`,
    `Intends to be scalable across US Landscapes`
  ];

  constructor(
    private authService: AuthService,
    private formBuilder: FormBuilder,
    private router: Router,
  ) {
    this.form = this.formBuilder.group({
      email: this.formBuilder.control('', [Validators.required, Validators.email]),
      password: this.formBuilder.control('', Validators.required)
    });
  }

  login() {
    if (!this.form.valid) return;

    const email: string = this.form.get('email')?.value;
    const password: string = this.form.get('password')?.value;

    this.authService.login(email, password).subscribe(
      _ => this.router.navigate(['map']),
      error => this.error = error
    );
  }

  signup() {
    this.router.navigate(['signup']);
  }

  continueAsGuest() {
    this.router.navigate(['home']);
  }

}
