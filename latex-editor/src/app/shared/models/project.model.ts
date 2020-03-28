import { User } from "./user.model";

export class MulterFile {
  _id: string;
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: string;
  destination: string;
  filename: string;
  path: string;
  buffer: any[];
  isMain: boolean;
}

export class Collaborator {
  pendingInvitation: boolean;
  acceptedInvitation: boolean;
  access: "read" | "readWrite";
  user: User;
}

export class Project {
  _id: string;
  owner: User;
  title: string;
  collaborators: Collaborator[];
  files: MulterFile[];
  dateCreated: Date;
  lastUpdated: Date;
  lastUpdatedBy: User;
}
