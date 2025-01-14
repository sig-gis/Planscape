import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { BehaviorSubject } from 'rxjs';

import { MaterialModule } from '../material/material.module';
import { AuthService, SessionService } from '../services';
import { Region, User } from '../types';
import { AccountDialogComponent } from './../account-dialog/account-dialog.component';
import { TopBarComponent } from './top-bar.component';

describe('TopBarComponent', () => {
  let component: TopBarComponent;
  let fixture: ComponentFixture<TopBarComponent>;
  let mockAuthService: Partial<AuthService>;
  let mockSessionService: Partial<SessionService>;

  beforeEach(async () => {
    const fakeMatDialog = jasmine.createSpyObj<MatDialog>(
      'MatDialog',
      {
        open: undefined,
      },
      {}
    );
    mockAuthService = {
      loggedInUser$: new BehaviorSubject<User | null>(null),
    };
    mockSessionService = {
      region$: new BehaviorSubject<Region | null>(null),
      setRegion: () => {},
    };
    await TestBed.configureTestingModule({
      imports: [HttpClientTestingModule, MaterialModule],
      declarations: [TopBarComponent],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: MatDialog, useValue: fakeMatDialog },
        { provide: SessionService, useValue: mockSessionService },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should toggle sidenav', () => {
    spyOn(component.toggleEvent, 'emit');

    // Act: click on the menu icon
    const menuButton = fixture.debugElement.query(
      By.css('[data-testid="menu-button"]')
    );
    const clickEvent = new MouseEvent('click');
    menuButton.triggerEventHandler('click', clickEvent);

    // Assert: expect that the toggleEvent emits the Event
    expect(component.toggleEvent.emit).toHaveBeenCalledOnceWith(clickEvent);
  });

  it('should open account dialog', () => {
    const fakeMatDialog: MatDialog =
      fixture.debugElement.injector.get(MatDialog);

    // Act: click on the account icon
    const accountButton = fixture.debugElement.query(
      By.css('[data-testid="account-button"]')
    );
    const clickEvent = new MouseEvent('click');
    accountButton.triggerEventHandler('click', clickEvent);

    // Assert: expect that the dialog opens
    expect(fakeMatDialog.open).toHaveBeenCalledOnceWith(AccountDialogComponent);
  });

  describe('Region selection dropdown', () => {
    it('should set the region', () => {
      const setRegionSpy = spyOn<any>(mockSessionService, 'setRegion');
      const regionDropdown = fixture.debugElement.query(
        By.css('[class="region-dropdown"]')
      ).nativeElement;

      regionDropdown.value = regionDropdown.options[0].value;
      regionDropdown.dispatchEvent(new Event('change'));
      fixture.detectChanges();

      expect(setRegionSpy).toHaveBeenCalledOnceWith(regionDropdown.value);
    });
  });

  describe('username', () => {
    it('should be "Guest" when no user is logged in', () => {
      expect(component.displayName).toEqual('Guest');
    });

    it('should be the first name of the logged in user', () => {
      mockAuthService.loggedInUser$?.next({
        firstName: 'Foo',
        username: 'User',
      });

      expect(component.displayName).toEqual('Foo');
    });

    it('should be the username of the logged in user if they have no first name', () => {
      mockAuthService.loggedInUser$?.next({ username: 'User' });

      expect(component.displayName).toEqual('User');
    });
  });
});
