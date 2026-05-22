import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;
console.log('MongoDB connection string loaded from env:', MONGODB_URI ? 'yes' : 'no');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection
let lastConnectionError: string | null = null;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
  })
    .then(() => {
      console.log('Connected to MongoDB. Status: Cloud Persistent');
      lastConnectionError = null;
    })
    .catch(err => {
      lastConnectionError = err.message;
      console.error('MongoDB connection error! THIS IS USUALLY AN ATLAS IP WHITELIST ISSUE.');
      console.error('ACTION REQUIRED: Go to MongoDB Atlas -> Network Access -> Add IP Address -> Allow Access From Anywhere (0.0.0.0/0).');
      console.error('Technical Error:', err.message);
    });
} else {
  console.warn('MONGODB_URI not found in environment. Data will reset on server restart.');
}

// Global error handler for mongoose
mongoose.connection.on('error', err => {
  lastConnectionError = err.message;
  console.error('Mongoose connection error:', err);
});

// Models
const TransactionSchema = new mongoose.Schema({
  id: String,
  amount: { type: Number, default: 0 },
  category: String,
  date: String,
  notes: String,
  type: { type: String, enum: ['income', 'expense'] },
  billStatus: { type: String, enum: ['received', 'pending', 'not_applicable'], default: 'not_applicable' },
  createdAt: { type: Date, default: Date.now },
});

const CategorySchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  color: String,
  icon: String,
});

const SettingsSchema = new mongoose.Schema({
  key: { type: String, unique: true },
  value: mongoose.Schema.Types.Mixed,
});

const Transaction = mongoose.model('Transaction', TransactionSchema);
const Category = mongoose.model('Category', CategorySchema);
const Settings = mongoose.model('Settings', SettingsSchema);

// Migration: Round existing amounts and fix NaN
mongoose.connection.once('open', async () => {
  try {
    // Drop the problematic unique index on 'id' if it exists
    try {
      await mongoose.connection.collection('transactions').dropIndex('id_1');
      console.log('Successfully dropped problematic index id_1');
    } catch (indexErr: any) {
      // If it doesn't exist, that's fine
      if (indexErr.code !== 27) { // 27 is IndexNotFound
        console.warn('Could not drop index id_1:', indexErr.message);
      }
    }

    const allT = await Transaction.find();
    let updatedCount = 0;
    for (const t of allT) {
      let needsFix = false;
      let newAmount = t.amount;

      if (typeof t.amount !== 'number' || isNaN(t.amount)) {
        newAmount = 0;
        needsFix = true;
      }

      if (needsFix) {
        t.amount = newAmount;
        await t.save();
        updatedCount++;
      }
    }
    if (updatedCount > 0) {
      console.log(`Migration: ${updatedCount} existing transaction amounts cleaned and rounded.`);
    }
  } catch (e) {
    console.error('Migration error:', e);
  }
});

// API Routes
app.get('/api/status', (req, res) => {
  res.json({ 
    status: mongoose.connection.readyState === 1 ? 'connected' : 'error',
    message: mongoose.connection.readyState === 1 ? 'OK' : (lastConnectionError || 'Database connection failed. Likely IP whitelist issue in Atlas.')
  });
});

app.get('/api/transactions', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      console.warn('GET /api/transactions: Database not connected');
      return res.json([]);
    }
    const transactions = await Transaction.find().sort({ date: -1 }).lean();
    // Return clean data: ensure amount is a number and type is valid
    const cleanTransactions = (transactions || []).map(t => ({
      ...t,
      id: t._id.toString(), // Map _id to id for frontend as string
      _id: t._id.toString(),
      amount: (typeof t.amount === 'number' && !isNaN(t.amount)) ? t.amount : 0,
      type: (t.type === 'income' || t.type === 'expense') ? t.type : 'expense',
      billStatus: t.billStatus || 'not_applicable'
    }));
    res.json(cleanTransactions);
  } catch (err: any) {
    console.error('GET /api/transactions error:', err.message);
    res.status(500).json([]);
  }
});

