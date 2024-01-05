
//imports
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

//Mongoose connection
mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
mongoose.connection.on('error', (error) => {
  console.error('MongoDB connection error:', error);
});

//Schema
const UserSchema = new mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
    },
    password: {
        type: String,
        required: true,
        unique: true,
    },
    date: {
        type: Date,
        default: Date.now,
    },
    teacher:{
        type: Boolean,
        require: true,
    },
    periods: [
      {
          periodNumber: {
              type: Number,
              required: true,
          },
          periodClass: {
            type: String,
            required: true,
        },
            teacher: {
            type: String,
            required: true,
        },
      }
  ],
});

//Compares encrypted password
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model('users', UserSchema);

//Encryption Functions
//Hashes passwords
async function hashPassword(password) {
    const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Verifies the password
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    const passwordMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return passwordMatch;
  } catch (error) {
    console.error(error);
    return false; 
  }
}

async function getUserByUsername(username) {
  return User.findOne({ username }).exec();
}  

module.exports = {
    User,
    hashPassword,
    verifyPassword,
    getUserByUsername,
}