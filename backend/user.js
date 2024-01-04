
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
UserSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};
const User = mongoose.model('users', UserSchema);

//Encryption Functions
// Hash a password and return the hashed version
async function hashPassword(password) {
    const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

// Verify a password against a hashed password
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    // Use bcrypt.compare to compare the plain password with the hashed password
    const passwordMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return passwordMatch;
  } catch (error) {
    // Handle any potential errors, e.g., invalid hashed password
    console.error(error);
    return false; // Return false in case of an error
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