app.post('/api/transactions', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
       // Mock behavioral save if DB is down for testing UI
       return res.json({ ...req.body, id: Math.random().toString(36).substr(2, 9) });
    }
    const rawAmount = req.body.amount;
    let amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount);
    if (!isNaN(amount)) {
      amount = parseFloat(Number(amount).toFixed(2));
    }
    
    const transactionData = { ...req.body };
    // Remove id if it's null, empty or undefined to prevent unique index conflicts on 'id'
    if (transactionData.id === null || transactionData.id === '' || transactionData.id === undefined) {
      delete transactionData.id;
    }
    if (transactionData._id === null || transactionData._id === '' || transactionData._id === undefined) {
      delete transactionData._id;
    }
    
    const newTransaction = new Transaction({ 
      ...transactionData, 
      amount: isNaN(amount) ? 0 : amount,
      type: req.body.type === 'income' ? 'income' : 'expense'
    });
    await newTransaction.save();
    
    // Return consistently mapped response
    const responseData = {
      ...newTransaction.toObject(),
      id: newTransaction._id.toString(),
      _id: newTransaction._id.toString(),
      amount: isNaN(amount) ? 0 : amount,
      billStatus: newTransaction.billStatus || 'not_applicable'
    };
    
    res.json(responseData);
  } catch (err: any) {
    console.error('Save error:', err.message);
    res.status(500).json({ error: 'Failed to save transaction', details: err.message });
  }
});

app.delete('/api/transactions/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ success: true });
    }
    const { id } = req.params;
    
    // Attempt delete by _id first, then by custom id field
    let result = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      result = await Transaction.findByIdAndDelete(id);
    }
    
    if (!result) {
      result = await Transaction.deleteOne({ id: id });
    }
    
    console.log(`Delete operation for ${id} completed. Result:`, result);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete error:', err);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

app.put('/api/transactions/:id', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json({ ...req.body, id: req.params.id });
    }
    const updateData = { ...req.body };
    // Remove id/ _id from update body to prevent immutable field errors or index issues
    delete updateData.id;
    delete updateData._id;
    
    if (updateData.amount !== undefined) {
      const rawAmount = updateData.amount;
      let amount = typeof rawAmount === 'number' ? rawAmount : parseFloat(rawAmount);
      if (!isNaN(amount)) {
        updateData.amount = parseFloat(Number(amount).toFixed(2));
      } else {
        updateData.amount = 0;
      }
    }
    const updated = await Transaction.findByIdAndUpdate(req.params.id, updateData, { new: true }).lean();
    if (!updated) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Return consistently mapped response
    const responseData = {
      ...updated,
      id: updated._id.toString(),
      _id: updated._id.toString(),
      amount: updated.amount,
      billStatus: updated.billStatus || 'not_applicable'
    };

    res.json(responseData);
  } catch (err: any) {
    console.error('Update error:', err.message);
    res.status(500).json({ error: 'Failed to update transaction', details: err.message });
  }
});

app.get('/api/categories', async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.json([]);
    }
    const categories = await Category.find();
    res.json(categories || []);
  } catch (err) {
    res.status(500).json([]);
  }
});

app.post('/api/categories', async (req, res) => {
  try {
    const newCategory = new Category(req.body);
    await newCategory.save();
    res.json(newCategory);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save category' });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await Category.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete category' });
  }
});
app.put('/api/categories/:id', async (req, res) => {
  try {
    const category = await Category.findOneAndUpdate(
      { id: req.params.id },
      { $set: req.body },
      { new: true }
    );
    res.json(category);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update category' });
  }
});

app.get('/api/budget', async (req, res) => {
  try {
    const budget = await Settings.findOne({ key: 'budget' });
    res.json({ amount: budget?.value || 0 });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch budget' });
  }
});

app.post('/api/budget', async (req, res) => {
  try {
    const amount = Number(req.body.amount);
    await Settings.findOneAndUpdate(
      { key: 'budget' },
      { value: isNaN(amount) ? 0 : amount },
      { upsert: true }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update budget' });
  }
});

// Vite Setup
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
