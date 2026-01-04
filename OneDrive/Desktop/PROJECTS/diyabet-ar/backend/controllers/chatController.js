const Message = require('../models/Message');
const User = require('../models/User');

/**
 * Verify if two users can chat (doctor-patient relationship)
 */
async function canChat(userId1, userId2) {
  const user1 = await User.findById(userId1).lean();
  const user2 = await User.findById(userId2).lean();

  console.debug('canChat check', { userId1, userId2, user1: user1 && { _id: user1._id, role: user1.role, assignedDoctor: user1.assignedDoctor }, user2: user2 && { _id: user2._id, role: user2.role, assignedDoctor: user2.assignedDoctor } });

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
    console.debug('getChatHistory called', { currentUserId, userId });
    
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
    
    console.debug('getChatHistory returning', { count: messages.length });
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

    console.debug('sendMessage called', { senderId, receiverId, body: req.body, file: req.file && { originalname: req.file.originalname, mimetype: req.file.mimetype, size: req.file.size } });
    
    if (!receiverId) {
      return res.status(400).json({ error: 'Receiver ID is required' });
    }
    
    // Verify chat permission
    const allowed = await canChat(senderId, receiverId);
    if (!allowed) {
      console.warn('sendMessage permission denied', { senderId, receiverId });
      return res.status(403).json({ error: 'You cannot chat with this user' });
    }
    
    // Validate message content
    if (!text && !req.file && !linkToMedicalResource) {
      return res.status(400).json({ error: 'Message must include text, an attachment, or a link' });
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

    console.debug('sendMessage created message', { id: message._id, sender: message.sender._id || message.sender, receiver: message.receiver._id || message.receiver });
    // Ensure explicit success status so frontend treats this as OK
    return res.status(201).json(message);
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
    res.status(500).json({ error: 'خطأ في الخادم' });
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

// DELETE /api/chat/message/:messageId
async function deleteMessage(req, res) {
  try {
    const { messageId } = req.params;
    const currentUserId = req.user.id || req.user._id;
    
    // Find the message
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    // Only sender can delete their own message
    if (message.sender.toString() !== currentUserId.toString()) {
      return res.status(403).json({ error: 'You can only delete your own message' });
    }
    
    // Delete the message
    await Message.findByIdAndDelete(messageId);
    
    res.json({ message: 'Message deleted successfully' });
  } catch (err) {
    console.error('deleteMessage error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}

module.exports = {
  getChatHistory,
  sendMessage,
  markMessageAsRead,
  getUnreadCount,
  getContacts,
  markAllMessagesAsRead,
  deleteMessage
};