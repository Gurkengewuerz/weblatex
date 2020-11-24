const express = require("express");
const router = express.Router();
const { param, body } = require("express-validator");
const jwt = require("express-jwt");
const multer = require("multer");
const auth = jwt({ secret: process.env.JWT_SECRET });
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, callback) => {
    if (
      file.mimetype === "image/png" ||
      file.mimetype === "image/jpeg" ||
      file.mimetype === "application/x-tex" ||
      file.mimetype === "application/x-latex" ||
      file.mimetype === "application/octet-stream"
    )
      callback(null, true);
    else callback(null, false);
  },
  limits: { fileSize: 1024 * 1024 * 20 },
});

const authenticationController = require("../controllers/authentication");
const projectController = require("../controllers/project");

// Authentication
router.post(
  "/users/signup",
  [
    body("username")
      .trim()
      .isAlphanumeric()
      .isLength({ min: 3, max: 20 })
      .escape(),
    body("password").trim().isLength({ min: 8, max: 20 }).escape(),
  ],
  authenticationController.signUp
);
router.post(
  "/users/signin",
  [
    body("username")
      .trim()
      .isLength({ min: 3, max: 20 })
      .isAlphanumeric()
      .escape(),
    body("password").trim().isLength({ min: 8, max: 20 }).escape(),
  ],
  authenticationController.signIn
);

// Projects
router.post(
  "/projects",
  auth,
  [
    body("title")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isLength({ min: 1, max: 50 })
      .escape(),
    body("template")
      .exists({ checkNull: true, checkFalsy: true })
      .isIn(["default", "cover-letter", "title-page", "resume"]),
  ],
  projectController.createProject
);
router.get("/projects", auth, projectController.retrieveAllProjects);
router.get(
  "/projects/:id",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  projectController.retrieveProjectById
);
router.delete(
  "/projects/:id",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  projectController.deleteProjectById
);
router.post(
  "/projects/:id/files",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  upload.array("files"),
  projectController.uploadFiles
);
router.get(
  "/projects/:id/files",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  projectController.retrieveAllFiles
);
router.get(
  "/projects/:projectId/files/:fileId",
  auth,
  [
    param("projectId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
    param("fileId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  projectController.retrieveFile
);
router.delete(
  "/projects/:projectId/files/:fileId",
  auth,
  [
    param("projectId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
    param("fileId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  projectController.deleteFile
);
router.patch(
  "/projects/:projectId/files/:fileId",
  auth,
  [
    param("projectId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
    param("fileId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
    body("operation")
      .exists({ checkNull: true, checkFalsy: true })
      .isIn(["replaceMain", "replaceName", "replaceContents"]),
    body("newName")
      .if(body("newName").exists({ checkNull: true, checkFalsy: true }))
      .trim()
      .isLength({ min: 1, max: 50 })
      .escape(),
  ],
  projectController.patchFile
);
router.get(
  "/projects/:id/output",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  projectController.retrieveOutputPdf
);
router.get(
  "/projects/:id/source",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  projectController.retrieveSourceFiles
);
router.get(
  "/projects/:id/collaborators",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  projectController.retrieveCollaborators
);
router.post(
  "/projects/:id/collaborators",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
    body("username")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .escape(),
    body("access")
      .exists({ checkNull: true, checkFalsy: true })
      .isIn(["read", "readWrite"]),
  ],
  projectController.inviteCollaborator
);
router.delete(
  "/projects/:projectId/collaborators/:userId",
  auth,
  [
    param("projectId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
    param("userId")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
  ],
  projectController.removeCollaborator
);
router.patch(
  "/projects/:id/collaborators",
  auth,
  [
    param("id")
      .exists({ checkNull: true, checkFalsy: true })
      .trim()
      .isUUID()
      .escape(),
    body("operation")
      .exists({ checkNull: true, checkFalsy: true })
      .isIn(["accept", "reject"]),
  ],
  projectController.patchCollaborator
);

// Invitations
router.get("/invitations", auth, projectController.retrieveInvitations);

module.exports = router;
