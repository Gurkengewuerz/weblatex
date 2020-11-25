const latex = require("node-latex");
const path = require("path");
const fs = require("fs");
const os = require("os");
const archiver = require("archiver");
const { validationResult } = require("express-validator");
const { v4: uuidv4 } = require("uuid");
const db = require("../database");
const localdisk = require("../provider/localdisk");

const PROVIDER = new localdisk.LocalDiskProvider();

const isAllowedAccess = (project, userId) =>
  project.owner._id == userId ||
  project.collaborators.find(
    (collaborator) =>
      collaborator.user._id == userId && collaborator.acceptedInvitation
  );

const hasReadWriteAccess = (project, userId) =>
  project.owner._id == userId ||
  project.collaborators.find(
    (collaborator) =>
      collaborator.user._id == userId &&
      collaborator.acceptedInvitation &&
      collaborator.access == "readWrite"
  );

const isBadRequest = (req) => !validationResult(req).isEmpty();

module.exports.createProject = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  let createdProject;
  try {
    createdProject = {
      _id: uuidv4(),
      owner: { _id: req.user._id, username: req.user.username },
      title: req.body.title,
      collaborators: [],
      files: [],
      lastUpdated: Date.now(),
      lastUpdatedBy: { _id: req.user._id, username: req.user.username },
    };
  } catch (err) {
    console.error(err);
    return res.sendStatus(500);
  }

  const templateFileName = "main.tex";
  let templateFile;
  try {
    templateFile = await fs.promises.readFile(
      path.join(
        __dirname,
        `../../latex-templates/${req.body.template}/${templateFileName}`
      )
    );
  } catch (err) {
    console.error(err);
    return res
      .sendStatus(404)
      .send(`Template ${req.body.template} does not exist`);
  }

  try {
    await PROVIDER.writeFile(
      `${createdProject._id}/${templateFileName}`,
      templateFile
    );

    const fileMetadata = {
      _id: uuidv4(),
      fieldname: "files",
      originalname: templateFileName,
      encoding: "7bit",
      mimetype: "application/octet-stream",
      size: "String",
      isMain: true,
    };

    createdProject.files.push(fileMetadata);
    db.get("project").push(createdProject).write(createdProject);

    res.json(createdProject);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

module.exports.retrieveProjectById = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.id }).value();

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    res.json(project);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveAllProjects = async (req, res) => {
  try {
    const projects = db.get("project").value();

    let projectsRes = [];
    projects.forEach((project) => {
      if (project.owner._id == req.user._id) projectsRes.push(project);

      project.collaborators.forEach((collaborator) => {
        if (
          collaborator.user._id == req.user._id &&
          collaborator.acceptedInvitation
        ) {
          projectsRes.push(project);
        }
      });
    });

    res.json(projectsRes);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.deleteProjectById = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.id }).value();

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (project.owner._id != req.user._id) return res.sendStatus(403);

    db.get("project").remove({ _id: project._id }).write();

    await PROVIDER.deleteDir(`${project._id}`);

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.uploadFiles = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.id }).value();

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (
      !isAllowedAccess(project, req.user._id) ||
      !hasReadWriteAccess(project, req.user._id)
    )
      return res.sendStatus(403);

    const existingFileNames = project.files.map((file) => file.originalname);
    for (const file of req.files) {
      if (existingFileNames.includes(file.originalname)) {
        return res.status(409).send(`File ${file.originalname} already exists`);
      }
      await PROVIDER.writeFile(
        `${project._id}/${file.originalname}`,
        file.buffer
      );
    }

    for (let i = 0; i < req.files.length; i++) {
      const x = { ...req.files[i], isMain: false, _id: uuidv4() };
      delete x.buffer;
      project.files.push(x);
    }

    db.get("project")
      .find({ _id: project._id })
      .assign({
        files: project.files,
        lastUpdated: Date.now(),
        lastUpdatedBy: {
          _id: req.user._id,
          username: req.user.username,
        },
      })
      .write();

    res.json(project.files);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveAllFiles = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.id }).value();

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    res.json(project.files);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveFile = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db
      .get("project")
      .find({ _id: req.params.projectId })
      .value();

    if (!project)
      return res
        .status(404)
        .send(`Project ${req.params.projectId} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    const file = project.files.find((file) => file._id == req.params.fileId);
    if (!file)
      return res.status(404).send(`File ${req.params.fileId} does not exist`);

    const downloadFile = await PROVIDER.getFile(
      `${project._id}/${file.originalname}`
    );

    res.sendFile(downloadFile);
  } catch (err) {
    console.log(err);
    res.sendStatus(500);
  }
};

module.exports.deleteFile = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.projectId }).value();

    if (!project)
      return res
        .status(404)
        .send(`Project ${req.params.projectId} does not exist`);

    if (
      !isAllowedAccess(project, req.user._id) ||
      !hasReadWriteAccess(project, req.user._id)
    )
      return res.sendStatus(403);

    const fileToDelete = project.files.find(
      (file) => file._id == req.params.fileId
    );
    if (!fileToDelete)
      return res.status(404).send(`File ${req.params.fileId} does not exist`);

    project.files = project.files.filter((file) => {
      return file._id != fileToDelete._id;
    });

    db.get("project")
      .find({ _id: project._id })
      .assign({
        files: project.files,
        lastUpdated: Date.now(),
        lastUpdatedBy: {
          _id: req.user._id,
          username: req.user.username,
        },
      })
      .write();

    await PROVIDER.deleteFile(`${project._id}/${fileToDelete.originalname}`);
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.patchFile = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.projectId }).value();

    if (!project)
      return res
        .status(404)
        .send(`Project ${req.params.projectId} does not exist`);

    if (
      !isAllowedAccess(project, req.user._id) ||
      !hasReadWriteAccess(project, req.user._id)
    )
      return res.sendStatus(403);

    if (req.body.operation == "replaceMain") {
      project.files = project.files.map((file) => {
        if (file.isMain) file.isMain = false;
        if (file._id == req.params.fileId) file.isMain = true;
        return file;
      });

      db.get("project")
        .find({ _id: project._id })
        .assign({
          files: project.files,
          lastUpdated: Date.now(),
          lastUpdatedBy: {
            _id: req.user._id,
            username: req.user.username,
          },
        })
        .write();
    } else if (req.body.operation == "replaceName") {
      const oldName = project.files.find(
        (file) => file._id == req.params.fileId
      ).originalname;
      const newName =
        req.body.newName + oldName.substring(oldName.indexOf("."));

      if (project.files.find((file) => file.originalname == newName))
        return res.status(409).send("File name exists");

      project.files = project.files.map((file) => {
        if (file._id == req.params.fileId) file.originalname = newName;
        return file;
      });

      db.get("project")
        .find({ _id: project._id })
        .assign({
          files: project.files,
          lastUpdated: Date.now(),
          lastUpdatedBy: {
            _id: req.user._id,
            username: req.user.username,
          },
        })
        .write();

      await PROVIDER.renameFile(
        `${project._id}/${oldName}`,
        `${project._id}/${newName}`
      );
    } else if (req.body.operation == "replaceContents") {
      const fileToUpdate = project.files.find(
        (file) => file._id == req.params.fileId
      );

      await PROVIDER.writeFile(
        `${project._id}/${fileToUpdate.originalname}`,
        req.body.newContents
      );

      db.get("project")
        .find({ _id: project._id })
        .assign({
          lastUpdated: Date.now(),
          lastUpdatedBy: {
            _id: req.user._id,
            username: req.user.username,
          },
        })
        .write();
    }

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveOutputPdf = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.id }).value();

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    const mainFile = project.files.find((file) => file.isMain);

    const { localPath, main } = await PROVIDER.getCompileFile(
      `${project._id}/${mainFile.originalname}`
    );
    const outputPath = path.join(os.tmpdir(), `${project._id}`);
    await fs.promises.mkdir(outputPath, { recursive: true });

    const pdfPath = path.join(outputPath, `${mainFile._id}.pdf`);
    const logPath = path.join(outputPath, `${mainFile._id}.log`);

    let inputStream = fs.createReadStream(main);
    let outputStream = fs.createWriteStream(pdfPath);
    let pdf = latex(inputStream, {
      inputs: localPath,
      fonts: localPath,
      errorLogs: logPath,
    });
    pdf.pipe(outputStream);

    pdf.on("error", (err) => {
      fs.readFile(logPath, (err, data) => {
        if (err || !data) throw err;
        return res.status(409).send(data.toString());
      });
    });

    pdf.on("finish", () => res.sendFile(pdfPath));
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveSourceFiles = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.id }).value();

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    const folderPath = path.join(os.tmpdir(), project._id.toString());
    await fs.promises.mkdir(folderPath, { recursive: true });

    const downloadPath = path.join(folderPath, `${project._id}.zip`);
    let output = fs.createWriteStream(downloadPath);

    if (project.files.length > 0) {
      const mainFile = project.files.find((file) => file.isMain);
      const { localPath, main } = await PROVIDER.getCompileFile(
        `${project._id}/${mainFile.originalname}`
      );

      const archive = archiver("zip", {
        zlib: { level: 9 }, // Sets the compression level.
      });
      archive.pipe(output);

      archive.directory(localPath, false);

      archive.on("error", function (err) {
        throw err;
      });
      archive.finalize();
    } else {
      output.close();
    }

    output.on("close", () =>
      res.download(downloadPath, project.title + ".zip")
    );
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

module.exports.retrieveCollaborators = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.id }).value();

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (!isAllowedAccess(project, req.user._id)) return res.sendStatus(403);

    res.json(project.collaborators);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.inviteCollaborator = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.id }).value();

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    if (project.owner._id != req.user._id) return res.sendStatus(403);

    const user = db.get("user").find({ username: req.body.username }).value();

    if (!user)
      return res
        .status(404)
        .send(`Username ${req.body.username} does not exist`);

    if (
      project.collaborators.find(
        (collaborator) => collaborator.user._id == user._id
      )
    ) {
      return res
        .status(409)
        .send(`Username ${user.username} already exists as a collaborator`);
    }

    const newCollaborator = {
      pendingInvitation: true,
      acceptedInvitation: false,
      access: req.body.access,
      user: { _id: user._id, username: user.username },
    };

    project.collaborators.push(newCollaborator);

    db.get("project")
      .find({ _id: project._id })
      .assign({
        collaborators: project.collaborators,
      })
      .write();

    res.json(newCollaborator);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.removeCollaborator = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.projectId }).value();

    if (!project)
      return res
        .status(404)
        .send(`Project ${req.params.projectId} does not exist`);

    // Only allow a user that is either owner or the collaborator themselves
    if (
      !(
        project.owner._id == req.user._id ||
        (project.collaborators.find(
          (collaborator) =>
            collaborator.user._id == req.user._id &&
            collaborator.acceptedInvitation
        ) &&
          req.params.userId == req.user._id)
      )
    )
      return res.sendStatus(403);

    const user = db.get("user").find({ _id: req.params.userId }).value();

    if (!user)
      return res.status(404).send(`User ${req.params.userId} does not exist`);

    if (
      !project.collaborators.find(
        (collaborator) => collaborator.user._id == user._id
      )
    ) {
      return res
        .status(404)
        .send(`User ${user._id} does not exist as a collaborator`);
    }

    project.collaborators = project.collaborators.filter(function (user) {
      return user._id != user._id;
    });

    db.get("project")
      .find({ _id: project._id })
      .assign({
        collaborators: project.collaborators,
      })
      .write();

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.patchCollaborator = async (req, res) => {
  if (isBadRequest(req)) return res.sendStatus(400);

  try {
    const project = db.get("project").find({ _id: req.params.id }).value();

    if (!project)
      return res.status(404).send(`Project ${req.params.id} does not exist`);

    // Only allow a user that was invited to accept/reject
    if (
      !project.collaborators.find(
        (collaborator) => collaborator.user._id == req.user._id
      )
    )
      return res.sendStatus(403);

    project.collaborators = project.collaborators.map((invite) => {
      if (invite.user._id == req.user._id) {
        invite.pendingInvitation = false;
        invite.acceptedInvitation = req.body.operation == "accept";
      }
      return invite;
    });

    db.get("project")
      .find({ _id: project._id })
      .assign({
        collaborators: project.collaborators,
      })
      .write();

    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(500);
  }
};

module.exports.retrieveInvitations = async (req, res) => {
  try {
    const projects = db.get("project").value();

    let invitations = [];
    projects.forEach((project) => {
      project.collaborators.forEach((collaborator) => {
        if (
          collaborator.user._id == req.user._id &&
          collaborator.pendingInvitation
        ) {
          invitations.push({
            from: project.owner,
            to: { _id: req.user._id, username: req.user.username },
            projectId: project._id,
            projectTitle: project.title,
          });
        }
      });
    });

    res.json(invitations);
  } catch (err) {
    res.sendStatus(500);
  }
};
