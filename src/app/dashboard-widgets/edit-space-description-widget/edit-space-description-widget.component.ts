import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';

import { Observable, Subject } from 'rxjs';

import { Broadcaster } from 'ngo-base';
import { Contexts, SpaceService, Space, Spaces } from 'ngo-openfact-sync';
import { UserService, User } from 'ngo-login-client';

@Component({
  selector: 'ofs-edit-space-description-widget',
  templateUrl: './edit-space-description-widget.component.html',
  styleUrls: ['./edit-space-description-widget.component.scss']
})
export class EditSpaceDescriptionWidgetComponent implements OnInit {

  space: Space;

  private _descriptionUpdater: Subject<string> = new Subject();

  private loggedInUser: User;
  @ViewChild('description') description: any;

  public isEditing: boolean = false;

  constructor(
    private spaces: Spaces,
    private contexts: Contexts,
    private userService: UserService,
    private broadcaster: Broadcaster,
    private spaceService: SpaceService
  ) {
    spaces.current.subscribe(val => {
      this.space = val;
      console.log('newspace', val);
    });
    userService.loggedInUser.subscribe(val => this.loggedInUser = val);
  }

  ngOnInit() {
    this._descriptionUpdater
      .debounceTime(1000)
      .map(description => {
        let patch = {
          attributes: {
            description: description,
            name: this.space.attributes.name,
            version: this.space.attributes.version
          },
          type: 'spaces',
          id: this.space.id
        } as Space;
        return patch;
      })
      .do(val => console.log(val))
      .switchMap(patch => this.spaceService
        .update(patch)
        .do(val => {
          console.log('updatedspace', val);
          this.isEditing = false;
          this.space.attributes.description = val.attributes.description;
        })
        .do(updated => this.broadcaster.broadcast('spaceUpdated', updated))
      )
      .subscribe();
  }

  onUpdateDescription(description) {
    this._descriptionUpdater.next(description);
  }

  preventDef(event: any) {
    event.preventDefault();
  }

  saveDescription() {
    this._descriptionUpdater.next(this.description.nativeElement.value);
  }

  stopEditingDescription() {
    this.isEditing = false;
  }

  startEditingDescription() {
    this.isEditing = true;
  }

  isEditable(): Observable<boolean> {
    return this.contexts.current.map(val => val.user.id === this.loggedInUser.id);
  }

}
