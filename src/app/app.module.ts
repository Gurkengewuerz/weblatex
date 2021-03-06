import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { AppRoutingModule } from "./app-routing.module";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MatSidenavModule } from "@angular/material/sidenav";
import { MatListModule } from "@angular/material/list";
import { MatIconModule } from "@angular/material/icon";
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatDividerModule } from "@angular/material/divider";
import { MatButtonModule } from "@angular/material/button";
import { MatCardModule } from "@angular/material/card";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatDialogModule } from "@angular/material/dialog";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatTableModule } from "@angular/material/table";
import { FormsModule } from "@angular/forms";
import { MatSortModule } from "@angular/material/sort";
import { MatTooltipModule } from "@angular/material/tooltip";
import { CodemirrorModule } from "@ctrl/ngx-codemirror";
import { MatCheckboxModule } from "@angular/material/checkbox";
import { MatSelectModule } from "@angular/material/select";
import { MatBadgeModule } from "@angular/material/badge";
import { MatRadioModule } from "@angular/material/radio";

import { AppComponent } from "./app.component";
import { HomeComponent } from "./components/pages/home/home.component";
import { HeaderComponent } from "./components/header/header.component";
import { PageNotFoundComponent } from "./components/pages/page-not-found/page-not-found.component";
import { CreditsComponent } from "./components/pages/credits/credits.component";
import { SignInComponent } from "./components/sign-in/sign-in.component";
import { SignUpComponent } from "./components/sign-up/sign-up.component";
import { ProjectsComponent } from "./components/pages/projects/projects.component";
import { NewProjectDialogComponent } from "./components/pages/projects/new-project-dialog/new-project-dialog.component";
import { DeleteProjectDialogComponent } from "./components/pages/projects/delete-project-dialog/delete-project-dialog.component";
import { ProjectComponent } from "./components/pages/project/project.component";
import { UploadFilesDialogComponent } from "./components/pages/project/upload-files-dialog/upload-files-dialog.component";
import { RenameFileDialogComponent } from "./components/pages/project/rename-file-dialog/rename-file-dialog.component";
import { DeleteFileDialogComponent } from "./components/pages/project/delete-file-dialog/delete-file-dialog.component";
import { InviteCollaboratorsDialogComponent } from "./components/pages/project/invite-collaborators-dialog/invite-collaborators-dialog.component";
import { InvitationsDialogComponent } from "./components/header/invitations-dialog/invitations-dialog.component";
import { LeaveProjectDialogComponent } from "./components/pages/projects/leave-project-dialog/leave-project-dialog.component";

import { JwtInterceptor } from "./shared/jwt.interceptor";

import { TimeAgoPipeExtension } from "./shared/utils/time-ago-pipe-extension.pipe";
import { TruncatePipe } from "./shared/utils/truncate.pipe";

import "codemirror/mode/stex/stex";
import { NOTYF, notyfFactory } from "./shared/utils/notyf.token";
import { DownloadFilesDialogComponent } from './components/pages/project/download-files-dialog/download-files-dialog.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    HeaderComponent,
    PageNotFoundComponent,
    CreditsComponent,
    SignInComponent,
    SignUpComponent,
    ProjectsComponent,
    NewProjectDialogComponent,
    TimeAgoPipeExtension,
    DeleteProjectDialogComponent,
    ProjectComponent,
    UploadFilesDialogComponent,
    TruncatePipe,
    RenameFileDialogComponent,
    DeleteFileDialogComponent,
    InviteCollaboratorsDialogComponent,
    InvitationsDialogComponent,
    LeaveProjectDialogComponent,
    DownloadFilesDialogComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    HttpClientModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatToolbarModule,
    MatDividerModule,
    MatButtonModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatTableModule,
    FormsModule,
    MatSortModule,
    MatTooltipModule,
    CodemirrorModule,
    MatCheckboxModule,
    MatSelectModule,
    MatBadgeModule,
    MatRadioModule
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: NOTYF, useFactory: notyfFactory },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
