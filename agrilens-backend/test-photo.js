require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const collection = mongoose.connection.db.collection('produces');
  const listing = await collection.findOne({photos: {$exists: true, $not: {$size: 0}}});
  console.log(listing ? listing.photos : 'No photos');
  process.exit(0);
});
