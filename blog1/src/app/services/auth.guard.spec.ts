import { TestBed } from '@angular/core/testing';
import { AuthGuard } from './auth.guard';
import { Router } from '@angular/router';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(() => {
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: Router, useValue: mockRouter },
      ],
    });

    authGuard = TestBed.inject(AuthGuard);
  });

  it('should be created', () => {
    expect(authGuard).toBeTruthy();
  });

  it('should return true if user is logged in', () => {
    spyOn(localStorage, 'getItem').and.returnValue('user');
    const result = authGuard.canActivate();
    expect(result).toBeTrue();
    expect(mockRouter.navigate).not.toHaveBeenCalled();
  });

  it('should redirect to login if user is not logged in', () => {
    spyOn(localStorage, 'getItem').and.returnValue(null);
    const result = authGuard.canActivate();
    expect(result).toBeFalse();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/login']);
  });
});
