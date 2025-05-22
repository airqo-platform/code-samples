import { NextResponse } from 'next/server';
import { MongoClient } from 'mongodb';

export async function GET() {
  // Use the development URI and DB name
  const MONGO_URI = process.env.MONGO_DEV_URI_NETMANAGER || 'mongodb://localhost:27017/';
  const DB_NAME = process.env.DB_NAME_DEV_NETMANAGER || 'airqo_netmanager_development';

  console.log('Attempting to connect to MongoDB...');
  console.log('Database:', DB_NAME);

  const targetAirqlouds = [
    'Jinja', 'Nairobi', 'Lagos', 'Kampala', 'Gulu', 'Mbarara', 'Masaka', 'Kabale', 'Mubende'
  ];

  try {
    const client = await MongoClient.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB');
    
    const db = client.db(DB_NAME);
    const collection = db.collection('idw_model_predictions'); 

    const aggregationPipeline = [
      {
        $match: {
          $expr: {
            $in: [
              { $toLower: '$airqloud' },
              targetAirqlouds.map(aq => aq.toLowerCase())
            ]
          }
        }
      },
      {
        $sort: { created_at: -1 }
      },
      {
        $group: {
          _id: '$airqloud',
          latestPrediction: { $first: '$$ROOT' }
        }
      }
    ];

    const aggregatedData = await collection.aggregate(aggregationPipeline).toArray();
    console.log(`Found ${aggregatedData.length} aggregated documents`);
    
    await client.close();

    if (!aggregatedData.length) {
      return NextResponse.json({ error: 'No prediction data found for target airqlouds' }, { status: 404 });
    }

    const points = aggregatedData.flatMap(item => {
      const latest = item.latestPrediction;
      if (!latest?.values || !Array.isArray(latest.values)) {
        return [];
      }
      return latest.values.map((point: any) => ({
        latitude: point.latitude,
        longitude: point.longitude,
        pm2_5: point.predicted_value,
        timestamp: latest.created_at,
        city: latest.airqloud
      }));
    });

    if (!points.length) {
      return NextResponse.json({ error: 'No valid data points generated after processing predictions' }, { status: 404 });
    }

    return NextResponse.json(points);
  } catch (error: any) {
    console.error('Detailed error in heatmap data API:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 });
  }
}
