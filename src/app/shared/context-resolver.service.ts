import { Navigation } from '../models/navigation';
import { ContextService } from './context.service';
import { Observable, ConnectableObservable, Subject, BehaviorSubject } from 'rxjs';
import { Context, Contexts } from 'ngo-openfact-sync';
import { Injectable } from '@angular/core';
import {
  Resolve,
  Router,
  NavigationEnd,
  RouterStateSnapshot,
  ActivatedRouteSnapshot
} from '@angular/router';

@Injectable()
export class ContextResolver implements Resolve<Context> {

  private _lastRoute: string;

  constructor(private contextService: ContextService, private router: Router) {
    // The default place to navigate to if the context cannot be resolved
    this._lastRoute = '/_error';
    this.router.errorHandler = (err) => {
      this.router.navigateByUrl(this._lastRoute);
    };

    // Store the last visited URL so we can navigate back if the context
    // cannot be resolved
    this.router.events
      .filter((e) => e instanceof NavigationEnd)
      .map((e: NavigationEnd) => e.urlAfterRedirects)
      .subscribe((val) => this._lastRoute = val);
  }

  public resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Observable<Context> {
    // Resolve the context
    return this.contextService
      .changeContext(Observable.of({
        url: state.url,
        user: route.params['entity'],
        space: route.params['space'],
        document: route.params['document']
      } as Navigation)).first()
      .catch((err: any, caught: Observable<Context>) => {
        console.log(`Caught in resolver ${err}`);
        return Observable.throw(err);
      });
  }

}
