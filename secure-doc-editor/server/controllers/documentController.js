const Document = require('../models/Document');
const User = require('../models/User');

exports.createDocument = async (req, res) => {
  const { title, content } = req.body;

  try {
    const newDocument = new Document({
      title,
      content,
      author: req.user.id,
      versionHistory: [{ content, timestamp: new Date(), author: req.user.username }],
    });
    await newDocument.save();
    res.json(newDocument);
  } catch (error) {
    res.status(500).json({ message: 'Error creating document' });
  }
};

exports.getDocument = async (req, res) => {
  const { id } = req.params;
  try {
    const document = await Document.findById(id);
    if (!document) return res.status(404).json({ message: 'Document not found' });
    res.json({ document });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching document' });
  }
};

exports.updateDocument = async (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  try {
    const document = await Document.findById(id);
    if (!document) return res.status(404).json({ message: 'Document not found' });

    document.content = content;
    await document.save();

    res.json(document);
  } catch (error) {
    res.status(500).json({ message: 'Error updating document' });
  }
};
