import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Http } from '@angular/http';

import { SpaceSettingsComponent } from './space-settings.component';
import { SpaceSettingsRoutingModule } from './space-settings-routing.module';

import { SettingsOverviewModule } from './settings-overview/settings-overview.module';

@NgModule({
  imports: [
    CommonModule,
    SpaceSettingsRoutingModule,
    SettingsOverviewModule
  ],
  declarations: [SpaceSettingsComponent],
})
export class SpaceSettingsModule {
  constructor(http: Http) { }
}
