let mongoose = require("mongoose");
const Schema = mongoose.Schema;

let projectSchema = new Schema({
  owner: {
    type: Schema.Types.ObjectId,
    ref: "User"
  },
  title: String,
  collaborators: [
    {
      type: Schema.ObjectId,
      ref: "User"
    }
  ],
  // shareLink: String,
  files: [],
  dateCreated: { type: Date, default: Date.now },
  lastUpdated: Date,
  lastUpdatedBy: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

mongoose.model("Project", projectSchema);
