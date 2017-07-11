import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HttpModule } from '@angular/http';
import {
  NgModule,
  ApplicationRef
} from '@angular/core';
import {
  removeNgStyles,
  createNewHosts,
  createInputTransfer
} from '@angularclass/hmr';
import {
  RouterModule,
  PreloadAllModules
} from '@angular/router';

/*
 * Platform and Environment providers/directives/pipes
 */
import { ENV_PROVIDERS } from './environment';
import { AppRoutingModule } from './app-routing.module';

// App is our top level component
import { AppComponent } from './app.component';
import { APP_RESOLVER_PROVIDERS } from './app.resolver';
import { AppState, InternalStateType } from './app.service';

import {
  Broadcaster,
  Logger
} from 'ngo-base';

import {
  AuthenticationService,
  HttpService,
  UserService
} from 'ngo-login-client';

import {
  // Base functionality for the runtime console
  OnLogin,
} from './openfact-runtime-console';

// Header & Footer
import { HeaderComponent } from './header/header.component';
import { FooterComponent } from './footer/footer.component';

// Component Services
import { ConfigStore } from './base/config.store';
import { ErrorService } from './error/error.service';
//import { DeleteAccountDialogModule } from './delete-account-dialog/delete-account-dialog.module';
//import { ProfileService } from './profile/profile.service';

// Shared Services
import { AboutService } from './shared/about.service';
import { NotificationsService } from './shared/notifications.service';
import { LoginService } from './shared/login.service';

import { fabric8UIConfigProvider } from './shared/config/fabric8-ui-config.service';
import { ApiLocatorService } from './shared/api-locator.service';
import { syncApiUrlProvider } from './shared/sync-api.provider';

import { authApiUrlProvider } from './shared/auth-api.provider';
import { ssoApiUrlProvider } from './shared/sso-api.provider';
import { realmProvider } from './shared/realm-token.provider';

import { Fabric8UIOnLogin } from './shared/runtime-console/fabric8-ui-onlogin.service';

// Third Party libs
import { NotificationModule } from 'patternfly-ng';
import { LocalStorageModule } from 'angular-2-local-storage';

import '../styles/styles.scss';
import '../styles/headings.css';

// Application wide providers
const APP_PROVIDERS = [
  ...APP_RESOLVER_PROVIDERS,
  AppState
];

type StoreType = {
  state: InternalStateType,
  restoreInputValues: () => void,
  disposeOldHosts: () => void
};

/**
 * `AppModule` is the main entry point into Angular2's bootstraping process
 */
@NgModule({
  bootstrap: [AppComponent],
  declarations: [// declare which components, directives and pipes belong to the module
    AppComponent,
    HeaderComponent,
    FooterComponent
  ],
  /**
   * Import Angular's modules.
   */
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule,

    // Third Party libs
    NotificationModule,
    LocalStorageModule.withConfig({
      prefix: 'fabric8',
      storageType: 'localStorage'
    }),

    // AppRoutingModule must appear last
    AppRoutingModule,
  ],
  /**
   * Expose our Services and Providers into Angular's dependency injection.
   */
  providers: [
    // Broadcaster must come first
    Broadcaster,

    ENV_PROVIDERS,
    APP_PROVIDERS,

    AuthenticationService,
    {
      provide: OnLogin,
      useClass: Fabric8UIOnLogin
    },

    // Component Services
    ConfigStore,
    ErrorService,

    // Shared Services
    AboutService,
    NotificationsService,
    LoginService,

    fabric8UIConfigProvider,
    ApiLocatorService,
    syncApiUrlProvider,

    authApiUrlProvider,
    ssoApiUrlProvider,
    realmProvider,
  ]
})
export class AppModule {

  constructor(
    public appRef: ApplicationRef,
    public appState: AppState
  ) { }

  public hmrOnInit(store: StoreType) {
    if (!store || !store.state) {
      return;
    }
    console.log('HMR store', JSON.stringify(store, null, 2));
    /**
     * Set state
     */
    this.appState._state = store.state;
    /**
     * Set input values
     */
    if ('restoreInputValues' in store) {
      let restoreInputValues = store.restoreInputValues;
      setTimeout(restoreInputValues);
    }

    this.appRef.tick();
    delete store.state;
    delete store.restoreInputValues;
  }

  public hmrOnDestroy(store: StoreType) {
    const cmpLocation = this.appRef.components.map((cmp) => cmp.location.nativeElement);
    /**
     * Save state
     */
    const state = this.appState._state;
    store.state = state;
    /**
     * Recreate root elements
     */
    store.disposeOldHosts = createNewHosts(cmpLocation);
    /**
     * Save input values
     */
    store.restoreInputValues = createInputTransfer();
    /**
     * Remove styles
     */
    removeNgStyles();
  }

  public hmrAfterDestroy(store: StoreType) {
    /**
     * Display new elements
     */
    store.disposeOldHosts();
    delete store.disposeOldHosts;
  }

}
