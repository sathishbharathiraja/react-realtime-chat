const express = require('express');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const crypto = require('crypto');

const router = express.Router();

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || 'dummy',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || 'dummy',
  },
});

router.get('/presignedUrl', async (req, res) => {
  const { filename, filetype } = req.query;

  if (!filename || !filetype) {
    return res.status(400).json({ error: 'Filename and filetype are required' });
  }

  // Generate a unique filename to prevent overwrites
  const ext = filename.split('.').pop();
  const uniqueFilename = `${crypto.randomUUID()}.${ext}`;

  try {
    const command = new PutObjectCommand({
      Bucket: process.env.AWS_S3_BUCKET_NAME || 'dummy-bucket',
      Key: uniqueFilename,
      ContentType: filetype,
    });

    const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 });
    
    // Construct the public URL assuming bucket is public or objects are publicly accessible
    const publicUrl = `https://${process.env.AWS_S3_BUCKET_NAME || 'dummy-bucket'}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com/${uniqueFilename}`;

    res.json({ uploadUrl: url, publicUrl });
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    res.status(500).json({ error: 'Could not generate URL' });
  }
});

module.exports = router;
