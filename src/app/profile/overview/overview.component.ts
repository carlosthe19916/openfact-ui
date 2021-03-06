import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { Context, Contexts } from 'ngo-openfact-sync';
import { Space, SpaceService } from 'ngo-openfact-sync';
import { UserService, User } from 'ngo-login-client';

@Component({
  selector: 'ofs-overview',
  templateUrl: 'overview.component.html',
  styleUrls: ['./overview.component.scss']
})
export class OverviewComponent implements OnDestroy, OnInit {

  public context: Context;
  public loggedInUser: User;
  public subscriptions: Subscription[] = [];
  public spaces: Space[] = [];

  constructor(
    private contexts: Contexts,
    private spaceService: SpaceService,
    private userService: UserService,
    private router: Router) {
    this.subscriptions.push(contexts.current.subscribe((val) => this.context = val));
    this.subscriptions.push(userService.loggedInUser.subscribe((user) => {
      this.loggedInUser = user;
      if (user.attributes) {
        this.subscriptions.push(spaceService.getSpacesByUser(user.attributes.username, 10).subscribe((spaces) => {
          this.spaces = spaces;
        }));
      }
    }));
  }

  public ngOnInit() {
  }

  public ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => {
      sub.unsubscribe();
    });
  }

  public routeToUpdateProfile(): void {
    this.router.navigate(['/', this.context.user.attributes.username, '_update']);
  }

  // Private
}
