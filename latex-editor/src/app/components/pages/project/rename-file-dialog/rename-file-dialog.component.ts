import { Component, Inject } from "@angular/core";
import { MatDialogRef, MAT_DIALOG_DATA } from "@angular/material/dialog";
import { NgForm } from "@angular/forms";
import { ProjectService } from "src/app/shared/project.service";
import { MatSnackBar } from "@angular/material/snack-bar";
import { DisplayFile } from "../project.component";

@Component({
  selector: "app-rename-file-dialog",
  templateUrl: "./rename-file-dialog.component.html",
  styleUrls: ["./rename-file-dialog.component.css"]
})
export class RenameFileDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<RenameFileDialogComponent>,
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    @Inject(MAT_DIALOG_DATA)
    public data: {
      projectId: string;
      fileId: string;
      oldFileName: string;
      displayFiles: DisplayFile;
    }
  ) {}

  onSubmit(form: NgForm) {
    this.projectService
      .renameFile(this.data.projectId, this.data.fileId, form.value.newName)
      .subscribe(
        data => {
          this.dialogRef.close(form.value.newName);
        },
        error => {
          this.snackBar.open("File name exists already.", "OK", {
            duration: 3000
          });
        }
      );
  }
}
