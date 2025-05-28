const User = require('../models/User');

class UserController {
    static async createUser(req, res) {
        try {
            const { username, password, email } = req.body;
            const newUser = new User({ username, password, email });
            await newUser.save();
            res.status(201).json({ message: 'User created successfully', user: newUser });
        } catch (error) {
            res.status(500).json({ message: 'Error creating user', error: error.message });
        }
    }

    
    static async getAllUsers(req, res) {
        try {
            const users = await User.find();
            res.status(200).json(users);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching users', error: error.message });
        }
    }

    static async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await User.findOne({ username, password });
            if (!user) {
                return res.status(401).json({ message: 'Invalid username or password' });
            }
            res.status(200).json({ message: 'Login successful', user });
        }
        catch (error) {
            res.status(500).json({ message: 'Error logging in', error: error.message });
        }
    }
}

module.exports = UserController;