
//imports
const mongoose = require('mongoose');

//Mongoose connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

//Schema
const ClassroomSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  className: {
    type: String,
    required: true,
    unique: false,
  },
  period: {
    type: Number,
    default: 1,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  studentsInside: {
    type: [String],
    default: [],
    required: true,
  },
  studentsOutside: {
    type: [String],
    default: [],
    required: true,
  },
  studentsWaiting: {
    type: [String],
    default: [],
    required: true,
  },
  studentsRequests: {
    type: [String],
    default: [],
    required: true,
  },
});
const Classroom = mongoose.model('classes', ClassroomSchema);

async function getClassbyClassname(Classname) {
  return Classroom.findOne({ Classname }).exec();
}  

module.exports = {
    Classroom,
    getClassbyClassname,
}