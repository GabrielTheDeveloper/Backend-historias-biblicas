const History = require('../models/History');

class HistoryController {
    static async createHistory(req, res) {
        try {
            const { title, images, description, hystory, isPremium } = req.body;
            const newHistory = new History({ title, images, description, hystory, isPremium });
            await newHistory.save();
            res.status(201).json({ message: 'History created successfully', history: newHistory });
        } catch (error) {
            res.status(500).json({ message: 'Error creating history', error: error.message });
        }
    }

    static async deleteHistory(req, res) {
        try {
            const id = req.body.id || req.params.id;
            const history = await History.findByIdAndDelete(id);
            if (!history) {
                return res.status(404).json({ message: 'History not found' });
            }
            res.status(200).json({ message: 'History deleted successfully' });
        } catch (error) {
            res.status(500).json({ message: 'Error deleting history', error: error.message });
        }
    }

    static async updateHistory(req, res) {
        try {
            const id = req.body.id || req.params.id;
            const { title, images, description, hystory, isPremium } = req.body;
            const updatedHistory = await History.findByIdAndUpdate(id, { title, images, description, hystory, isPremium }, { new: true });
            if (!updatedHistory) {
                return res.status(404).json({ message: 'History not found' });
            }
            res.status(200).json({ message: 'History updated successfully', history: updatedHistory });
        } catch (error) {
            res.status(500).json({ message: 'Error updating history', error: error.message });
        }
    }

    static async getHistoryById(req, res) {
        try {
            const id = req.body.id || req.params.id;
            const history = await History.findById(id);
            if (!history) {
                return res.status(404).json({ message: 'History not found' });
            }
            res.status(200).json(history);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching history', error: error.message });
        }
    }

    static async getAllHistories(req, res) {
        try {
            const histories = await History.find();
            res.status(200).json(histories);
        } catch (error) {
            res.status(500).json({ message: 'Error fetching histories', error: error.message });
        }
    }
}

module.exports = HistoryController;