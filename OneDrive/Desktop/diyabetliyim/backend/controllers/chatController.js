const Message = require('../models/Message');
const User = require('../models/User');
const { createNotification, NOTIFICATION_TYPES } = require('../utils/notificationService');

/**
 * Verify if two users can chat (doctor-patient relationship)
 */
async function canChat(userId1, userId2) {
  const user1 = await User.findById(userId1);
  const user2 = await User.findById(userId2);
  
  if (!user1 || !user2) return false;
  
  // Check if one is doctor and other is patient with matching assignment
  if (user1.role === 'doctor' && user2.role === 'patient') {
    return user2.assignedDoctor && user2.assignedDoctor.toString() === userId1;
  }
  if (user1.role === 'patient' && user2.role === 'doctor') {
    return user1.assignedDoctor && user1.assignedDoctor.toString() === userId2;
  }
  
  return false;
}

// GET /api/chat/history/:userId
async function getChatHistory(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id || req.user._id;
    
    // Verify chat permission
    const allowed = await canChat(currentUserId, userId);
    if (!allowed) {
      return res.status(403).json({ error: 'You cannot chat with this user' });
    }
    
    // Fetch messages between the two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId }
      ]
    })
    .sort({ createdAt: 1 })
    .populate('sender', 'fullName role')
    .populate('receiver', 'fullName role')
    .lean();
    
    res.json({ messages });
  } catch (err) {
    console.error('getChatHistory error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// POST /api/chat/send
async function sendMessage(req, res) {
  try {
    const { receiverId, text, linkToMedicalResource } = req.body;
    const senderId = req.user.id || req.user._id;
    
    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID required' });
    }
    
    // Verify chat permission
    const allowed = await canChat(senderId, receiverId);
    if (!allowed) {
      return res.status(403).json({ error: 'You cannot chat with this user' });
    }
    
    // Validate message content
    if (!text && !req.file && !linkToMedicalResource) {
      return res.status(400).json({ error: 'Message must contain text, attachment, or link' });
    }
    
    // Prepare message data
    const messageData = {
      sender: senderId,
      receiver: receiverId,
      text: text || ''
    };
    
    // Handle file attachment
    if (req.file) {
      const fileType = req.file.mimetype.startsWith('image/') ? 'image' : 'pdf';
      messageData.attachment = {
        url: `/uploads/chat/${req.file.filename}`,
        type: fileType,
        filename: req.file.originalname,
        size: req.file.size
      };
    }
    
    // Add medical resource link
    if (linkToMedicalResource) {
      messageData.linkToMedicalResource = linkToMedicalResource;
    }
    
    // Create message
    const message = await Message.create(messageData);
    await message.populate('sender', 'fullName role');
    await message.populate('receiver', 'fullName role');
    
    // Send notification to receiver
    const senderUser = await User.findById(senderId).select('fullName role');
    const senderName = senderUser.fullName || (senderUser.role === 'doctor' ? 'Your doctor' : 'Patient');
    
    await createNotification({
      user: receiverId,
      sender: senderId,
      type: NOTIFICATION_TYPES.MESSAGE,
      message: `New message from ${senderName}`,
      link: senderUser.role === 'doctor' ? `/patient/chat.html?with=${senderId}` : `/doctor/chat.html?with=${senderId}`,
      meta: { messageId: message._id }
    });
    
    res.json(message);
  } catch (err) {
    console.error('sendMessage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// PATCH /api/chat/read/:msgId
async function markMessageAsRead(req, res) {
  try {
    const { msgId } = req.params;
    const userId = req.user.id || req.user._id;
    
    const message = await Message.findOne({ _id: msgId, receiver: userId });
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    message.read = true;
    await message.save();
    
    res.json(message);
  } catch (err) {
    console.error('markMessageAsRead error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/chat/unread-count
async function getUnreadCount(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    
    const count = await Message.countDocuments({
      receiver: userId,
      read: false
    });
    
    res.json({ count });
  } catch (err) {
    console.error('getUnreadCount error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// GET /api/chat/contacts
async function getContacts(req, res) {
  try {
    const userId = req.user.id || req.user._id;
    const user = await User.findById(userId);
    
    let contacts = [];
    
    if (user.role === 'doctor') {
      // Get all assigned patients
      contacts = await User.find({ 
        assignedDoctor: userId, 
        role: 'patient' 
      }).select('fullName phone').lean();
    } else if (user.role === 'patient' && user.assignedDoctor) {
      // Get assigned doctor
      contacts = await User.find({ 
        _id: user.assignedDoctor, 
        role: 'doctor' 
      }).select('fullName phone').lean();
    }
    
    // Get last message and unread count for each contact
    const contactsWithInfo = await Promise.all(contacts.map(async (contact) => {
      const lastMessage = await Message.findOne({
        $or: [
          { sender: userId, receiver: contact._id },
          { sender: contact._id, receiver: userId }
        ]
      }).sort({ createdAt: -1 }).lean();
      
      const unreadCount = await Message.countDocuments({
        sender: contact._id,
        receiver: userId,
        read: false
      });
      
      return {
        ...contact,
        lastMessage: lastMessage ? {
          text: lastMessage.text,
          createdAt: lastMessage.createdAt,
          isOwn: lastMessage.sender.toString() === userId
        } : null,
        unreadCount
      };
    }));
    
    res.json({ contacts: contactsWithInfo });
  } catch (err) {
    console.error('getContacts error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

// PATCH /api/chat/read-all/:userId
async function markAllMessagesAsRead(req, res) {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id || req.user._id;
    
    // Verify chat permission
    const allowed = await canChat(currentUserId, userId);
    if (!allowed) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { read: true }
    );
    
    res.json({ message: 'All messages marked as read' });
  } catch (err) {
    console.error('markAllMessagesAsRead error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getChatHistory,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
  getContacts,
  markAllMessagesAsRead
};