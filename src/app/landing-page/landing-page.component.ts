import { LoginService } from '../shared/login.service';
import { Broadcaster } from 'ngo-base';
import { Component, OnInit } from '@angular/core';

import { AuthenticationService } from 'ngo-login-client';

@Component({
  host: {
    'class': "app-component flex-container in-column-direction flex-grow-1"
  },
  selector: 'alm-landing-page',
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent implements OnInit {

  constructor(private broadcaster: Broadcaster,
              private loginService: LoginService,
              private authService: AuthenticationService) {
  }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.loginService.redirectAfterLogin();
    }
  }

  login() {
    this.loginService.redirectUrl = '/_gettingstarted';
    this.broadcaster.broadcast('login');
    this.loginService.redirectToAuth();
  }

}
