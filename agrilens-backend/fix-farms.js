require('dotenv').config();
const mongoose = require('mongoose');
const { Schema } = mongoose;

const farmSchema = new Schema({}, { strict: false });
const Farm = mongoose.model('Farm', farmSchema);

const coordsMap = {
  dhaka: { lat: 23.8103, lng: 90.4125 },
  gazipur: { lat: 24.0023, lng: 90.4264 },
  savar: { lat: 23.8583, lng: 90.2667 },
  'demo-district': { lat: 23.7, lng: 90.3 }
};

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const farms = await Farm.find();
  for (const f of farms) {
    const dist = f.get('location.district')?.toLowerCase() || 'dhaka';
    const upazila = f.get('location.upazila')?.toLowerCase() || '';
    
    let base = coordsMap[dist] || coordsMap['dhaka'];
    if (upazila === 'savar') base = coordsMap['savar'];

    const lat = base.lat + (Math.random() - 0.5) * 0.05;
    const lng = base.lng + (Math.random() - 0.5) * 0.05;

    await Farm.updateOne(
      { _id: f._id },
      { 
        $set: { 
          'location.coordinates': { lat, lng },
          geoPoint: { type: 'Point', coordinates: [lng, lat] }
        } 
      }
    );
    console.log('Updated', f.get('name'), 'to', lat, lng);
  }
  process.exit(0);
});
